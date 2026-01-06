import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wand2, Upload, Download, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BackgroundRemoverProps {
  onComplete?: (imageUrl: string) => void;
  className?: string;
}

export default function BackgroundRemover({ onComplete, className }: BackgroundRemoverProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Load and display original image
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      setProgress(30);

      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Resize if needed (max 1024px)
      const maxDim = 1024;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      setProgress(50);

      // Simple background removal using color difference
      // This is a simplified version - for production, use @huggingface/transformers
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Get corner colors to estimate background
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(([x, y]) => {
        const idx = (y * width + x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      setProgress(70);

      // Remove similar colors to background
      const threshold = 50;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const diff = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        );

        if (diff < threshold) {
          data[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);

      setProgress(90);

      // Convert to PNG
      const resultUrl = canvas.toDataURL("image/png");
      setProcessedImage(resultUrl);
      onComplete?.(resultUrl);

      setProgress(100);
      toast.success("Background removed!");
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background. Try a different image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "background-removed.png";
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-primary mb-2">
        <Wand2 className="w-5 h-5" />
        <span className="font-semibold">AI Background Remover</span>
      </div>

      {/* Drop Zone */}
      {!originalImage && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag & drop an image or click to upload
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG up to 5MB
          </p>
        </div>
      )}

      {/* Image Preview */}
      {originalImage && (
        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Original</p>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Processed */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Result</p>
            <div className="aspect-square rounded-lg overflow-hidden border border-border bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZWIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Processing... {progress}%
          </p>
        </div>
      )}

      {/* Actions */}
      {originalImage && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOriginalImage(null);
              setProcessedImage(null);
            }}
            className="flex-1"
          >
            Clear
          </Button>
          
          {!processedImage ? (
            <Button
              size="sm"
              onClick={removeBackground}
              disabled={isProcessing}
              className="flex-1 gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Remove Background
            </Button>
          ) : (
            <Button size="sm" onClick={downloadImage} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

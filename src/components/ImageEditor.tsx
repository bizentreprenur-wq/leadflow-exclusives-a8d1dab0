import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Maximize2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName: string;
  onSave: (editedImageUrl: string) => void;
}

export default function ImageEditor({
  open,
  onOpenChange,
  imageUrl,
  imageName,
  onSave,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [fabricImage, setFabricImage] = useState<FabricImage | null>(null);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cropRect, setCropRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!open || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.min(container.clientWidth - 32, 600);
    const height = 400;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#1a1a2e",
      selection: false,
    });

    setFabricCanvas(canvas);
    setIsLoading(true);
    setScale(100);
    setRotation(0);
    setIsCropping(false);
    setCropRect(null);

    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fabricImg = new FabricImage(img, {
        originX: "center",
        originY: "center",
        left: width / 2,
        top: height / 2,
        selectable: false,
        evented: false,
      });

      // Scale image to fit canvas
      const scaleX = (width * 0.9) / img.width;
      const scaleY = (height * 0.9) / img.height;
      const fitScale = Math.min(scaleX, scaleY, 1);
      fabricImg.scale(fitScale);

      canvas.add(fabricImg);
      canvas.renderAll();
      setFabricImage(fabricImg);
      setIsLoading(false);
    };
    img.onerror = () => {
      toast.error("Failed to load image");
      setIsLoading(false);
    };
    img.src = imageUrl;

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
      setFabricImage(null);
    };
  }, [open, imageUrl]);

  // Update scale
  const handleScaleChange = useCallback((value: number[]) => {
    const newScale = value[0];
    setScale(newScale);
    
    if (fabricImage && fabricCanvas) {
      const baseScale = fabricImage.getOriginalSize().width > 0 
        ? Math.min((fabricCanvas.width! * 0.9) / fabricImage.getOriginalSize().width, 1)
        : 1;
      fabricImage.scale(baseScale * (newScale / 100));
      fabricCanvas.renderAll();
    }
  }, [fabricImage, fabricCanvas]);

  // Rotate
  const handleRotate = useCallback((degrees: number) => {
    if (fabricImage && fabricCanvas) {
      const newRotation = rotation + degrees;
      setRotation(newRotation);
      fabricImage.rotate(newRotation);
      fabricCanvas.renderAll();
    }
  }, [fabricImage, fabricCanvas, rotation]);

  // Flip horizontal
  const handleFlipH = useCallback(() => {
    if (fabricImage && fabricCanvas) {
      fabricImage.set('flipX', !fabricImage.flipX);
      fabricCanvas.renderAll();
    }
  }, [fabricImage, fabricCanvas]);

  // Flip vertical
  const handleFlipV = useCallback(() => {
    if (fabricImage && fabricCanvas) {
      fabricImage.set('flipY', !fabricImage.flipY);
      fabricCanvas.renderAll();
    }
  }, [fabricImage, fabricCanvas]);

  // Start crop mode
  const handleStartCrop = useCallback(() => {
    if (!fabricCanvas || !fabricImage) return;
    
    setIsCropping(true);
    
    // Create crop rectangle
    const { Rect } = require('fabric');
    const rect = new Rect({
      left: fabricCanvas.width! / 2 - 100,
      top: fabricCanvas.height! / 2 - 75,
      width: 200,
      height: 150,
      fill: 'transparent',
      stroke: '#22c55e',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#22c55e',
      cornerStrokeColor: '#fff',
      cornerSize: 10,
      transparentCorners: false,
      selectable: true,
      evented: true,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    
    setCropRect({
      left: rect.left!,
      top: rect.top!,
      width: rect.width! * rect.scaleX!,
      height: rect.height! * rect.scaleY!,
    });
  }, [fabricCanvas, fabricImage]);

  // Apply crop
  const handleApplyCrop = useCallback(() => {
    if (!fabricCanvas || !fabricImage) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      toast.error("Please select a crop area");
      return;
    }

    // Get crop dimensions
    const cropLeft = activeObject.left!;
    const cropTop = activeObject.top!;
    const cropWidth = activeObject.width! * activeObject.scaleX!;
    const cropHeight = activeObject.height! * activeObject.scaleY!;

    // Create a temporary canvas to do the crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    // Remove crop rectangle before exporting
    fabricCanvas.remove(activeObject);
    fabricCanvas.renderAll();

    // Draw the cropped area
    tempCtx.drawImage(
      fabricCanvas.toCanvasElement(),
      cropLeft,
      cropTop,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Load the cropped image back
    const croppedUrl = tempCanvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#1a1a2e";
      
      const newFabricImg = new FabricImage(img, {
        originX: "center",
        originY: "center",
        left: fabricCanvas.width! / 2,
        top: fabricCanvas.height! / 2,
        selectable: false,
        evented: false,
      });

      const scaleX = (fabricCanvas.width! * 0.9) / img.width;
      const scaleY = (fabricCanvas.height! * 0.9) / img.height;
      const fitScale = Math.min(scaleX, scaleY, 1);
      newFabricImg.scale(fitScale);

      fabricCanvas.add(newFabricImg);
      fabricCanvas.renderAll();
      setFabricImage(newFabricImg);
      setScale(100);
      setRotation(0);
      setIsCropping(false);
      setCropRect(null);
      toast.success("Crop applied");
    };
    img.src = croppedUrl;
  }, [fabricCanvas, fabricImage]);

  // Cancel crop
  const handleCancelCrop = useCallback(() => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
    }
    
    setIsCropping(false);
    setCropRect(null);
  }, [fabricCanvas]);

  // Fit to canvas
  const handleFitToCanvas = useCallback(() => {
    if (fabricImage && fabricCanvas) {
      const scaleX = (fabricCanvas.width! * 0.9) / fabricImage.getOriginalSize().width;
      const scaleY = (fabricCanvas.height! * 0.9) / fabricImage.getOriginalSize().height;
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      fabricImage.scale(fitScale);
      fabricImage.set({
        left: fabricCanvas.width! / 2,
        top: fabricCanvas.height! / 2,
      });
      fabricImage.rotate(0);
      setScale(100);
      setRotation(0);
      fabricCanvas.renderAll();
    }
  }, [fabricImage, fabricCanvas]);

  // Save edited image
  const handleSave = useCallback(() => {
    if (!fabricCanvas) return;
    
    // Remove any active crop rectangle
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && isCropping) {
      fabricCanvas.remove(activeObject);
    }
    
    fabricCanvas.renderAll();
    
    // Export as data URL
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    onSave(dataUrl);
    onOpenChange(false);
    toast.success("Image saved");
  }, [fabricCanvas, isCropping, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" />
            Edit Image
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {imageName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Canvas Area */}
        <div 
          ref={containerRef} 
          className="flex-1 flex items-center justify-center bg-secondary/50 mx-6 rounded-lg overflow-hidden relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>

        {/* Controls */}
        <div className="p-6 pt-4 space-y-4 border-t border-border">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {!isCropping ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartCrop}
                  className="gap-2"
                >
                  <Crop className="w-4 h-4" />
                  Crop
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotate(-90)}
                  title="Rotate Left"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotate(90)}
                  title="Rotate Right"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlipH}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlipV}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFitToCanvas}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Reset
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag the corners to adjust crop area
                </p>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelCrop}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCrop}
                  className="gap-2 bg-success hover:bg-success/90"
                >
                  <Check className="w-4 h-4" />
                  Apply Crop
                </Button>
              </>
            )}
          </div>

          {/* Scale Slider */}
          {!isCropping && (
            <div className="flex items-center gap-4">
              <Label className="text-sm text-muted-foreground w-16">Scale</Label>
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[scale]}
                onValueChange={handleScaleChange}
                min={25}
                max={200}
                step={5}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {scale}%
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

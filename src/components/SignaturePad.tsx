import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Check, Pen, Type, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SignaturePadProps {
  onSignatureComplete: (signatureData: SignatureData) => void;
  signerName?: string;
}

export interface SignatureData {
  signatureImage: string;
  signatureType: 'draw' | 'type';
  typedName?: string;
  timestamp: string;
  ipAddress?: string;
}

export default function SignaturePad({ onSignatureComplete, signerName = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedSignature, setTypedSignature] = useState(signerName);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [selectedFont, setSelectedFont] = useState<'cursive' | 'script' | 'formal'>('cursive');

  const fonts = {
    cursive: "'Brush Script MT', cursive",
    script: "'Lucida Handwriting', cursive",
    formal: "'Snell Roundhand', 'Zapfino', cursive"
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Set drawing styles
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignatureImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `48px ${fonts[selectedFont]}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleComplete = async () => {
    let signatureImage: string;

    if (signatureMethod === 'draw') {
      if (!hasDrawn) {
        toast.error('Please draw your signature');
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      signatureImage = canvas.toDataURL('image/png');
    } else {
      if (!typedSignature.trim()) {
        toast.error('Please type your name');
        return;
      }
      signatureImage = generateTypedSignatureImage();
    }

    const signatureData: SignatureData = {
      signatureImage,
      signatureType: signatureMethod,
      typedName: signatureMethod === 'type' ? typedSignature : undefined,
      timestamp: new Date().toISOString(),
    };

    onSignatureComplete(signatureData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Sign Document
        </CardTitle>
        <CardDescription>
          Choose how you'd like to sign this document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={signatureMethod} onValueChange={(v) => setSignatureMethod(v as 'draw' | 'type')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw" className="gap-2">
              <Pen className="w-4 h-4" />
              Draw Signature
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-2">
              <Type className="w-4 h-4" />
              Type Signature
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-crosshair bg-white touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="absolute bottom-2 left-2 right-2 border-b border-muted-foreground/30" />
              <span className="absolute bottom-4 left-4 text-xs text-muted-foreground">
                Sign here ✍️
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div>
              <Label>Your Full Legal Name</Label>
              <Input
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your full name"
                className="text-lg"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Signature Style</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['cursive', 'script', 'formal'] as const).map((font) => (
                  <Button
                    key={font}
                    variant={selectedFont === font ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFont(font)}
                    className="h-12"
                    style={{ fontFamily: fonts[font] }}
                  >
                    {typedSignature || 'Preview'}
                  </Button>
                ))}
              </div>
            </div>

            {typedSignature && (
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-xs text-muted-foreground mb-2">Signature Preview:</p>
                <p
                  className="text-3xl text-center"
                  style={{ fontFamily: fonts[selectedFont] }}
                >
                  {typedSignature}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">By clicking "Complete Signature" you agree:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This signature is legally binding</li>
            <li>You have authority to sign this document</li>
            <li>Your signature will be timestamped and recorded</li>
          </ul>
        </div>

        <Button onClick={handleComplete} className="w-full gap-2" size="lg">
          <Check className="w-4 h-4" />
          Complete Signature
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, FileSignature, Shield, Clock, AlertCircle, Download } from 'lucide-react';
import SignaturePad, { SignatureData } from './SignaturePad';
import { toast } from 'sonner';

interface ContractSigningPageProps {
  contractId: string;
  contractHTML: string;
  contractName: string;
  senderCompany: string;
  recipientName: string;
  recipientEmail: string;
  onSigningComplete?: (signatureData: SignatureData) => void;
}

export interface SignedContractData {
  contractId: string;
  signatureData: SignatureData;
  signedAt: string;
  recipientName: string;
  recipientEmail: string;
  contractName: string;
}

export default function ContractSigningPage({
  contractId,
  contractHTML,
  contractName,
  senderCompany,
  recipientName,
  recipientEmail,
  onSigningComplete
}: ContractSigningPageProps) {
  const [hasReadContract, setHasReadContract] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [signedContractHTML, setSignedContractHTML] = useState('');

  // Check if contract was already signed (stored in localStorage)
  useEffect(() => {
    const signedContracts = JSON.parse(localStorage.getItem('bamlead_signed_contracts') || '{}');
    if (signedContracts[contractId]) {
      setIsSigned(true);
      setSignatureData(signedContracts[contractId].signatureData);
      setSignedContractHTML(signedContracts[contractId].signedHTML);
    }
  }, [contractId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (isAtBottom) {
      setHasReadContract(true);
    }
  };

  const handleSignatureComplete = (data: SignatureData) => {
    setSignatureData(data);
    setShowSignaturePad(false);

    // Generate signed contract HTML with embedded signature
    const signedHTML = generateSignedContractHTML(contractHTML, data, recipientName);
    setSignedContractHTML(signedHTML);

    // Save to localStorage
    const signedContracts = JSON.parse(localStorage.getItem('bamlead_signed_contracts') || '{}');
    signedContracts[contractId] = {
      signatureData: data,
      signedAt: data.timestamp,
      recipientName,
      recipientEmail,
      contractName,
      signedHTML
    };
    localStorage.setItem('bamlead_signed_contracts', JSON.stringify(signedContracts));

    setIsSigned(true);
    toast.success('Contract signed successfully!');

    if (onSigningComplete) {
      onSigningComplete(data);
    }
  };

  const generateSignedContractHTML = (html: string, signature: SignatureData, signerName: string): string => {
    // Find the signature section and replace with actual signature
    const signatureBlockHTML = `
      <div style="margin-top: 30px; padding: 20px; border: 2px solid #22c55e; border-radius: 8px; background: #f0fdf4;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="color: #22c55e; font-size: 24px;">✓</span>
          <strong style="color: #166534;">Electronically Signed</strong>
        </div>
        <div style="margin-bottom: 10px;">
          <p style="margin: 0; font-size: 12px; color: #666;">Client Signature:</p>
          <img src="${signature.signatureImage}" alt="Signature" style="max-height: 60px; margin: 5px 0;" />
        </div>
        <div style="font-size: 11px; color: #666;">
          <p style="margin: 3px 0;"><strong>Signed by:</strong> ${signerName}</p>
          <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(signature.timestamp).toLocaleString()}</p>
          <p style="margin: 3px 0;"><strong>Signature ID:</strong> ${contractId}</p>
          <p style="margin: 3px 0;"><strong>Method:</strong> Electronic ${signature.signatureType === 'draw' ? 'Drawn' : 'Typed'} Signature</p>
        </div>
      </div>
    `;

    // Insert before closing body tag
    return html.replace('</body>', `${signatureBlockHTML}</body>`);
  };

  const handleDownloadSigned = () => {
    if (!signedContractHTML) return;
    
    const blob = new Blob([signedContractHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractName}-SIGNED.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Signed contract downloaded!');
  };

  if (isSigned) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
        <Card className="max-w-3xl mx-auto border-green-200">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Contract Signed Successfully!</CardTitle>
            <CardDescription>
              Thank you for signing. A copy has been saved for your records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contract:</span>
                <span className="font-medium">{contractName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Signed by:</span>
                <span className="font-medium">{recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {signatureData && new Date(signatureData.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Signature ID:</span>
                <span className="font-mono text-xs">{contractId}</span>
              </div>
            </div>

            {signatureData && (
              <div className="border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Your Signature:</p>
                <img 
                  src={signatureData.signatureImage} 
                  alt="Your signature" 
                  className="max-h-16 mx-auto"
                />
              </div>
            )}

            <Button onClick={handleDownloadSigned} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download Signed Contract
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-1" />
              This signature is legally binding and has been securely recorded.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting Signature
              </Badge>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                {contractName}
              </CardTitle>
              <CardDescription>
                From {senderCompany} • Sent to {recipientEmail}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contract Preview */}
          <div className="border rounded-lg bg-white">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-medium">Contract Document</span>
              <span className="text-xs text-muted-foreground">
                {hasReadContract ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Read
                  </span>
                ) : (
                  'Scroll to read entire document'
                )}
              </span>
            </div>
            <ScrollArea 
              className="h-[400px]" 
              onScrollCapture={handleScroll}
            >
              <iframe 
                srcDoc={contractHTML}
                className="w-full h-[800px] bg-white"
                title="Contract Document"
              />
            </ScrollArea>
          </div>

          <Separator />

          {/* Signing Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Before signing, please:</p>
                <ul className="mt-1 text-amber-700 space-y-1">
                  <li>• Read the entire contract carefully</li>
                  <li>• Ensure you understand all terms and conditions</li>
                  <li>• Verify your information is correct</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">Ready to sign?</p>
                <p className="text-sm text-muted-foreground">
                  Signing as: <strong>{recipientName}</strong> ({recipientEmail})
                </p>
              </div>
              <Button 
                onClick={() => setShowSignaturePad(true)}
                disabled={!hasReadContract}
                size="lg"
                className="gap-2"
              >
                <FileSignature className="w-4 h-4" />
                Sign Contract
              </Button>
            </div>

            {!hasReadContract && (
              <p className="text-xs text-muted-foreground text-center">
                Please scroll through the entire document to enable signing
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
            <Shield className="w-4 h-4" />
            <span>Your signature is encrypted and legally binding</span>
          </div>
        </CardContent>
      </Card>

      {/* Signature Pad Dialog */}
      <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign: {contractName}</DialogTitle>
          </DialogHeader>
          <SignaturePad 
            onSignatureComplete={handleSignatureComplete}
            signerName={recipientName}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

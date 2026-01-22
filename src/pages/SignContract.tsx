import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ContractSigningPage from '@/components/ContractSigningPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileX, Home } from 'lucide-react';

interface PendingContract {
  contractHTML: string;
  contractName: string;
  senderCompany: string;
  recipientName: string;
  recipientEmail: string;
  createdAt: string;
  status: string;
}

export default function SignContract() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<PendingContract | null>(null);
  const [contractId, setContractId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const id = searchParams.get('id');
    
    if (!id) {
      setError('No contract ID provided');
      return;
    }

    setContractId(id);

    // Load contract from localStorage
    const pendingContracts = JSON.parse(localStorage.getItem('bamlead_pending_contracts') || '{}');
    const contractData = pendingContracts[id];

    if (!contractData) {
      setError('Contract not found or has expired');
      return;
    }

    if (contractData.status === 'signed') {
      setError('This contract has already been signed');
      return;
    }

    setContract(contractData);
  }, [searchParams]);

  const handleSigningComplete = () => {
    // Update contract status
    const pendingContracts = JSON.parse(localStorage.getItem('bamlead_pending_contracts') || '{}');
    if (pendingContracts[contractId]) {
      pendingContracts[contractId].status = 'signed';
      pendingContracts[contractId].signedAt = new Date().toISOString();
      localStorage.setItem('bamlead_pending_contracts', JSON.stringify(pendingContracts));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileX className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Contract Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this is an error, please contact the sender.
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading contract...</div>
      </div>
    );
  }

  return (
    <ContractSigningPage
      contractId={contractId}
      contractHTML={contract.contractHTML}
      contractName={contract.contractName}
      senderCompany={contract.senderCompany}
      recipientName={contract.recipientName}
      recipientEmail={contract.recipientEmail}
      onSigningComplete={handleSigningComplete}
    />
  );
}

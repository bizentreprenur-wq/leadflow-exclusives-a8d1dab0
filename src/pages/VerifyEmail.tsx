import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '@/lib/api/password';
import BackButton from '@/components/BackButton';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link.');
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyEmail(token);
        setIsSuccess(true);
        toast.success(result.message);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-6">
        <BackButton fallbackPath="/" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${
              isLoading ? 'bg-primary/10' : error ? 'bg-destructive/10' : 'bg-emerald-500/10'
            }`}>
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : error ? (
                <XCircle className="w-8 h-8 text-destructive" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? 'Verifying...' : error ? 'Verification Failed' : 'Email Verified!'}
            </CardTitle>
            <CardDescription>
              {isLoading 
                ? 'Please wait while we verify your email'
                : error 
                  ? error 
                  : 'Your email has been successfully verified'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoading && (
              <div className="space-y-4 text-center">
                {isSuccess ? (
                  <>
                    <p className="text-muted-foreground">
                      You can now access all features of your account.
                    </p>
                    <Link to="/dashboard">
                      <Button className="w-full">Go to Dashboard</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      The verification link may have expired or already been used.
                    </p>
                    <Link to="/auth">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

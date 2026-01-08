import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CreditCard,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Calendar,
  DollarSign,
  RefreshCw,
  XCircle,
  Gift,
  Sparkles,
} from 'lucide-react';
import {
  getSubscription,
  getPaymentHistory,
  cancelSubscription,
  resumeSubscription,
  createPortalSession,
  Subscription,
  Payment,
} from '@/lib/api/stripe';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

export default function SubscriptionManagement() {
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isFreeAccount, setIsFreeAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [subData, historyData] = await Promise.all([
        getSubscription(),
        getPaymentHistory(),
      ]);
      
      setSubscription(subData.subscription);
      setIsOwner(subData.is_owner);
      setIsFreeAccount(subData.is_free_account);
      setPayments(historyData.payments || []);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (immediately: boolean = false) => {
    setIsActionLoading(true);
    try {
      await cancelSubscription(immediately);
      toast.success(immediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will cancel at the end of your billing period'
      );
      await loadSubscriptionData();
      await refreshUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResume = async () => {
    setIsActionLoading(true);
    try {
      await resumeSubscription();
      toast.success('Subscription resumed!');
      await loadSubscriptionData();
      await refreshUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resume subscription');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsActionLoading(true);
    try {
      const { portal_url } = await createPortalSession();
      window.location.href = portal_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><AlertCircle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Owner or Free Account
  if (isOwner || isFreeAccount) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {isOwner ? 'Owner Account' : 'Complimentary Access'}
                </CardTitle>
                <CardDescription>
                  {isOwner 
                    ? 'You have full access to all features as the platform owner.'
                    : 'You have been granted free access to all premium features.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-600">
              <Gift className="w-5 h-5" />
              <span className="font-medium">Unlimited access to all features - no payment required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No subscription
  if (!subscription) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-muted">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">No Active Subscription</CardTitle>
                <CardDescription>
                  Upgrade to unlock premium features and find more leads.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to grow your business?</h3>
              <p className="text-muted-foreground mb-4">
                Get more searches, AI verification credits, and premium support.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="gap-2">
                  <Crown className="w-4 h-4" />
                  View Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active subscription
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl capitalize">{subscription.plan} Plan</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </div>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Period Ends</p>
                <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Auto-Renew</p>
                <p className="font-medium">
                  {subscription.cancel_at_period_end ? (
                    <span className="text-amber-600">Cancels at period end</span>
                  ) : (
                    <span className="text-emerald-600">Enabled</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={handleOpenPortal}
              disabled={isActionLoading}
              className="gap-2"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing
            </Button>

            {subscription.cancel_at_period_end ? (
              <Button 
                onClick={handleResume}
                disabled={isActionLoading}
                className="gap-2"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Resume Subscription
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can cancel at the end of your billing period (you'll keep access until {formatDate(subscription.current_period_end)}) or cancel immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancel(false)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Cancel at Period End
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={() => handleCancel(true)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Cancel Immediately
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'paid' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      {payment.status === 'paid' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.description || 'Subscription Payment'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</p>
                    <Badge variant="secondary" className="text-xs capitalize">{payment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Pro Onboarding Page
 * Dedicated page for $99/mo Pro tier setup wizard
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProOnboardingWizard from '@/components/ProOnboardingWizard';

const ProOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('bamlead_pro_onboarding_complete') === 'true') {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      // ignore localStorage access issues
    }
  }, [navigate]);

  const handleComplete = () => {
    isCompletingRef.current = true;
    setIsCompleting(true);
    setOpen(false);
    navigate('/dashboard');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !isCompletingRef.current && !isCompleting) {
      navigate('/pricing');
    }
  };

  return (
    <ProOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default ProOnboarding;

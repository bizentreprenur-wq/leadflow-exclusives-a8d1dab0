/**
 * Basic Onboarding Page
 * Dedicated page for $49/mo Basic tier setup wizard
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicOnboardingWizard from '@/components/BasicOnboardingWizard';

const BasicOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('bamlead_basic_onboarding_complete') === 'true') {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      // ignore localStorage access issues
    }
  }, [navigate]);

  const handleComplete = () => {
    setOpen(false);
    navigate('/dashboard');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      navigate('/pricing');
    }
  };

  return (
    <BasicOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default BasicOnboarding;

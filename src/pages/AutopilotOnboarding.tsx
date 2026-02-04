/**
 * Autopilot Onboarding Page
 * Dedicated page for $249/mo Autopilot tier setup wizard
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutopilotOnboardingWizard from '@/components/AutopilotOnboardingWizard';

const AutopilotOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const isCompletingRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('bamlead_autopilot_onboarding_complete') === 'true') {
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
    <AutopilotOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default AutopilotOnboarding;

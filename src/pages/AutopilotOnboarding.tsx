/**
 * Autopilot Onboarding Page
 * Dedicated page for $249/mo Autopilot tier setup wizard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutopilotOnboardingWizard from '@/components/AutopilotOnboardingWizard';

const AutopilotOnboarding = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

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
    <AutopilotOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default AutopilotOnboarding;

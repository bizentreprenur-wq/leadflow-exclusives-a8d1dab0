/**
 * Basic Onboarding Page
 * Dedicated page for $49/mo Basic tier setup wizard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicOnboardingWizard from '@/components/BasicOnboardingWizard';

const BasicOnboarding = () => {
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
    <BasicOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default BasicOnboarding;

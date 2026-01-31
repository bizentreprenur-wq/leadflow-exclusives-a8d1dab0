/**
 * Pro Onboarding Page
 * Dedicated page for $99/mo Pro tier setup wizard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProOnboardingWizard from '@/components/ProOnboardingWizard';

const ProOnboarding = () => {
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
    <ProOnboardingWizard 
      open={open}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
};

export default ProOnboarding;

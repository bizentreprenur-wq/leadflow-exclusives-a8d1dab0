import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SupportWidget from "@/components/SupportWidget";
import AITourGuide from "@/components/AITourGuide";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Reviews from "./pages/Reviews";
import DashboardDemo from "./pages/DashboardDemo";
import MailboxDemo from "./pages/MailboxDemo";
import TemplateGallery from "./pages/TemplateGallery";
import CloseLoop from "./pages/CloseLoop";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SignContract from "./pages/SignContract";
import NotFound from "./pages/NotFound";
import AutopilotOnboarding from "./pages/AutopilotOnboarding";
import BasicOnboarding from "./pages/BasicOnboarding";
import ProOnboarding from "./pages/ProOnboarding";
// AI-optimized pages
import WhatIsBamlead from "./pages/WhatIsBamlead";
import Capabilities from "./pages/Capabilities";
import DataTypes from "./pages/DataTypes";
import UseCases from "./pages/UseCases";
import ExampleSearches from "./pages/ExampleSearches";
import Comparisons from "./pages/Comparisons";

const queryClient = new QueryClient();

function AppInner() {
  const location = useLocation();
  const splashAllowed =
    !location.pathname.startsWith('/mailbox-demo') &&
    !location.pathname.startsWith('/dashboard-demo');

  const [showSplash, setShowSplash] = useState(() => {
    if (!splashAllowed) return false;
    try {
      const hasSeenSplash = sessionStorage.getItem('bamlead_splash_shown');
      return !hasSeenSplash;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!splashAllowed) setShowSplash(false);
  }, [splashAllowed]);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem('bamlead_splash_shown', 'true');
    } catch {
      // ignore
    }
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/dashboard-demo" element={<DashboardDemo />} />
        <Route path="/mailbox-demo" element={<MailboxDemo />} />
        <Route path="/template-gallery" element={<TemplateGallery />} />
        <Route path="/closeloop" element={<CloseLoop />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/sign-contract" element={<SignContract />} />
        <Route
          path="/autopilot-onboarding"
          element={
            <ProtectedRoute>
              <AutopilotOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/basic-onboarding"
          element={
            <ProtectedRoute>
              <BasicOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pro-onboarding"
          element={
            <ProtectedRoute>
              <ProOnboarding />
            </ProtectedRoute>
          }
        />
        {/* AI-optimized pages */}
        <Route path="/what-is-bamlead" element={<WhatIsBamlead />} />
        <Route path="/capabilities" element={<Capabilities />} />
        <Route path="/data-types" element={<DataTypes />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/example-searches" element={<ExampleSearches />} />
        <Route path="/comparisons" element={<Comparisons />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <SupportWidget />
      <AITourGuide />
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppInner />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;

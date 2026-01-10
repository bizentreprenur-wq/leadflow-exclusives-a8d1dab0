import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Back Button */}
        <div className="container px-4 pt-6">
          <BackButton />
        </div>

        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                Terms of Service
              </h1>
              <p className="text-lg text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-6">
                By accessing or using BamLead, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">2. Use of Service</h2>
              <p className="text-muted-foreground mb-6">
                BamLead is a lead generation platform designed for web professionals. You agree to use 
                the service only for lawful purposes and in accordance with these Terms.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">3. Account Responsibilities</h2>
              <p className="text-muted-foreground mb-6">
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">4. Payment Terms</h2>
              <p className="text-muted-foreground mb-6">
                Paid subscriptions are billed in advance. Refunds are available within 7 days of purchase 
                if you are not satisfied with the service.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">5. Cancellation</h2>
              <p className="text-muted-foreground mb-6">
                You may cancel your subscription at any time. Access to paid features will continue 
                until the end of your current billing period.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-6">
                BamLead is provided "as is" without warranties of any kind. We are not liable for 
                any damages arising from your use of the service.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">7. Contact</h2>
              <p className="text-muted-foreground">
                Questions about these Terms? Contact us at:
                <br />
                <a href="mailto:support@bamlead.com" className="text-primary hover:underline">
                  support@bamlead.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

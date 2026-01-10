import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

const Privacy = () => {
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
                Privacy Policy
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
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-6">
                We collect information you provide directly to us, such as your name, email address, 
                and any other information you choose to provide when using BamLead services.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-6">
                We use the information we collect to provide, maintain, and improve our services, 
                to process transactions, and to communicate with you about your account and our services.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">3. Data Security</h2>
              <p className="text-muted-foreground mb-6">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">4. Your Rights</h2>
              <p className="text-muted-foreground mb-6">
                You have the right to access, correct, or delete your personal information. 
                Contact us at support@bamlead.com to exercise these rights.
              </p>

              <h2 className="text-2xl font-display font-bold text-foreground mb-4">5. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
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

export default Privacy;

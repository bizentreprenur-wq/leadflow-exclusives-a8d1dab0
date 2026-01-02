const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="text-2xl md:text-3xl font-display font-bold mb-8">
            <span className="text-gradient">Simple. Exclusive. Built to deliver customers.</span>
          </p>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

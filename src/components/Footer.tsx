const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="text-2xl md:text-3xl font-display font-bold mb-4">
            <span className="text-gradient">Stop guessing.</span>
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            Find businesses that need your service — now.
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

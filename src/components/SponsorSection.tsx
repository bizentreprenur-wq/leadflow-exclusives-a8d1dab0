import sthillStudiosLogo from '@/assets/sthillstudios-logo.png';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SponsorSection = () => {
  const schedulingLink = "https://calendly.com/sthillstudios"; // Replace with actual link

  return (
    <section className="py-12 border-y border-border/30 bg-gradient-to-r from-muted/30 via-background to-muted/30">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
            Our Partners
          </p>
          
          <a
            href={schedulingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-6 py-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-300"
          >
            <img
              src={sthillStudiosLogo}
              alt="SthillStudios"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div className="text-left">
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                SthillStudios
              </p>
              <p className="text-xs text-muted-foreground">
                Professional Website Design
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
          </a>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => window.open('mailto:advertise@bamlead.com', '_blank')}
          >
            Want to advertise here?
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SponsorSection;

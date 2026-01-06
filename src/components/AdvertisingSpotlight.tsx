import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Megaphone, ArrowRight } from 'lucide-react';
import sthillStudiosLogo from '@/assets/sthillstudios-logo.png';

interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo: string;
  link: string;
  cta: string;
  featured?: boolean;
}

const sponsors: Sponsor[] = [
  {
    id: 'sthillstudios',
    name: 'SthillStudios',
    description: 'Need a professional website to convert your leads? Our sister company builds stunning, high-converting websites for businesses of all sizes.',
    logo: sthillStudiosLogo,
    link: 'https://calendly.com/sthillstudios', // Replace with actual link
    cta: 'Schedule a Free Consultation',
    featured: true,
  },
];

const AdvertisingSpotlight = () => {
  return (
    <Card className="border-border bg-gradient-to-br from-card via-card to-primary/5 shadow-card overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Partner Spotlight</CardTitle>
            <CardDescription>Trusted services from our network</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className={`relative p-5 rounded-xl border transition-all duration-300 ${
                sponsor.featured
                  ? 'border-primary/30 bg-primary/5 hover:border-primary/50'
                  : 'border-border/50 bg-card hover:border-border'
              }`}
            >
              {sponsor.featured && (
                <span className="absolute -top-2 left-4 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
                  Featured Partner
                </span>
              )}
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 shadow-sm">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-1">{sponsor.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sponsor.description}
                  </p>
                </div>
                
                <Button
                  className="shrink-0 gap-2"
                  onClick={() => window.open(sponsor.link, '_blank')}
                >
                  {sponsor.cta}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Advertise CTA */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Want your business featured here?</p>
              <p className="text-sm text-muted-foreground">
                Reach thousands of business owners and decision-makers.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => window.open('mailto:advertise@bamlead.com?subject=Advertising%20Inquiry', '_blank')}
            >
              Advertise With Us
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvertisingSpotlight;

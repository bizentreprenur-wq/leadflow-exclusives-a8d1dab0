import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is BamLead?",
    answer: "BamLead is a lead generation platform built for website designers, social media marketers, and digital agencies. Our AI-powered scanners find businesses with broken websites, weak social presence, missing reviews, and other digital gaps — helping you discover clients who need exactly what you offer.",
  },
  {
    question: "How does the Agency Lead Finder work?",
    answer: "Enter a business type (like 'plumbers' or 'dentists') and a location. Our AI scans the web to find businesses with outdated websites, inactive social profiles, missing tracking pixels, low reviews, and other issues. You get a prioritized list of leads ready for outreach.",
  },
  {
    question: "What types of issues can BamLead detect?",
    answer: "BamLead detects broken or outdated websites, missing Google Analytics & Facebook Pixels, no booking systems, weak or inactive social media profiles, low or no reviews, missing retargeting, and businesses leaking leads online. Perfect for finding clients who need your digital services.",
  },
  {
    question: "Who is BamLead built for?",
    answer: "BamLead is designed specifically for website designers, social media marketers, digital marketing agencies, SEO professionals, and freelance consultants looking for clients who need help with their online presence.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Every new account gets 5 free searches to test the platform. No credit card required. After that, you can upgrade to one of our paid plans starting at $49/month.",
  },
  {
    question: "What information do I get for each lead?",
    answer: "Each lead includes business name, address, phone number, website URL, Google rating, detected issues (broken website, no social, missing reviews, etc.), mobile score, and AI-powered recommendations for how to approach them.",
  },
  {
    question: "Can I export my leads?",
    answer: "Absolutely! Export leads as CSV files, copy to Google Docs, or generate comprehensive PDF Intelligence Reports with AI insights and prioritized action plans.",
  },
  {
    question: "How accurate is the analysis?",
    answer: "Our AI analysis has a 95%+ accuracy rate for detecting website issues, social media gaps, and tracking problems. We use multiple signals to ensure you're targeting genuinely qualified prospects.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about BamLead and how it can help you find more clients.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-card"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is BamLead?",
    answer: "BamLead is a lead generation platform designed for web designers and SEO professionals. It scans Google My Business listings and search results to find businesses with outdated, poorly performing, or WordPress-based websites that need an upgrade.",
  },
  {
    question: "How does the search work?",
    answer: "Simply enter a business niche (like 'plumbers' or 'dentists') and a location. Our platform searches Google My Business and live search results, analyzes each website for quality, mobile performance, and technology stack, then presents you with a curated list of leads.",
  },
  {
    question: "What platforms can BamLead detect?",
    answer: "BamLead can detect 16+ platforms including WordPress, Wix, Squarespace, Joomla, Magento, Shopify, Drupal, custom PHP sites, and more. We identify businesses using legacy or outdated platforms that would benefit from a modern website.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Every new account gets 5 free searches to test the platform. No credit card required. After that, you can upgrade to one of our paid plans starting at $49/month.",
  },
  {
    question: "What information do I get for each lead?",
    answer: "Each lead includes business name, address, phone number, website URL, Google rating, platform/CMS detected, mobile performance score, and website quality assessment. Verified leads also include email addresses when available.",
  },
  {
    question: "Can I export my leads?",
    answer: "Absolutely! You can export leads as CSV files, copy them to clipboard for Google Docs, or generate comprehensive PDF reports with summary statistics and detailed lead breakdowns.",
  },
  {
    question: "How accurate is the website analysis?",
    answer: "Our analysis has a 95% accuracy rate for platform detection. We use multiple signals including meta tags, HTML structure, JavaScript libraries, and server headers to determine the technology stack.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processing. All plans are billed monthly with no long-term contracts.",
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

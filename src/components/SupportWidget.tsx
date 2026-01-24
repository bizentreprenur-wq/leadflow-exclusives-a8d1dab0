import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, X, Send, Phone, Mail, HelpCircle, 
  ChevronRight, ArrowLeft, Loader2, CheckCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

type View = "main" | "chat" | "contact" | "faq";

const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  const [chatMessages, setChatMessages] = useState<{role: "user" | "assistant", content: string}[]>([
    { role: "assistant", content: "Hi! 👋 I'm here to help. What can I assist you with today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      question: "How do I search for leads?",
      answer: "Use our two search methods: 1) Google My Business Scanner finds local businesses, 2) Agency Lead Finder helps web designers, agencies & SMMA find clients needing website fixes, GMB optimization, reviews & social media help. Just enter a service type and location to get started!"
    },
    {
      question: "How does AI lead verification work?",
      answer: "Our AI analyzes each lead's website, checks if contact info is valid, assesses their need for your services, and scores their conversion potential. This saves you hours of manual research."
    },
    {
      question: "What platforms can you detect?",
      answer: "We detect 16+ platforms including WordPress, Wix, Weebly, Squarespace, Joomla, Drupal, Magento, GoDaddy, and custom PHP/HTML sites."
    },
    {
      question: "How do I install the Chrome extension?",
      answer: "Download the extension files, go to chrome://extensions, enable Developer Mode, click 'Load unpacked', and select the chrome-extension folder. Full guide in the download."
    },
    {
      question: "How many leads can I export?",
      answer: "Each search returns up to 60+ leads. You can export unlimited leads as CSV, PDF, or send directly to your email outreach system."
    },
    {
      question: "What AI features are included?",
      answer: "BamLead includes Pre-Intent Detection, Emotional State AI, Outcome Simulator, Psychological Profiler, and more. These work automatically to improve your conversions."
    }
  ];

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Great question! Let me help you with that. For detailed guidance, you can also check our FAQ section or send us a message through the contact form.",
        "I understand. Our team typically responds within 24 hours. For immediate help, check out the FAQ section - it covers the most common questions!",
        "Thanks for reaching out! Based on your question, I'd recommend checking our documentation or speaking with our support team via the contact form.",
        "That's a popular question! You can find step-by-step guides in our dashboard. Would you like me to connect you with our support team?"
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setContactForm({ name: "", email: "", message: "" });
    setView("main");
    setIsSubmitting(false);
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/1234567890?text=Hi! I have a question about BamLead.", "_blank");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-card rounded-2xl border border-border shadow-elevated overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
            <div className="flex items-center justify-between">
              {view !== "main" && (
                <button onClick={() => setView("main")} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="text-center flex-1">
                <h3 className="font-display font-bold">BamLead Support</h3>
                <p className="text-xs opacity-90">We're here to help!</p>
              </div>
              {view === "main" && <div className="w-6" />}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {view === "main" && (
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setView("chat")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Live Chat</p>
                    <p className="text-xs text-muted-foreground">Chat with our AI assistant</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <button
                  onClick={() => setView("contact")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Contact Us</p>
                    <p className="text-xs text-muted-foreground">Send us a message</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Quick message on WhatsApp</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </button>

                <button
                  onClick={() => setView("faq")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Help Center</p>
                    <p className="text-xs text-muted-foreground">Browse FAQs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}

            {view === "chat" && (
              <div className="flex flex-col h-80">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary text-foreground p-3 rounded-2xl rounded-bl-md text-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "0.1s"}} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "0.2s"}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <Button size="icon" onClick={handleSendChat}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {view === "contact" && (
              <form onSubmit={handleSubmitContact} className="p-4 space-y-3">
                <Input
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <Textarea
                  placeholder="How can we help?"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}

            {view === "faq" && (
              <div className="p-4 space-y-2">
                {faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                      <span className="font-medium text-sm text-foreground pr-2">{faq.question}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="p-3 text-sm text-muted-foreground">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportWidget;

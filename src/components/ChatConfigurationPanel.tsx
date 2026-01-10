import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  MessageCircle, Plus, Trash2, Save, Settings,
  CheckCircle, XCircle, Edit2, HelpCircle, Send,
  Bot, User, Clock, AlertCircle
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  enabled: boolean;
}

interface PendingMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: Date;
  replied: boolean;
}

const ChatConfigurationPanel = () => {
  const [chatEnabled, setChatEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! 👋 I'm here to help. What can I assist you with today?");
  const [businessHours, setBusinessHours] = useState("9am - 6pm EST");
  const [whatsappNumber, setWhatsappNumber] = useState("+1234567890");
  const [supportEmail, setSupportEmail] = useState("support@bamlead.com");
  
  // FAQ Management
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "How do I search for leads?",
      answer: "Use our two search methods: 1) Google My Business Scanner finds local businesses, 2) Platform Scanner detects outdated websites via Google & Bing. Just enter a service type and location to get started!",
      enabled: true
    },
    {
      id: "2", 
      question: "How does AI lead verification work?",
      answer: "Our AI analyzes each lead's website, checks if contact info is valid, assesses their need for your services, and scores their conversion potential. This saves you hours of manual research.",
      enabled: true
    },
    {
      id: "3",
      question: "What platforms can you detect?",
      answer: "We detect 16+ platforms including WordPress, Wix, Weebly, Squarespace, Joomla, Drupal, Magento, GoDaddy, and custom PHP/HTML sites.",
      enabled: true
    },
    {
      id: "4",
      question: "How do I install the Chrome extension?",
      answer: "Download the extension files, go to chrome://extensions, enable Developer Mode, click 'Load unpacked', and select the chrome-extension folder. Full guide in the download.",
      enabled: true
    },
    {
      id: "5",
      question: "How many leads can I export?",
      answer: "Each search returns up to 60+ leads. You can export unlimited leads as CSV, PDF, or send directly to your email outreach system.",
      enabled: true
    },
    {
      id: "6",
      question: "What AI features are included?",
      answer: "BamLead includes Pre-Intent Detection, Emotional State AI, Outcome Simulator, Psychological Profiler, and more. These work automatically to improve your conversions.",
      enabled: true
    }
  ]);

  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // Pending messages (simulated - in production would come from backend)
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([
    {
      id: "m1",
      name: "John Smith",
      email: "john@example.com",
      message: "Hi, I'm having trouble connecting my Google Drive. Can you help?",
      timestamp: new Date(Date.now() - 3600000),
      replied: false
    },
    {
      id: "m2",
      name: "Sarah Johnson",
      email: "sarah@agency.com",
      message: "Do you offer bulk pricing for agencies with 10+ users?",
      timestamp: new Date(Date.now() - 7200000),
      replied: false
    }
  ]);

  const [replyText, setReplyText] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      chatEnabled,
      autoReplyEnabled,
      welcomeMessage,
      businessHours,
      whatsappNumber,
      supportEmail,
      faqs
    };
    localStorage.setItem("chatSettings", JSON.stringify(settings));
    toast.success("Chat settings saved!");
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatSettings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setChatEnabled(settings.chatEnabled ?? true);
        setAutoReplyEnabled(settings.autoReplyEnabled ?? true);
        setWelcomeMessage(settings.welcomeMessage || welcomeMessage);
        setBusinessHours(settings.businessHours || businessHours);
        setWhatsappNumber(settings.whatsappNumber || whatsappNumber);
        setSupportEmail(settings.supportEmail || supportEmail);
        if (settings.faqs) setFaqs(settings.faqs);
      } catch (e) {
        console.error("Failed to load chat settings:", e);
      }
    }
  }, []);

  // Add new FAQ
  const addFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error("Please fill in both question and answer");
      return;
    }
    const newFaq: FAQ = {
      id: Date.now().toString(),
      question: newFaqQuestion,
      answer: newFaqAnswer,
      enabled: true
    };
    setFaqs([...faqs, newFaq]);
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    toast.success("FAQ added!");
  };

  // Delete FAQ
  const deleteFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
    toast.success("FAQ deleted");
  };

  // Toggle FAQ enabled
  const toggleFaq = (id: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  // Update FAQ
  const updateFaq = (id: string, question: string, answer: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, question, answer } : f));
    setEditingFaqId(null);
    toast.success("FAQ updated!");
  };

  // Reply to message
  const replyToMessage = (messageId: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    
    const message = pendingMessages.find(m => m.id === messageId);
    if (!message) return;

    // Open email client with reply
    const mailtoLink = `mailto:${message.email}?subject=Re: Your BamLead Support Request&body=${encodeURIComponent(replyText)}`;
    window.open(mailtoLink, "_blank");

    // Mark as replied
    setPendingMessages(pendingMessages.map(m => 
      m.id === messageId ? { ...m, replied: true } : m
    ));
    setReplyText("");
    setSelectedMessageId(null);
    toast.success("Reply sent via email!");
  };

  // Dismiss message
  const dismissMessage = (messageId: string) => {
    setPendingMessages(pendingMessages.filter(m => m.id !== messageId));
    toast.success("Message dismissed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Chat Configuration</h1>
          <p className="text-muted-foreground">Manage your support chat, FAQs, and respond to customer messages</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{pendingMessages.filter(m => !m.replied).length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pending Messages</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{faqs.filter(f => f.enabled).length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active FAQs</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{autoReplyEnabled ? "ON" : "OFF"}</span>
            </div>
            <p className="text-sm text-muted-foreground">Auto-Reply</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold">{businessHours}</span>
            </div>
            <p className="text-sm text-muted-foreground">Business Hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Pending Messages */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Messages
              {pendingMessages.filter(m => !m.replied).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingMessages.filter(m => !m.replied).length} New
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Respond to customer inquiries from the chat widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {pendingMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending messages</p>
                  <p className="text-sm">Messages from customers will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border-2 ${
                        msg.replied 
                          ? "bg-muted/50 border-muted" 
                          : "bg-card border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{msg.name}</p>
                          <p className="text-sm text-muted-foreground">{msg.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.replied ? (
                            <Badge variant="outline" className="text-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" /> Replied
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-500">
                              <AlertCircle className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mb-3 bg-muted/50 p-3 rounded-lg">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Received: {msg.timestamp.toLocaleString()}
                      </p>
                      
                      {!msg.replied && (
                        <>
                          {selectedMessageId === msg.id ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => replyToMessage(msg.id)}>
                                  <Send className="w-4 h-4 mr-1" /> Send Reply
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setSelectedMessageId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedMessageId(msg.id)}
                              >
                                Reply
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => dismissMessage(msg.id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column - Chat Settings */}
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Chat Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="chat-enabled">Chat Widget Enabled</Label>
                  <p className="text-sm text-muted-foreground">Show chat bubble on your site</p>
                </div>
                <Switch
                  id="chat-enabled"
                  checked={chatEnabled}
                  onCheckedChange={setChatEnabled}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-reply">Auto-Reply with AI</Label>
                  <p className="text-sm text-muted-foreground">AI responds when you're away</p>
                </div>
                <Switch
                  id="auto-reply"
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Business Hours</Label>
                  <Input
                    id="hours"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Support Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
              <Button onClick={saveSettings} className="w-full gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Management - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            FAQ Management
          </CardTitle>
          <CardDescription>
            Add, edit, or remove frequently asked questions that appear in the chat widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New FAQ */}
          <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New FAQ
            </h4>
            <div className="space-y-3">
              <Input
                placeholder="Question (e.g., How do I reset my password?)"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
              />
              <Textarea
                placeholder="Answer (provide a helpful, detailed response)"
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                rows={2}
              />
              <Button onClick={addFaq} className="gap-2">
                <Plus className="w-4 h-4" /> Add FAQ
              </Button>
            </div>
          </div>

          {/* Existing FAQs */}
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className={`p-4 rounded-lg border ${
                  faq.enabled ? "bg-card" : "bg-muted/50 opacity-75"
                }`}
              >
                {editingFaqId === faq.id ? (
                  <div className="space-y-3">
                    <Input
                      value={faq.question}
                      onChange={(e) => setFaqs(faqs.map(f => 
                        f.id === faq.id ? { ...f, question: e.target.value } : f
                      ))}
                    />
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => setFaqs(faqs.map(f => 
                        f.id === faq.id ? { ...f, answer: e.target.value } : f
                      ))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateFaq(faq.id, faq.question, faq.answer)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingFaqId(null)}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{faq.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={faq.enabled}
                          onCheckedChange={() => toggleFaq(faq.id)}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setEditingFaqId(faq.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteFaq(faq.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatConfigurationPanel;

/**
 * SMS Conversation Panel
 * Full bi-directional SMS interface for Autopilot tier
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Clock,
  CheckCheck,
  AlertCircle,
  Phone,
  Building2,
  ChevronRight,
  Zap,
  RefreshCw,
  FileText,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import {
  SMSConversation,
  SMSMessage,
  DEFAULT_SMS_TEMPLATES,
  sendSMS,
  getAISMSReply
} from '@/lib/api/sms';

interface SMSConversationPanelProps {
  conversations: SMSConversation[];
  onRefresh: () => void;
  isLoading?: boolean;
  userPhoneNumber?: string;
  companyName?: string;
}

export default function SMSConversationPanel({
  conversations,
  onRefresh,
  isLoading = false,
  userPhoneNumber,
  companyName
}: SMSConversationPanelProps) {
  const [selectedConversation, setSelectedConversation] = useState<SMSConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const result = await sendSMS({
        lead_id: selectedConversation.lead_id,
        lead_phone: selectedConversation.lead_phone,
        lead_name: selectedConversation.lead_name,
        business_name: selectedConversation.business_name,
        message: newMessage.trim()
      });

      if (result.success) {
        toast.success('Message sent!');
        setNewMessage('');
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAIReply = async () => {
    if (!selectedConversation) return;

    setIsGeneratingReply(true);
    try {
      const result = await getAISMSReply(selectedConversation.lead_id, {
        lead_name: selectedConversation.lead_name,
        business_name: selectedConversation.business_name,
        previous_messages: selectedConversation.messages
      });

      if (result.success && result.suggested_reply) {
        setNewMessage(result.suggested_reply);
        toast.success('AI generated a reply suggestion');
      } else {
        // Fallback to local AI suggestion
        const suggestion = generateLocalAISuggestion(selectedConversation);
        setNewMessage(suggestion);
        toast.success('AI reply suggestion ready');
      }
    } catch (error) {
      // Fallback
      const suggestion = generateLocalAISuggestion(selectedConversation);
      setNewMessage(suggestion);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const generateLocalAISuggestion = (conv: SMSConversation): string => {
    const lastMessage = conv.messages[conv.messages.length - 1];
    const name = conv.lead_name?.split(' ')[0] || 'there';
    
    if (lastMessage?.direction === 'inbound') {
      const msg = lastMessage.message.toLowerCase();
      
      if (msg.includes('interested') || msg.includes('yes') || msg.includes('tell me more')) {
        return `Great to hear from you, ${name}! I'd love to schedule a quick call to discuss how we can help ${conv.business_name || 'your business'}. What time works best for you this week?`;
      }
      
      if (msg.includes('busy') || msg.includes('later') || msg.includes('not now')) {
        return `No problem at all, ${name}! I'll follow up next week. In the meantime, feel free to reach out if anything comes up. 👍`;
      }
      
      if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
        return `Great question, ${name}! Our pricing is customized based on your specific needs. Can we hop on a quick 10-minute call so I can understand your situation better and give you an accurate quote?`;
      }
      
      if (msg.includes('?')) {
        return `Thanks for your question, ${name}! Let me get you the info you need. Would it be easier to jump on a quick call, or should I send over some details via text?`;
      }
    }
    
    return `Hi ${name}, following up on our conversation. When would be a good time to connect this week?`;
  };

  const handleUseTemplate = (template: typeof DEFAULT_SMS_TEMPLATES[0]) => {
    let message = template.message;
    
    if (selectedConversation) {
      message = message
        .replace('{name}', selectedConversation.lead_name?.split(' ')[0] || 'there')
        .replace('{business}', selectedConversation.business_name || 'your business')
        .replace('{company}', companyName || 'our company')
        .replace('{sender}', 'our team');
    }
    
    setNewMessage(message);
    setShowTemplates(false);
  };

  const getStatusIcon = (status: SMSMessage['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-emerald-500" />;
      case 'sent':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getSentimentBadge = (sentiment?: SMSConversation['sentiment']) => {
    switch (sentiment) {
      case 'interested':
        return <Badge className="bg-emerald-500 text-white text-xs">Interested</Badge>;
      case 'positive':
        return <Badge className="bg-blue-500 text-white text-xs">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-500 text-white text-xs">Needs Attention</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              SMS Inbox
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {userPhoneNumber && (
            <p className="text-xs text-muted-foreground font-mono">{userPhoneNumber}</p>
          )}
        </CardHeader>
        <ScrollArea className="flex-1">
          {conversations.length > 0 ? (
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.lead_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedConversation?.lead_id === conv.lead_id ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {conv.lead_name}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conv.business_name && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {conv.business_name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.last_message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                      {getSentimentBadge(conv.sentiment)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">No SMS conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Send your first message to start texting leads
              </p>
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Conversation View */}
      <Card className="md:col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedConversation.lead_name}
                    {getSentimentBadge(selectedConversation.sentiment)}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedConversation.lead_phone}
                    </span>
                    {selectedConversation.business_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {selectedConversation.business_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${
                      msg.direction === 'outbound' 
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                        : 'bg-muted rounded-2xl rounded-bl-md'
                    } p-3`}>
                      <p className="text-sm">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* AI Suggestion Banner */}
            {selectedConversation.ai_suggested_reply && (
              <div className="px-4 py-2 bg-primary/5 border-t border-primary/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">AI Suggested Reply:</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {selectedConversation.ai_suggested_reply}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewMessage(selectedConversation.ai_suggested_reply || '')}
                  >
                    Use
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Templates */}
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t overflow-hidden"
                >
                  <div className="p-3 bg-muted/30 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Quick Templates</p>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SMS_TEMPLATES.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTemplates(!showTemplates)}
                  title="Templates"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateAIReply}
                  disabled={isGeneratingReply}
                  title="AI Suggest Reply"
                >
                  {isGeneratingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="gap-2"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI will analyze responses and suggest optimal replies automatically
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a lead from the inbox to view messages
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

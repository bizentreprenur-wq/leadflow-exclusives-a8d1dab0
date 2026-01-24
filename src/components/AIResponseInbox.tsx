import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Mail, Bot, User, Send, Edit3, Check, X, RefreshCw,
  Sparkles, Clock, CheckCircle2, MessageSquare, Loader2,
  ThumbsUp, ThumbsDown, RotateCcw, Eye, ArrowRight
} from 'lucide-react';

interface EmailReply {
  id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body: string;
  received_at: string;
  lead_id?: string;
  original_email_id?: string;
  status: 'new' | 'ai_drafted' | 'approved' | 'sent' | 'rejected';
  ai_draft?: string;
  human_response?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface AIResponseInboxProps {
  onSendResponse?: (replyId: string, response: string) => Promise<void>;
}

// Demo replies for demonstration
const DEMO_REPLIES: EmailReply[] = [
  {
    id: '1',
    from_email: 'john@acmeplumbing.com',
    from_name: 'John Miller',
    subject: 'Re: Website Upgrade Offer',
    body: "Hi, thanks for reaching out! We've been thinking about updating our website. Can you tell me more about your pricing and timeline?",
    received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'ai_drafted',
    sentiment: 'positive',
    ai_draft: `Hi John,

Thank you for your interest! I'd be happy to provide more details.

**Pricing**: Our website packages start at $2,500 for a basic 5-page site, with custom solutions available based on your specific needs.

**Timeline**: A typical project takes 2-4 weeks from start to launch.

Would you be available for a quick 15-minute call this week to discuss your requirements? I can share some examples of similar work we've done for plumbing businesses.

Best regards`
  },
  {
    id: '2',
    from_email: 'sarah@greenleaflandscaping.com',
    from_name: 'Sarah Chen',
    subject: 'Re: Digital Marketing Proposal',
    body: "This looks interesting but we're not sure if now is the right time. What kind of results have you seen with other landscaping companies?",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'new',
    sentiment: 'neutral'
  },
  {
    id: '3',
    from_email: 'mike@cityautorepair.com',
    from_name: 'Mike Thompson',
    subject: 'Re: Lead Generation Services',
    body: "We're definitely interested! We've been struggling to get new customers. When can we schedule a call?",
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'approved',
    sentiment: 'positive',
    ai_draft: `Hi Mike,

Fantastic! I'd love to help you attract more customers to City Auto Repair.

I have availability:
- Tomorrow at 2pm or 4pm
- Thursday at 10am or 3pm

Which time works best for you? The call will be about 20 minutes, and I'll walk you through exactly how we can help you get more repair jobs.

Looking forward to connecting!`
  }
];

export default function AIResponseInbox({ onSendResponse }: AIResponseInboxProps) {
  const [replies, setReplies] = useState<EmailReply[]>(DEMO_REPLIES);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [editedDraft, setEditedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoAIDraft, setAutoAIDraft] = useState(true);
  const [responseMode, setResponseMode] = useState<'ai_suggest' | 'manual'>('ai_suggest');

  // Stats
  const newCount = replies.filter(r => r.status === 'new').length;
  const draftedCount = replies.filter(r => r.status === 'ai_drafted').length;
  const approvedCount = replies.filter(r => r.status === 'approved').length;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success bg-success/10 border-success/30';
      case 'negative': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getStatusBadge = (status: EmailReply['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>;
      case 'ai_drafted':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">AI Draft Ready</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'sent':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Sent</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
    }
  };

  const generateAIDraft = async (reply: EmailReply) => {
    setIsGenerating(true);
    
    // Simulate AI generation - in production this would call your AI endpoint
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiDraft = `Hi ${reply.from_name.split(' ')[0]},

Thank you for getting back to us! I appreciate you taking the time to respond.

Based on your message, I'd love to discuss this further and answer any questions you might have.

Would you be available for a quick 15-minute call this week? I can walk you through exactly how we can help ${reply.from_name.includes(' ') ? reply.from_name.split(' ')[1] : 'your business'} achieve your goals.

Looking forward to hearing from you!

Best regards`;

    setReplies(prev => prev.map(r => 
      r.id === reply.id 
        ? { ...r, status: 'ai_drafted' as const, ai_draft: aiDraft }
        : r
    ));
    
    if (selectedReply?.id === reply.id) {
      setSelectedReply({ ...reply, status: 'ai_drafted', ai_draft: aiDraft });
      setEditedDraft(aiDraft);
    }
    
    setIsGenerating(false);
    toast.success('AI draft generated! Review and approve to send.');
  };

  const handleApprove = async () => {
    if (!selectedReply) return;
    
    const finalResponse = editedDraft || selectedReply.ai_draft || '';
    
    setReplies(prev => prev.map(r => 
      r.id === selectedReply.id 
        ? { ...r, status: 'approved' as const, human_response: finalResponse }
        : r
    ));
    
    setSelectedReply({ ...selectedReply, status: 'approved', human_response: finalResponse });
    toast.success('Response approved! Ready to send.');
  };

  const handleSend = async () => {
    if (!selectedReply) return;
    
    setIsSending(true);
    
    try {
      const finalResponse = selectedReply.human_response || editedDraft || selectedReply.ai_draft || '';
      
      if (onSendResponse) {
        await onSendResponse(selectedReply.id, finalResponse);
      } else {
        // Demo mode - simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setReplies(prev => prev.map(r => 
        r.id === selectedReply.id 
          ? { ...r, status: 'sent' as const }
          : r
      ));
      
      toast.success(`Response sent to ${selectedReply.from_email}!`);
      setSelectedReply(null);
      
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsSending(false);
    }
  };

  const handleReject = () => {
    if (!selectedReply) return;
    
    setReplies(prev => prev.map(r => 
      r.id === selectedReply.id 
        ? { ...r, status: 'rejected' as const }
        : r
    ));
    
    toast.info('Response rejected. You can regenerate or write manually.');
    setSelectedReply(null);
  };

  const handleRegenerate = async () => {
    if (!selectedReply) return;
    await generateAIDraft(selectedReply);
  };

  const selectReply = (reply: EmailReply) => {
    setSelectedReply(reply);
    setEditedDraft(reply.ai_draft || reply.human_response || '');
  };

  return (
    <div className="space-y-4">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Inbox Replies</h3>
            <p className="text-xs text-muted-foreground">AI drafts responses • You approve before sending</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-ai" className="text-xs text-muted-foreground">Auto AI Draft</Label>
            <Switch 
              id="auto-ai"
              checked={autoAIDraft}
              onCheckedChange={setAutoAIDraft}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{newCount}</div>
            <div className="text-xs text-muted-foreground">New Replies</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{draftedCount}</div>
            <div className="text-xs text-muted-foreground">AI Drafts Ready</div>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
            <div className="text-xs text-muted-foreground">Ready to Send</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Reply List */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Incoming Replies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-3">
                {replies.filter(r => r.status !== 'sent').map(reply => (
                  <motion.button
                    key={reply.id}
                    onClick={() => selectReply(reply)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedReply?.id === reply.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-card hover:bg-muted/50 border-border/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{reply.from_name}</span>
                      {getStatusBadge(reply.status)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mb-1">
                      {reply.subject}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getSentimentColor(reply.sentiment)}`}>
                        {reply.sentiment || 'neutral'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(reply.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.button>
                ))}
                
                {replies.filter(r => r.status !== 'sent').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending replies</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Response Editor */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Response Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReply ? (
              <div className="space-y-4">
                {/* Original Message Preview */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedReply.from_name}</span>
                    <span className="text-xs text-muted-foreground">({selectedReply.from_email})</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedReply.body}</p>
                </div>

                <Separator />

                {/* AI Draft or Editor */}
                {selectedReply.status === 'new' && !selectedReply.ai_draft ? (
                  <div className="text-center py-6">
                    <Bot className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Let AI draft a response based on the conversation
                    </p>
                    <Button 
                      onClick={() => generateAIDraft(selectedReply)}
                      disabled={isGenerating}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate AI Draft
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">AI Suggested Response</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="text-xs gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Regenerate
                      </Button>
                    </div>
                    
                    <Textarea
                      value={editedDraft}
                      onChange={(e) => setEditedDraft(e.target.value)}
                      className="min-h-[200px] text-sm"
                      placeholder="Edit the AI draft or write your own response..."
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedReply.status !== 'approved' && (
                        <Button 
                          onClick={handleApprove}
                          className="flex-1 gap-2 bg-success hover:bg-success/90"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Approve Draft
                        </Button>
                      )}
                      
                      {selectedReply.status === 'approved' && (
                        <Button 
                          onClick={handleSend}
                          disabled={isSending}
                          className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Response
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={handleReject}
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a reply to view and respond</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">How AI Response Assistant Works</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  Replies come in and AI analyzes sentiment
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  AI drafts a personalized response based on context
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">3</span>
                  You review, edit if needed, and approve
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                  Response is sent only after your approval
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

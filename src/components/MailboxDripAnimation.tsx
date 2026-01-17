import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, Clock, Zap } from 'lucide-react';

interface MailboxDripAnimationProps {
  totalEmails: number;
  sentCount: number;
  isActive: boolean;
  emailsPerHour?: number;
}

export default function MailboxDripAnimation({
  totalEmails,
  sentCount,
  isActive,
  emailsPerHour = 50,
}: MailboxDripAnimationProps) {
  const [flyingEmails, setFlyingEmails] = useState<number[]>([]);
  const [emailId, setEmailId] = useState(0);

  // Simulate email flying animation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setEmailId(prev => prev + 1);
      setFlyingEmails(prev => [...prev, emailId]);
      
      // Remove email after animation completes
      setTimeout(() => {
        setFlyingEmails(prev => prev.filter(id => id !== emailId));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isActive, emailId]);

  const progress = totalEmails > 0 ? (sentCount / totalEmails) * 100 : 0;

  return (
    <div className="relative bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/30 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Smart Drip Campaign</h3>
            <p className="text-sm text-blue-300/80">
              {emailsPerHour} emails/hour • Optimal delivery
            </p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-400">SENDING</span>
          </div>
        )}
      </div>

      {/* Animation Container */}
      <div className="relative h-32 mb-6">
        {/* Outbox (Left) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20">
          <motion.div
            animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-20 bg-gradient-to-b from-blue-600 to-blue-800 rounded-lg border-2 border-blue-400/50 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <Send className="w-6 h-6 text-blue-200 mb-1" />
            <span className="text-xs text-blue-200 font-bold">{totalEmails - sentCount}</span>
          </motion.div>
          <p className="text-xs text-blue-300/60 text-center mt-2">Outbox</p>
        </div>

        {/* Flying Emails Path */}
        <div className="absolute left-24 right-24 top-1/2 -translate-y-1/2">
          {/* Path line */}
          <div className="h-1 bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-green-500/50 rounded-full">
            {/* Progress indicator */}
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full"
              style={{ width: `${progress}%` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          
          {/* Drip drops */}
          <div className="flex justify-between mt-2 px-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400/50"
                animate={{ 
                  opacity: isActive ? [0.3, 1, 0.3] : 0.3,
                  scale: isActive ? [1, 1.3, 1] : 1,
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Flying email animations */}
          <AnimatePresence>
            {flyingEmails.map((id) => (
              <motion.div
                key={id}
                initial={{ x: 0, y: -20, opacity: 0, scale: 0.5 }}
                animate={{ 
                  x: [0, 50, 100, 150, 200], 
                  y: [-20, -25, -20, -15, -20],
                  opacity: [0, 1, 1, 1, 0],
                  scale: [0.5, 1, 1, 1, 0.5],
                  rotate: [0, 5, 0, -5, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute left-0 top-0"
              >
                <div className="w-8 h-6 bg-white rounded shadow-lg shadow-blue-500/30 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Inbox (Right) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20">
          <motion.div
            animate={{ 
              scale: isActive && sentCount > 0 ? [1, 1.1, 1] : 1,
              boxShadow: isActive ? ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)'] : '0 0 20px rgba(34, 197, 94, 0.3)',
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-20 bg-gradient-to-b from-green-600 to-green-800 rounded-lg border-2 border-green-400/50 flex flex-col items-center justify-center"
          >
            <CheckCircle2 className="w-6 h-6 text-green-200 mb-1" />
            <span className="text-xs text-green-200 font-bold">{sentCount}</span>
          </motion.div>
          <p className="text-xs text-green-300/60 text-center mt-2">Delivered</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
            <Mail className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-white">{totalEmails}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-white">{sentCount}</p>
          <p className="text-xs text-muted-foreground">Sent</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-white">
            {Math.ceil((totalEmails - sentCount) / emailsPerHour * 60)}m
          </p>
          <p className="text-xs text-muted-foreground">ETA</p>
        </div>
      </div>

      {/* Drip Rate Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-muted-foreground">
          Drip rate: <span className="text-white font-medium">{emailsPerHour}/hour</span> for optimal deliverability
        </span>
      </div>
    </div>
  );
}

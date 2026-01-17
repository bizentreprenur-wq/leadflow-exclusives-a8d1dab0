import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Clock, Zap, Info, ArrowRight, Shield, TrendingUp } from 'lucide-react';

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
  const [showExplanation, setShowExplanation] = useState(false);

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
  const pendingCount = totalEmails - sentCount;
  const etaMinutes = Math.ceil(pendingCount / emailsPerHour * 60);
  const etaHours = Math.floor(etaMinutes / 60);
  const etaRemainingMins = etaMinutes % 60;

  return (
    <div className="space-y-4">
      {/* Main Animation Container */}
      <div className="relative bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/30 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Mailbox Icon */}
            <div className="relative w-14 h-14">
              {/* Mailbox body */}
              <div className="absolute bottom-0 w-12 h-10 bg-gradient-to-b from-blue-500 to-blue-700 rounded-lg border-2 border-blue-400/60">
                {/* Mail slot */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-900/60 rounded-full" />
              </div>
              {/* Mailbox flag */}
              <motion.div 
                className="absolute right-0 top-2 w-2 h-6 bg-red-500 rounded-sm origin-bottom"
                animate={isActive ? { rotate: [0, -45, 0] } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              {/* Mailbox post */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-blue-800" />
            </div>
            <div>
              <h3 className="font-bold text-white">Smart Drip Campaign</h3>
              <div className="flex items-center gap-2 text-sm text-blue-300/80">
                <span className="font-semibold text-primary">{emailsPerHour} emails/hour</span>
                <span>•</span>
                <span>~{Math.round(60 / emailsPerHour * 10) / 10} min between each</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="How does drip sending work?"
            >
              <Info className="w-4 h-4 text-blue-300" />
            </button>
            {isActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-400">SENDING</span>
              </div>
            )}
          </div>
        </div>

        {/* Animation Container - Mailbox Style */}
        <div className="relative h-36 mb-6">
          {/* Outbox Mailbox (Left) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
            <motion.div
              animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative"
            >
              {/* Mailbox body */}
              <div className="w-20 h-16 bg-gradient-to-b from-blue-500 to-blue-700 rounded-t-3xl rounded-b-lg border-2 border-blue-400/50 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
                {/* Mail slot */}
                <div className="absolute top-2 w-12 h-1.5 bg-blue-900/70 rounded-full" />
                {/* Door */}
                <motion.div 
                  className="absolute bottom-0 w-10 h-8 bg-blue-600 border-t-2 border-blue-400/50 rounded-b-md origin-bottom"
                  animate={isActive ? { rotateX: [0, 30, 0] } : { rotateX: 0 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-2xl font-bold text-white mt-2">{pendingCount}</span>
              </div>
              {/* Post */}
              <div className="w-3 h-6 bg-blue-800 mx-auto rounded-b" />
              {/* Flag */}
              <motion.div
                className="absolute -right-1 top-4 w-1.5 h-4 bg-amber-500 rounded-sm origin-bottom"
                animate={isActive && pendingCount > 0 ? { rotate: [-45, 0] } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </motion.div>
            <p className="text-sm text-blue-300 font-medium mt-2">Outbox</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>

          {/* Flying Emails Path */}
          <div className="absolute left-28 right-28 top-1/2 -translate-y-1/2">
            {/* Path line - styled like a road/conveyor */}
            <div className="relative h-3 bg-gradient-to-r from-blue-800/80 via-indigo-800/80 to-green-800/80 rounded-full border border-white/10">
              {/* Progress indicator */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-green-400 rounded-full"
                style={{ width: `${progress}%` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              {/* Center line markings */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
            </div>
            
            {/* Progress markers */}
            <div className="flex justify-between mt-3 px-1">
              {[0, 25, 50, 75, 100].map((marker, i) => (
                <div key={i} className="flex flex-col items-center">
                  <motion.div
                    className={`w-2 h-2 rounded-full ${progress >= marker ? 'bg-green-400' : 'bg-white/30'}`}
                    animate={{ 
                      scale: progress >= marker && isActive ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">{marker}%</span>
                </div>
              ))}
            </div>

            {/* Flying email animations */}
            <AnimatePresence>
              {flyingEmails.map((id) => (
                <motion.div
                  key={id}
                  initial={{ x: 0, y: -30, opacity: 0, scale: 0.5 }}
                  animate={{ 
                    x: [0, 60, 120, 180, 240], 
                    y: [-30, -35, -30, -25, -30],
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0.5, 1, 1, 1, 0.5],
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute left-0 top-0"
                >
                  <div className="w-10 h-7 bg-white rounded-md shadow-lg shadow-primary/40 flex items-center justify-center border border-primary/20">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Inbox Mailbox (Right) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 flex flex-col items-center">
            <motion.div
              animate={{ 
                scale: isActive && sentCount > 0 ? [1, 1.05, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="relative"
            >
              {/* Mailbox body */}
              <div className="w-20 h-16 bg-gradient-to-b from-green-500 to-green-700 rounded-t-3xl rounded-b-lg border-2 border-green-400/50 flex flex-col items-center justify-center shadow-lg shadow-green-500/30">
                {/* Mail slot */}
                <div className="absolute top-2 w-12 h-1.5 bg-green-900/70 rounded-full" />
                {/* Checkmark badge */}
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                  animate={{ scale: sentCount > 0 ? [1, 1.2, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-900" />
                </motion.div>
                <span className="text-2xl font-bold text-white mt-2">{sentCount}</span>
              </div>
              {/* Post */}
              <div className="w-3 h-6 bg-green-800 mx-auto rounded-b" />
            </motion.div>
            <p className="text-sm text-green-300 font-medium mt-2">Delivered</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{totalEmails}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{sentCount}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">
              {etaHours > 0 ? `${etaHours}h ${etaRemainingMins}m` : `${etaMinutes}m`}
            </p>
            <p className="text-xs text-muted-foreground">ETA</p>
          </div>
        </div>

        {/* Drip Rate Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-muted-foreground">
            Sending <span className="text-white font-semibold">{emailsPerHour} emails per hour</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            1 email every <span className="text-primary font-semibold">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>
          </span>
        </div>
      </div>

      {/* Explanation Panel */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-5 border border-indigo-500/30">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                How Drip Sending Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Controlled Sending Speed</p>
                    <p className="text-sm text-muted-foreground">
                      Your emails are sent at <span className="text-primary font-medium">{emailsPerHour} per hour</span> — 
                      that's roughly one email every <span className="text-primary font-medium">{Math.round(60 / emailsPerHour * 10) / 10} minutes</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Why Not Send All At Once?</p>
                    <p className="text-sm text-muted-foreground">
                      Sending too many emails too fast triggers spam filters. Drip sending mimics natural human 
                      behavior, keeping your sender reputation high and emails landing in the inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Time Estimate</p>
                    <p className="text-sm text-muted-foreground">
                      With <span className="text-white font-medium">{pendingCount} emails</span> remaining at{' '}
                      <span className="text-white font-medium">{emailsPerHour}/hour</span>, your campaign will complete in approximately{' '}
                      <span className="text-amber-400 font-medium">
                        {etaHours > 0 ? `${etaHours} hour${etaHours > 1 ? 's' : ''} and ${etaRemainingMins} minutes` : `${etaMinutes} minutes`}
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-white font-medium">Pro tip:</span> You can close this page — emails will continue sending in the background!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-visible speed summary */}
      <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-white">Campaign Speed</p>
              <p className="text-sm text-muted-foreground">Optimized for maximum deliverability</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{emailsPerHour}</p>
            <p className="text-xs text-muted-foreground">emails/hour</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-white">{Math.round(60 / emailsPerHour * 10) / 10}</p>
            <p className="text-xs text-muted-foreground">min between emails</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{emailsPerHour * 24}</p>
            <p className="text-xs text-muted-foreground">emails/day max</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-400">99%</p>
            <p className="text-xs text-muted-foreground">inbox rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

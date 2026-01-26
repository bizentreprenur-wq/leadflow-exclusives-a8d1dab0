import { useState } from 'react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailScheduleCalendarProps {
  onSchedule: (date: Date) => void;
  onSendNow?: () => void;
}

export default function EmailScheduleCalendar({ onSchedule, onSendNow }: EmailScheduleCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('09:00');
  const [isOpen, setIsOpen] = useState(false);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00',
  ];

  const getOptimalTimes = () => {
    return ['09:00', '10:00', '14:00', '15:00'];
  };

  const handleSchedule = () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = setMinutes(setHours(date, hours), minutes);

    if (scheduledDate <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    onSchedule(scheduledDate);
    setIsOpen(false);
    toast.success(`📅 Email scheduled for ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}`);
  };

  const handleQuickSchedule = (option: 'tomorrow_morning' | 'tomorrow_afternoon' | 'next_week') => {
    const now = new Date();
    let scheduledDate: Date;

    switch (option) {
      case 'tomorrow_morning':
        scheduledDate = setMinutes(setHours(addHours(now, 24), 9), 0);
        break;
      case 'tomorrow_afternoon':
        scheduledDate = setMinutes(setHours(addHours(now, 24), 14), 0);
        break;
      case 'next_week':
        scheduledDate = setMinutes(setHours(addHours(now, 168), 9), 0);
        break;
    }

    onSchedule(scheduledDate);
    setIsOpen(false);
    toast.success(`📅 Email scheduled for ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}`);
  };

  return (
    <div className="space-y-4">
      {/* Quick options */}
      <div className="flex flex-wrap gap-2">
        {onSendNow && (
          <Button
            onClick={onSendNow}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Send Now
          </Button>
        )}
        <Button
          onClick={() => handleQuickSchedule('tomorrow_morning')}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <Clock className="w-3.5 h-3.5" />
          Tomorrow 9 AM
        </Button>
        <Button
          onClick={() => handleQuickSchedule('tomorrow_afternoon')}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <Clock className="w-3.5 h-3.5" />
          Tomorrow 2 PM
        </Button>
        <Button
          onClick={() => handleQuickSchedule('next_week')}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Next Week
        </Button>
      </div>

      {/* Custom date/time picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              <span>{format(date, 'PPP')} at {time}</span>
            ) : (
              <span>Pick a custom date & time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Calendar */}
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />

            {/* Time selector */}
            <div className="border-l border-border p-3 w-36">
              <p className="text-xs font-medium text-muted-foreground mb-2">Select Time</p>
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {timeSlots.map((slot) => {
                  const isOptimal = getOptimalTimes().includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg text-left transition-colors flex items-center justify-between",
                        time === slot
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span>{slot}</span>
                      {isOptimal && time !== slot && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 text-emerald-500 border-emerald-500/30">
                          Best
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schedule button */}
          <div className="p-3 border-t border-border">
            <Button onClick={handleSchedule} className="w-full gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Schedule Email
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Scheduled info */}
      {date && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">
            Scheduled for <span className="font-medium">{format(date, 'PPP')}</span> at <span className="font-medium">{time}</span>
          </span>
        </div>
      )}
    </div>
  );
}

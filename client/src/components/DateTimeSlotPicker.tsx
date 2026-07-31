import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface DateTimeSlotPickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
}

export const DateTimeSlotPicker: React.FC<DateTimeSlotPickerProps> = ({ value, onChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>(''); // e.g. "09:30"

  // 1. Generate next 7 days starting from today
  const getNext7Days = (): Date[] => {
    const days: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getNext7Days();

  // 2. Format helpers
  const formatDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // 3. Define 30-minute operational time slots (08:00 AM to 05:00 PM)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30',
  ];

  const formatSlotLabel = (slot: string): string => {
    const [hourStr, minStr] = slot.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minStr} ${ampm}`;
  };

  // 4. Initialize or sync with external value
  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      if (datePart && timePart) {
        // Parse datePart
        const [year, month, day] = datePart.split('-').map(Number);
        const parsedDate = new Date(year, month - 1, day);
        setSelectedDate(parsedDate);
        setSelectedSlot(timePart.slice(0, 5));
        return;
      }
    }

    // Default: select first day & its first available slot
    const firstDay = days[0];
    setSelectedDate(firstDay);
    const initialSlot = getFirstAvailableSlot(firstDay);
    setSelectedSlot(initialSlot);
    
    if (firstDay && initialSlot) {
      onChange(`${formatDateKey(firstDay)}T${initialSlot}`);
    }
  }, [value]);

  // 5. Get first available slot for a given day
  const getFirstAvailableSlot = (date: Date): string => {
    const isTodayFlag = isToday(date);
    if (!isTodayFlag) return timeSlots[0];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // Must book at least 60 minutes in advance
    const minutesThreshold = currentHour * 60 + currentMin + 60;

    for (const slot of timeSlots) {
      const [sh, sm] = slot.split(':').map(Number);
      if (sh * 60 + sm >= minutesThreshold) {
        return slot;
      }
    }
    return ''; // No slots left today
  };

  // Helper checks
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSlotDisabled = (slot: string, date: Date | null): boolean => {
    if (!date) return true;
    if (!isToday(date)) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // Disallow past slots + 60 mins buffer for preparation
    const minutesThreshold = currentHour * 60 + currentMin + 60;
    const [sh, sm] = slot.split(':').map(Number);
    return sh * 60 + sm < minutesThreshold;
  };

  // 6. Handle Date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Find first available slot for this new date
    const firstSlot = getFirstAvailableSlot(date);
    setSelectedSlot(firstSlot);
    if (firstSlot) {
      onChange(`${formatDateKey(date)}T${firstSlot}`);
    } else {
      onChange(''); // No slots available
    }
  };

  // 7. Handle Slot selection
  const handleSlotSelect = (slot: string) => {
    if (!selectedDate) return;
    setSelectedSlot(slot);
    onChange(`${formatDateKey(selectedDate)}T${slot}`);
  };

  // Group slots into Morning and Afternoon
  const morningSlots = timeSlots.filter(s => parseInt(s.split(':')[0], 10) < 12);
  const afternoonSlots = timeSlots.filter(s => parseInt(s.split(':')[0], 10) >= 12);

  return (
    <div className="space-y-4">
      {/* 1. Date Selector Cards Row */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Calendar size={12} className="text-brand-500" />
          <span>Select Date</span>
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
          {days.map((date, idx) => {
            const isSelected = selectedDate && formatDateKey(selectedDate) === formatDateKey(date);
            const isDayToday = isToday(date);
            const noSlotsLeft = isDayToday && getFirstAvailableSlot(date) === '';

            return (
              <button
                key={idx}
                type="button"
                disabled={noSlotsLeft}
                onClick={() => handleDateSelect(date)}
                className={`flex-shrink-0 w-20 py-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/10 text-brand-500 shadow-md shadow-brand-500/5'
                    : 'border-zinc-805 bg-zinc-900/40 text-zinc-350 hover:border-zinc-700/80 hover:text-zinc-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {getDayName(date)}
                </span>
                <span className="text-base font-extrabold tracking-tight">
                  {date.getDate()}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-widest opacity-80">
                  {getMonthName(date)}
                </span>
                {isDayToday && (
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 leading-none ${
                    isSelected ? 'bg-brand-500/20 text-brand-500' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Slot Selector Cards Grid */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Clock size={12} className="text-brand-500" />
          <span>Select 30-Min Booking Slot</span>
        </span>

        {selectedDate && getFirstAvailableSlot(selectedDate) === '' ? (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2.5 text-xs text-amber-500">
            <AlertCircle size={14} className="shrink-0" />
            <span>No operational slots remaining for today. Please select a future date.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Morning slots */}
            {morningSlots.some(s => !isSlotDisabled(s, selectedDate)) && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-zinc-500 tracking-wider uppercase block">Morning</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {morningSlots.map((slot) => {
                    const isDisabled = isSlotDisabled(slot, selectedDate);
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-2 px-3 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/10 text-brand-500 font-bold'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {formatSlotLabel(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon slots */}
            {afternoonSlots.some(s => !isSlotDisabled(s, selectedDate)) && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-zinc-500 tracking-wider uppercase block">Afternoon</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isDisabled = isSlotDisabled(slot, selectedDate);
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-2 px-3 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/10 text-brand-500 font-bold'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {formatSlotLabel(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

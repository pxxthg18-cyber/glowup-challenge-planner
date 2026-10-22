import React, { useState } from 'react';
import { X, Flame, Trash2 } from 'lucide-react';
import { Habit, HabitFrequencyType } from '../../types/database';

interface HabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Habit>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  habit,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(habit);

  const [title, setTitle] = useState(habit?.title || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [category, setCategory] = useState(habit?.category || 'General');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(habit?.frequency_type || 'daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>(habit?.scheduled_days || [0, 1, 2, 3, 4, 5, 6]);
  const [timeOfDay, setTimeOfDay] = useState(habit?.time_of_day || 'anytime');
  const [color, setColor] = useState(habit?.color || '#C9879B');

  if (!isOpen) return null;

  const daysLabels = [
    { num: 0, label: 'Sun' },
    { num: 1, label: 'Mon' },
    { num: 2, label: 'Tue' },
    { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' },
    { num: 5, label: 'Fri' },
    { num: 6, label: 'Sat' },
  ];

  const toggleDay = (num: number) => {
    if (scheduledDays.includes(num)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter(d => d !== num));
      }
    } else {
      setScheduledDays([...scheduledDays, num].sort());
    }
  };

  const handleFrequencyPreset = (type: HabitFrequencyType) => {
    setFrequencyType(type);
    if (type === 'daily') {
      setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (type === 'weekdays') {
      setScheduledDays([1, 2, 3, 4, 5]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      frequency_type: frequencyType,
      scheduled_days: scheduledDays,
      time_of_day: timeOfDay,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-[#29272B] mb-1">Habit Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10-Minute Morning Gua Sha & Hydration"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Skincare, Fitness"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Time of Day</label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs capitalize"
              >
                <option value="anytime">Anytime</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          {/* Schedule Frequency Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#29272B] mb-1.5">Frequency</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleFrequencyPreset('daily')}
                className={`py-1.5 text-xs rounded-xl border font-medium ${
                  frequencyType === 'daily'
                    ? 'bg-[#29272B] text-white border-[#29272B]'
                    : 'bg-[#FAF7F2] text-[#29272B] border-[#E8E2D9]'
                }`}
              >
                Daily (7 Days)
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyPreset('weekdays')}
                className={`py-1.5 text-xs rounded-xl border font-medium ${
                  frequencyType === 'weekdays'
                    ? 'bg-[#29272B] text-white border-[#29272B]'
                    : 'bg-[#FAF7F2] text-[#29272B] border-[#E8E2D9]'
                }`}
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('custom_days')}
                className={`py-1.5 text-xs rounded-xl border font-medium ${
                  frequencyType === 'custom_days'
                    ? 'bg-[#29272B] text-white border-[#29272B]'
                    : 'bg-[#FAF7F2] text-[#29272B] border-[#E8E2D9]'
                }`}
              >
                Custom Days
              </button>
            </div>

            {/* Day buttons */}
            <div className="flex gap-1.5 pt-1">
              {daysLabels.map((d) => {
                const isSelected = scheduledDays.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => {
                      setFrequencyType('custom_days');
                      toggleDay(d.num);
                    }}
                    className={`flex-1 py-2 text-xs rounded-xl border font-bold transition-all ${
                      isSelected
                        ? 'bg-[#C9879B] text-white border-[#C9879B]'
                        : 'bg-white text-[#77727B] border-[#E8E2D9]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#29272B] mb-1">Description / Cue</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What trigger starts this habit? e.g. Right after pouring morning tea."
              className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
            />
          </div>

          {isEditing && onDelete && habit && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(habit.id);
                  onClose();
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Archive Habit
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

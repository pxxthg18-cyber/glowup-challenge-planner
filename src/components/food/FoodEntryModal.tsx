import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Coffee,
  SunMedium,
  Moon,
  Apple,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Hash,
} from 'lucide-react';
import { FoodEntry, MealType } from '../../types/database';
import { getTodayDateString } from '../../utils/dateUtils';

interface FoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMealType?: MealType;
  initialDate: string;
  editingEntry?: FoodEntry | null;
  onSave: (entryData: {
    food_name: string;
    meal_type: MealType;
    quantity?: string;
    entry_date: string;
    entry_time?: string;
    notes?: string;
  }) => Promise<void>;
}

const MEAL_CONFIG: {
  type: MealType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    type: 'breakfast',
    label: 'Breakfast',
    icon: Coffee,
    accentColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    type: 'lunch',
    label: 'Lunch',
    icon: SunMedium,
    accentColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    type: 'dinner',
    label: 'Dinner',
    icon: Moon,
    accentColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    type: 'snacks',
    label: 'Snacks & Drinks',
    icon: Apple,
    accentColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
];

// Helper to get current HH:mm
function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export const FoodEntryModal: React.FC<FoodEntryModalProps> = ({
  isOpen,
  onClose,
  initialMealType = 'breakfast',
  initialDate,
  editingEntry = null,
  onSave,
}) => {
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [quantity, setQuantity] = useState('');
  const [entryDate, setEntryDate] = useState(initialDate);
  const [entryTime, setEntryTime] = useState(getCurrentTimeString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when editing or opening
  useEffect(() => {
    if (editingEntry) {
      setFoodName(editingEntry.food_name || '');
      setMealType(editingEntry.meal_type || 'breakfast');
      setQuantity(editingEntry.quantity || '');
      setEntryDate(editingEntry.entry_date || initialDate);
      setEntryTime(editingEntry.entry_time || getCurrentTimeString());
      setNotes(editingEntry.notes || '');
    } else {
      setFoodName('');
      setMealType(initialMealType);
      setQuantity('');
      setEntryDate(initialDate || getTodayDateString());
      setEntryTime(getCurrentTimeString());
      setNotes('');
    }
    setErrorMessage(null);
  }, [editingEntry, initialMealType, initialDate, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setErrorMessage('Please enter what you ate or drank.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        food_name: foodName.trim(),
        meal_type: mealType,
        quantity: quantity.trim() || undefined,
        entry_date: entryDate,
        entry_time: entryTime.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save food entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E2D9] shadow-soft overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center">
              {editingEntry ? <Save className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#29272B] font-serif-title">
                {editingEntry ? 'Edit Food Entry' : 'Log Food or Drink'}
              </h2>
              <p className="text-xs text-[#77727B]">
                Mindful, stress-free daily eating tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Meal Type Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-2">
              Meal Category <span className="text-[#C9879B]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_CONFIG.map((m) => {
                const Icon = m.icon;
                const isSelected = mealType === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMealType(m.type)}
                    className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-[#C9879B] bg-[#F2DDE3]/50 text-[#29272B] shadow-2xs'
                        : 'border-[#E8E2D9] bg-white text-[#77727B] hover:border-[#C9879B]/40 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#C9879B]' : 'text-[#77727B]'}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Food / Drink Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
              Food or Drink Name <span className="text-[#C9879B]">*</span>
            </label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Avocado toast with egg, Green tea, Idli, Dal & rice..."
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] placeholder:text-[#A09BA5] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
              autoFocus
            />
          </div>

          {/* 3. Quantity / Portion & Time in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
                Portion / Quantity <span className="text-[#A09BA5] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-[#A09BA5] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 1 bowl, 2 pieces, 250ml"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] placeholder:text-[#A09BA5] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
                Time <span className="text-[#A09BA5] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-[#A09BA5] absolute left-3.5 top-3" />
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                />
              </div>
            </div>
          </div>

          {/* 4. Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-[#A09BA5] absolute left-3.5 top-3" />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
              />
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
              Notes <span className="text-[#A09BA5] font-normal lowercase">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Freshly cooked at home, felt energetic, had extra water..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] placeholder:text-[#A09BA5] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !foodName.trim()}
              className="px-5 py-2 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-bold shadow-soft transition-all disabled:opacity-50 flex items-center gap-1.5 transform active:scale-95"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : editingEntry ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Entry</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Food</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

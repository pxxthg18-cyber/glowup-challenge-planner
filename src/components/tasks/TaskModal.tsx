import React, { useState } from 'react';
import { X, Calendar, Clock, Flag, CheckCircle2, Copy, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/database';
import { getTodayDateString } from '../../utils/dateUtils';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onDuplicate?: (task: Task) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState(task?.category || 'General');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [scheduledDate, setScheduledDate] = useState(task?.scheduled_date || getTodayDateString());
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_duration_minutes || 25);
  const [notes, setNotes] = useState(task?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      scheduled_date: scheduledDate || null,
      due_date: dueDate || null,
      estimated_duration_minutes: estimatedMinutes,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          <h2 className="text-base font-bold text-[#29272B] font-serif-title">
            {isEditing ? 'Edit Task' : 'New Action Task'}
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
            <label className="block text-xs font-semibold text-[#29272B] mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 20-Minute Guided Breathwork Sprint"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Skincare, Fitness, Study"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 25)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#29272B] mb-1">Notes / Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any checklist items, links, or specific thoughts..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
            />
          </div>

          {isEditing && (
            <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
              {onDuplicate && task && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicate(task);
                    onClose();
                  }}
                  className="text-xs text-[#77727B] hover:text-[#29272B] font-medium flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
              )}
              {onDelete && task && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
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
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

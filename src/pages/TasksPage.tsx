import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Columns,
  List,
  Table as TableIcon,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  MoreVertical,
  ArrowUpDown,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, TaskPriority, TaskStatus } from '../types/database';
import { TaskModal } from '../components/tasks/TaskModal';
import { formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

type ViewMode = 'kanban' | 'checklist' | 'table';

export const TasksPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const data = await api.getTasks(activeChallenge.id);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.category && set.add(t.category));
    return ['All', ...Array.from(set)];
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesPri = selectedPriority === 'All' || t.priority === selectedPriority;
      const matchesStat = selectedStatus === 'All' || t.status === selectedStatus;

      return matchesSearch && matchesCat && matchesPri && matchesStat;
    });
  }, [tasks, search, selectedCategory, selectedPriority, selectedStatus]);

  // Task actions
  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated = await api.updateTask(task.id, { status: nextStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    if (nextStatus === 'completed') {
      confetti({
        particleCount: 25,
        spread: 35,
        origin: { y: 0.7 },
        colors: ['#C9879B', '#DCE8DD'],
      });
    }
  };

  const handleUpdateStatus = async (task: Task, nextStatus: TaskStatus) => {
    const updated = await api.updateTask(task.id, { status: nextStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!activeChallenge) return;

    if (editingTask) {
      const updated = await api.updateTask(editingTask.id, taskData);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
    } else {
      const created = await api.createTask({
        user_id: activeChallenge.user_id,
        challenge_id: activeChallenge.id,
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        category: taskData.category || 'General',
        scheduled_date: taskData.scheduled_date || getTodayDateString(),
        due_date: taskData.due_date,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        estimated_duration_minutes: taskData.estimated_duration_minutes || 25,
        actual_duration_minutes: 0,
        notes: taskData.notes,
        day_number: 1,
      });
      setTasks(prev => [created, ...prev]);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!activeChallenge) return;
    const duplicated = await api.createTask({
      user_id: activeChallenge.user_id,
      challenge_id: activeChallenge.id,
      title: `${task.title} (Copy)`,
      description: task.description,
      category: task.category,
      scheduled_date: task.scheduled_date,
      due_date: task.due_date,
      priority: task.priority,
      status: 'todo',
      estimated_duration_minutes: task.estimated_duration_minutes,
      actual_duration_minutes: 0,
      notes: task.notes,
      day_number: task.day_number,
    });
    setTasks(prev => [duplicated, ...prev]);
  };

  const kanbanColumns: Array<{ id: TaskStatus; label: string; color: string; count: number }> = [
    { id: 'todo', label: 'To Do', color: 'border-l-amber-400', count: filteredTasks.filter(t => t.status === 'todo').length },
    { id: 'in_progress', label: 'In Progress', color: 'border-l-blue-400', count: filteredTasks.filter(t => t.status === 'in_progress').length },
    { id: 'completed', label: 'Completed', color: 'border-l-emerald-400', count: filteredTasks.filter(t => t.status === 'completed').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title & Views */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Tasks & Action Planner
          </h1>
          <p className="text-xs text-[#77727B]">
            Manage daily missions, prioritize deep work sprints, and track task completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex rounded-xl bg-white border border-[#E8E2D9] p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
              title="Kanban Board View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'checklist'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
              title="Checklist View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Checklist</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#77727B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs bg-white text-[#29272B]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs bg-white text-[#29272B]"
        >
          <option value="All">Priority: All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <span className="text-xs text-[#77727B] font-medium ml-auto">
          {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* 1. KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D9] p-4 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E2D9]">
                  <span className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E8E2D9] text-[#77727B]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs hover:shadow-soft hover:border-[#C9879B]/50 transition-all cursor-pointer group space-y-2.5"
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#29272B] line-clamp-2">
                          {task.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-[#77727B] line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#FAF7F2] flex items-center justify-between text-[10px] text-[#77727B]">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D9]">
                          {task.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimated_duration_minutes}m
                        </span>
                      </div>

                      {/* Quick move buttons */}
                      <div
                        className="pt-2 border-t border-[#FAF7F2] flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.id !== 'todo' && (
                          <button
                            onClick={() => handleUpdateStatus(task, 'todo')}
                            className="px-2 py-0.5 rounded text-[10px] bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#29272B]"
                          >
                            ← To Do
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(task, 'in_progress')}
                            className="px-2 py-0.5 rounded text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700"
                          >
                            Progress
                          </button>
                        )}
                        {col.id !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(task, 'completed')}
                            className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          >
                            Done ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-12 text-xs text-[#77727B] border-2 border-dashed border-[#E8E2D9]/70 rounded-2xl">
                      No tasks in this lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. CHECKLIST VIEW */}
      {viewMode === 'checklist' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isDone
                      ? 'bg-[#FAF7F2]/60 border-[#E8E2D9]/60 opacity-60'
                      : 'bg-white border-[#E8E2D9] hover:border-[#C9879B]/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="text-[#C9879B] focus:outline-hidden"
                      aria-label="Toggle task status"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 fill-[#C9879B] text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#E8E2D9] hover:text-[#C9879B]" />
                      )}
                    </button>
                    <div>
                      <p
                        onClick={() => {
                          setEditingTask(task);
                          setIsModalOpen(true);
                        }}
                        className={`text-xs font-semibold cursor-pointer ${
                          isDone ? 'line-through text-[#77727B]' : 'text-[#29272B]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#77727B]">
                        <span className="px-1.5 py-0.2 rounded bg-[#FAF7F2] border border-[#E8E2D9]">
                          {task.category}
                        </span>
                        {task.scheduled_date && (
                          <span>Date: {formatDisplayDate(task.scheduled_date)}</span>
                        )}
                        <span>{task.estimated_duration_minutes} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-[#77727B] hover:text-[#29272B]"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-[#77727B]">No tasks found.</div>
          )}
        </div>
      )}

      {/* 3. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#77727B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Est. Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-[#FAF7F2]/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingTask(task);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="text-[#C9879B]"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 fill-[#C9879B] text-white" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#E8E2D9] hover:text-[#C9879B]" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#29272B]">
                      {task.title}
                    </td>
                    <td className="py-3 px-4 text-[#77727B]">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D9]">
                        {task.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#77727B]">
                      {task.scheduled_date ? formatDisplayDate(task.scheduled_date) : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#77727B]">
                      {task.estimated_duration_minutes}m
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-[#C9879B] hover:text-[#B26F84] font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
      />
    </div>
  );
};

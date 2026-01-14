import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Pencil, Trash2, Flag, Archive } from 'lucide-react';

export default function TaskCard({ task, onToggleDone, onEdit, onDelete, onArchive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && !task.done;
  };

  const priorityConfig = {
    high: { label: 'High', className: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
    medium: { label: 'Med', className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
    low: { label: 'Low', className: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300' }
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm
        border border-slate-900/10 dark:border-white/10
        rounded-lg px-3 sm:px-4 py-3 cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:bg-white/90 dark:hover:bg-white/[0.10]
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${task.done ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleDone(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-[18px] h-[18px] mt-0.5 accent-black dark:accent-white border-slate-300 dark:border-white/30 rounded focus:ring-slate-400 dark:focus:ring-white/30 flex-shrink-0 cursor-pointer bg-transparent"
        />
        <span
          className={`
            flex-1 text-sm font-medium leading-snug
            ${task.done ? 'line-through text-slate-400 dark:text-white/40' : 'text-slate-900 dark:text-white'}
          `}
        >
          {task.title}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-600 dark:text-white/70 mb-2 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {task.priority && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${priority.className}`}>
            {priority.label}
          </span>
        )}

        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 text-xs ${isOverdue(task.dueDate) ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-white/60'}`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}

        <div className="ml-auto flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 rounded transition-colors"
            title="Edit task"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onArchive(task.id);
            }}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 rounded transition-colors"
            title="Archive task"
          >
            <Archive size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-white/60 dark:hover:text-red-300 dark:hover:bg-red-500/10 rounded transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

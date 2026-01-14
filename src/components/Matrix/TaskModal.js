import React, { useState, useEffect } from 'react';
import { X, Type, AlignLeft, Calendar, Flag } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, task, defaultQuadrant }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    important: false,
    urgent: false,
    done: false
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority || 'medium',
        important: task.important || false,
        urgent: task.urgent || false,
        done: task.done || false
      });
    } else if (defaultQuadrant) {
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        done: false,
        important: defaultQuadrant.important,
        urgent: defaultQuadrant.urgent
      }));
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        important: false,
        urgent: false,
        done: false
      });
    }
  }, [task, defaultQuadrant, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSave({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white/95 dark:bg-white/[0.06] backdrop-blur-xl border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/70 dark:border-white/10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{task ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-900 dark:text-white">
                Title
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/70 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 rounded-lg focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:focus-within:border-white/20 dark:focus-within:ring-white/10 transition-all">
                <Type size={18} className="text-slate-400 dark:text-white/60 flex-shrink-0" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                  className="flex-1 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-900 dark:text-white">
                Description
              </label>
              <div className="flex items-start gap-3 px-4 py-3 bg-slate-50/70 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 rounded-lg focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:focus-within:border-white/20 dark:focus-within:ring-white/10 transition-all">
                <AlignLeft size={18} className="text-slate-400 dark:text-white/60 flex-shrink-0 mt-0.5" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add more details..."
                  rows={3}
                  className="flex-1 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 resize-vertical bg-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dueDate" className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white">
                  <Calendar size={14} className="text-slate-500 dark:text-white/70" />
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/70 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:border-slate-400 focus:ring-4 focus:ring-slate-200 dark:focus:border-white/20 dark:focus:ring-white/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white">
                  <Flag size={14} className="text-slate-500 dark:text-white/70" />
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/70 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:border-slate-400 focus:ring-4 focus:ring-slate-200 dark:focus:border-white/20 dark:focus:ring-white/10 transition-all cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="important"
                  checked={formData.important}
                  onChange={handleChange}
                  className="w-5 h-5 accent-black dark:accent-white border-slate-300 dark:border-white/30 rounded focus:ring-slate-400 dark:focus:ring-white/30 cursor-pointer bg-transparent"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-white/80 dark:group-hover:text-white">Important</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="urgent"
                  checked={formData.urgent}
                  onChange={handleChange}
                  className="w-5 h-5 accent-black dark:accent-white border-slate-300 dark:border-white/30 rounded focus:ring-slate-400 dark:focus:ring-white/30 cursor-pointer bg-transparent"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-white/80 dark:group-hover:text-white">Urgent</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200/70 dark:border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg transition-colors"
            >
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

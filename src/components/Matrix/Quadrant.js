import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const quadrantConfig = {
  'do-first': {
    title: 'Do',
    subtitle: 'Important & Urgent',
    emptyMessage: 'Do it now!',
  },
  'schedule': {
    title: 'Decide',
    subtitle: 'Important & Not Urgent',
    emptyMessage: 'Schedule a time to do it.',
  },
  'delegate': {
    title: 'Delegate',
    subtitle: 'Not Important & Urgent',
    emptyMessage: 'Who can do it for you?',
  },
  'eliminate': {
    title: 'Delete',
    subtitle: 'Not Important & Not Urgent',
    emptyMessage: 'Stop doing it.',
  }
};

export default function Quadrant({ 
  id, 
  tasks, 
  onToggleDone, 
  onEditTask, 
  onDeleteTask,
  onArchiveTask 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  const config = quadrantConfig[id];

  return (
    <div 
      ref={setNodeRef}
      className={`group h-full min-h-0 p-4 sm:p-6 md:p-8 ${isOver ? 'bg-slate-900/[0.04] dark:bg-white/[0.04]' : ''}`}
    >
      <SortableContext 
        items={tasks.map(t => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="h-full min-h-0 overflow-y-auto pr-2 space-y-3">
          {tasks.length === 0 ? (
            <div
              className={`
                flex items-center justify-center h-full text-center font-medium text-slate-900/40 dark:text-white/40
                text-base sm:text-xl md:text-2xl
                px-2
                ${isOver ? 'opacity-100' : ''}
              `}
            >
              <span className="max-w-[16ch] sm:max-w-none">{config?.emptyMessage ?? ''}</span>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="group">
                <TaskCard
                  task={task}
                  onToggleDone={onToggleDone}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onArchive={onArchiveTask}
                />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

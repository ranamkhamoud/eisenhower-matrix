import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Quadrant from './Quadrant';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import Header from '../UI/Header';
import FeedbackModal from '../UI/FeedbackModal';
import InfoModal from '../UI/InfoModal';
import ApiSettingsModal from '../UI/ApiSettingsModal';
import Archive from './Archive';
import Trash from './Trash';
import { Plus, Archive as ArchiveIcon, Trash2, ArrowLeft } from 'lucide-react';

// Map quadrant IDs to important/urgent values
const quadrantMapping = {
  'do-first': { important: true, urgent: true },
  'schedule': { important: true, urgent: false },
  'delegate': { important: false, urgent: true },
  'eliminate': { important: false, urgent: false }
};

// Get quadrant ID from task properties
function getQuadrantId(task) {
  if (task.important && task.urgent) return 'do-first';
  if (task.important && !task.urgent) return 'schedule';
  if (!task.important && task.urgent) return 'delegate';
  return 'eliminate';
}

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultQuadrant, setDefaultQuadrant] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null); // null, 'active', or 'completed'
  const { currentUser } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Global keyboard shortcut: N for new task, ? for info
  const handleGlobalKeyDown = useCallback((e) => {
    // Close info modal on any key
    if (isInfoOpen) {
      setIsInfoOpen(false);
      return;
    }
    
    // Don't trigger if modal is open, typing in input, or modifier keys pressed
    if (isModalOpen || isFeedbackOpen) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      setEditingTask(null);
      setDefaultQuadrant(null);
      setIsModalOpen(true);
    } else if (e.key === '?') {
      e.preventDefault();
      setIsInfoOpen(true);
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      setGlobalFilter(prev => prev === 'active' ? null : 'active');
    } else if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      setGlobalFilter(prev => prev === 'completed' ? null : 'completed');
    }
  }, [isModalOpen, isFeedbackOpen, isInfoOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Fetch active tasks from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const q = query(tasksRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch archived tasks
  useEffect(() => {
    if (!currentUser) return;

    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const q = query(tasksRef, where('status', '==', 'archived'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArchivedTasks(tasksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch deleted tasks and auto-delete after 30 days
  useEffect(() => {
    if (!currentUser) return;

    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const q = query(tasksRef, where('status', '==', 'deleted'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Auto-delete tasks older than 30 days
      const now = new Date();
      tasksData.forEach(task => {
        if (task.deletedAt) {
          const deletedDate = task.deletedAt.toDate();
          const daysSinceDeleted = (now - deletedDate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceDeleted >= 30) {
            deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', task.id));
          }
        }
      });

      setDeletedTasks(tasksData.filter(task => {
        if (!task.deletedAt) return true;
        const deletedDate = task.deletedAt.toDate();
        const daysSinceDeleted = (now - deletedDate) / (1000 * 60 * 60 * 24);
        return daysSinceDeleted < 30;
      }));
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add new task
  const handleAddTask = async (taskData) => {
    if (!currentUser) return;

    try {
      const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
      await addDoc(tasksRef, {
        ...taskData,
        status: 'active',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Update task
  const handleUpdateTask = async (taskId, updates) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Move task to trash
  const handleDeleteTask = async (taskId) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Archive task
  const handleArchiveTask = async (taskId) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'archived',
        archivedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  // Restore task from archive or trash
  const handleRestoreTask = async (taskId) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'active',
        deletedAt: null,
        archivedAt: null
      });
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  // Permanently delete task
  const handleDeletePermanently = async (taskId) => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    }
  };

  // Empty trash
  const handleEmptyTrash = async () => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to permanently delete all items in trash? This action cannot be undone.')) {
      return;
    }

    try {
      const deletePromises = deletedTasks.map(task =>
        deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', task.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  };

  // Toggle task done status
  const handleToggleDone = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await handleUpdateTask(taskId, { done: !task.done });
    }
  };

  // Open edit modal
  const handleEditTask = (task) => {
    setEditingTask(task);
    setDefaultQuadrant(null);
    setIsModalOpen(true);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setDefaultQuadrant(null);
    setIsModalOpen(true);
  };

  // Save task from modal
  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await handleUpdateTask(editingTask.id, taskData);
    } else {
      await handleAddTask(taskData);
    }
  };

  const handleSubmitFeedback = async ({ message, category }) => {
    if (!currentUser) return;
    const feedbackRef = collection(db, 'users', currentUser.uid, 'feedback');
    await addDoc(feedbackRef, {
      message,
      category: category || 'general',
      createdAt: serverTimestamp(),
      // Helpful metadata (keep minimal)
      page: activeTab,
      userEmail: currentUser.email || null,
    });
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const targetQuadrant = over.id;

    // Check if dropped on a quadrant
    if (quadrantMapping[targetQuadrant]) {
      const task = tasks.find(t => t.id === taskId);
      const currentQuadrant = getQuadrantId(task);

      // Only update if dropped in a different quadrant
      if (currentQuadrant !== targetQuadrant) {
        const { important, urgent } = quadrantMapping[targetQuadrant];
        await handleUpdateTask(taskId, { important, urgent });
      }
    }
  };

  // Group tasks by quadrant
  const tasksByQuadrant = {
    'do-first': tasks.filter(t => t.important && t.urgent),
    'schedule': tasks.filter(t => t.important && !t.urgent),
    'delegate': tasks.filter(t => !t.important && t.urgent),
    'eliminate': tasks.filter(t => !t.important && !t.urgent)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white text-slate-900 dark:bg-[#1a1a1a] dark:text-white">
      <Header 
        onOpenFeedback={() => setIsFeedbackOpen(true)} 
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenApi={() => setIsApiOpen(true)}
      />

      {activeTab !== 'matrix' && (
        <button
          onClick={() => setActiveTab('matrix')}
          className="fixed top-6 left-6 z-50 text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
          aria-label="Back to matrix"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}
      
      <div className="flex-1 min-h-0">
        {activeTab === 'archive' && (
          <div className="h-full overflow-y-auto">
            <Archive
              tasks={archivedTasks}
              onRestore={handleRestoreTask}
              onDelete={handleDeletePermanently}
            />
          </div>
        )}

        {activeTab === 'trash' && (
          <div className="h-full overflow-y-auto">
            <Trash
              tasks={deletedTasks}
              onRestore={handleRestoreTask}
              onDeletePermanently={handleDeletePermanently}
              onEmptyTrash={handleEmptyTrash}
            />
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 mx-auto w-full px-4 sm:px-6 pt-16 sm:pt-14 pb-16 sm:pb-20 flex flex-col">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {/* Matrix canvas - fixed size, quadrants scroll internally */}
                <div className="mx-auto w-full max-w-6xl flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-[48px,1fr] sm:grid-cols-[64px,1fr] md:grid-cols-[72px,1fr] grid-rows-[44px,1fr] sm:grid-rows-[56px,1fr] md:grid-rows-[64px,1fr] flex-1 min-h-0 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-5 md:gap-x-6 md:gap-y-6">
                    {/* top-left spacer */}
                    <div />

                    {/* Top labels */}
                    <div className="grid grid-cols-2 items-end">
                      <div className="text-center text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                        Urgent
                      </div>
                      <div className="text-center text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                        Not Urgent
                      </div>
                    </div>

                    {/* Left labels */}
                    <div className="grid grid-rows-2 items-center justify-center">
                      <div className="-rotate-90 text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                        Important
                      </div>
                      <div className="-rotate-90 text-lg sm:text-2xl md:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                        Not Important
                      </div>
                    </div>

                    {/* Quadrants + crosshair lines */}
                    <div className="relative h-full min-h-0 overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-900/30 dark:bg-white/30" />
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-900/30 dark:bg-white/30" />
                      </div>

                      <div className="grid grid-cols-2 grid-rows-2 h-full min-h-0">
                        <Quadrant
                          id="do-first"
                          tasks={tasksByQuadrant['do-first']}
                          onToggleDone={handleToggleDone}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                          onArchiveTask={handleArchiveTask}
                          globalFilter={globalFilter}
                        />
                        <Quadrant
                          id="schedule"
                          tasks={tasksByQuadrant['schedule']}
                          onToggleDone={handleToggleDone}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                          onArchiveTask={handleArchiveTask}
                          globalFilter={globalFilter}
                        />
                        <Quadrant
                          id="delegate"
                          tasks={tasksByQuadrant['delegate']}
                          onToggleDone={handleToggleDone}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                          onArchiveTask={handleArchiveTask}
                          globalFilter={globalFilter}
                        />
                        <Quadrant
                          id="eliminate"
                          tasks={tasksByQuadrant['eliminate']}
                          onToggleDone={handleToggleDone}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                          onArchiveTask={handleArchiveTask}
                          globalFilter={globalFilter}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DragOverlay>
                  {activeTask ? (
                    <TaskCard
                      task={activeTask}
                      onToggleDone={() => {}}
                      onEdit={() => {}}
                      onArchive={() => {}}
                      onDelete={() => {}}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Bottom-left navigation icons (Archive / Trash) */}
              <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4 sm:gap-6">
                <button
                  onClick={() => setActiveTab((t) => (t === 'archive' ? 'matrix' : 'archive'))}
                  className="text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                  aria-label="Archive"
                  title="Archive"
                >
                  <ArchiveIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <button
                  onClick={() => setActiveTab((t) => (t === 'trash' ? 'matrix' : 'trash'))}
                  className="text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                  aria-label="Trash"
                  title="Trash"
                >
                  <Trash2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="fixed bottom-6 right-6 z-50 text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Add task"
                title="Add task"
              >
                <Plus className="w-10 h-10 sm:w-11 sm:h-11" strokeWidth={2.25} />
              </button>

              <TaskModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingTask(null);
                  setDefaultQuadrant(null);
                }}
                onSave={handleSaveTask}
                task={editingTask}
                defaultQuadrant={defaultQuadrant}
              />
            </div>
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleSubmitFeedback}
        userEmail={currentUser?.email}
      />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      <ApiSettingsModal
        isOpen={isApiOpen}
        onClose={() => setIsApiOpen(false)}
        userId={currentUser?.uid}
      />
    </div>
  );
}

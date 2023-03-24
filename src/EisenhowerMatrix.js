import React, { useState, useEffect } from "react";
import { openDatabase, getTasks, addTask, deleteTask, updateTask } from "./indexedDB";
import TaskList from "./TaskList";
import TaskInput from "./TaskInput";
import "./EisenhowerMatrix.css";


const EisenhowerMatrix = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const db = await openDatabase();
      const allTasks = await getTasks(db);
      setTasks(allTasks);
    };
    fetchTasks();
  }, []);

  const handleAddTask = async (task) => {
    const db = await openDatabase();
    const id = await addTask(db, task);
    setTasks([...tasks, { ...task, id }]);
  };

  const handleDeleteTask = async (id) => {
    const db = await openDatabase();
    await deleteTask(db, id);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleUpdateTask = async (id, updatedTask) => {
    const db = await openDatabase();
    await updateTask(db, id, updatedTask);
    setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
  };

  const handleToggleDone = async (id) => {
    const task = tasks.find((t) => t.id === id);
    const updatedTask = { ...task, done: !task.done };

    const db = await openDatabase();
    await updateTask(db, id, updatedTask);
    setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
  };

  return (
    <div className="EisenhowerMatrix">
      <TaskInput onAddTask={handleAddTask} />
      <div className="matrix">
        <TaskList
          title="Important & Urgent"
          tasks={tasks.filter((task) => task.important && task.urgent)}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onToggleDone={handleToggleDone}
        />
        <TaskList
          title="Important & Not Urgent"
          tasks={tasks.filter((task) => task.important && !task.urgent)}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onToggleDone={handleToggleDone}
        />
        <TaskList
          title="Not Important & Urgent"
          tasks={tasks.filter((task) => !task.important && task.urgent)}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onToggleDone={handleToggleDone}
        />
        <TaskList
          title="Not Important & Not Urgent"
          tasks={tasks.filter((task) => !task.important && !task.urgent)}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onToggleDone={handleToggleDone}
        />
      </div>
    </div>
  );
};

export default EisenhowerMatrix;

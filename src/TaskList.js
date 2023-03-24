import React from "react";
import Task from "./Task";

const TaskList = ({ title, tasks, onDeleteTask, onToggleDone, onUpdateTask }) => {
  return (
    <div className="TaskList">
      <h2>{title}</h2>
      {tasks.map((task) => (
        <Task
          key={task.id}
          task={task}
          onDeleteTask={onDeleteTask}
          onToggleDone={onToggleDone}
          onUpdateTask={onUpdateTask}
        />
      ))}
    </div>
  );
};

export default TaskList;

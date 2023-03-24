import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
const Task = ({ task, onDeleteTask, onToggleDone, onUpdateTask }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [important, setImportant] = useState(task.important);
  const [urgent, setUrgent] = useState(task.urgent);

  const handleSave = () => {
    const updatedTask = {
      ...task,
      title,
      important,
      urgent,
    };
    onUpdateTask(task.id, updatedTask);
    setEditing(false);
  };
  

  if (editing) {
    return (
      <div className="Task">
         <TextField
            id="standard-basic"
            variant="standard"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <label>
          Important
          <input
            type="checkbox"
            checked={important}
            onChange={() => setImportant(!important)}
          />
        </label>
        <label>
          Urgent
          <input
            type="checkbox"
            checked={urgent}
            onChange={() => setUrgent(!urgent)}
          />
        </label>
        
        <Button variant="outline" type="submit" style={{ "font-family": "Sono" }} onClick={handleSave}>Save</Button>
        <Button variant="outline" type="submit" style={{ "font-family": "Sono" }} onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className={`Task${task.done ? " done" : ""}`}>
      <input type="checkbox"
        defaultChecked={task.done}
        onChange={() => onToggleDone(task.id)}/>
      <span >{task.title}</span>
      
      <div className="button-container">
  <Button
    variant="outline"
    style={{ "font-family": "Sono" }}
          onClick={() => setEditing(true)}
          disabled={task.done} 
  >
    Edit
  </Button>
  <Button
    variant="outline"
    type="submit"
    style={{ "font-family": "Sono" }}
          onClick={() => onDeleteTask(task.id)}
          disabled={task.done} 
  >
    Delete
  </Button>
</div>
    </div>);
};

export default Task;

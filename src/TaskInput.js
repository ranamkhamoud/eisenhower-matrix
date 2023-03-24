import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import "./EisenhowerMatrix.css";
const TaskInput = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTask({ title, important, urgent, done: false });
    setTitle("");
    setImportant(false);
    setUrgent(false);
  };

  return (
    <form onSubmit={handleSubmit} >
      <Grid container justifyContent="center" alignItems="center" columns={12}>
        <Grid item xs={2}>
          <TextField
            id="standard-basic"
            variant="standard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={2}>
          <label>
            Important
            <input
              type="checkbox"
              checked={important}
              onChange={() => setImportant(!important)}
            />
          </label>
        </Grid>
          {'  '}
          <Grid item xs={2}>
          <label>
            Urgent
            <input
              type="checkbox"
              checked={urgent}
              onChange={() => setUrgent(!urgent)}
            />
          </label>
        </Grid>
        <Grid item xs={2}>
          <Button variant="outline" type="submit" style={{"font-family": "Sono"}}>
            Add Task
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default TaskInput;

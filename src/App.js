import './App.css';
import React from 'react';
import './App.css';
import EisenhowerMatrix from './EisenhowerMatrix'; 
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Eisenhower Matrix</h1>
      </header>
      <main>
        <EisenhowerMatrix />
      </main>
      <footer>
        <h3>About this</h3>
        <p>The Eisenhower Matrix is a simple tool for considering the long-term outcomes of your daily tasks and focusing on what will make you most effective, not just most productive.
          It helps you visualize all your tasks in a matrix of urgent/important.</p>
      </footer>
    </div>
  );
}

export default App;


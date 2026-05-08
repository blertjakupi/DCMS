import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/test')   // This will be proxied to http://localhost:5000/api/test
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <div className="App">
      <h1>React Frontend</h1>
      <p>Backend says: {message || 'Loading...'}</p>
    </div>
  );
}
// api call test - fshije pas testimit
export default App

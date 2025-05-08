import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Callback = () => {
  const [status, setStatus] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    // The server already processed the code and set the tokens
    // We just need to check the URL for errors or success
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      setStatus('Authentication failed. Please try again.');
      setTimeout(() => navigate('/'), 3000);
    } else {
      setStatus('Authentication successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    }
  }, [navigate]);

  return (
    <div className="callback-container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Spotify Authentication</h2>
      <p>{status}</p>
    </div>
  );
};

export default Callback;

import React, { useState, useEffect } from 'react';

const Login = () => {
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    // Fetch the auth URL from your backend
    fetch('/api/spotify/auth-url')
      .then(res => res.json())
      .then(data => setAuthUrl(data.url))
      .catch(err => console.error('Error fetching auth URL:', err));
  }, []);

  return (
    <div>
      <a href={authUrl}>Login with Spotify</a>
    </div>
  );
};

export default Login;

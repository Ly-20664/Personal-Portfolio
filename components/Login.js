import React from 'react';

const Login = () => {
  const handleLogin = () => {
    // Redirect directly to the auth endpoint
    window.location.href = '/api/spotify/auth-url';
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Spotify</button>
    </div>
  );
};

export default Login;

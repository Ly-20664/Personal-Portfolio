import React, { useState } from 'react';
import axios from 'axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=track,artist,album`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setResults(response.data.tracks.items);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <div>
        {results.map(result => (
          <div key={result.id}>{result.name}</div>
        ))}
      </div>
    </div>
  );
};

export default Search;

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import SpotifyDisplay from "./SpotifyDisplay";

const App = () => {
    const [nowPlaying, setNowPlaying] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("/api/now-playing")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch now playing");
                }
                return res.json();
            })
            .then((data) => setNowPlaying(data))
            .catch((err) => {
                console.error("Error fetching now playing:", err);
                setError("Unable to fetch now playing data.");
            });

        fetch("/api/top-tracks")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch top tracks");
                }
                return res.json();
            })
            .then((data) => setTopTracks(data))
            .catch((err) => {
                console.error("Error fetching top tracks:", err);
                setError("Unable to fetch top tracks data.");
            });
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <SpotifyDisplay
                nowPlaying={nowPlaying}
                topTracks={topTracks}
            />
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById("spotify-root"));

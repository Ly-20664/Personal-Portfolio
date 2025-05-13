import React from "react";
import { Spotify } from "react-spotify-embed";
import { Fade } from "react-awesome-reveal";

const SpotifyDisplay = ({ nowPlaying, topTracks }) => {
    return (
        <div id="spotify">
            {nowPlaying ? (
                <div className="now-playing-container">
                    <Fade duration={1000} delay={1000} triggerOnce>
                        <div className="now-playing-header">
                            <p>Currently Playing</p>
                            <div className="center">
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                            </div>
                        </div>
                    </Fade>
                    <Fade direction="up" duration={1000} delay={1000} triggerOnce>
                        <Spotify
                            className="now-playing-track"
                            link={`https://open.spotify.com/track/${nowPlaying.id}`}
                            style={{ pointerEvents: 'none' }}
                        />
                    </Fade>                </div>
            ) : null}
              {topTracks && Array.isArray(topTracks) && topTracks.length > 0 ? (
                <div className="top-tracks-container">
                    <Fade duration={1000} delay={1000} triggerOnce>
                        <p>My Recent Tracks</p>
                    </Fade>
                    {topTracks.map((track, i) => (
                        track && track.songID ? (
                            <Fade
                                direction="up"
                                duration={1000}
                                delay={1000 + i * 100}
                                triggerOnce
                                key={track.songID || i}
                            >
                                <Spotify
                                    className="track"
                                    wide
                                    link={`https://open.spotify.com/track/${track.songID}?theme=0&backgroundColor=transparent`}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </Fade>
                        ) : null
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default SpotifyDisplay;

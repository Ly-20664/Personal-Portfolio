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
              {(() => {
                // Extra validation with helpful console messages to debug
                if (!topTracks) {
                    console.log("Recent tracks is null or undefined");
                    return null;
                }
                
                if (!Array.isArray(topTracks)) {
                    console.error("Recent tracks is not an array:", typeof topTracks, topTracks);
                    return null;
                }
                
                if (topTracks.length === 0) {
                    console.log("Recent tracks array is empty");
                    return (
                        <div className="top-tracks-container">
                            <Fade duration={1000} delay={1000} triggerOnce>
                                <p>My Recent Tracks</p>
                                <p className="subtle-message">No recent tracks available</p>
                            </Fade>
                        </div>
                    );
                }
                
                // If we get here, we have a valid non-empty array
                console.log(`Rendering ${topTracks.length} recent tracks`);
                
                return (
                    <div className="top-tracks-container">
                        <Fade duration={1000} delay={1000} triggerOnce>
                            <p>My Recent Tracks</p>
                        </Fade>
                        {topTracks.map((track, i) => {
                            // Extra validation for each track
                            if (!track) {
                                console.error(`Track at index ${i} is null or undefined`);
                                return null;
                            }
                            
                            if (!track.songID) {
                                console.error(`Track at index ${i} is missing songID:`, track);
                                return null;
                            }
                            
                            return (
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
                            );
                        })}
                    </div>
                );
            })()}
        </div>
    );
};

export default SpotifyDisplay;

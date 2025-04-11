import React from 'react';
import GameStatus from './GameStatus';
import GuessHistory from './GuessHistory';
import './SpectatorView.css';

function SpectatorView({ roomData, gameState }) {
    return (
        <div className="spectator-view">
            <div className="spectator-header">
                <h2>观战模式</h2>
                <span className="room-code">房间号: {roomData.roomId}</span>
            </div>

            <GameStatus 
                players={roomData.players}
                currentRound={gameState.currentRound}
                maxRounds={roomData.maxRounds}
                timeLeft={gameState.timeLeft}
            />

            <div className="spectator-content">
                <div className="players-history">
                    {Object.entries(roomData.players).map(([id, player]) => (
                        <div key={id} className="player-history">
                            <h3>{player.name}的猜测历史</h3>
                            <GuessHistory history={player.guessHistory} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SpectatorView;

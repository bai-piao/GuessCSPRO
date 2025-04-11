import React from 'react';
import './GameStatus.css';

function GameStatus({ players, currentRound, maxRounds, timeLeft }) {
    return (
        <div className="game-status-container">
            <div className="round-info">
                <span className="round-count">回合 {currentRound}/{maxRounds}</span>
                <span className="time-left">剩余时间: {timeLeft}s</span>
            </div>
            <div className="players-status">
                {Object.entries(players).map(([id, player]) => (
                    <div key={id} className={`player-card ${player.isReady ? 'ready' : ''}`}>
                        <span className="player-name">玩家 {player.name}</span>
                        <span className="player-score">得分: {player.score}</span>
                        <span className="player-status">{player.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GameStatus;

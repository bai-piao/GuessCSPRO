import React from 'react';
import './GameSummary.css';

function GameSummary({ matchData, onPlayAgain, onReturnLobby }) {
    const winner = matchData.players.find(p => p.score >= Math.ceil(matchData.maxRounds / 2));

    return (
        <div className="game-summary">
            <h2 className="summary-title">游戏结束</h2>
            
            <div className="winner-section">
                <h3>{winner.name} 获胜!</h3>
                <div className="final-score">
                    {matchData.players.map(player => (
                        <div key={player.id} className="player-final-score">
                            <span>{player.name}</span>
                            <span className="score">{player.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="match-stats">
                <h3>对局统计</h3>
                {matchData.rounds.map((round, index) => (
                    <div key={index} className="round-stats">
                        <span>第 {index + 1} 回合</span>
                        <span>获胜者: {round.winner}</span>
                        <span>用时: {round.timeUsed}s</span>
                    </div>
                ))}
            </div>

            <div className="summary-actions">
                <button className="play-again" onClick={onPlayAgain}>
                    再来一局
                </button>
                <button className="return-lobby" onClick={onReturnLobby}>
                    返回大厅
                </button>
            </div>
        </div>
    );
}

export default GameSummary;

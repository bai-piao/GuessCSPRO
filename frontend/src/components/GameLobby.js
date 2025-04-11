import React from 'react';
import './GameLobby.css';

function GameLobby({ rooms, maxRounds, setMaxRounds, onCreateRoom, onJoinRoom, onSpectateRoom }) {
    return (
        <div className="lobby">
            <h2 className="lobby-title">游戏大厅</h2>
            <div className="create-room-section">
                <div className="rounds-selector">
                    <label>胜利局数：</label>
                    <select 
                        value={maxRounds} 
                        onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                        className="rounds-select"
                    >
                        <option value={3}>3局(Bo5)</option>
                        <option value={4}>4局(Bo7)</option>
                        <option value={5}>5局(Bo9)</option>
                    </select>
                </div>
                <button className="create-room-btn" onClick={onCreateRoom}>
                    创建房间
                </button>
            </div>
            
            <div className="rooms-list">
                <h3>当前房间</h3>
                {rooms.length === 0 ? (
                    <p className="no-rooms">暂无可用房间</p>
                ) : (
                    rooms.map(room => (
                        <div key={room.id} className={`room-item ${room.status}`}>
                            <div className="room-info">
                                <span className="room-id">房间 #{room.id}</span>
                                <span className="room-status">
                                    {room.status === 'waiting' ? '等待中' : '游戏中'}
                                </span>
                            </div>
                            <div className="room-details">
                                <span>玩家: {room.players}/2</span>
                                <span>局数: {room.maxRounds}</span>
                            </div>
                            <div className="room-actions">
                                <button 
                                    onClick={() => onJoinRoom(room.id)}
                                    disabled={room.status !== 'waiting' || room.players >= 2}
                                >
                                    加入
                                </button>
                                <button 
                                    onClick={() => onSpectateRoom(room.id)}
                                    disabled={room.status !== 'playing'}
                                >
                                    旁观
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default GameLobby;

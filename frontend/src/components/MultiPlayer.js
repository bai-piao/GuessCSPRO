import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import GameRoom from './GameRoom';
import GameLobby from './GameLobby';
import './MultiPlayer.css';

function MultiPlayer() {
    const socketRef = useRef(null);
    const [rooms, setRooms] = useState([]); // 添加 rooms 状态
    const [gameState, setGameState] = useState({
        roomId: null,
        currentRound: 0,
        maxRounds: 3,
        status: 'lobby',
        isReady: false
    });

    useEffect(() => {
        // 使用完整的配置选项
        const socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
            timeout: 10000,
        });

        socketRef.current = socket;

        const handlers = {
            connect: () => {
                console.log('Connected to server');
                socket.emit('getRooms'); // 连接后请求房间列表
            },
            disconnect: (reason) => {
                console.log('Disconnected:', reason);
            },
            connect_error: (error) => {
                console.error('Connection error:', error);
            },
            roomsList: (roomsList) => {
                console.log('Received rooms list:', roomsList);
                setRooms(roomsList); // 处理房间列表更新
            },
            roomCreated: (data) => {
                setGameState(prev => ({
                    ...prev,
                    roomId: data.roomCode,
                    status: 'room'
                }));
            },
            error: console.error
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        return () => {
            if (socket) {
                Object.keys(handlers).forEach(event => {
                    socket.off(event);
                });
                socket.disconnect();
            }
        };
    }, []);

    const handleCreateRoom = useCallback((settings = {}) => {
        if (!socketRef.current) return;
        
        const roomSettings = {
            maxRounds: settings.maxRounds || 3
        };

        socketRef.current.emit('createRoom', roomSettings);
    }, []);

    const handleJoinRoom = (roomId) => {
        if (socketRef.current) {
            socketRef.current.emit('joinRoom', roomId);
            setGameState(prev => ({
                ...prev,
                status: 'room'
            }));
        }
    };

    const handleSpectateRoom = (roomId) => {
        if (socketRef.current) {
            socketRef.current.emit('spectateRoom', roomId);
            setGameState(prev => ({
                ...prev,
                status: 'spectate'
            }));
        }
    };

    const handlePlayerReady = () => {
        if (socketRef.current && gameState.roomId) {
            socketRef.current.emit('playerReady', { roomId: gameState.roomId });
            setGameState(prev => ({
                ...prev,
                isReady: true
            }));
        }
    };

    return (
        <div className="multiplayer-container">
            {gameState.status === 'lobby' && (
                <GameLobby 
                    rooms={rooms}
                    maxRounds={gameState.maxRounds}
                    setMaxRounds={(rounds) => setGameState(prev => ({ ...prev, maxRounds: rounds }))}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onSpectateRoom={handleSpectateRoom}
                />
            )}
            
            {gameState.status === 'room' && (
                <GameRoom 
                    socket={socketRef.current}
                    roomId={gameState.roomId}
                    currentRound={gameState.currentRound}
                    maxRounds={gameState.maxRounds}
                    scores={gameState.scores}
                    isReady={gameState.isReady}
                    onReady={handlePlayerReady}
                />
            )}

            {gameState.status === 'spectate' && (
                <SpectatorView 
                    roomId={gameState.roomId}
                    socket={socketRef.current}
                />
            )}
        </div>
    );
}

// 防抖函数
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export default MultiPlayer;

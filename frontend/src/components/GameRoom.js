import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GameRoom.css';
import { API_BASE_URL } from '../config';
import GuessHistory from './GuessHistory';

const decryptData = async (encryptedData) => {
    const response = await fetch(`${API_BASE_URL}/api/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData }),
    });
    return await response.json();
};

function GameRoom({ roomId, socket, scores, currentRound, maxRounds }) {
    const [gameState, setGameState] = useState({
        currentPlayer: null,
        timeLeft: 60,
        guess: '',
        remainingGuesses: 8,
        guessHistory: [], 
    });
    
    const [playersGuesses, setPlayersGuesses] = useState({}); 
    const [messages, setMessages] = useState([]);

    const [suggestions, setSuggestions] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showGameResult, setShowGameResult] = useState(false);
    const [players, setPlayers] = useState({});
    const [isChatExpanded, setIsChatExpanded] = useState(true);

    const regionMapping = {
        Asia: ['China', 'Mongolia', 'Indonesia', 'Malaysia', 'Turkey', 'India'],
        Europe: ['France', 'Germany', 'Sweden', 'Denmark', 'Poland', 'Spain', 'Italy', 'Ukraine', 'Finland', 'Norway'],
    };

    const getRegion = (country) => {
        for (const [region, countries] of Object.entries(regionMapping)) {
            if (countries.includes(country)) {
                return region;
            }
        }
        return 'Other';
    };

    const getAge = (birthYear) => 2025 - birthYear;

    const guessHistoryRef = useRef([]);
    const playersRef = useRef({});

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/players`)
            .then(res => res.json())
            .then(data => setPlayers(data))
            .catch(err => console.error('获取玩家数据失败:', err));

        if (!socket) return;

        const handleRoundStart = (data) => {
            const simplePlayer = {
                country: data.country,
                team: data.team,
                role: data.role,
                majapp: data.majapp,
                hiddenName: data.hiddenName
            };
            
            setGameState(prev => ({
                ...prev,
                currentPlayer: simplePlayer,
                remainingGuesses: 8,
                timeLeft: 60,
                guess: ''
            }));
            setPlayersGuesses({});
        };

        const handleRoundEnd = ({ winner, correctAnswer }) => {
            setGameState(prev => ({
                ...prev,
                showAnswer: true,
                currentPlayer: { ...prev.currentPlayer, hiddenName: correctAnswer }
            }));
            setShowGameResult(true);
        };

        const handleChatMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        socket.on('roundStart', handleRoundStart);
        socket.on('roundEnd', handleRoundEnd);
        socket.on('chatMessage', handleChatMessage);

        return () => {
            socket.off('roundStart', handleRoundStart);
            socket.off('roundEnd', handleRoundEnd);
            socket.off('chatMessage', handleChatMessage);
        };
    }, [socket, roomId]);

    const handleGuessResult = useCallback(({ playerId, guess, result }) => {
        if (!result) return;
        
        // 使用单层数据结构
        setPlayersGuesses(prev => ({
            ...prev,
            [playerId]: [
                ...(prev[playerId] || []),
                {
                    name: guess,
                    ...result,
                    timestamp: Date.now()
                }
            ]
        }));
    }, []);

    useEffect(() => {
        if (!socket) return;

        // 一次性注册所有事件监听器
        const eventHandlers = {
            'roundStart': (data) => {
                const simpleData = {
                    country: data.country,
                    team: data.team,
                    role: data.role,
                    majapp: data.majapp,
                    hiddenName: data.hiddenName
                };
                
                setGameState(prev => ({
                    ...prev,
                    currentPlayer: simpleData,
                    remainingGuesses: 8,
                    timeLeft: 60,
                    guess: ''
                }));
                setPlayersGuesses({});
            },
            'guessResult': handleGuessResult,
            'roundEnd': ({ winner, correctAnswer }) => {
                setGameState(prev => ({
                    ...prev,
                    showAnswer: true,
                    currentPlayer: {
                        ...prev.currentPlayer,
                        hiddenName: correctAnswer
                    }
                }));
                setShowGameResult(true);
            }
        };

        // 注册事件
        Object.entries(eventHandlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        // 清理函数
        return () => {
            Object.keys(eventHandlers).forEach(event => {
                socket.off(event);
            });
        };
    }, [socket, handleGuessResult]);

    useEffect(() => {
        if (!socket) return;

        const handleRoundStart = (data) => {
            // 简化数据结构
            const gameData = {
                currentPlayer: {
                    country: data.country,
                    team: data.team,
                    role: data.role,
                    majapp: data.majapp,
                    hiddenName: data.hiddenName
                },
                remainingGuesses: 8,
                timeLeft: 60,
                guess: ''
            };
            
            setGameState(gameData);
            setPlayersGuesses({});
        };

        const handleGuessResult = (data) => {
            // 使用简单数据结构
            setPlayersGuesses(prev => {
                const newGuesses = { ...prev };
                if (!newGuesses[data.playerId]) {
                    newGuesses[data.playerId] = [];
                }
                newGuesses[data.playerId].push(data.result);
                return newGuesses;
            });
        };

        socket.on('roundStart', handleRoundStart);
        socket.on('guessResult', handleGuessResult);
        
        return () => {
            socket.off('roundStart', handleRoundStart);
            socket.off('guessResult', handleGuessResult);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        
        const handlers = {
            roundStart: (data) => {
                setGameState(prev => ({
                    ...prev,
                    currentPlayer: {
                        country: data.country,
                        team: data.team,
                        role: data.role,
                        majapp: data.majapp,
                        hiddenName: data.hiddenName
                    },
                    remainingGuesses: 8,
                    timeLeft: 60,
                    guess: ''
                }));
                // 清理历史记录
                guessHistoryRef.current = [];
            }
        };

        // 注册事件处理器
        Object.entries(handlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        return () => {
            // 清理事件监听器
            Object.keys(handlers).forEach(event => {
                socket.off(event);
            });
        };
    }, [socket]); // 只依赖 socket

    const handleInputChange = (e) => {
        const value = e.target.value;
        setGameState((prev) => ({ ...prev, guess: value }));

        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        fetch(`${API_BASE_URL}/api/search-players?query=${value}`)
            .then((response) => response.json())
            .then((data) => setSuggestions(data))
            .catch((error) => console.error('搜索选手失败:', error));
    };

    const handleGuess = () => {
        if (!gameState.currentPlayer || gameState.remainingGuesses <= 0 || !gameState.guess.trim()) return;

        const guessedPlayer = players[gameState.guess];
        if (!guessedPlayer) return;

        // 发送简化的猜测数据
        const guessData = {
            roomId,
            guess: gameState.guess,
            playerData: {
                name: gameState.guess,
                team: guessedPlayer.team,
                country: guessedPlayer.country,
                role: guessedPlayer.role,
                majapp: guessedPlayer.majapp
            }
        };

        socket.emit('submitGuess', guessData);

        setGameState(prev => ({
            ...prev,
            remainingGuesses: prev.remainingGuesses - 1,
            guess: ''
        }));
        setSuggestions([]);
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !socket) return;

        const message = {
            id: socket.id,
            content: newMessage,
            timestamp: Date.now(),
        };

        socket.emit('chatMessage', { roomId, ...message });
        setNewMessage('');
    };

    return (
        <div className="game-room">
            <div className="game-room-container">
                {/* 左侧游戏区域 */}
                <div className="game-main">
                    <div className="game-header">
                        <h2>房间 #{roomId}</h2>
                        <div className="game-status">
                            <span>回合: {currentRound}/{maxRounds}</span>
                            <span>剩余时间: {gameState.timeLeft}秒</span>
                        </div>
                    </div>

                    {/* 单人模式风格的输入区域 */}
                    <div className="input-section">
                        <input
                            type="text"
                            value={gameState.guess}
                            onChange={handleInputChange}
                            placeholder="输入选手名字"
                            disabled={!gameState.currentPlayer || gameState.remainingGuesses <= 0}
                            className="player-input"
                        />
                        {suggestions.length > 0 && (
                            <div className="suggestions-list">
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.name}
                                        className="suggestion-item"
                                        onClick={() => {
                                            setGameState((prev) => ({ ...prev, guess: suggestion.name }));
                                            setSuggestions([]);
                                        }}
                                    >
                                        {suggestion.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="button-group">
                        <button
                            className="submit-guess"
                            onClick={handleGuess}
                            disabled={!gameState.currentPlayer || gameState.remainingGuesses <= 0}
                        >
                            提交
                        </button>
                    </div>

                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{width: `${(gameState.remainingGuesses / 8) * 100}%`}}
                        >
                            {gameState.remainingGuesses}
                        </div>
                    </div>

                    {/* 将猜测历史区域分为两列显示 */}
                    <div className="guess-histories">
                        <div className="player-history">
                            <h3>你的猜测</h3>
                            <GuessHistory history={gameState.guessHistory} />
                        </div>
                        <div className="player-history">
                            <h3>对手的猜测</h3>
                            {Object.entries(playersGuesses).map(([playerId, guesses]) => (
                                playerId !== socket.id && (
                                    <GuessHistory key={playerId} history={guesses} />
                                )
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`chat-section ${isChatExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="chat-header" onClick={() => setIsChatExpanded(!isChatExpanded)}>
                        <h3>聊天</h3>
                        <button className="toggle-button">
                            {isChatExpanded ? '↓' : '↑'}
                        </button>
                    </div>
                    <div className="messages-container">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.id === socket.id ? 'self' : ''}`}>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="message-content">{msg.content}</span>
                            </div>
                        ))}
                    </div>
                    <div className="message-input">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="发送消息..."
                        />
                        <button onClick={sendMessage}>发送</button>
                    </div>
                </div>
            </div>

            {showGameResult && (
                <div className="game-result-modal">
                    <h3>回合结束</h3>
                    <p>正确答案: {gameState.currentPlayer.hiddenName}</p>
                    <button onClick={() => setShowGameResult(false)}>继续</button>
                </div>
            )}
        </div>
    );
}

export default React.memo(GameRoom); // 使用 memo 优化渲染
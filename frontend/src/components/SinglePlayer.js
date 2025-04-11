import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import GuessHistory from './GuessHistory';
import './SinglePlayer.css';

// 添加 decryptData 函数
const decryptData = async (encryptedData) => {
    const response = await fetch(`${API_BASE_URL}/api/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
    });
    const data = await response.json();
    return data;
};

function SinglePlayer() {
    // 区域映射
    const regionMapping = {
        Asia: ['China', 'Mongolia', 'Indonesia', 'Malaysia', 'Turkey', 'India', 'Israel', 'Jordan', 'Uzbekistan'],
        Oceania: ['Australia', 'New Zealand'],
        Europe: ['France', 'Germany', 'Sweden', 'Denmark', 'Poland', 'Spain', 'Italy', 
                'Finland', 'Norway', 'Latvia', 'Estonia', 'Bosnia and Herzegovina', 
                'Montenegro', 'Serbia', 'Bulgaria', 'Czech Republic', 'Switzerland', 
                'Netherlands', 'Slovakia', 'Lithuania', 'Romania', 'United Kingdom', 
                'Ukraine', 'Belgium', 'Hungary', 'Portugal', 'Kosovo'],
        Africa: ['South Africa'],
        SouthAmerica: ['Brazil', 'Uruguay', 'Argentina', 'Chile', 'Guatemala'],
        NorthAmerica: ['United States', 'Canada'],
        CIS: ['Russia', 'Kazakhstan', 'Belarus']
    };

    const getRegion = (country) => {
        for (const [region, countries] of Object.entries(regionMapping)) {
            if (countries.includes(country)) {
                return region;
            }
        }
        return 'Other';
    };

    // 添加国家中英文映射
    const countryTranslations = {
        'China': '中国',
        'Mongolia': '蒙古',
        'Indonesia': '印度尼西亚',
        'Malaysia': '马来西亚',
        'Turkey': '土耳其',
        'India': '印度',
        'Israel': '以色列',
        'Jordan': '约旦',
        'Uzbekistan': '乌兹别克斯坦',
        'Australia': '澳大利亚',
        'New Zealand': '新西兰',
        'France': '法国',
        'Germany': '德国',
        'Sweden': '瑞典',
        'Denmark': '丹麦',
        'Poland': '波兰',
        'Spain': '西班牙',
        'Italy': '意大利',
        'Finland': '芬兰',
        'Norway': '挪威',
        'Latvia': '拉脱维亚',
        'Estonia': '爱沙尼亚',
        'Bosnia and Herzegovina': '波黑',
        'Montenegro': '黑山',
        'Serbia': '塞尔维亚',
        'Bulgaria': '保加利亚',
        'Czech Republic': '捷克',
        'Switzerland': '瑞士',
        'Netherlands': '荷兰',
        'Slovakia': '斯洛伐克',
        'Lithuania': '立陶宛',
        'Romania': '罗马尼亚',
        'United Kingdom': '英国',
        'Ukraine': '乌克兰',
        'Belgium': '比利时',
        'Hungary': '匈牙利',
        'Portugal': '葡萄牙',
        'Kosovo': '科索沃',
        'South Africa': '南非',
        'Brazil': '巴西',
        'Uruguay': '乌拉圭',
        'Argentina': '阿根廷',
        'Chile': '智利',
        'Guatemala': '危地马拉',
        'United States': '美国',
        'Canada': '加拿大',
        'Russia': '俄罗斯',
        'Kazakhstan': '哈萨克斯坦',
        'Belarus': '白俄罗斯'
    };

    const [player, setPlayer] = useState(null);
    const [players, setPlayers] = useState({});
    const [guess, setGuess] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [guessHistory, setGuessHistory] = useState([]);
    const [remainingGuesses, setRemainingGuesses] = useState(8);
    const [showGameResult, setShowGameResult] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // 获取随机选手
    const fetchRandomPlayer = () => {
        fetch(`${API_BASE_URL}/api/random-player`)
            .then(response => {
                if (!response.ok) throw new Error('无法获取随机选手');
                return response.json();
            })
            .then(async data => {
                const decryptedData = await decryptData(data.encryptedData);
                setPlayer(decryptedData);
                setGuess('');
                setSuggestions([]);
                setGuessHistory([]);
                setRemainingGuesses(8);
                setShowGameResult(false);
            })
            .catch(error => console.error('获取随机选手失败:', error));
    };

    // 获取所有选手数据
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/players`)
            .then(response => {
                if (!response.ok) throw new Error('无法获取选手数据');
                return response.json();
            })
            .then(data => setPlayers(data))
            .catch(err => console.error('获取玩家数据失败:', err));

        fetchRandomPlayer();
    }, []);

    // 处理搜索建议
    const handleInputChange = (e) => {
        const value = e.target.value;
        setGuess(value);
        setSelectedIndex(-1);
        
        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        fetch(`${API_BASE_URL}/api/search-players?query=${value}`)
            .then(response => response.json())
            .then(data => {
                setSuggestions(data);
                // 确保建议列表可见
                const suggestionsElement = document.querySelector('.suggestions-list');
                if (suggestionsElement) {
                    suggestionsElement.style.display = 'block';
                }
            })
            .catch(error => console.error('搜索选手失败:', error));
    };

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : selectedIndex;
                setSelectedIndex(nextIndex);
                if (nextIndex >= 0) {
                    setGuess(suggestions[nextIndex].name);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
                setSelectedIndex(prevIndex);
                if (prevIndex >= 0) {
                    setGuess(suggestions[prevIndex].name);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    submitGuessWithName(suggestions[selectedIndex].name);
                    setSuggestions([]);
                    setSelectedIndex(-1);
                } else if (guess.trim()) {
                    submitGuess();
                }
                break;
            default:
                break;
        }
    };

    // 新增函数：提取纯队伍名称（移除角色后缀）
    const getTeamName = (team) => {
        return team.replace(/\s*\((coach|benched)\)$/i, '');
    };

    // 添加一个新的函数来处理直接用名字提交
    const submitGuessWithName = (playerName) => {
        if (!player || remainingGuesses <= 0) return;

        let guessedPlayer = players[playerName];
        
        if (!guessedPlayer) {
            const matchedEntry = Object.entries(players).find(
                ([name]) => name.toLowerCase() === playerName.toLowerCase()
            );
            
            if (matchedEntry) {
                guessedPlayer = matchedEntry[1];
            }
        }

        if (!guessedPlayer) {
            setGuess('');
            return;
        }

        // 使用传入的 playerName 构建新的猜测数据
        const newGuess = {
            name: playerName,
            team: guessedPlayer.team,
            teamCorrect: getTeamName(guessedPlayer.team) === getTeamName(player.team),
            country: countryTranslations[guessedPlayer.country] || guessedPlayer.country,
            countryCorrect: String(guessedPlayer.country).toLowerCase() === String(player.country).toLowerCase(),
            countryRegion: getRegion(guessedPlayer.country),
            targetCountryRegion: getRegion(player.country),
            birth_year: compareValues(guessedPlayer.birth_year, player.birth_year),
            guessedAge: 2025 - guessedPlayer.birth_year, // 修改为2025年
            targetAge: 2025 - player.birth_year, // 添加目标年龄
            role: guessedPlayer.role,
            roleCorrect: guessedPlayer.role.toLowerCase() === player.role.toLowerCase(),
            majapp: compareMajors(guessedPlayer.majapp, player.majapp),
            guessedMajapp: guessedPlayer.majapp,
            targetMajapp: player.majapp // 添加目标 Major 次数
        };

        setGuessHistory(prev => [...prev, newGuess]);
        setRemainingGuesses(prev => {
            const newRemaining = prev - 1;
            // 确保进度条更新
            document.querySelector('.progress-bar').style.width = `${(newRemaining / 8) * 100}%`;
            return newRemaining;
        });
        setGuess('');
        setSuggestions([]);

        // 检查是否猜对或用完猜测次数
        if (playerName.toLowerCase() === player.hiddenName.toLowerCase() || remainingGuesses - 1 === 0) {
            setShowGameResult(true);
        }
    };

    // 提交猜测
    const submitGuess = () => {
        if (!player || remainingGuesses <= 0 || !guess.trim()) return;

        // 先尝试完全匹配
        let guessedPlayer = players[guess];
        
        // 如果完全匹配未找到，再尝试不区分大小写的匹配
        if (!guessedPlayer) {
            const matchedEntry = Object.entries(players).find(
                ([name]) => name.toLowerCase() === guess.toLowerCase()
            );
            
            if (matchedEntry) {
                setGuess(matchedEntry[0]); // 设置为正确的大小写形式
                guessedPlayer = matchedEntry[1];
            }
        }

        if (!guessedPlayer) {
            setGuess('');
            return;
        }

        // 构建新的猜测数据
        const newGuess = {
            name: guess,
            team: guessedPlayer.team,
            teamCorrect: getTeamName(guessedPlayer.team) === getTeamName(player.team),
            country: countryTranslations[guessedPlayer.country] || guessedPlayer.country,
            countryCorrect: String(guessedPlayer.country).toLowerCase() === String(player.country).toLowerCase(),
            countryRegion: getRegion(guessedPlayer.country),
            targetCountryRegion: getRegion(player.country),
            birth_year: compareValues(guessedPlayer.birth_year, player.birth_year),
            guessedAge: 2025 - guessedPlayer.birth_year, // 修改为2025年
            targetAge: 2025 - player.birth_year, // 添加目标年龄
            role: guessedPlayer.role,
            roleCorrect: guessedPlayer.role.toLowerCase() === player.role.toLowerCase(),
            majapp: compareMajors(guessedPlayer.majapp, player.majapp),
            guessedMajapp: guessedPlayer.majapp,
            targetMajapp: player.majapp // 添加目标 Major 次数
        };

        setGuessHistory(prev => [...prev, newGuess]);
        setRemainingGuesses(prev => {
            const newRemaining = prev - 1;
            // 确保进度条更新
            document.querySelector('.progress-bar').style.width = `${(newRemaining / 8) * 100}%`;
            return newRemaining;
        });
        setGuess('');
        setSuggestions([]);

        // 检查是否猜对或用完猜测次数
        if (guess.toLowerCase() === player.hiddenName.toLowerCase() || remainingGuesses - 1 === 0) {
            setShowGameResult(true);
        }
    };

    // 修改比较函数的判定逻辑
    const compareValues = (guessed, target) => {
        if (guessed === target) return 'correct';
        const diff = Math.abs(guessed - target);
        if (diff <= 3) return 'close'; // 修改为 3 年内为接近
        return guessed > target ? 'higher' : 'lower';
    };

    const compareMajors = (guessed, target) => {
        if (guessed === target) return 'correct';
        const diff = Math.abs(guessed - target);
        if (diff <= 2) return 'close'; // 修改为 2 次以内为接近
        return guessed > target ? 'higher' : 'lower';
    };

    const handleContinueGame = () => {
        setShowGameResult(false);
        fetchRandomPlayer();
    };

    const handleStayHere = () => {
        setShowGameResult(false);
    };

    // 添加滚动到底部的函数
    const scrollToBottom = () => {
        const element = document.querySelector('.single-player');
        if (element) {
            element.scrollTo({
                top: element.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // 在添加新的猜测历史后滚动到底部
    useEffect(() => {
        if (guessHistory.length > 0) {
            scrollToBottom();
        }
    }, [guessHistory]);

    return (
        <div className="single-player">
            <div className="game-area">
                {/* 输入区域 */}
                <div className="input-section">
                    <input
                        type="text"
                        value={guess}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="输入选手名字"
                        disabled={!player || remainingGuesses <= 0}
                        className="player-input"
                    />
                    {/* 建议列表 */}
                    {suggestions.length > 0 && (
                        <div className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion.name}
                                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                                    onClick={() => {
                                        setGuess(suggestion.name);
                                        setSuggestions([]);
                                        setSelectedIndex(-1);
                                    }}
                                >
                                    {suggestion.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 按钮区域 */}
                <div className="button-group">
                    <button 
                        onClick={submitGuess}
                        disabled={!player || remainingGuesses <= 0}
                        className="submit-button"
                    >
                        提交
                    </button>
                    <button 
                        onClick={fetchRandomPlayer}
                        className="reset-button"
                    >
                        换一个选手
                    </button>
                </div>

                {/* 历史记录 */}
                <GuessHistory history={guessHistory} player={player} />

                {/* 进度条 */}
                <div className="progress-container">
                    <div 
                        className="progress-bar"
                        style={{width: `${(remainingGuesses / 8) * 100}%`}}
                    >
                        {remainingGuesses}
                    </div>
                </div>

                {/* 修改游戏结果弹窗的内容 */}
                {showGameResult && (
                    <div className="game-result-modal">
                        <div className="game-result-title">
                            {guess.toLowerCase() === player.hiddenName.toLowerCase() ? '恭喜猜对了！' : '游戏结束'}
                        </div>
                        <div className="game-result-content">
                            <div className="player-info-item">
                                <span className="player-info-label">选手名字:</span>
                                <span className="player-info-value">{player.hiddenName}</span>
                            </div>
                            <div className="player-info-item">
                                <span className="player-info-label">所属战队:</span>
                                <span className="player-info-value">{player.team}</span>
                            </div>
                            <div className="player-info-item">
                                <span className="player-info-label">国家及地区:</span>
                                <span className="player-info-value">
                                    {countryTranslations[player.country] || player.country}
                                </span>
                            </div>
                            <div className="player-info-item">
                                <span className="player-info-label">出生年份:</span>
                                <span className="player-info-value">{player.birth_year}</span>
                            </div>
                            <div className="player-info-item">
                                <span className="player-info-label">游戏角色:</span>
                                <span className="player-info-value">{player.role}</span>
                            </div>
                            <div className="player-info-item">
                                <span className="player-info-label">Major次数:</span>
                                <span className="player-info-value">{player.majapp}</span>
                            </div>
                            <a 
                                className="game-result-link"
                                href={players[player.hiddenName]?.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                查看选手资料 →
                            </a>
                        </div>
                        <div className="game-result-buttons">
                            <button className="button-continue" onClick={handleContinueGame}>
                                下一个选手
                            </button>
                            <button className="button-stay" onClick={handleStayHere}>
                                查看历史记录
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SinglePlayer;

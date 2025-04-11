const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { encrypt, decrypt } = require('./utils/crypto');
const http = require('http');
const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';

// 使用 CORS 中间件
app.use(cors({
    origin: '*', // 允许所有来源访问
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// 创建 HTTP 服务器和 Socket.IO 实例
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    pingTimeout: 60000
});

// 初始化房间管理
const rooms = new Map();

// 简化的房间类
class GameRoom {
    constructor(id, maxRounds = 3) {
        this.id = id;
        this.maxRounds = maxRounds;
        this.players = new Set();
        this.scores = new Map();
        this.currentRound = 0;
        this.status = 'waiting';
        this.currentPlayer = null;
    }

    toJSON() {
        return {
            id: this.id,
            maxRounds: this.maxRounds,
            players: Array.from(this.players),
            scores: Array.from(this.scores),
            currentRound: this.currentRound,
            status: this.status
        };
    }
}

// Socket.IO 事件处理
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // 清理房间数据
        for (const [roomId, room] of rooms) {
            if (room.players.has(socket.id)) {
                room.players.delete(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(roomId);
                }
                io.to(roomId).emit('playerLeft', socket.id);
            }
        }
    });

    // 返回所有房间列表
    socket.on('getRooms', () => {
        const roomsList = Array.from(rooms.values()).map(room => room.toJSON());
        socket.emit('roomsList', roomsList);
    });

    socket.on('createRoom', (settings = {}) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId, settings.maxRounds);
        room.players.add(socket.id);
        rooms.set(roomId, room);
        
        socket.join(roomId);
        socket.emit('roomCreated', { 
            roomCode: roomId,
            maxRounds: room.maxRounds
        });
    });

    // ...rest of socket event handlers
});

// 读取 JSON 文件
app.get('/api/players', (req, res) => {
    const filePath = path.join(__dirname, 'players_data_cleaned.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: '无法读取数据文件' });
        }
        res.json(JSON.parse(data));
    });
});

// 随机获取一个选手（隐藏名字）
app.get('/api/random-player', (req, res) => {
    const filePath = path.join(__dirname, 'players_data_cleaned.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: '无法读取数据文件' });
        }
        const players = JSON.parse(data);
        const keys = Object.keys(players);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const player = players[randomKey];
        
        // 加密敏感数据
        const encryptedData = encrypt(JSON.stringify({
            country: player.country,
            team: player.team,
            birth_year: player.birth_year,
            role: player.role,
            majapp: player.majapp,
            hiddenName: randomKey
        }));

        res.json({ encryptedData });
    });
});

// 验证用户猜测
app.post('/api/guess', express.json(), (req, res) => {
    const { guess, hiddenName } = req.body;
    if (!guess || !hiddenName) {
        return res.status(400).json({ error: '缺少必要参数' });
    }
    const filePath = path.join(__dirname, 'players_data_cleaned.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: '无法读取数据文件' });
        }
        const players = JSON.parse(data);
        if (players[hiddenName] && hiddenName.toLowerCase() === guess.toLowerCase()) {
            res.json({ correct: true });
        } else {
            res.json({ correct: false });
        }
    });
});

// 根据输入返回匹配的选手列表
app.get('/api/search-players', (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: '缺少查询参数' });
    }
    const filePath = path.join(__dirname, 'players_data_cleaned.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: '无法读取数据文件' });
        }
        const players = JSON.parse(data);
        const matches = Object.keys(players)
            .filter((key) => key.toLowerCase().includes(query.toLowerCase()))
            .map((key) => ({ name: key, fullName: players[key].link.split('/').pop() }));
        res.json(matches);
    });
});

// 添加解密端点
app.post('/api/decrypt', express.json(), (req, res) => {
    try {
        const { encryptedData } = req.body;
        const decryptedData = decrypt(encryptedData);
        res.json(JSON.parse(decryptedData));
    } catch (error) {
        console.error('解密失败:', error);
        res.status(500).json({ error: '解密失败' });
    }
});

// 确保监听所有网络接口
server.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器已启动，访问地址：http://0.0.0.0:${PORT}`);
});

// 删除或注释掉这行，因为它会导致端口冲突
// app.listen(PORT, HOST, () => { ... });

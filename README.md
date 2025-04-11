# GuessCSPRO 部署指南

## 项目结构

## 环境要求
- Node.js >= 14
- npm >= 6

## 部署步骤

### 1. 前端部署
```bash
cd frontend
npm install
npm run build

npm install
node server.js

const SERVER_IP = 'your-server-ip';  // 替换为实际服务器IP
const SERVER_PORT = '3001';          // 根据需要修改端口


npm install -g pm2
serve -s build -l 80
pm2 start server.js --name guesscs
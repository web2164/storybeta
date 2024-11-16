import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const router = express.Router();

// __dirname 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 스토리 화면 경로
router.get('/story', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'story.html'));
});

// 보드 화면 경로
router.get('/board', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'board.html'));
});

export default router;
// server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 환경 변수 설정
dotenv.config();

// 현재 파일과 디렉토리 이름 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express 앱 초기화
const app = express();
const openaiApiKey = process.env.DB_OPENAI_API_KEY;

// CORS 및 JSON 요청 본문 파싱 미들웨어 설정
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

// HTML 파일 제공
app.get('/', (req, res) => res.sendFile(`${__dirname}/public/index.html`));

// Favicon 요청 처리
app.get('/favicon.ico', (req, res) => res.status(204)); // 204 No Content 응답

// OpenAI API 요청을 중계하는 엔드포인트 생성
app.post('/api/generate', async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).send('프롬프트가 필요합니다.');

    const maxRetries = 5; // 최대 재시도 횟수
    const retryDelay = 1000; // 재시도 간의 지연 시간 (ms)

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                return res.json({ result: data.choices[0].message.content });
            } 
            // 429 오류 처리
            else if (response.status === 429) {
                console.warn(`429 Too Many Requests. 재시도 중... (${attempt + 1}/${maxRetries})`);
                await delay(retryDelay); // 요청 속도 초과 시 대기
                continue; // 재시도
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            if (attempt === maxRetries - 1) {
                return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
            }
            await delay(retryDelay); // 대기 후 재시도
        }
    }
});

// 대기 함수
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 서버 실행
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});

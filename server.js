import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import sqlite3 from 'sqlite3'; // SQLite3 모듈 추가
import bcrypt from 'bcrypt'; // bcrypt 모듈 추가
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from './routes.js'; // 새로운 파일 가져오기

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

// 새로운 라우트 추가
app.use(routes);

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
                    messages: [
                        { role: 'system', content: '너는 창의적인 스토리를 창작하는 AI입니다.' },
                        { role: "user", content: prompt }]
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

// 제목 생성 API 엔드포인트 추가
app.post('/api/generate-title', async (req, res) => {
    const story = req.body.story;
    if (!story) return res.status(400).send('스토리가 필요합니다.');

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
                    messages: [
                        { role: 'system', content: '너는 창의적인 제목을 생성하는 AI입니다.' },
                        { role: "user", content: `다음 스토리에 어울리는 제목을 만들어 주세요:\n\n${story}\n\n제목:` }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                return res.json({ title: data.choices[0].message.content.trim() });
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
            console.error("Error generating title:", error);
            if (attempt === maxRetries - 1) {
                return res.status(500).json({ error: '제목 생성 중 오류가 발생했습니다.' });
            }
            await delay(retryDelay); // 대기 후 재시도
        }
    }
});

// 게시물 등록 API
app.post("/api/submit-post", async (req, res) => {
    const { title, content, author, password, timestamp } = req.body;

    if (!title || !content || !author || !password) {
        return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해싱
        const db = new sqlite3.Database("./public/stories.db");
        db.run(
            "INSERT INTO posts (title, content, author, password, timestamp) VALUES (?, ?, ?, ?, ?)",
            [title, content, author, hashedPassword, timestamp],
            function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: "게시물 등록 중 오류 발생" });
                } else {
                    res.status(200).json({ success: true });
                }
            }
        );
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

// 게시판 조회 API
app.get("/api/get-posts", (req, res) => {
    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.all("SELECT id, title, author, timestamp FROM posts ORDER BY timestamp ASC", [], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "게시물 조회 중 오류 발생" });
            } else {
                res.status(200).json(rows);
            }
        });
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

// 특정 게시물 조회 API
app.get("/api/get-post/:id", (req, res) => {
    const postId = req.params.id;

    try {
        const db = new sqlite3.Database("./public/stories.db");
        db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "게시물 조회 중 오류 발생" });
            } else if (!row) {
                res.status(404).json({ error: "게시물이 존재하지 않습니다." });
            } else {
                res.status(200).json(row);
            }
        });
        db.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "DB 연결 중 오류 발생" });
    }
});

// 게시물 삭제 API
app.post("/api/delete-post/:id", (req, res) => {
    const postId = req.params.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "비밀번호가 필요합니다." });
    }

    const db = new sqlite3.Database("./public/stories.db"); // 데이터베이스 열기

    db.get("SELECT password FROM posts WHERE id = ?", [postId], (err, row) => {
        if (err) {
            console.error("DB 조회 오류:", err);
            return res.status(500).json({ success: false, message: "DB 오류 발생" });
        }

        if (!row) {
            db.close(); // 작업 완료 후 데이터베이스 닫기
            return res.status(404).json({ success: false, message: "게시물을 찾을 수 없습니다." });
        }

        // 비밀번호 확인
        bcrypt.compare(password, row.password, (bcryptErr, isMatch) => {
            if (bcryptErr) {
                console.error("비밀번호 비교 오류:", bcryptErr);
                db.close();
                return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
            }

            if (!isMatch) {
                db.close();
                return res.status(403).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
            }

            // 비밀번호가 일치하면 게시물 삭제
            db.run("DELETE FROM posts WHERE id = ?", [postId], (deleteErr) => {
                db.close(); // 삭제 작업 완료 후 데이터베이스 닫기

                if (deleteErr) {
                    console.error("DB 삭제 오류:", deleteErr);
                    return res.status(500).json({ success: false, message: "DB 삭제 오류가 발생했습니다." });
                }

                res.status(200).json({ success: true, message: "게시물이 삭제되었습니다." });
            });
        });
    });
});

// 대기 함수
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 테이블 생성
const db = new sqlite3.Database("./public/stories.db");
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            password TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("테이블 생성 중 오류 발생:", err.message);
        } else {
            console.log("posts 테이블이 성공적으로 생성되었습니다.");
        }
    });
});
db.close();

// 서버 실행
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
"""
英语口语陪练 - Vercel Serverless 后端 API
适配为 Vercel Serverless Function
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

app = FastAPI(title="英语口语陪练 API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== DeepSeek 配置 ==========
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_BASE = os.getenv("LLM_API_BASE", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")

# ========== 内存数据库（Vercel 无状态，用临时 SQLite） ==========
import tempfile
DB_PATH = os.path.join(tempfile.gettempdir(), "practice.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scene_id TEXT NOT NULL,
            scene_name TEXT NOT NULL,
            original_text TEXT,
            chinese_meaning TEXT,
            user_text TEXT,
            score REAL,
            problems TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scene_id TEXT NOT NULL,
            scene_name TEXT NOT NULL,
            messages TEXT NOT NULL,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

init_db()

# ========== 模型 ==========
class ChatRequest(BaseModel):
    messages: list
    config: Optional[dict] = None
    response_format: Optional[dict] = None

class TTSRequest(BaseModel):
    text: str
    config: Optional[dict] = None

# ========== 路由 ==========

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "has_api_key": bool(LLM_API_KEY), "model": LLM_MODEL}

@app.get("/api/config")
async def get_config():
    return {
        "llm": {
            "provider": "deepseek",
            "model": LLM_MODEL,
            "configured": bool(LLM_API_KEY),
        },
        "stt": {
            "provider": "whisper",
            "configured": False,
        },
    }

@app.post("/api/llm/chat")
async def llm_chat(request: ChatRequest):
    if not LLM_API_KEY:
        print("LLM: No API Key configured, using mock")
        return JSONResponse(content={
            "content": generate_mock_response(request.messages),
            "role": "assistant",
            "model": "mock-no-key",
        })

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            }
            body = {
                "model": LLM_MODEL,
                "messages": request.messages,
                "temperature": 0.7,
                "max_tokens": 1000,
            }
            if request.response_format:
                body["response_format"] = request.response_format

            print(f"LLM: Calling {LLM_API_BASE}/chat/completions with model={LLM_MODEL}")
            response = await client.post(
                f"{LLM_API_BASE}/chat/completions",
                headers=headers,
                json=body,
            )

            if response.status_code != 200:
                print(f"LLM: API returned {response.status_code}: {response.text[:500]}")
                return JSONResponse(content={
                    "content": generate_mock_response(request.messages),
                    "role": "assistant",
                    "model": f"mock-status-{response.status_code}",
                })

            data = response.json()
            choice = data["choices"][0]["message"]
            print(f"LLM: Success, model={data.get('model', '')}")
            return JSONResponse(content={
                "content": choice["content"],
                "role": choice.get("role", "assistant"),
                "model": data.get("model", ""),
                "usage": data.get("usage", {}),
            })

    except Exception as e:
        print(f"LLM API 错误: {e}")
        return JSONResponse(content={
            "content": generate_mock_response(request.messages),
            "role": "assistant",
            "model": "mock-error",
        })

@app.post("/api/stt/recognize")
async def speech_to_text(audio: UploadFile = File(...)):
    # 没有 STT API Key，返回模拟结果
    return JSONResponse(content={
        "text": "Hello, how are you doing today?",
        "confidence": 0.85,
        "model": "mock-stt",
    })

@app.post("/api/tts/speak")
async def text_to_speech(request: TTSRequest):
    return JSONResponse(content={
        "message": "请使用浏览器内置语音合成",
        "text": request.text,
        "use_browser_tts": True,
    })

@app.post("/api/records/score")
async def save_score(data: dict):
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO scores (scene_id, scene_name, original_text, chinese_meaning, user_text, score, problems) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (data.get("sceneId",""), data.get("sceneName",""), data.get("originalText",""),
             data.get("chineseMeaning",""), data.get("userText",""), data.get("score",0),
             json.dumps(data.get("problems",[]))),
        )
        conn.commit()
        conn.close()
    except:
        pass
    return {"status": "ok"}

@app.post("/api/records/conversation")
async def save_conversation(data: dict):
    try:
        conn = get_db()
        conn.execute(
            "INSERT INTO conversations (scene_id, scene_name, messages, summary) VALUES (?, ?, ?, ?)",
            (data.get("sceneId",""), data.get("sceneName",""),
             json.dumps(data.get("messages",[])), data.get("summary","")),
        )
        conn.commit()
        conn.close()
    except:
        pass
    return {"status": "ok"}

@app.get("/api/records/stats")
async def get_stats():
    try:
        conn = get_db()
        total_scores = conn.execute("SELECT COUNT(*) as c FROM scores").fetchone()["c"]
        avg_score = conn.execute("SELECT AVG(score) as a FROM scores").fetchone()["a"] or 0
        total_conv = conn.execute("SELECT COUNT(*) as c FROM conversations").fetchone()["c"]
        conn.close()
        return {"totalScores": total_scores, "averageScore": round(avg_score,1), "totalConversations": total_conv}
    except:
        return {"totalScores": 0, "averageScore": 0, "totalConversations": 0}

def generate_mock_response(messages):
    if not messages:
        return "Hello! How can I help you today?"
    mock_responses = [
        "That's interesting! Tell me more about it.",
        "I see. And how do you feel about that?",
        "Nice! What happened next?",
        "Oh really? That sounds great!",
        "I understand. Can you tell me a bit more?",
        "Good point! What do you think about that?",
    ]
    import random
    return random.choice(mock_responses)

# ========== 兼容 Vercel ASGI ==========
from mangum import Mangum
handler = Mangum(app)

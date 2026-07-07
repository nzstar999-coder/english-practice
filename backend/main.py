"""
英语口语陪练 - 后端API服务
FastAPI + SQLite + 可替换AI接口配置
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import httpx

app = FastAPI(title="英语口语陪练 API", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 数据库初始化 ==========
DB_PATH = os.path.join(os.path.dirname(__file__), "practice.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS practice_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            scene_id TEXT,
            scene_name TEXT,
            data TEXT,
            score REAL,
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
    """)
    conn.commit()
    conn.close()

init_db()

# ========== 请求/响应模型 ==========
class LLMConfig(BaseModel):
    provider: str = "openai"
    endpoint: str = ""
    apiKey: str = ""
    model: str = "gpt-4o-mini"

class ChatRequest(BaseModel):
    messages: list
    config: Optional[LLMConfig] = None
    response_format: Optional[dict] = None

class TTSConfig(BaseModel):
    provider: str = "edge"
    endpoint: str = ""
    apiKey: str = ""
    voice: str = "en-US-JennyNeural"

class TTSRequest(BaseModel):
    text: str
    config: Optional[TTSConfig] = None

# ========== AI配置（从环境变量或默认值） ==========
DEFAULT_LLM_CONFIG = {
    "provider": os.getenv("LLM_PROVIDER", "openai"),
    "api_key": os.getenv("LLM_API_KEY", ""),
    "api_base": os.getenv("LLM_API_BASE", "https://api.openai.com/v1"),
    "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
}

DEFAULT_STT_CONFIG = {
    "provider": os.getenv("STT_PROVIDER", "whisper"),
    "api_key": os.getenv("STT_API_KEY", ""),
    "api_base": os.getenv("STT_API_BASE", "https://api.openai.com/v1"),
}

# ========== API路由 ==========

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api/config")
async def get_ai_config():
    """获取当前AI配置（隐藏API Key）"""
    return {
        "llm": {
            "provider": DEFAULT_LLM_CONFIG["provider"],
            "model": DEFAULT_LLM_CONFIG["model"],
            "configured": bool(DEFAULT_LLM_CONFIG["api_key"]),
        },
        "stt": {
            "provider": DEFAULT_STT_CONFIG["provider"],
            "configured": bool(DEFAULT_STT_CONFIG["api_key"]),
        },
    }


# ========== LLM 对话接口 ==========

@app.post("/api/llm/chat")
async def llm_chat(request: ChatRequest):
    """
    大模型对话接口
    支持 OpenAI 兼容的 API，可替换为其他供应商
    """
    llm_config = DEFAULT_LLM_CONFIG

    # 合并用户自定义配置
    if request.config and request.config.apiKey:
        llm_config["api_key"] = request.config.apiKey
    if request.config and request.config.model:
        llm_config["model"] = request.config.model
    if request.config and request.config.endpoint:
        llm_config["api_base"] = request.config.endpoint

    if not llm_config["api_key"]:
        # 没有配置API Key时，返回模拟回复
        return JSONResponse(content={
            "content": generate_mock_response(request.messages),
            "role": "assistant",
            "model": "mock",
        })

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {llm_config['api_key']}",
                "Content-Type": "application/json",
            }

            body = {
                "model": llm_config["model"],
                "messages": request.messages,
                "temperature": 0.7,
                "max_tokens": 1000,
            }

            if request.response_format:
                body["response_format"] = request.response_format

            response = await client.post(
                f"{llm_config['api_base']}/chat/completions",
                headers=headers,
                json=body,
            )

            if response.status_code != 200:
                error_text = response.text
                # 回退到模拟回复
                return JSONResponse(content={
                    "content": generate_mock_response(request.messages),
                    "role": "assistant",
                    "model": "mock-fallback",
                })

            data = response.json()
            choice = data["choices"][0]["message"]

            return JSONResponse(content={
                "content": choice["content"],
                "role": choice.get("role", "assistant"),
                "model": data.get("model", ""),
                "usage": data.get("usage", {}),
            })

    except Exception as e:
        print(f"LLM API 错误: {e}")
        # 出错时返回模拟回复
        return JSONResponse(content={
            "content": generate_mock_response(request.messages),
            "role": "assistant",
            "model": "mock-error",
        })


def generate_mock_response(messages):
    """当没有配置API Key时，生成模拟回复"""
    if not messages:
        return "Hello! How can I help you today?"

    last_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    # 简单的模拟回复逻辑
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


# ========== 语音识别 (STT) 接口 ==========

@app.post("/api/stt/recognize")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    语音识别接口
    支持 OpenAI Whisper API 或其他供应商
    """
    stt_config = DEFAULT_STT_CONFIG

    if not stt_config["api_key"]:
        # 无API Key时，返回模拟结果
        return JSONResponse(content={
            "text": "Hello, how are you doing today?",
            "confidence": 0.85,
            "model": "mock-stt",
        })

    try:
        # 读取音频文件
        audio_bytes = await audio.read()

        # 调用 Whisper API
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {
                "file": (audio.filename or "recording.webm", audio_bytes, audio.content_type or "audio/webm"),
            }
            headers = {
                "Authorization": f"Bearer {stt_config['api_key']}",
            }
            data = {
                "model": "whisper-1",
                "language": "en",
                "response_format": "json",
            }

            response = await client.post(
                f"{stt_config['api_base']}/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
            )

            if response.status_code != 200:
                return JSONResponse(content={
                    "text": "Could not recognize speech.",
                    "confidence": 0.5,
                    "error": response.text,
                })

            result = response.json()
            return JSONResponse(content={
                "text": result.get("text", ""),
                "confidence": 0.9,
                "model": "whisper-1",
            })

    except Exception as e:
        print(f"STT API 错误: {e}")
        return JSONResponse(content={
            "text": "Sorry, I didn't catch that.",
            "confidence": 0.5,
            "error": str(e),
        })


# ========== TTS 接口 ==========

@app.post("/api/tts/speak")
async def text_to_speech(request: TTSRequest):
    """
    文字转语音接口
    支持 Edge TTS (免费) 或 OpenAI TTS
    """
    # 前端使用浏览器的 Web Speech API，后端TTS作为备选
    # 这里返回音频URL或流

    # 使用 Edge TTS (免费，无需API Key)
    try:
        import subprocess
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp_path = tmp.name

        # 尝试使用 edge-tts（如果已安装）
        voice = request.config.voice if request.config else "en-US-JennyNeural"
        result = subprocess.run(
            ["edge-tts", "--text", request.text, "--voice", voice, "--write-media", tmp_path],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode == 0:
            with open(tmp_path, "rb") as f:
                audio_data = f.read()
            os.unlink(tmp_path)
            return StreamingResponse(
                iter([audio_data]),
                media_type="audio/mpeg",
                headers={"Content-Disposition": "inline"},
            )

    except Exception as e:
        print(f"TTS 错误 (将使用浏览器TTS): {e}")

    # 回退：返回提示让前端使用浏览器TTS
    return JSONResponse(content={
        "message": "请使用浏览器内置语音合成",
        "text": request.text,
        "use_browser_tts": True,
    })


# ========== 记录存储接口 ==========

@app.post("/api/records/score")
async def save_score_record(data: dict):
    """保存跟读评分记录"""
    conn = get_db()
    conn.execute(
        "INSERT INTO scores (scene_id, scene_name, original_text, chinese_meaning, user_text, score, problems) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("sceneId", ""),
            data.get("sceneName", ""),
            data.get("originalText", ""),
            data.get("chineseMeaning", ""),
            data.get("userText", ""),
            data.get("score", 0),
            json.dumps(data.get("problems", [])),
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.post("/api/records/conversation")
async def save_conversation_record(data: dict):
    """保存AI对话记录"""
    conn = get_db()
    conn.execute(
        "INSERT INTO conversations (scene_id, scene_name, messages, summary) VALUES (?, ?, ?, ?)",
        (
            data.get("sceneId", ""),
            data.get("sceneName", ""),
            json.dumps(data.get("messages", [])),
            data.get("summary", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.get("/api/records/stats")
async def get_stats():
    """获取学习统计"""
    conn = get_db()
    total_scores = conn.execute("SELECT COUNT(*) as c FROM scores").fetchone()["c"]
    avg_score = conn.execute("SELECT AVG(score) as a FROM scores").fetchone()["a"] or 0
    total_conversations = conn.execute("SELECT COUNT(*) as c FROM conversations").fetchone()["c"]
    conn.close()

    return {
        "totalScores": total_scores,
        "averageScore": round(avg_score, 1),
        "totalConversations": total_conversations,
    }


# ========== 启动 ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

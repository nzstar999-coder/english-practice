#!/bin/bash
# 英语口语陪练 - 后端启动脚本

echo "🚀 启动英语口语陪练后端服务..."
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 需要 Python 3.8+"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pip3 install -q fastapi uvicorn openai python-multipart pydantic httpx

# 设置环境变量（可选）
# export LLM_API_KEY="your-openai-api-key"
# export LLM_MODEL="gpt-4o-mini"
# export LLM_API_BASE="https://api.openai.com/v1"

echo ""
echo "✅ 后端服务启动在 http://localhost:8000"
echo "📝 API 文档: http://localhost:8000/docs"
echo ""

cd "$(dirname "$0")"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

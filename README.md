# 英语场景口语陪练 🎯

一个专为 iPhone 设计的英语口语练习 PWA 网页应用。通过场景化跟读评分、AI 角色对话和闯关模式，帮助中国用户在真实生活场景中敢说、能接话。

## 功能特点

### 🎯 今日20分钟
每天自动安排学习计划：复习错句(3min) → 新场景学习(5min) → 跟读训练(5min) → AI对话(7min)

### 🏆 场景闯关
5个场景 × 5个关卡 = 25关，逐关解锁：
- 第1关：常用句学习
- 第2关：跟读练习
- 第3关：听力理解
- 第4关：模拟对话
- 第5关：AI实战闯关

### 🤖 AI对话
AI扮演外国人角色（海关/前台/司机/店员/售票员/朋友），进行真实场景对话，对话结束后自动生成中文总结。

### 🎤 跟读评分
显示句子 → 播放发音 → 用户跟读 → 语音识别 → AI评分（完整度/准确度/自然度/实用性）

### 📊 学习记录
查看跟读历史、对话记录、连续学习天数、关卡进度。

## 场景覆盖

| 场景 | 核心句 | 角色 |
|------|--------|------|
| ✈️ 机场/海关/酒店 | 25句 | 海关/前台 |
| 🚕 打车/问路/地铁 | 22句 | 司机/路人 |
| 🍽️ 点餐/咖啡/超市 | 22句 | 店员/咖啡师 |
| 🎫 景点/买票 | 21句 | 售票员/导游 |
| 💬 朋友聊天/寒暄 | 22句 | 外国朋友 |

**总计：5个场景，112个核心句**

## 技术栈

### 前端
- **React 18** + **Vite 5**
- **Tailwind CSS 3** - 移动端优先的UI
- **React Router 6** - 路由管理
- **PWA** - 支持添加到主屏幕，离线缓存
- **Web Speech API** - 浏览器内置语音合成

### 后端
- **FastAPI** - Python 异步API
- **SQLite** - 本地数据存储
- **可替换AI接口** - 支持 OpenAI / 自定义LLM / Whisper STT

## 快速开始

### 1. 安装前端依赖

```bash
cd frontend
npm install
```

### 2. 启动前端开发服务器

```bash
npm run dev
```

前端运行在 `http://localhost:5173`

### 3. 启动后端（可选）

```bash
cd backend
pip install -r requirements.txt
python main.py
```

后端运行在 `http://localhost:8000`

> **注意**：不启动后端也可以使用基本功能。系统内置了模拟AI回复和浏览器语音合成，无需任何API Key即可体验。

### 4. 配置AI接口（可选）

设置环境变量以启用真实AI功能：

```bash
export LLM_API_KEY="your-openai-api-key"
export LLM_MODEL="gpt-4o-mini"
export LLM_API_BASE="https://api.openai.com/v1"
export STT_API_KEY="your-openai-api-key"
```

AI接口设计为可替换，支持任何兼容 OpenAI API 格式的服务商。

## 构建生产版本

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/` 目录，可直接部署到任何静态服务器。

## iPhone 使用

1. 将 `dist/` 目录部署到 HTTPS 服务器
2. 在 iPhone Safari 中打开网址
3. 点击底部"分享"按钮
4. 选择"添加到主屏幕"
5. 像原生 App 一样使用！

## 项目结构

```
ai外语/
├── frontend/                # 前端项目
│   ├── public/              # 静态资源（PWA图标等）
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── TabBar.jsx          # 底部导航栏
│   │   │   ├── RecordButton.jsx    # 录音按钮
│   │   │   └── ScoreDisplay.jsx    # 评分结果展示
│   │   ├── data/
│   │   │   └── scenes.js           # 5个场景112句核心句库
│   │   ├── hooks/
│   │   │   └── useStorage.js       # 本地存储和学习统计
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # 首页（4个主入口）
│   │   │   ├── DailyPractice.jsx   # 今日20分钟
│   │   │   ├── SceneLevels.jsx     # 场景闯关列表
│   │   │   ├── LevelDetail.jsx     # 关卡详情
│   │   │   ├── Shadowing.jsx       # 跟读练习
│   │   │   ├── SceneSelect.jsx     # AI对话场景选择
│   │   │   ├── AiChat.jsx          # AI对话页面
│   │   │   └── LearningRecords.jsx # 学习记录
│   │   └── services/
│   │       └── api.js              # AI接口服务层（可替换配置）
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/                 # 后端项目
│   ├── main.py              # FastAPI服务
│   ├── requirements.txt
│   └── start.sh
└── README.md
```

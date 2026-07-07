// AI服务层 - 所有AI接口统一管理，可替换配置

const API_BASE = '/api';

// 默认配置，可通过 setConfig 修改
let aiConfig = {
  // 大模型接口 - 用于AI对话和评分
  llm: {
    provider: 'openai', // openai | custom
    endpoint: '/api/llm/chat',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  // 语音识别接口 - 用于把录音转英文文本
  stt: {
    provider: 'whisper', // whisper | custom
    endpoint: '/api/stt/recognize',
    apiKey: '',
  },
  // TTS接口 - 用于播放标准发音和AI回复
  tts: {
    provider: 'edge', // edge | openai | custom
    endpoint: '/api/tts/speak',
    apiKey: '',
    voice: 'en-US-JennyNeural',
  },
};

export function getConfig() {
  return { ...aiConfig };
}

export function setConfig(newConfig) {
  aiConfig = { ...aiConfig, ...newConfig };
}

// ========== LLM 接口 ==========

/**
 * AI场景对话
 */
export async function chatWithAI({ sceneId, sceneName, role, aiRole, userMessage, history = [] }) {
  const messages = [
    {
      role: 'system',
      content: `你是一个英语场景口语陪练教练。

用户是中国成年人，英语水平为：能看懂一些英文，但缺少真实场景练习，口语表达和临场反应不足。

你的任务：
1. 根据用户选择的生活场景，扮演真实外国人角色；
2. 用简单、自然、常见的英语和用户对话；
3. 不要一次说太长；
4. 每次只问一个问题；
5. 用户表达错误时，不要立刻打断，优先保持对话继续；
6. 当用户严重听不懂或答非所问时，可以用中文给一句提示；
7. 不要讲复杂语法；
8. 目标是让用户在真实生活场景中能开口、能接话。

当前场景：${sceneName}
AI角色：${role}
${aiRole}
难度：简单模式

请先用一句英文进入角色，并开始对话。`
    },
    ...history.map(h => ({
      role: h.role,
      content: h.content
    })),
  ];

  if (userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  const response = await fetch(`${API_BASE}/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      config: aiConfig.llm,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI对话请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * AI对话结束后的中文总结
 */
export async function getConversationSummary({ sceneName, role, history }) {
  const messages = [
    {
      role: 'system',
      content: `你是一个英语口语教练。请用中文对以下英语场景对话进行总结。

总结要求：
1. 完成情况：用户是否完成了对话目标；
2. 错误表达：列出用户说错或表达不自然的地方；
3. 更自然表达：给出更好的说法；
4. 推荐复习句：3-5个建议复习的句子；
5. 鼓励的话：一句积极的鼓励。

场景：${sceneName}
角色：${role}`
    },
    {
      role: 'user',
      content: `对话记录：\n${history.map(h => `${h.role === 'user' ? '用户' : 'AI'}：${h.content}`).join('\n')}\n\n请给出中文总结。`
    }
  ];

  const response = await fetch(`${API_BASE}/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      config: aiConfig.llm,
    }),
  });

  if (!response.ok) {
    throw new Error(`总结请求失败: ${response.status}`);
  }

  return response.json();
}

// ========== 语音识别 (STT) 接口 ==========

/**
 * 上传录音，返回英文文本
 */
export async function recognizeSpeech(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE}/stt/recognize`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`语音识别失败: ${response.status}`);
  }

  return response.json();
}

// ========== TTS 接口 ==========

/**
 * 文字转语音，返回音频URL
 */
export async function textToSpeech(text) {
  const response = await fetch(`${API_BASE}/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      config: aiConfig.tts,
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS请求失败: ${response.status}`);
  }

  return response.blob();
}

/**
 * 播放文字语音（使用Web Speech API作为备选）
 */
export function speakTextWithBrowser(text, lang = 'en-US') {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }

    // 取消之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = resolve;
    utterance.onerror = reject;

    window.speechSynthesis.speak(utterance);
  });
}

// ========== 跟读评分接口 ==========

/**
 * AI评分
 */
export async function scorePronunciation({ originalText, chineseMeaning, userSpeechText, sceneName }) {
  const messages = [
    {
      role: 'system',
      content: `你是一个英语口语发音和表达评分教练。

请根据原句和语音识别结果，对用户的跟读进行评分。

评分维度：
1. 完整度：是否漏词、错词；
2. 表达准确度：意思是否正确；
3. 自然度：是否符合真实英语表达；
4. 实用性：在当前场景中是否能被外国人理解。

请输出JSON格式：
{
  "score": 数字0-100,
  "problems": ["问题1", "问题2"],
  "betterExpression": "更自然的表达方式",
  "suggestion": "一句中文建议",
  "needRetry": true或false
}

原句：${originalText}
中文意思：${chineseMeaning}
用户识别结果：${userSpeechText}
当前场景：${sceneName}`
    }
  ];

  const response = await fetch(`${API_BASE}/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      config: aiConfig.llm,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`评分请求失败: ${response.status}`);
  }

  return response.json();
}

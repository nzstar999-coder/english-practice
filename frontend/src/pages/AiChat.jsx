import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import scenesData from '../data/scenes'
import { chatWithAI, getConversationSummary, speakTextWithBrowser } from '../services/api'
import { addConversationRecord, completeLevel } from '../hooks/useStorage'

export default function AiChat() {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const scene = scenesData.find(s => s.id === sceneId);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 本地模拟回复（无后端API时使用）
  const getFallbackMessage = useCallback((sceneId, type) => {
    const fallbacks = {
      airport: {
        init: "Hello! Welcome to the airport. Where are you flying today?",
        reply: [
          "That's a great destination! Have you checked in online yet?",
          "Your gate is B12. Do you need help finding it?",
          "How many bags are you checking in today?",
          "Would you like a window seat or an aisle seat?",
          "Do you have your passport ready? I'll need to see it.",
          "Your flight is on time. Is there anything else I can help with?",
        ]
      },
      hotel: {
        init: "Good afternoon! Welcome to our hotel. Do you have a reservation?",
        reply: [
          "Let me check you in. Could I see your ID please?",
          "Your room is on the 5th floor. Would you like help with your luggage?",
          "Breakfast is served from 7 to 10 AM. Would you like to add that?",
          "Is there anything else you need for your stay?",
          "The gym and pool are on the 3rd floor. Enjoy your stay!",
          "Check-out time is 11 AM. Would you like a late check-out?",
        ]
      },
      restaurant: {
        init: "Good evening! Table for how many people tonight?",
        reply: [
          "Right this way please. Here's your menu.",
          "Our specials today are grilled salmon and pasta. Any questions?",
          "Are you ready to order, or do you need a few more minutes?",
          "Would you like something to drink while you look at the menu?",
          "How is everything? Is your meal okay?",
          "Would you like to see the dessert menu?",
        ]
      },
      shopping: {
        init: "Hi there! Can I help you find something today?",
        reply: [
          "What size are you looking for? We have small to extra large.",
          "That looks great on you! Would you like to try another color?",
          "This one is on sale, 30% off. It's a great deal!",
          "Would you like me to check if we have this in your size?",
          "We also have matching accessories. Would you like to see them?",
          "Cash or card? Would you like a receipt?",
        ]
      },
      hospital: {
        init: "Hello, how can I help you today? Do you have an appointment?",
        reply: [
          "Please take a seat. The doctor will see you shortly.",
          "Can you describe your symptoms? When did they start?",
          "Have you taken any medicine for this?",
          "I'm going to check your temperature and blood pressure now.",
          "The doctor recommends some rest and these medications.",
          "Do you have any allergies I should know about?",
        ]
      },
    };

    const scene = fallbacks[sceneId] || fallbacks.airport;
    if (type === 'init') return scene.init;
    const replies = scene.reply;
    return replies[Math.floor(Math.random() * replies.length)];
  }, []);

  // 初始化：AI先开始对话
  useEffect(() => {
    if (!scene || messages.length > 0) return;
    initConversation();
  }, [scene]);

  const initConversation = async () => {
    setIsLoading(true);
    try {
      const response = await chatWithAI({
        sceneId,
        sceneName: scene.name,
        role: scene.role,
        aiRole: scene.aiRole,
      });
      const aiMessage = response.content || 'Hello! How can I help you today?';
      setMessages([{ role: 'assistant', content: aiMessage }]);
      // 自动播放AI的消息
      speakTextWithBrowser(aiMessage).catch(() => {});
    } catch (err) {
      console.error('初始化对话失败，使用本地模拟:', err);
      const fallbackMsg = getFallbackMessage(sceneId, 'init');
      setMessages([{ role: 'assistant', content: fallbackMsg }]);
      // API失败时也用浏览器TTS朗读
      speakTextWithBrowser(fallbackMsg).catch(() => {});
    }
    setIsLoading(false);
  };

  // 发送文本消息
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatWithAI({
        sceneId,
        sceneName: scene.name,
        role: scene.role,
        aiRole: scene.aiRole,
        userMessage,
        history: newMessages,
      });

      const aiMessage = response.content || 'I see. Can you tell me more?';
      setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);

      // 自动播放AI的消息
      speakTextWithBrowser(aiMessage).catch(() => {});
    } catch (err) {
      console.error('AI回复失败，使用本地模拟:', err);
      const fallbackMsg = getFallbackMessage(sceneId, 'reply');
      setMessages([...newMessages, { role: 'assistant', content: fallbackMsg }]);
      // API失败时也用浏览器TTS朗读
      speakTextWithBrowser(fallbackMsg).catch(() => {});
    }
    setIsLoading(false);
  };

  // 结束对话并获取总结
  const endConversation = async () => {
    if (isEnded || messages.length < 4) {
      // 对话太短，直接返回
      navigate(`/levels/${sceneId}`);
      return;
    }

    setIsLoading(true);
    setIsEnded(true);

    try {
      const summaryResult = await getConversationSummary({
        sceneName: scene.name,
        role: scene.role,
        history: messages,
      });

      setSummary(summaryResult.content || '对话总结生成中...');
      setShowSummary(true);

      // 保存记录
      addConversationRecord(sceneId, scene.name, summaryResult.content, messages);
      completeLevel(sceneId, 4); // AI实战闯关完成
    } catch (err) {
      console.error('获取总结失败:', err);
      setSummary('对话完成！继续加油练习吧！');
      setShowSummary(true);
    }
    setIsLoading(false);
  };

  // 录音功能
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // 这里可以调用语音识别API
        // 简化版：直接用语音输入，实际项目中这里会调用STT API
        setIsRecording(false);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // 最长10秒
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);

    } catch (err) {
      console.error('无法访问麦克风:', err);
      alert('无法访问麦克风，请在设置中允许麦克风权限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  if (!scene) {
    return (
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="text-4xl mb-4">😕</div>
        <div className="text-gray-500">场景未找到</div>
        <Link to="/chat/select" className="text-indigo-600 text-sm mt-4 inline-block">返回选择场景</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* 顶部栏 */}
      <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
        <Link to="/chat/select" className="text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <span className="text-lg mr-2">{scene.icon}</span>
            <span className="text-sm font-bold text-gray-900">{scene.name}</span>
          </div>
          <div className="text-xs text-gray-400">{scene.role}</div>
        </div>
        <button
          onClick={endConversation}
          disabled={isEnded}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
            isEnded
              ? 'text-gray-300'
              : 'text-red-500 bg-red-50 active:bg-red-100'
          }`}
        >
          {isEnded ? '已结束' : '结束'}
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-sm">正在连接AI教练...</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {/* AI角色标识 */}
              {msg.role === 'assistant' && i === 0 && (
                <div className="text-xs text-indigo-500 mb-1 font-medium">
                  {scene.role}
                </div>
              )}
              <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      {!isEnded && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            {/* 录音按钮 */}
            <button
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-200'
                  : 'bg-gray-100 active:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              </svg>
            </button>

            {/* 文本输入 */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder={isRecording ? '录音中...' : '输入英语或中文...'}
              disabled={isRecording}
              className="flex-1 h-11 bg-gray-50 rounded-xl px-4 text-sm outline-none focus:bg-gray-100 transition-colors"
            />

            {/* 发送按钮 */}
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                inputText.trim() && !isLoading
                  ? 'bg-indigo-600 active:scale-95'
                  : 'bg-gray-100'
              }`}
            >
              <svg className={`w-5 h-5 ${inputText.trim() && !isLoading ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">长按麦克风按钮录音，或直接输入文字</span>
          </div>
        </div>
      )}

      {/* 对话总结弹窗 */}
      {showSummary && summary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto px-6 py-6 animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">📝</div>
              <h2 className="text-xl font-bold text-gray-900">对话总结</h2>
            </div>

            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl mb-6">
              {summary}
            </div>

            <button
              onClick={() => navigate(`/levels/${sceneId}`)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform"
            >
              返回场景
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

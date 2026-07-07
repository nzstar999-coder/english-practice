import { useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import scenesData from '../data/scenes'
import RecordButton from '../components/RecordButton'
import ScoreDisplay from '../components/ScoreDisplay'
import { recognizeSpeech, scorePronunciation, speakTextWithBrowser } from '../services/api'
import { addScoreRecord, completeLevel, getStoredRecords } from '../hooks/useStorage'

export default function Shadowing() {
  const { sceneId, levelIndex: levelIndexParam } = useParams();
  const navigate = useNavigate();
  const scene = scenesData.find(s => s.id === sceneId);
  const levelIndex = levelIndexParam ? parseInt(levelIndexParam) : 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [userText, setUserText] = useState('');
  const [scoreResult, setScoreResult] = useState(null);
  const [showScore, setShowScore] = useState(false);

  // 过滤出当前场景的句子
  const sentences = scene?.sentences || [];
  const currentSentence = sentences[currentIndex];

  // 播放标准发音
  const playStandardAudio = useCallback(async () => {
    if (!currentSentence) return;
    setIsPlaying(true);
    try {
      await speakTextWithBrowser(currentSentence.en);
    } catch (err) {
      console.error('播放失败:', err);
    }
    setIsPlaying(false);
  }, [currentSentence]);

  // 处理录音完成
  const handleRecordingStop = useCallback(async (audioBlob) => {
    if (!currentSentence) return;

    setIsRecognizing(true);
    setUserText('');

    try {
      // 语音识别
      const result = await recognizeSpeech(audioBlob);
      const recognizedText = result.text || '';
      setUserText(recognizedText);

      // AI评分
      const scoreData = await scorePronunciation({
        originalText: currentSentence.en,
        chineseMeaning: currentSentence.zh,
        userSpeechText: recognizedText,
        sceneName: scene.name,
      });

      // 解析评分结果
      let parsed;
      try {
        parsed = typeof scoreData.content === 'string'
          ? JSON.parse(scoreData.content)
          : scoreData.content || scoreData;
      } catch {
        parsed = {
          score: 70,
          problems: ['系统评分异常，请重试'],
          betterExpression: currentSentence.en,
          suggestion: '请再试一次',
          needRetry: true,
        };
      }

      setScoreResult(parsed);
      setShowScore(true);

      // 保存记录
      addScoreRecord(
        sceneId,
        scene.name,
        { en: currentSentence.en, zh: currentSentence.zh },
        parsed.score || 0,
        recognizedText,
        parsed.problems || []
      );

      // 如果得分超过70，标记关卡完成
      if (parsed.score >= 70) {
        completeLevel(sceneId, levelIndex);
      }
    } catch (err) {
      console.error('评分失败:', err);
      alert('评分服务暂时不可用，请稍后重试');
    }
    setIsRecognizing(false);
  }, [currentSentence, scene, sceneId, levelIndex]);

  const handleNext = () => {
    setShowScore(false);
    setScoreResult(null);
    setUserText('');
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // 完成所有句子
      navigate(`/levels/${sceneId}`);
    }
  };

  const handleRetry = () => {
    setShowScore(false);
    setScoreResult(null);
    setUserText('');
  };

  if (!scene || sentences.length === 0) {
    return (
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="text-4xl mb-4">😕</div>
        <div className="text-gray-500">场景未找到</div>
        <Link to="/levels" className="text-indigo-600 text-sm mt-4 inline-block">返回场景列表</Link>
      </div>
    );
  }

  const isLearningMode = levelIndex === 0; // 关卡0是学习模式
  const isListeningMode = levelIndex === 2; // 关卡2是听力理解

  return (
    <div className="px-5 pt-8 pb-4">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <Link to={`/levels/${sceneId}`} className="text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {isLearningMode ? '常用句学习' : isListeningMode ? '听力理解' : '跟读练习'}
          </div>
          <div className="text-xs text-gray-400">
            {currentIndex + 1} / {sentences.length}
          </div>
        </div>
        <div className="w-6" />
      </div>

      {/* 进度条 */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
        />
      </div>

      {/* 场景信息 */}
      <div className="text-center mb-2">
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">
          {scene.icon} {scene.name}
        </span>
      </div>

      {/* 句子卡片 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 min-h-[180px] flex flex-col items-center justify-center">
        {/* 难度标签 */}
        <div className="self-start mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            currentSentence.difficulty === 1 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {currentSentence.difficulty === 1 ? '简单' : '中等'}
          </span>
          {currentSentence.key && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 ml-1">重点句</span>
          )}
        </div>

        {/* 英文句子 */}
        <div className="text-2xl font-bold text-gray-900 text-center leading-relaxed mb-4">
          {currentSentence.en}
        </div>

        {/* 中文意思 */}
        <div className="text-base text-gray-500 text-center mb-4">
          {currentSentence.zh}
        </div>

        {/* 使用场景 */}
        <div className="text-xs text-gray-400">
          场景：{currentSentence.scenario}
        </div>
      </div>

      {/* 操作区 */}
      <div className="flex flex-col items-center space-y-6">
        {/* 播放按钮 */}
        <button
          onClick={playStandardAudio}
          disabled={isPlaying}
          className={`flex items-center px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 ${
            isPlaying
              ? 'bg-indigo-100 text-indigo-400'
              : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isPlaying ? '播放中...' : '播放标准发音'}
        </button>

        {/* 学习模式：只显示学习内容 */}
        {isLearningMode ? (
          <div className="flex gap-3 w-full">
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(i => i - 1)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-base active:scale-95 transition-transform"
              >
                上一句
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
            >
              {currentIndex < sentences.length - 1 ? '下一句' : '完成学习'}
            </button>
          </div>
        ) : (
          <>
            {/* 录音按钮 */}
            <RecordButton
              onStop={handleRecordingStop}
              disabled={isRecognizing}
            />

            {/* 识别中 */}
            {isRecognizing && (
              <div className="flex items-center text-indigo-600 text-sm">
                <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI正在评分...
              </div>
            )}

            {/* 跳过按钮 */}
            <button
              onClick={handleNext}
              className="text-sm text-gray-400 py-2"
            >
              跳过 →
            </button>
          </>
        )}
      </div>

      {/* 评分弹窗 */}
      {showScore && scoreResult && (
        <ScoreDisplay
          result={scoreResult}
          originalText={currentSentence.en}
          chineseMeaning={currentSentence.zh}
          userText={userText}
          onRetry={handleRetry}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

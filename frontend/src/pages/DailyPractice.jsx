import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import scenesData from '../data/scenes'
import { useErrorSentences, useTimer, recordDailySession } from '../hooks/useStorage'

const PHASES = [
  { key: 'review', title: '复习昨日错句', minutes: 3, icon: '📝' },
  { key: 'learn', title: '新场景学习', minutes: 5, icon: '📖' },
  { key: 'shadowing', title: '跟读训练', minutes: 5, icon: '🎤' },
  { key: 'chat', title: 'AI场景对话', minutes: 7, icon: '🤖' },
];

export default function DailyPractice() {
  const navigate = useNavigate();
  const errorSentences = useErrorSentences();
  const timer = useTimer();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseStatus, setPhaseStatus] = useState('ready'); // ready | active | done
  const [selectedScene, setSelectedScene] = useState(null);

  // 随机选择一个场景用于今日学习
  useEffect(() => {
    const randomScene = scenesData[Math.floor(Math.random() * scenesData.length)];
    setSelectedScene(randomScene);
  }, []);

  const phase = PHASES[currentPhase];
  const phaseTimeMin = Math.floor(timer.seconds / 60);
  const phaseTimeSec = timer.seconds % 60;
  const isPhaseDone = phaseTimeMin >= phase.minutes;

  // 自动进入下一阶段
  useEffect(() => {
    if (phaseStatus === 'active' && isPhaseDone) {
      setPhaseStatus('done');
      timer.pause();
      if (currentPhase < PHASES.length - 1) {
        setCurrentPhase(p => p + 1);
        setPhaseStatus('ready');
        timer.reset();
      }
    }
  }, [isPhaseDone, phaseStatus, currentPhase]);

  const startPhase = () => {
    setPhaseStatus('active');
    timer.start();
  };

  const skipPhase = () => {
    timer.pause();
    timer.reset();
    setPhaseStatus('done');
    if (currentPhase < PHASES.length - 1) {
      setCurrentPhase(p => p + 1);
      setPhaseStatus('ready');
    }
  };

  const completeAll = () => {
    recordDailySession(Math.ceil(timer.seconds / 60) + currentPhase * 5, 'daily20');
    navigate('/');
  };

  const allDone = currentPhase >= PHASES.length - 1 && phaseStatus === 'done';

  const goToShadowing = () => {
    navigate(`/shadowing/${selectedScene?.id || 'airport'}`);
  };

  const goToChat = () => {
    navigate(`/chat/${selectedScene?.id || 'airport'}`);
  };

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">今日20分钟训练</h1>

      {/* 进度概览 */}
      <div className="flex gap-1 mb-8 mt-4">
        {PHASES.map((p, i) => (
          <div
            key={p.key}
            className={`flex-1 h-2 rounded-full ${
              i < currentPhase || (i === currentPhase && phaseStatus === 'done')
                ? 'bg-indigo-500'
                : i === currentPhase
                ? 'bg-indigo-300 animate-pulse'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* 当前阶段 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{phase.icon}</span>
            <div>
              <div className="text-sm text-gray-400">阶段 {currentPhase + 1}/{PHASES.length}</div>
              <div className="text-lg font-bold text-gray-900">{phase.title}</div>
              <div className="text-xs text-gray-500">目标 {phase.minutes} 分钟</div>
            </div>
          </div>
          {phaseStatus === 'active' && (
            <div className="text-2xl font-mono font-bold text-indigo-600">
              {String(phaseTimeMin).padStart(2, '0')}:{String(phaseTimeSec).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* 阶段内容 */}
        {phase.key === 'review' && (
          <div>
            {errorSentences.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-sm text-gray-500">没有需要复习的错句，太棒了！</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {errorSentences.slice(0, 5).map((err, i) => (
                  <div key={i} className="bg-orange-50 p-3 rounded-xl">
                    <div className="text-sm font-medium text-gray-800">{err.sentence?.en || '—'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {err.sentence?.zh} · 得分: <span className="text-orange-500 font-bold">{err.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase.key === 'learn' && (
          <div>
            {selectedScene && (
              <div>
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{selectedScene.icon}</span>
                  <span className="text-base font-bold text-gray-800">{selectedScene.name}</span>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  今天学习这个场景的核心句子，先听再跟读
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedScene.sentences.filter(s => s.key).slice(0, 8).map((s, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-sm font-medium text-gray-800">{s.en}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.zh}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase.key === 'shadowing' && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎤</div>
            <div className="text-sm text-gray-600 mb-1">跟读训练</div>
            <div className="text-xs text-gray-400">大声跟读，系统会给你的发音打分</div>
          </div>
        )}

        {phase.key === 'chat' && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🤖</div>
            <div className="text-sm text-gray-600 mb-1">AI场景对话</div>
            <div className="text-xs text-gray-400">和AI扮演的外国人进行真实对话练习</div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-3">
          {phaseStatus === 'ready' && (
            <>
              <button
                onClick={startPhase}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
              >
                开始
              </button>
              <button
                onClick={skipPhase}
                className="px-6 py-3 text-gray-400 text-sm"
              >
                跳过
              </button>
            </>
          )}

          {phaseStatus === 'active' && !isPhaseDone && (
            <>
              {phase.key === 'shadowing' && (
                <button
                  onClick={goToShadowing}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
                >
                  开始跟读
                </button>
              )}
              {phase.key === 'chat' && (
                <button
                  onClick={goToChat}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
                >
                  开始对话
                </button>
              )}
              {(phase.key === 'review' || phase.key === 'learn') && (
                <div className="flex-1 text-center py-3 text-gray-400 text-sm">
                  正在进行中... {String(phaseTimeMin).padStart(2, '0')}:{String(phaseTimeSec).padStart(2, '0')}
                </div>
              )}
              <button
                onClick={skipPhase}
                className="px-4 py-3 text-gray-400 text-sm"
              >
                跳过
              </button>
            </>
          )}

          {phaseStatus === 'done' && !allDone && (
            <button
              onClick={() => {
                setCurrentPhase(p => p + 1);
                setPhaseStatus('ready');
                timer.reset();
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-base active:scale-95 transition-transform"
            >
              进入下一阶段 →
            </button>
          )}
        </div>
      </div>

      {/* 完成按钮 */}
      {allDone && (
        <button
          onClick={completeAll}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-indigo-200"
        >
          🎉 完成今日训练！
        </button>
      )}
    </div>
  );
}

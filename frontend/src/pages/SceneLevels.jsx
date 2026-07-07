import { Link } from 'react-router-dom'
import scenesData from '../data/scenes'
import { getStoredRecords } from '../hooks/useStorage'

const levelNames = ['常用句学习', '跟读练习', '听力理解', '模拟对话', 'AI实战闯关'];
const levelIcons = ['📖', '🎤', '👂', '💬', '⚔️'];

export default function SceneLevels() {
  const records = getStoredRecords();
  const completedLevels = records.completedLevels || [];

  const totalCompleted = completedLevels.length;
  const totalLevels = scenesData.length * 5;

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">场景闯关</h1>
      <p className="text-sm text-gray-500 mb-2">
        已通关 {totalCompleted}/{totalLevels} 关
      </p>

      {/* 总进度条 */}
      <div className="w-full h-3 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(totalCompleted / totalLevels) * 100}%` }}
        />
      </div>

      {/* 场景列表 */}
      <div className="space-y-4">
        {scenesData.map((scene) => {
          const sceneCompleted = [0, 1, 2, 3, 4].filter(i =>
            completedLevels.includes(`${scene.id}-${i}`)
          ).length;

          return (
            <Link
              key={scene.id}
              to={`/levels/${scene.id}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{scene.icon}</span>
                  <div>
                    <div className="text-base font-bold text-gray-900">{scene.name}</div>
                    <div className="text-xs text-gray-400">{scene.nameEn}</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 关卡进度 */}
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(i => {
                  const isDone = completedLevels.includes(`${scene.id}-${i}`);
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        isDone ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {sceneCompleted}/5 关完成
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

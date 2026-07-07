import { useParams, useNavigate, Link } from 'react-router-dom'
import scenesData from '../data/scenes'
import { getStoredRecords } from '../hooks/useStorage'

const levelNames = ['常用句学习', '跟读练习', '听力理解', '模拟对话', 'AI实战闯关'];
const levelIcons = ['📖', '🎤', '👂', '💬', '⚔️'];
const levelDescs = [
  '学习本场景的常用英语句子',
  '跟读句子，系统为你的发音打分',
  '听英语句子，选择正确的中文意思',
  '和AI进行模拟场景对话',
  '综合实战，AI扮演外国人自由对话',
];

export default function LevelDetail() {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const scene = scenesData.find(s => s.id === sceneId);
  const records = getStoredRecords();
  const completedLevels = records.completedLevels || [];

  if (!scene) {
    return (
      <div className="px-5 pt-8 pb-4 text-center">
        <div className="text-4xl mb-4">😕</div>
        <div className="text-gray-500">场景未找到</div>
        <Link to="/levels" className="text-indigo-600 text-sm mt-4 inline-block">返回场景列表</Link>
      </div>
    );
  }

  const handleLevelClick = (levelIndex) => {
    switch (levelIndex) {
      case 0: // 常用句学习
        navigate(`/shadowing/${sceneId}/0`);
        break;
      case 1: // 跟读练习
        navigate(`/shadowing/${sceneId}/1`);
        break;
      case 2: // 听力理解
        navigate(`/shadowing/${sceneId}/2`);
        break;
      case 3: // 模拟对话
      case 4: // AI实战闯关
        navigate(`/chat/${sceneId}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="px-5 pt-8 pb-4">
      {/* 返回 */}
      <Link to="/levels" className="inline-flex items-center text-gray-400 mb-4">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">返回</span>
      </Link>

      {/* 场景标题 */}
      <div className="flex items-center mb-6">
        <span className="text-4xl mr-3">{scene.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{scene.name}</h1>
          <p className="text-sm text-gray-500">{scene.nameEn} · {scene.sentences.length}个核心句</p>
        </div>
      </div>

      {/* 关卡列表 */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => {
          const isDone = completedLevels.includes(`${sceneId}-${i}`);
          const isUnlocked = i === 0 || completedLevels.includes(`${sceneId}-${i - 1}`);

          return (
            <button
              key={i}
              onClick={() => isUnlocked && handleLevelClick(i)}
              disabled={!isUnlocked}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-green-50 border-green-200'
                  : isUnlocked
                  ? 'bg-white border-gray-200 active:scale-[0.98]'
                  : 'bg-gray-50 border-gray-100 opacity-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isDone ? 'bg-green-100' : isUnlocked ? 'bg-indigo-50' : 'bg-gray-100'
                }`}>
                  {isDone ? '✅' : levelIcons[i]}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <span className="text-base font-bold text-gray-900">
                      第{i + 1}关：{levelNames[i]}
                    </span>
                    {isDone && <span className="ml-2 text-xs text-green-600">已完成</span>}
                    {!isUnlocked && <span className="ml-2 text-xs text-gray-400">🔒 需先完成上一关</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{levelDescs[i]}</div>
                </div>
                {isUnlocked && (
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

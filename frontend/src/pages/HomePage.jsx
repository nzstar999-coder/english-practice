import { Link } from 'react-router-dom'
import { useLearningStats } from '../hooks/useStorage'

export default function HomePage() {
  const stats = useLearningStats();

  const entries = [
    {
      title: '今日20分钟',
      desc: '每天20分钟，系统安排学习计划',
      icon: '🎯',
      path: '/daily',
      color: 'bg-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: '场景闯关',
      desc: '5个场景 × 5个关卡 = 25关',
      icon: '🏆',
      path: '/levels',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'AI对话',
      desc: '和AI扮演的外国人自由对话',
      icon: '🤖',
      path: '/chat/select',
      color: 'bg-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: '学习记录',
      desc: '查看练习历史和进步轨迹',
      icon: '📊',
      path: '/records',
      color: 'bg-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="px-5 pt-8 pb-4">
      {/* 顶部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">英语口语陪练</h1>
        <p className="text-sm text-gray-500 mt-1">场景式口语训练 · 敢说就能行</p>
      </div>

      {/* 学习统计卡片 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 mb-8 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm opacity-80">今日学习</span>
          <span className="text-lg font-bold">{stats.todayMinutes} 分钟</span>
        </div>
        <div className="flex justify-between text-center">
          <div>
            <div className="text-2xl font-bold">{stats.streakDays}</div>
            <div className="text-xs opacity-80">连续天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.averageScore}</div>
            <div className="text-xs opacity-80">平均分</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.completedLevels}/{stats.totalLevels}</div>
            <div className="text-xs opacity-80">已通关卡</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <div className="text-xs opacity-80">对话次数</div>
          </div>
        </div>
      </div>

      {/* 四个主入口 */}
      <div className="grid grid-cols-2 gap-4">
        {entries.map((entry) => (
          <Link
            key={entry.path}
            to={entry.path}
            className={`${entry.bgColor} rounded-2xl p-5 active:scale-95 transition-transform`}
          >
            <div className={`w-12 h-12 ${entry.color} rounded-2xl flex items-center justify-center text-2xl mb-3`}>
              {entry.icon}
            </div>
            <div className="text-base font-bold text-gray-900">{entry.title}</div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.desc}</div>
          </Link>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
        <div className="flex items-start">
          <span className="text-lg mr-2">💡</span>
          <div>
            <div className="text-sm font-medium text-blue-800">小提示</div>
            <div className="text-xs text-blue-600 mt-1">
              每天坚持20分钟，先跟读再对话，慢慢就能开口说英语啦！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

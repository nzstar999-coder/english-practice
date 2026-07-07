import { useLearningStats, getStoredRecords } from '../hooks/useStorage'

export default function LearningRecords() {
  const stats = useLearningStats();
  const records = getStoredRecords();

  const recentScores = (records.scores || []).slice(-20).reverse();
  const recentConversations = (records.conversations || []).slice(-10).reverse();

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">学习记录</h1>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-indigo-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-indigo-600">{stats.totalScores}</div>
          <div className="text-xs text-indigo-400 mt-1">跟读练习次数</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-emerald-600">{stats.averageScore}</div>
          <div className="text-xs text-emerald-400 mt-1">平均得分</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-amber-600">{stats.totalConversations}</div>
          <div className="text-xs text-amber-400 mt-1">AI对话次数</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-purple-600">{stats.streakDays}</div>
          <div className="text-xs text-purple-400 mt-1">连续学习天数</div>
        </div>
      </div>

      {/* 关卡进度 */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">闯关进度</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">总进度</span>
            <span className="text-sm font-bold text-indigo-600">
              {stats.completedLevels}/{stats.totalLevels}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${(stats.completedLevels / stats.totalLevels) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 最近跟读评分 */}
      {recentScores.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-3">最近跟读</h2>
          <div className="space-y-2">
            {recentScores.slice(0, 10).map((record) => (
              <div key={record.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${
                  record.score >= 80 ? 'bg-green-100 text-green-600' :
                  record.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-500'
                }`}>
                  {record.score}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {record.sentence?.en || '—'}
                  </div>
                  <div className="text-xs text-gray-400">{record.sceneName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近AI对话 */}
      {recentConversations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-3">最近对话</h2>
          <div className="space-y-2">
            {recentConversations.slice(0, 5).map((record) => (
              <div key={record.id} className="bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{record.sceneName}</span>
                  <span className="text-xs text-gray-400">{record.messageCount}轮对话</span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(record.date).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {recentScores.length === 0 && recentConversations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <div className="text-gray-500">还没有学习记录</div>
          <div className="text-sm text-gray-400 mt-2">开始你的第一次练习吧！</div>
        </div>
      )}
    </div>
  );
}

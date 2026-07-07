// 评分结果显示组件

export default function ScoreDisplay({ result, originalText, chineseMeaning, userText, onRetry, onNext }) {
  if (!result) return null;

  const { score, problems = [], betterExpression, suggestion, needRetry } = result;

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getScoreEmoji = (s) => {
    if (s >= 90) return '🌟';
    if (s >= 80) return '👍';
    if (s >= 60) return '💪';
    return '📚';
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return '非常棒！';
    if (s >= 80) return '不错！';
    if (s >= 60) return '继续加油！';
    return '需要多练习哦！';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto px-6 py-6 animate-slide-up">
        {/* 分数 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">{getScoreEmoji(score)}</div>
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</div>
          <div className={`text-lg mt-1 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
        </div>

        {/* 原句 */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">原句</div>
          <div className="text-base font-medium text-gray-800 bg-gray-50 p-3 rounded-xl">
            {originalText}
          </div>
        </div>

        {/* 中文意思 */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">中文意思</div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
            {chineseMeaning}
          </div>
        </div>

        {/* 用户说出的 */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">你的发音识别结果</div>
          <div className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl">
            {userText || '（未识别到语音）'}
          </div>
        </div>

        {/* 问题 */}
        {problems.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">需要注意</div>
            <div className="space-y-1">
              {problems.map((p, i) => (
                <div key={i} className="text-sm text-orange-600 bg-orange-50 p-2 rounded-lg flex items-start">
                  <span className="mr-2">•</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 更自然表达 */}
        {betterExpression && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">更自然的表达</div>
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-xl">
              {betterExpression}
            </div>
          </div>
        )}

        {/* 建议 */}
        {suggestion && (
          <div className="mb-6">
            <div className="text-xs text-gray-400 mb-1">教练建议</div>
            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-xl">
              {suggestion}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {needRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
            >
              再练一次
            </button>
          )}
          <button
            onClick={onNext}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
          >
            {needRetry ? '跳过' : '下一句'}
          </button>
        </div>
      </div>
    </div>
  );
}

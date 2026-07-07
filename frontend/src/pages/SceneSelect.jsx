import { Link } from 'react-router-dom'
import scenesData from '../data/scenes'

export default function SceneSelect() {
  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI场景对话</h1>
      <p className="text-sm text-gray-500 mb-6">选择一个场景，AI将扮演外国人和你对话</p>

      <div className="space-y-3">
        {scenesData.map(scene => (
          <Link
            key={scene.id}
            to={`/chat/${scene.id}`}
            className="flex items-center p-4 bg-white border border-gray-200 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: scene.color + '15' }}
            >
              {scene.icon}
            </div>
            <div className="ml-4 flex-1">
              <div className="text-base font-bold text-gray-900">{scene.name}</div>
              <div className="text-xs text-gray-400">{scene.role}</div>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

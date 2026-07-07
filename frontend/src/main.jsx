import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import DailyPractice from './pages/DailyPractice.jsx'
import SceneLevels from './pages/SceneLevels.jsx'
import LevelDetail from './pages/LevelDetail.jsx'
import Shadowing from './pages/Shadowing.jsx'
import AiChat from './pages/AiChat.jsx'
import LearningRecords from './pages/LearningRecords.jsx'
import SceneSelect from './pages/SceneSelect.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="daily" element={<DailyPractice />} />
          <Route path="levels" element={<SceneLevels />} />
          <Route path="levels/:sceneId" element={<LevelDetail />} />
          <Route path="shadowing/:sceneId/:levelIndex?" element={<Shadowing />} />
          <Route path="chat/select" element={<SceneSelect />} />
          <Route path="chat/:sceneId" element={<AiChat />} />
          <Route path="records" element={<LearningRecords />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

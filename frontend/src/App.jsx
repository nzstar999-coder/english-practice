import { Outlet } from 'react-router-dom'
import TabBar from './components/TabBar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}

export default App

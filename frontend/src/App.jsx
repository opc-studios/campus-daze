import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import CreateCharacterPage from './components/CreateCharacterPage'
import PlazaPage from './components/PlazaPage'
import ExplorePage from './components/ExplorePage'
import BattlePage from './components/BattlePage'
import CharacterPage from './components/CharacterPage'
import TasksPage from './components/TasksPage'
import RestPage from './components/RestPage'
import RewardsPage from './components/RewardsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create-character" element={<CreateCharacterPage />} />
        <Route path="/plaza" element={<PlazaPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/rest" element={<RestPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
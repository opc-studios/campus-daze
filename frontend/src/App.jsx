import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
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
        <Route path="/" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } />
        <Route path="/create-character" element={
          <ProtectedRoute>
            <CreateCharacterPage />
          </ProtectedRoute>
        } />
        <Route path="/plaza" element={
          <ProtectedRoute>
            <PlazaPage />
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        } />
        <Route path="/battle" element={
          <ProtectedRoute>
            <BattlePage />
          </ProtectedRoute>
        } />
        <Route path="/character" element={
          <ProtectedRoute>
            <CharacterPage />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        } />
        <Route path="/rest" element={
          <ProtectedRoute>
            <RestPage />
          </ProtectedRoute>
        } />
        <Route path="/rewards" element={
          <ProtectedRoute>
            <RewardsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
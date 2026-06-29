import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'

function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    try {
      await authApi.forgotPassword({ username, new_password: newPassword })
      setSuccess('密码重置成功，请返回登录')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || '重置失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-game max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-academic-purple mb-2">🔑 忘记密码</h1>
          <p className="text-gray-500">输入用户名和新密码进行重置</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-center">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请输入新密码"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请再次输入新密码"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-game w-full text-lg"
          >
            重置密码
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500">
            想起密码了？ <Link to="/" className="text-campus-blue font-semibold hover:underline">返回登录</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

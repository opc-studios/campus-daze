import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../redux/slices/authSlice'
import { authApi } from '../services/api'

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    try {
      const response = await authApi.register({ username, email, password })
      dispatch(login({
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      }))
      navigate('/create-character')
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-game max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-academic-purple mb-2">学术喵的奇幻之旅</h1>
          <p className="text-gray-500">创建你的校园账号</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-center">
            {error}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura focus:border-transparent outline-none transition-all"
              placeholder="请输入密码"
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
              placeholder="请再次输入密码"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-game w-full text-lg"
          >
            注册
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500">
            已有账号？ <Link to="/" className="text-campus-blue font-semibold hover:underline">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
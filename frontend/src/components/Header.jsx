import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, setUser } from '../redux/slices/authSlice'
import { authApi } from '../services/api'

function Header({ title, showBack, backUrl = '/plaza' }) {
  const [displayUser, setDisplayUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        setDisplayUser(user)
        setIsLoading(false)
        return
      }

      try {
        const response = await authApi.getMe()
        const userData = response.data
        setDisplayUser(userData)
        dispatch(setUser(userData))
      } catch (err) {
        console.error('Header fetch user failed:', err)
      }
      setIsLoading(false)
    }

    const timer = setTimeout(fetchUser, 100)
    return () => clearTimeout(timer)
  }, [user, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => navigate(backUrl)} className="btn-primary">返回</button>
        )}
        <h1 className="text-xl font-bold text-academic-purple">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-gray-700">
          {isLoading ? '加载中...' : displayUser ? displayUser.username || displayUser.identifier : '用户'}
        </span>
        <button onClick={handleLogout} className="btn-danger px-4 py-2">退出登录</button>
      </div>
    </div>
  )
}

export default Header
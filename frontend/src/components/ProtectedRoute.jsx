import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { logout, setUser } from '../redux/slices/authSlice'
import { authApi } from '../services/api'

function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const dispatch = useDispatch()

  useEffect(() => {
    const validateToken = async () => {
      if (!isAuthenticated) {
        setIsValidating(false)
        return
      }

      try {
        const response = await authApi.getMe()
        dispatch(setUser(response.data))
        setIsValidating(false)
      } catch {
        dispatch(logout())
        setIsValidating(false)
      }
    }

    validateToken()
  }, [isAuthenticated, dispatch])

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-academic-purple text-xl">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
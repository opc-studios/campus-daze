import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

function PublicRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/plaza" replace />
  }

  return children
}

export default PublicRoute
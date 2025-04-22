import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useUserStore from '../../stores/useUserStore'

const UserFetcher = () => {
  const location = useLocation()
  const fetchUsers = useUserStore((state) => state.fetchUsers)
  const users = useUserStore((state) => state.users)

  useEffect(() => {
    const shouldFetchUsers = ['/report', '/dashboard', '/invoices'].includes(location.pathname)
    if (shouldFetchUsers && users.length === 0) {
      fetchUsers()
    }
  }, [location.pathname, users.length, fetchUsers])

  return null
}

export default UserFetcher

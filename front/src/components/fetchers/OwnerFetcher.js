import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useOwnerStore from '../../stores/useOwnerStore'

const OwnerFetcher = () => {
  const location = useLocation()
  const fetchOwners = useOwnerStore((state) => state.fetchOwners)
  const owners = useOwnerStore((state) => state.owners)

  useEffect(() => {
    const paths = ['/owner', '/vehicle', '/report', '/dashboard', '/invoices']
    if (paths.includes(location.pathname)) {
      fetchOwners({}, 'full_name')
    }
  }, [location.pathname, owners.length])

  return null
}

export default OwnerFetcher

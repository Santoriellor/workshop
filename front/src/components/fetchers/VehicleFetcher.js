import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// Zustand stores
import useVehicleStore from '../../stores/useVehicleStore'

const VehicleFetcher = () => {
  const location = useLocation()
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles)
  const vehicles = useVehicleStore((state) => state.vehicles)

  useEffect(() => {
    const paths = ['/vehicle', '/report', '/dashboard', '/invoices']
    if (paths.includes(location.pathname)) {
      fetchVehicles({}, 'brand, model')
    }
  }, [location.pathname, vehicles.length, fetchVehicles])

  return null
}

export default VehicleFetcher

import { useState, useEffect } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import VehicleCard from '../components/vehicles/VehicleCard'
import VehicleModal from '../components/vehicles/VehicleModal'
// Zustand
import useVehicleStore from '../stores/useVehicleStore'
// Contexts
import { useGlobalContext } from '../contexts/GlobalContext'
// Styles
import '../styles/Vehicles.css'

const Vehicle = () => {
  // const { vehicles, loadingVehicles } = useVehicleContext()
  const { vehicles, loading } = useVehicleStore()

  const { setModalState } = useGlobalContext()

  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    vehicle_owner: '',
  })

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      modalComponent: VehicleModal,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page
      itemType="Vehicle"
      filters={{ ...filters, type: 'vehicle' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).vehicles}
      items={vehicles}
      CardComponent={VehicleCard}
      loadingItem={loading}
    />
  )
}

export default Vehicle

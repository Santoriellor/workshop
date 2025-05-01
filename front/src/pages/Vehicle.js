import { useState } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import VehicleCard from '../components/vehicles/VehicleCard'
// Zustand
import useVehicleStore from '../stores/useVehicleStore'
// Styles
import '../styles/Vehicles.css'

const Vehicle = () => {
  const { vehicles, loading } = useVehicleStore()
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    vehicle_owner: '',
  })

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

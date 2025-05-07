import { useState } from 'react'
// Utils
import getFilterOptions from '../utils/filterBarFilterOptions'
// Components
import Page from '../components/Page'
import OwnerCard from '../components/owners/OwnerCard'
// Zustand
import useOwnerStore from '../stores/useOwnerStore'
// Styles
import '../styles/Owner.css'

const Owner = () => {
  const { owners, loading } = useOwnerStore()
  const [filters, setFilters] = useState({
    name: '',
    email: '',
  })

  return (
    <Page
      itemType="Owner"
      filters={{ ...filters, type: 'owner' }}
      setFilters={setFilters}
      filterOptions={getFilterOptions(filters).owners}
      items={owners}
      CardComponent={OwnerCard}
      loadingItem={loading}
    />
  )
}

export default Owner

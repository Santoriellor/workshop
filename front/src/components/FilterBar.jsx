import { useMemo } from 'react'
// Zustand
import useVehicleStore from '../stores/useVehicleStore'
import useOwnerStore from '../stores/useOwnerStore'
import useInventoryStore from '../stores/useInventoryStore'
import useInvoiceStore from '../stores/useInvoiceStore'
import useReportStore from '../stores/useReportStore'
import useUserStore from '../stores/useUserStore'
// Styles
import '../styles/FilterBar.css'
// Utils
import { capitalizeFirstLetter } from '../utils/stringUtils'

const FilterBar = ({ filterOptions, onFilterChange }) => {
  const { owners } = useOwnerStore()
  const { reports } = useReportStore()
  const { vehicles } = useVehicleStore()
  const { inventory } = useInventoryStore()
  const { invoices } = useInvoiceStore()
  const { users } = useUserStore()

  /* ------------ MEMOIZED FILTER AND SORT DATA ----------------- */
  const sortedUniqueUsers = useMemo(() => {
    if (!users?.length || !reports?.length) return []
    return [...new Set(reports.map((r) => r.user))]
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .sort((a, b) => a.username.localeCompare(b.username))
  }, [users, reports])

  const sortedUniqueDates = useMemo(() => {
    return [...new Set(reports.map((r) => r.formatted_created_at))].sort(
      (a, b) => new Date(b) - new Date(a),
    )
  }, [reports])

  const uniqueStatuses = useMemo(() => {
    return new Map(
      reports.filter((r) => r.status !== 'exported').map((r) => [r.status, r.status_display]),
    )
  }, [reports])

  const sortedUniqueBrands = useMemo(
    () => [...new Set(vehicles.map((v) => v.brand))].sort(),
    [vehicles],
  )
  const sortedUniqueModels = useMemo(
    () => [...new Set(vehicles.map((v) => v.model))].sort(),
    [vehicles],
  )
  const sortedUniqueYears = useMemo(
    () => [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a),
    [vehicles],
  )

  const sortedUniqueOwners = useMemo(() => {
    return [...new Set(owners.map((o) => [o.id, o.full_name || 'Unknown']))].sort((a, b) =>
      a[1].localeCompare(b[1]),
    )
  }, [owners])

  const inventoryItems = useMemo(
    () =>
      Array.isArray(inventory)
        ? inventory
        : Array.isArray(inventory?.results)
          ? inventory.results
          : [],
    [inventory],
  )

  const sortedUniquesCategories = useMemo(
    () => [...new Set(inventoryItems.map((i) => i.category))].sort(),
    [inventoryItems],
  )
  const sortedUniqueUpdatedDates = useMemo(
    () =>
      [...new Set(inventoryItems.map((i) => i.formatted_updated_at))].sort(
        (a, b) => new Date(b) - new Date(a),
      ),
    [inventoryItems],
  )

  const sortedUniqueIssuedDates = useMemo(
    () =>
      [...new Set(invoices.map((i) => i.formatted_issued_date))].sort(
        (a, b) => new Date(b) - new Date(a),
      ),
    [invoices],
  )

  /* ------------ MAP OPTION NAME TO DATA ----------------- */
  const optionsMap = {
    owner: sortedUniqueOwners,
    vehicle_owner: sortedUniqueOwners,
    user: sortedUniqueUsers,
    created_at: sortedUniqueDates,
    status: [...uniqueStatuses.entries()],
    brand: sortedUniqueBrands,
    model: sortedUniqueModels,
    year: sortedUniqueYears,
    category: sortedUniquesCategories,
    updated_at: sortedUniqueUpdatedDates,
    formatted_issued_date: sortedUniqueIssuedDates,
  }

  /* ------------ RENDER OPTIONS HELPER ----------------- */
  const renderOptions = (list, getValue = (item) => item, getLabel = (item) => item) => {
    return list.map((item, index) => (
      <option key={getValue(item, index)} value={getValue(item, index)}>
        {getLabel(item, index)}
      </option>
    ))
  }

  return (
    <div className="filter-bar">
      {filterOptions.map((option) => (
        <div
          key={option.name}
          className={option.type === 'checkbox' ? 'filter-group checkbox' : 'filter-group'}
        >
          <label htmlFor={option.name}>{capitalizeFirstLetter(option.label)}</label>

          {option.type === 'select' ? (
            <select
              id={option.name}
              name={option.name}
              value={option.value}
              onChange={(e) => onFilterChange(option.name, e.target.value)}
            >
              <option value="">All {option.label}</option>

              {optionsMap[option.name] &&
                renderOptions(
                  optionsMap[option.name],
                  (item) => (Array.isArray(item) ? item[0] : item.id || item),
                  (item) => (Array.isArray(item) ? item[1] : item.username || item),
                )}
            </select>
          ) : (
            <input
              type={option.type || 'text'}
              id={option.name}
              name={option.name}
              value={option.value}
              checked={option.type === 'checkbox' ? option.value : undefined}
              onChange={(e) =>
                onFilterChange(
                  option.name,
                  option.type === 'checkbox' ? e.target.checked : e.target.value,
                )
              }
              placeholder={option.placeholder || ''}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default FilterBar

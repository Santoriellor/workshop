// Contexts
import { useUserContext } from '../contexts/UserContext'
import { useOwnerContext } from '../contexts/OwnerContext'
import { useReportContext } from '../contexts/ReportContext'
import { useVehicleContext } from '../contexts/VehicleContext'
import { useInventoryContext } from '../contexts/InventoryContext'
import { useInvoiceContext } from '../contexts/InvoiceContext'
// Styles
import '../styles/FilterBar.css'

const FilterBar = ({ filterOptions, onFilterChange }) => {
  const { users } = useUserContext()
  const { owners } = useOwnerContext()
  const { reports } = useReportContext()
  const { vehicles } = useVehicleContext()
  const { inventory } = useInventoryContext()
  const { invoices } = useInvoiceContext()

  /* ------------ REPORT FILTER AND SORT ----------------- */
  // Get unique report dates and sort
  const sortedUniqueDates = [...new Set(reports.map((report) => report.formatted_created_at))].sort(
    (a, b) => new Date(b) - new Date(a),
  )
  // Get unique users who created reports and sort
  const sortedUniqueUsers = [...new Set(reports.map((report) => report.user))]
    .map((userId) => users.find((user) => user.id === userId))
    .filter(Boolean)
    .sort((a, b) => a.username.localeCompare(b.username))
  // Get unique report statuses
  const uniqueStatuses = new Map(
    reports
      .filter((report) => report.status !== 'exported')
      .map((report) => [report.status, report.status_display]),
  )

  /* ------------ VEHICLE FILTER AND SORT ----------------- */
  // Get unique brands, models, and years from the vehicle list and sort
  const sortedUniqueBrands = [...new Set(vehicles.map((vehicle) => vehicle.brand))].sort()
  const sortedUniqueModels = [...new Set(vehicles.map((vehicle) => vehicle.model))].sort()
  const sortedUniqueYears = [...new Set(vehicles.map((vehicle) => vehicle.year))].sort(
    (a, b) => b - a,
  )
  // Get unique vehicle owners from the owners list and sort
  const sortedUniqueOwners = [
    ...new Set(owners.map((owner) => [owner.id, owner.full_name || 'Unknown'])),
  ].sort((a, b) => a[1].localeCompare(b[1]))

  /* ------------ INVENTORY FILTER AND SORT ----------------- */
  const sortedUniquesCategories = [...new Set(inventory.map((item) => item.category))].sort()
  const sortedUniqueUpdatedDates = [
    ...new Set(inventory.map((item) => item.formatted_updated_at)),
  ].sort((a, b) => new Date(b) - new Date(a))

  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /* ------------ INVOICES FILTER AND SORT ----------------- */
  const sortedUniqueIssuedDates = [
    ...new Set(invoices.map((item) => item.formatted_issued_date)),
  ].sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="filter-bar">
      {filterOptions.map((option) => (
        <div
          className={option.type === 'checkbox' ? 'filter-group checkbox' : 'filter-group'}
          key={option.name}
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
              {/* Filter bar select options for the reports page */}
              {option.name === 'owner' &&
                sortedUniqueOwners.map((owner, index) => (
                  <option key={index} value={owner[0]}>
                    {owner[1]}
                  </option>
                ))}
              {option.name === 'created_at' &&
                sortedUniqueDates.map((uniqueDate) => (
                  <option key={uniqueDate} value={uniqueDate}>
                    {uniqueDate}
                  </option>
                ))}
              {option.name === 'user' &&
                sortedUniqueUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              {option.name === 'status' &&
                [...uniqueStatuses.entries()].map(([status, statusDisplay]) => (
                  <option key={status} value={status}>
                    {statusDisplay}
                  </option>
                ))}

              {/* Filter bar select options for the owners page */}
              {/* no select */}
              {/* Filter bar select options for the vehicles page */}
              {option.name === 'brand' &&
                sortedUniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              {option.name === 'model' &&
                sortedUniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              {option.name === 'year' &&
                sortedUniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              {option.name === 'vehicle_owner' &&
                sortedUniqueOwners.map(([ownerId, ownerName]) => (
                  <option key={ownerId} value={ownerId}>
                    {ownerName}
                  </option>
                ))}
              {/* Filter bar select options for the inventory page */}
              {option.name === 'category' &&
                sortedUniquesCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              {option.name === 'updated_at' &&
                sortedUniqueUpdatedDates.map((uniqueDate) => (
                  <option key={uniqueDate} value={uniqueDate}>
                    {uniqueDate}
                  </option>
                ))}
              {/* Filter bar select options for the invoices page */}
              {option.name === 'formatted_issued_date' &&
                sortedUniqueIssuedDates.map((uniqueDate) => (
                  <option key={uniqueDate} value={uniqueDate}>
                    {uniqueDate}
                  </option>
                ))}
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

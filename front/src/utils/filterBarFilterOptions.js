const getFilterOptions = (filters) => ({
  reports: [
    {
      name: 'vehicle',
      label: 'Vehicle',
      value: filters.vehicle,
      placeholder: 'Search for a vehicle',
    },
    {
      name: 'created_at',
      label: 'Date',
      value: filters.created_at,
      type: 'select',
    },
    {
      name: 'owner',
      label: 'Owner',
      value: filters.owner,
      type: 'select',
    },
    {
      name: 'user',
      label: 'Users',
      value: filters.user,
      type: 'select',
    },
    {
      name: 'status',
      label: 'Status',
      value: filters.status,
      type: 'select',
    },
  ],
  owners: [
    {
      name: 'name',
      label: 'Name',
      value: filters.name,
      placeholder: 'Filter by name',
    },
    {
      name: 'email',
      label: 'Email',
      value: filters.email,
      placeholder: 'Filter by email',
    },
  ],
  vehicles: [
    {
      name: 'brand',
      label: 'Brand',
      value: filters.brand,
      type: 'select',
    },
    {
      name: 'model',
      label: 'Model',
      value: filters.model,
      type: 'select',
    },
    {
      name: 'year',
      label: 'Year',
      value: filters.year,
      type: 'select',
    },
    {
      name: 'license_plate',
      label: 'License plate',
      value: filters.license_plate,
      placeholder: 'Filter by License plate',
    },
    {
      name: 'vehicle_owner',
      label: 'Owner',
      value: filters.owner,
      type: 'select',
    },
  ],
  inventory: [
    {
      name: 'part_name',
      label: 'Part name',
      value: filters.part_name,
      placeholder: 'Filter by part name',
    },
    {
      name: 'reference_code',
      label: 'Reference code',
      value: filters.reference_code,
      placeholder: 'Filter by reference code',
    },
    {
      name: 'category',
      label: 'Select category',
      value: filters.category,
      type: 'select',
    },
    {
      name: 'updated_at',
      label: 'update date',
      value: filters.updated_at,
      type: 'select',
    },
    {
      name: 'quantity_in_stock',
      label: 'sort by quantity',
      value: filters.quantity_in_stock,
      type: 'checkbox',
    },
  ],
  task_template: [
    {
      name: 'search',
      label: 'Search in tasks',
      value: filters.search,
      placeholder: 'Enter some text',
    },
  ],
  invoices: [
    {
      name: 'vehicle',
      label: 'Vehicle',
      value: filters.vehicle,
      placeholder: 'Search for a vehicle',
    },
    {
      name: 'formatted_issued_date',
      label: 'Issued date',
      value: filters.formatted_issued_date,
      type: 'select',
    },
  ],
})

export default getFilterOptions

export const getReportFilters = (pathname) => {
  let filters = {}
  let ordering = 'vehicle__brand,vehicle__model'
  let limit = null
  let offset = null

  if (pathname.includes('report')) {
    filters = { status__in: ['pending', 'in_progress', 'completed'] }
  }
  if (pathname.includes('dashboard')) {
    filters = { status__in: ['pending', 'in_progress', 'completed'] }
    ordering = '-created_at'
    limit = 5
  }
  if (pathname.includes('invoices')) {
    filters = { status: 'completed' }
  }

  return { filters, ordering, limit, offset }
}

// Zustand stores
import useReportStore from '../../stores/useReportStore'
// Components
import ReportCard from './ReportCard'
import LoadingScreen from '../LoadingScreen'

const LatestReports = () => {
  const { reports, loading } = useReportStore()

  return (
    <>
      <h3>Latest Reports</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {loading ? (
          <LoadingScreen fullscreen={false} />
        ) : reports.length > 0 ? (
          reports.map((item) => <ReportCard key={item.id} item={item} />)
        ) : (
          <p>No report found.</p>
        )}
      </div>
    </>
  )
}
export default LatestReports

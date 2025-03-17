// Contexts
import { useReportContext } from "../../contexts/ReportContext";
// Components
import ReportCard from "./ReportCard";

const LatestReports = () => {
  const { reports } = useReportContext();

  const fetchLatestReports = (reports) => {
    return reports
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  };
  let latestReports = fetchLatestReports(reports);

  return (
    <>
      <h3>Latest Reports</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {latestReports.length > 0 ? (
          latestReports.map((item) => <ReportCard key={item.id} item={item} />)
        ) : (
          <p>No report found.</p>
        )}
      </div>
    </>
  );
};
export default LatestReports;

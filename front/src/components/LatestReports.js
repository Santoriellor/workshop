import { useNavigate } from "react-router-dom";

// Contexts
import { useReportContext } from "../contexts/ReportContext";
// Components
import ReportCard from "./ReportCard";

const LatestReports = () => {
  const navigate = useNavigate();
  const { reports } = useReportContext();

  const fetchLatestReports = (reports) => {
    return reports
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  };
  let latestReports = fetchLatestReports(reports);

  const handleViewClick = (type, id) => {
    navigate(`/${type}`, { state: { viewItemId: id } });
  };
  const handleEditClick = (item) => {
    console.log("Edit item", item);
  };
  const handleDeleteClick = (item) => {
    console.log("Delete item", item);
  };

  return (
    <>
      <h3>Latest Reports</h3>
      {/* latest reports list with card display */}
      <div className="list">
        {latestReports.length > 0 ? (
          latestReports.map((item) => (
            <ReportCard
              key={item.id}
              item={item}
              handleViewClick={() => handleViewClick("report", item.id)}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          ))
        ) : (
          <p>No report match your filters.</p>
        )}
      </div>
    </>
  );
};
export default LatestReports;

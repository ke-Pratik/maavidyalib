import { useState } from "react";
import { getMonthlyCollection, getCollectionByRange } from "../services/api";
import { toast } from "react-toastify";

function CollectionReport() {
  const now = new Date();
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      let res;
      if (reportType === "monthly") {
        res = await getMonthlyCollection({ month, year });
      } else {
        res = await getCollectionByRange({ startDate, endDate });
      }
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">📊 Fee Collection Report</h2>
      <div className="form-section col-lg-8 mb-4">
        <div className="mb-3">
          <label className="form-label fw-bold">Report Type</label>
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                checked={reportType === "monthly"}
                onChange={() => setReportType("monthly")}
              />
              <label className="form-check-label">Monthly</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                checked={reportType === "range"}
                onChange={() => setReportType("range")}
              />
              <label className="form-check-label">Custom Date Range</label>
            </div>
          </div>
        </div>

        <form onSubmit={handleFetch}>
          {reportType === "monthly" ? (
            <div className="d-flex gap-3 align-items-end">
              <div>
                <label className="form-label fw-bold">Month</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label fw-bold">Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                📊 Generate
              </button>
            </div>
          ) : (
            <div className="d-flex gap-3 align-items-end">
              <div>
                <label className="form-label fw-bold">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label fw-bold">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                📊 Generate
              </button>
            </div>
          )}
        </form>
      </div>

      {data && (
        <div className="result-card">
          <h5 className="fw-bold mb-4">📊 Collection Report — {data.period}</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card text-center p-3">
                <h4>{data.totalStudents}</h4>
                <small>Total Students</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3 border-success">
                <h4 className="text-success">{data.paidCount}</h4>
                <small>Paid</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3 border-warning">
                <h4 className="text-warning">{data.partialCount}</h4>
                <small>Partial</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3 border-danger">
                <h4 className="text-danger">{data.pendingCount}</h4>
                <small>Pending</small>
              </div>
            </div>
          </div>

          <table className="table table-bordered">
            <tbody>
              <tr>
                <td>Total Fee Expected</td>
                <td className="fw-bold">₹{data.totalFeeExpected}</td>
              </tr>
              <tr className="table-success">
                <td>Total Collected</td>
                <td className="fw-bold fs-5">₹{data.totalCollected}</td>
              </tr>
              <tr className="table-danger">
                <td>Total Balance</td>
                <td className="fw-bold">₹{data.totalBalance}</td>
              </tr>
              <tr>
                <td>💵 Cash Collected</td>
                <td className="fw-bold">₹{data.cashCollected}</td>
              </tr>
              <tr>
                <td>💳 Online Collected</td>
                <td className="fw-bold">₹{data.onlineCollected}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CollectionReport;

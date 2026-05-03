import { useState } from "react";
import { getAllFeeStatus } from "../services/api";
import { toast } from "react-toastify";

function AllFeeStatus() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await getAllFeeStatus({ month, year });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    if (s === "PAID") return <span className="badge badge-paid">✅</span>;
    if (s === "PARTIAL") return <span className="badge badge-partial">🔶</span>;
    return <span className="badge badge-pending">⏳</span>;
  };

  return (
    <div>
      <h2 className="page-title">📋 All Students Fee Status</h2>
      <div className="form-section col-lg-6 mb-4">
        <form onSubmit={handleFetch} className="d-flex gap-3 align-items-end">
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            🔍 Fetch
          </button>
        </form>
      </div>

      {data && (
        <div>
          <div className="d-flex gap-3 mb-3">
            <span className="badge badge-paid px-3 py-2">
              Paid: {data.paidCount}
            </span>
            <span className="badge badge-partial px-3 py-2">
              Partial: {data.partialCount}
            </span>
            <span className="badge badge-pending px-3 py-2">
              Pending: {data.pendingCount}
            </span>
            <span className="badge bg-dark px-3 py-2">
              Total: ₹{data.totalFeeExpected} | Collected: ₹
              {data.totalCollected}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-custom table-hover">
              <thead>
                <tr>
                  <th>RegNo</th>
                  <th>Name</th>
                  <th>Slot</th>
                  <th>Fee</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s, i) => (
                  <tr key={i}>
                    <td className="fw-bold">{s.regNo}</td>
                    <td>{s.studentName}</td>
                    <td>{s.timeSlot}</td>
                    <td>₹{s.finalFee}</td>
                    <td>₹{s.paidAmount}</td>
                    <td>₹{s.balanceAmount}</td>
                    <td>{statusBadge(s.paymentStatus)}</td>
                    <td>{s.paymentMode || "-"}</td>
                    <td>{s.receiptNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllFeeStatus;

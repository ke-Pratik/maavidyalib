import { useState } from "react";
import { getStudentFeeStatus } from "../services/api";
import { toast } from "react-toastify";

function StudentFeeStatus() {
  const [regNo, setRegNo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      const res = await getStudentFeeStatus(regNo);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Not found");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    if (s === "PAID") return <span className="badge badge-paid">✅ PAID</span>;
    if (s === "PARTIAL")
      return <span className="badge badge-partial">🔶 PARTIAL</span>;
    return <span className="badge badge-pending">⏳ PENDING</span>;
  };

  return (
    <div>
      <h2 className="page-title">📋 Student Fee History</h2>
      <div className="form-section col-lg-4 mb-4">
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input
            type="number"
            className="form-control"
            placeholder="Enter Reg No"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            🔍
          </button>
        </form>
      </div>

      {data && (
        <div>
          <div className="result-card mb-4">
            <h5 className="fw-bold">
              {data.studentName} (Reg: {data.regNo})
            </h5>
            <p>
              Status: {data.isActive ? "✅ Active" : "❌ Inactive"} | Months:{" "}
              {data.totalMonths}
            </p>
            <p>
              Total: ₹{data.totalFee} | Paid:{" "}
              <span className="text-success">₹{data.totalPaid}</span> | Balance:{" "}
              <span className="text-danger">₹{data.totalBalance}</span>
            </p>
            <p>
              Overall: <strong>{data.overallStatus}</strong>
            </p>
          </div>

          <div className="table-responsive">
            <table className="table table-custom table-hover">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Slot</th>
                  <th>Final Fee</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyRecords.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.feeMonth}/{r.feeYear}
                    </td>
                    <td>
                      {r.inTime} - {r.outTime}
                    </td>
                    <td>₹{r.finalFee}</td>
                    <td>₹{r.paidAmount}</td>
                    <td>₹{r.balanceAmount}</td>
                    <td>{statusBadge(r.paymentStatus)}</td>
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

export default StudentFeeStatus;

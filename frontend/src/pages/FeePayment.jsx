import { useState } from "react";
import { recordPayment, getStudentFeeStatus } from "../services/api";
import { toast } from "react-toastify";

function FeePayment() {
  const now = new Date();
  const [form, setForm] = useState({
    regNo: "",
    feeMonth: now.getMonth() + 1,
    feeYear: now.getFullYear(),
    payAmount: "",
    paymentMode: "CASH",
    remarks: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // For showing student's pending fees
  const [feeData, setFeeData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search student fee records
  const handleSearch = async () => {
    if (!form.regNo) {
      toast.error("Enter Reg No first");
      return;
    }
    setSearchLoading(true);
    setFeeData(null);
    try {
      const res = await getStudentFeeStatus(form.regNo);
      setFeeData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Student not found");
    } finally {
      setSearchLoading(false);
    }
  };

  // Quick fill from pending record
  const handleQuickFill = (record) => {
    setForm({
      ...form,
      regNo: feeData.regNo.toString(),
      feeMonth: record.feeMonth,
      feeYear: record.feeYear,
      payAmount: record.balanceAmount,
    });
  };

  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        regNo: Number(form.regNo),
        feeMonth: Number(form.feeMonth),
        feeYear: Number(form.feeYear),
        payAmount: Number(form.payAmount),
        paymentMode: form.paymentMode,
        remarks: form.remarks || null,
      };
      const res = await recordPayment(payload);
      setResult(res.data);
      toast.success(res.data.message);
      // Refresh fee data
      if (form.regNo) {
        const res2 = await getStudentFeeStatus(form.regNo);
        setFeeData(res2.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
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
      <h2 className="page-title">💳 Record Payment</h2>

      {/* ─── STEP 1: Search Student ──────────────── */}
      <div className="form-section col-lg-8 mb-4">
        <h5 className="fw-bold mb-3">Step 1: Find Student</h5>
        <div className="d-flex gap-2 align-items-end mb-3">
          <div className="flex-grow-1">
            <label className="form-label fw-bold">Reg No *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter Registration Number"
              value={form.regNo}
              onChange={(e) => setForm({ ...form, regNo: e.target.value })}
              required
            />
          </div>
          <button
            type="button"
            className="btn btn-outline-primary px-4"
            onClick={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ? "..." : "🔍 Find Fees"}
          </button>
        </div>

        {/* Show student's fee records */}
        {feeData && (
          <div className="mt-3">
            <div className="alert alert-info py-2">
              <strong>{feeData.studentName}</strong> (Reg: {feeData.regNo}) |
              Total: ₹{feeData.totalFee} | Paid:{" "}
              <span className="text-success">₹{feeData.totalPaid}</span>|
              Balance:{" "}
              <span className="text-danger">₹{feeData.totalBalance}</span>
            </div>

            {feeData.monthlyRecords.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Month</th>
                      <th>Slot</th>
                      <th>Fee</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.monthlyRecords.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.paymentStatus === "PAID"
                            ? "table-success"
                            : r.paymentStatus === "PARTIAL"
                              ? "table-warning"
                              : ""
                        }
                      >
                        <td>
                          {r.feeMonth}/{r.feeYear}
                        </td>
                        <td>
                          {r.inTime} - {r.outTime}
                        </td>
                        <td>₹{r.finalFee}</td>
                        <td>₹{r.paidAmount}</td>
                        <td className="fw-bold">₹{r.balanceAmount}</td>
                        <td>{statusBadge(r.paymentStatus)}</td>
                        <td>
                          {r.paymentStatus !== "PAID" && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleQuickFill(r)}
                            >
                              💰 Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-warning">
                No fee records. Calculate fee first.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── STEP 2: Payment Form ──────────────── */}
      <div className="form-section col-lg-8 mb-4">
        <h5 className="fw-bold mb-3">Step 2: Make Payment</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Reg No *</label>
              <input
                type="number"
                className="form-control"
                value={form.regNo}
                onChange={(e) => setForm({ ...form, regNo: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Month *</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max="12"
                value={form.feeMonth}
                onChange={(e) => setForm({ ...form, feeMonth: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Year *</label>
              <input
                type="number"
                className="form-control"
                value={form.feeYear}
                onChange={(e) => setForm({ ...form, feeYear: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Pay Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={form.payAmount}
                onChange={(e) =>
                  setForm({ ...form, payAmount: e.target.value })
                }
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Payment Mode *</label>
              <select
                className="form-select"
                value={form.paymentMode}
                onChange={(e) =>
                  setForm({ ...form, paymentMode: e.target.value })
                }
              >
                <option value="CASH">💵 Cash</option>
                <option value="ONLINE">💳 Online</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Remarks</label>
              <input
                type="text"
                className="form-control"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
            <div className="col-12">
              <button
                type="submit"
                className="btn btn-success px-4"
                disabled={loading}
              >
                {loading ? "Processing..." : "💰 Record Payment"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── PAYMENT RESULT ──────────────────────── */}
      {result && (
        <div className="result-card success">
          <h5 className="fw-bold">✅ {result.message}</h5>
          <table className="table table-sm mt-3">
            <tbody>
              <tr>
                <td>Receipt No</td>
                <td className="fw-bold text-primary fs-5">
                  {result.receiptNumber}
                </td>
              </tr>
              <tr>
                <td>Student</td>
                <td>
                  {result.studentName} (RegNo: {result.regNo})
                </td>
              </tr>
              <tr>
                <td>Month</td>
                <td>
                  {result.feeMonth}/{result.feeYear}
                </td>
              </tr>
              <tr>
                <td>Final Fee</td>
                <td>₹{result.finalFee}</td>
              </tr>
              <tr>
                <td>Amount Paid Now</td>
                <td className="text-success fw-bold fs-5">
                  ₹{result.amountPaidNow}
                </td>
              </tr>
              <tr>
                <td>Total Paid So Far</td>
                <td>₹{result.totalPaidSoFar}</td>
              </tr>
              <tr>
                <td>Balance Remaining</td>
                <td
                  className={
                    result.balanceRemaining > 0
                      ? "text-danger fw-bold"
                      : "text-success fw-bold"
                  }
                >
                  ₹{result.balanceRemaining}
                </td>
              </tr>
              <tr>
                <td>Status</td>
                <td>
                  <span
                    className={`badge ${result.paymentStatus === "PAID" ? "badge-paid" : "badge-partial"} fs-6`}
                  >
                    {result.paymentStatus === "PAID"
                      ? "✅ FULLY PAID"
                      : "🔶 PARTIAL"}
                  </span>
                </td>
              </tr>
              <tr>
                <td>Mode</td>
                <td>{result.paymentMode}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td>{result.paymentDate}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FeePayment;

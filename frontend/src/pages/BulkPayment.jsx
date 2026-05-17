import { useState } from "react";
import { getAllFeeStatus, bulkPayment } from "../services/api";
import { toast } from "react-toastify";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// ── ENHANCEMENT #5: Bulk Payment Page ────────────────────────────────────────
// Admin selects month/year → loads all PENDING/PARTIAL students →
// edits per-student amounts (pre-filled with balance) → submits one batch
function BulkPayment() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [amounts, setAmounts] = useState({});   // regNo → amount string
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Step 1: Load PENDING + PARTIAL students for the month
  const handleLoadStudents = async (e) => {
    e.preventDefault();
    setLoadingStudents(true);
    setPendingStudents([]);
    setAmounts({});
    setResult(null);
    try {
      const res = await getAllFeeStatus({ month, year });
      const unpaid = res.data.students.filter(
        (s) => s.paymentStatus === "PENDING" || s.paymentStatus === "PARTIAL"
      );
      setPendingStudents(unpaid);
      // Pre-fill each student's amount with their full balance
      const defaultAmounts = {};
      unpaid.forEach((s) => { defaultAmounts[s.regNo] = String(s.balanceAmount ?? ""); });
      setAmounts(defaultAmounts);
      if (unpaid.length === 0) toast.info("No PENDING or PARTIAL students for this month!");
      else toast.success(`Loaded ${unpaid.length} students with pending fees`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Step 2: Submit bulk payment
  const handleSubmit = async () => {
    const payments = pendingStudents
      .filter((s) => amounts[s.regNo] && Number(amounts[s.regNo]) > 0)
      .map((s) => ({ regNo: s.regNo, amount: Number(amounts[s.regNo]) }));

    if (payments.length === 0) {
      toast.error("Enter amount for at least one student");
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await bulkPayment({ feeMonth: month, feeYear: year, paymentMode, payments });
      setResult(res.data);
      toast.success(res.data.message);
      setPendingStudents([]);
      setAmounts({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk payment failed — no changes saved");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelected = Object.values(amounts)
    .filter((v) => v && Number(v) > 0)
    .reduce((sum, v) => sum + Number(v), 0);

  return (
    <div>
      <h2 className="page-title">💰 Bulk Payment</h2>
      <p className="text-muted mb-4">
        Collect fees from multiple students at once. Select month, load pending students,
        adjust amounts if needed, and submit one batch. <strong>If any student fails validation,
        the entire batch is rolled back.</strong>
      </p>

      {/* Step 1: Select month/year */}
      <div className="form-section col-lg-8 mb-4">
        <h5 className="fw-bold mb-3">Step 1: Select Month & Payment Mode</h5>
        <form onSubmit={handleLoadStudents} className="d-flex gap-3 align-items-end flex-wrap">
          <div>
            <label className="form-label fw-bold">Month</label>
            <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label fw-bold">Year</label>
            <input type="number" className="form-control" style={{ width: "100px" }}
              value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <label className="form-label fw-bold">Payment Mode</label>
            <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="CASH">💵 Cash</option>
              <option value="ONLINE">💳 Online</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loadingStudents}>
            {loadingStudents ? "Loading..." : "🔍 Load Pending Students"}
          </button>
        </form>
      </div>

      {/* Step 2: Edit amounts and submit */}
      {pendingStudents.length > 0 && (
        <div className="form-section col-lg-10 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              Step 2: Enter Amounts — {MONTH_NAMES[month - 1]} {year} ({paymentMode})
            </h5>
            <span className="badge bg-success fs-6">
              Total: ₹{totalSelected.toFixed(2)}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Reg No</th><th>Name</th><th>Slot</th>
                  <th>Total Fee</th><th>Paid</th><th>Balance Due</th>
                  <th>Status</th><th style={{ width: "140px" }}>Pay Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map((s) => (
                  <tr key={s.regNo}>
                    <td className="fw-bold">{s.regNo}</td>
                    <td>{s.studentName}</td>
                    <td>{s.timeSlot || "—"}</td>
                    <td>₹{s.finalFee}</td>
                    <td>₹{s.paidAmount}</td>
                    <td className="fw-bold text-danger">₹{s.balanceAmount}</td>
                    <td>
                      <span className={`badge ${s.paymentStatus === "PARTIAL" ? "badge-partial" : "badge-pending"}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number" step="0.01" min="0"
                        className="form-control form-control-sm"
                        value={amounts[s.regNo] ?? ""}
                        onChange={(e) => setAmounts({ ...amounts, [s.regNo]: e.target.value })}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="

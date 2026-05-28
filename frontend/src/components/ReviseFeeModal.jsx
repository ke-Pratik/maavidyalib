import { useState } from "react";
import { reviseFee } from "../services/api";
import { toast } from "react-toastify";

export default function ReviseFeeModal({ feeRecord, onClose, onSaved }) {
  // ── Derive full-month discount from stored prorated value ─────
  const computeFullMonthDiscount = () => {
    if (!feeRecord.discountAmount) return "";
    const total = Number(feeRecord.totalDaysInMonth);
    const applicable = Number(feeRecord.applicableDays);
    const stored = Number(feeRecord.discountAmount);
    if (!total || !applicable || total === applicable) {
      return stored.toFixed(2);
    }
    const fullMonth = (stored * total) / applicable;
    return fullMonth.toFixed(2);
  };

  const [discount, setDiscount]   = useState(computeFullMonthDiscount());
  const [admission, setAdmission] = useState(feeRecord.admissionFee || "");
  const [reason, setReason]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState(null);

  const isMidMonth =
    feeRecord.applicableDays &&
    feeRecord.totalDaysInMonth &&
    Number(feeRecord.applicableDays) !== Number(feeRecord.totalDaysInMonth);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await reviseFee(feeRecord.feeId, {
        newDiscount:     discount  === "" ? null : parseFloat(discount),
        newAdmissionFee: admission === "" ? null : parseFloat(admission),
        reason,
        adminUser: "admin",
      });
      setResult(res.data);
      toast.success("Fee revised successfully");
      onSaved && onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revise fee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                ✏️ Revise Fee — {feeRecord.feeMonth}/{feeRecord.feeYear}
              </h5>
              <button className="btn-close" onClick={onClose} disabled={saving} />
            </div>
            <div className="modal-body">
              {result ? (
                <div>
                  <div className="alert alert-success">
                    <strong>{result.message}</strong>
                  </div>
                  <table className="table table-sm table-bordered">
                    <tbody>
                      <tr><td>Old Final Fee</td><td>Rs.{result.oldFinalFee}</td></tr>
                      <tr><td>New Final Fee</td><td>Rs.{result.newFinalFee}</td></tr>
                      <tr><td>Old Balance</td><td>Rs.{result.oldBalance}</td></tr>
                      <tr><td>New Balance</td><td>Rs.{result.newBalance}</td></tr>
                      <tr>
                        <td>Status</td>
                        <td>{result.oldStatus} → <strong>{result.newStatus}</strong></td>
                      </tr>
                      {result.walletCreditAdded > 0 && (
                        <tr className="table-warning">
                          <td>Wallet Credit</td>
                          <td>Rs.{result.walletCreditAdded}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {result.overpaidNote && (
                    <div className="alert alert-warning small">
                      {result.overpaidNote}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={submit}>
                  {isMidMonth && (
                    <div className="alert alert-info py-2 small mb-3">
                      ℹ️ This is a mid-month joining record ({feeRecord.applicableDays} of{" "}
                      {feeRecord.totalDaysInMonth} days). Discount shown is the
                      <strong> monthly amount</strong> — system will pro-rate automatically.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Monthly Discount (Rs)
                      <span className="text-muted fw-normal small"> — pro-rated automatically</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      disabled={saving}
                    />
                    <small className="text-muted">
                      Current: Rs.{computeFullMonthDiscount() || "0.00"} /month
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Admission Fee (Rs)
                      <span className="text-muted fw-normal small"> — one-time</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      step="0.01"
                      min="0"
                      value={admission}
                      onChange={(e) => setAdmission(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                      : "💾 Revise Fee"}
                  </button>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

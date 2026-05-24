import { useState, useEffect, useCallback } from "react";
import {
  getActiveStudents,
  deactivateStudent,
  getStudentByRegNo,
  editStudent,
} from "../services/api";
import { toast } from "react-toastify";

const PAGE_SIZE = 10;

function ActiveStudents() {
  const [students, setStudents]           = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [loading, setLoading]             = useState(true);

  // ── Deactivate modal ──────────────────────────────────────────────
  const [showDeactivate, setShowDeactivate]     = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateRemarks, setDeactivateRemarks] = useState("");
  const [deactivating, setDeactivating]         = useState(false);

  // ── Edit modal ────────────────────────────────────────────────────
  const [showEdit, setShowEdit]   = useState(false);
  const [editLoading, setEditLoading] = useState(false);   // fetching current data
  const [editSaving, setEditSaving]   = useState(false);   // saving edit
  const [editResult, setEditResult]   = useState(null);    // response after save
  const [editForm, setEditForm] = useState({
    name: "", fatherName: "", aadhaarNo: "", gender: "",
    address: "", mobile: "", remarks: "",
    inTime: "", outTime: "",
  });
  const [editRegNo, setEditRegNo]   = useState(null);
  const [origSlot, setOrigSlot]     = useState({ inTime: "", outTime: "" });

  // ─────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const res = await getActiveStudents({ page: pageNum, size: PAGE_SIZE });
      setStudents(res.data.students);
      setTotalElements(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(page); }, [page, fetchStudents]);

  // ── Deactivate handlers ───────────────────────────────────────────
  const openDeactivate = (s) => {
    setDeactivateTarget(s);
    setDeactivateRemarks("");
    setShowDeactivate(true);
  };
  const closeDeactivate = () => {
    if (deactivating) return;
    setShowDeactivate(false);
    setDeactivateTarget(null);
  };
  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await deactivateStudent({
        regNo: deactivateTarget.regNo,
        remarks: deactivateRemarks.trim() || null,
      });
      toast.success(res.data.message || "Student deactivated");
      closeDeactivate();
      fetchStudents(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  // ── Edit handlers ─────────────────────────────────────────────────
  const openEdit = async (s) => {
    setEditRegNo(s.regNo);
    setEditResult(null);
    setEditLoading(true);
    setShowEdit(true);
    try {
      const res = await getStudentByRegNo(s.regNo);
      const d   = res.data;
      setEditForm({
        name: d.name || "", fatherName: d.fatherName || "",
        aadhaarNo: d.aadhaarNo || "", gender: d.gender || "",
        address: d.address || "", mobile: d.mobile || "",
        remarks: d.remarks || "",
        inTime:  d.inTime  || "",
        outTime: d.outTime || "",
      });
      setOrigSlot({ inTime: d.inTime || "", outTime: d.outTime || "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load student data");
      setShowEdit(false);
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    if (editSaving) return;
    setShowEdit(false);
    setEditResult(null);
    setEditRegNo(null);
  };

  const handleEditChange = (e) => {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const slotWillChange =
    editForm.inTime  !== origSlot.inTime ||
    editForm.outTime !== origSlot.outTime;

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const payload = {
        name:       editForm.name.trim(),
        fatherName: editForm.fatherName.trim() || null,
        aadhaarNo:  editForm.aadhaarNo.trim(),
        gender:     editForm.gender,
        address:    editForm.address.trim(),
        mobile:     editForm.mobile.trim(),
        remarks:    editForm.remarks.trim() || null,
        inTime:     editForm.inTime  || null,
        outTime:    editForm.outTime || null,
      };
      const res = await editStudent(editRegNo, payload);
      setEditResult(res.data);
      toast.success(res.data.message || "Student updated");
      fetchStudents(page);  // refresh table
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Badge helpers ─────────────────────────────────────────────────
  const feeStatusBadge = (status) =>
    status === "PAID" ? (
      <span className="badge bg-success">✅ PAID</span>
    ) : (
      <span className="badge bg-danger">🔴 DUES</span>
    );

  const feeHandlingBadge = (h) => {
    const map = {
      NOT_CHANGED:                   ["secondary", "No change"],
      NO_RECORD:                     ["secondary", "No fee record"],
      RECALCULATED_PENDING:          ["info",    "Recalculated (PENDING)"],
      HYBRID_RECALCULATED_PARTIAL:   ["warning", "Hybrid recalculated"],
      HYBRID_RECALCULATED_OVERPAID:  ["danger",  "Overpaid — marked PAID"],
      PAID_UNTOUCHED:                ["success", "Already PAID — untouched"],
    };
    const [color, label] = map[h] || ["secondary", h];
    return <span className={`badge bg-${color}`}>{label}</span>;
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="page-title">
        👥 Active Students{" "}
        {!loading && (
          <span className="fs-6 fw-normal text-muted">
            ({totalElements} total)
          </span>
        )}
      </h2>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading students...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-custom table-hover align-middle">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>Seat No</th>
                  <th>Time Slot</th>
                  <th>Fee Status</th>
                  <th>Admission</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      <div className="fs-5">📭</div>No active students found
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => (
                    <tr key={s.regNo}>
                      <td className="text-muted">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="fw-bold">{s.regNo}</td>
                      <td>{s.name}</td>
                      <td>
                        <span className={`badge ${s.gender === "Male" ? "bg-primary" : "bg-danger"}`}>
                          {s.gender}
                        </span>
                      </td>
                      <td>{s.mobile}</td>
                      <td>
                        {s.seatNo > 0 ? (
                          <span className="badge bg-info text-dark fw-bold">{s.seatNo}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {s.timeSlot ? (
                          <span className="badge bg-success">{s.timeSlot}</span>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td>{feeStatusBadge(s.feeStatus)}</td>
                      <td>{s.dateOfAdmission}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEdit(s)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openDeactivate(s)}
                          >
                            🔴 Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <span className="text-muted small">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} students
              </span>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page === 0} onClick={() => setPage(0)}>
                  « First
                </button>
                <button className="btn btn-sm btn-outline-primary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  ‹ Prev
                </button>
                <span className="badge bg-secondary px-3 py-2">{page + 1} / {totalPages}</span>
                <button className="btn btn-sm btn-outline-primary" disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next ›
                </button>
                <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                  Last »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          DEACTIVATE MODAL
      ══════════════════════════════════════════ */}
      {showDeactivate && (
        <>
          <div className="modal-backdrop fade show" onClick={closeDeactivate} />
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header border-danger">
                  <h5 className="modal-title text-danger fw-bold">🔴 Deactivate Student</h5>
                  <button type="button" className="btn-close" onClick={closeDeactivate} disabled={deactivating} />
                </div>
                <div className="modal-body">
                  <p className="mb-3">
                    Are you sure you want to deactivate{" "}
                    <strong>{deactivateTarget?.name}</strong>{" "}
                    <span className="text-muted">(Reg No: {deactivateTarget?.regNo})</span>?
                  </p>
                  <div className="alert alert-warning py-2 small mb-3">
                    ⚠️ This will also <strong>cancel all seat bookings</strong> for this student.
                  </div>
                  <div>
                    <label className="form-label fw-semibold">
                      Reason / Remarks <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <textarea
                      className="form-control" rows={3}
                      placeholder="e.g. Left city, completed course..."
                      value={deactivateRemarks}
                      onChange={(e) => setDeactivateRemarks(e.target.value)}
                      disabled={deactivating}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeDeactivate} disabled={deactivating}>Cancel</button>
                  <button className="btn btn-danger" onClick={confirmDeactivate} disabled={deactivating}>
                    {deactivating ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" />Deactivating...</>
                    ) : "🔴 Yes, Deactivate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {showEdit && (
        <>
          <div className="modal-backdrop fade show" onClick={closeEdit} />
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">

                {/* Header */}
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">✏️ Edit Student — Reg No: {editRegNo}</h5>
                  <button type="button" className="btn-close" onClick={closeEdit} disabled={editSaving} />
                </div>

                {/* Body */}
                <div className="modal-body">
                  {editLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status" />
                      <p className="mt-2 text-muted">Loading student data...</p>
                    </div>

                  ) : editResult ? (
                    /* ── Result panel after save ── */
                    <div>
                      <div className={`alert ${editResult.slotChanged ? "alert-warning" : "alert-success"} mb-3`}>
                        <strong>{editResult.message}</strong>
                      </div>

                      {editResult.slotChanged && (
                        <div className="mb-3">
                          <table className="table table-sm table-bordered mb-2">
                            <tbody>
                              <tr>
                                <td className="fw-semibold" style={{ width: "45%" }}>New Time Slot</td>
                                <td><span className="badge bg-success">{editResult.inTime} – {editResult.outTime}</span></td>
                              </tr>
                              <tr>
                                <td className="fw-semibold">Seat Bookings Cancelled</td>
                                <td>{editResult.seatBookingsCancelled}</td>
                              </tr>
                              <tr>
                                <td className="fw-semibold">Current Month Fee</td>
                                <td>{feeHandlingBadge(editResult.currentMonthFeeHandling)}</td>
                              </tr>
                              {editResult.newFinalFee != null && (
                                <tr>
                                  <td className="fw-semibold">New Final Fee</td>
                                  <td>Rs. {editResult.newFinalFee}</td>
                                </tr>
                              )}
                              {editResult.newBalanceAmount != null && (
                                <tr>
                                  <td className="fw-semibold">New Balance</td>
                                  <td>Rs. {editResult.newBalanceAmount}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>

                          {editResult.overpaidWarning && (
                            <div className="alert alert-danger py-2 small">
                              ⚠️ <strong>Overpaid:</strong> {editResult.overpaidWarning}
                            </div>
                          )}

                          {editResult.previousDuesWarning?.length > 0 && (
                            <div className="alert alert-warning py-2 small">
                              <strong>⚠️ Previous unpaid months:</strong>
                              <ul className="mb-0 mt-1">
                                {editResult.previousDuesWarning.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                         {!editResult.assignedSeatNo && (
                          <div className="alert alert-info py-2 small">
                            🪑 Seat bookings were cancelled. Please re-allot a seat for this student.
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                  ) : (
                    /* ── Edit form ── */
                    <form id="editStudentForm" onSubmit={submitEdit}>
                      <div className="row g-3">

                        {/* Name */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                          <input
                            type="text" className="form-control" name="name"
                            value={editForm.name} onChange={handleEditChange}
                            required disabled={editSaving}
                          />
                        </div>

                        {/* Father Name */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Father's Name</label>
                          <input
                            type="text" className="form-control" name="fatherName"
                            value={editForm.fatherName} onChange={handleEditChange}
                            disabled={editSaving}
                          />
                        </div>

                        {/* Aadhaar */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Aadhaar No <span className="text-danger">*</span></label>
                          <input
                            type="text" className="form-control" name="aadhaarNo"
                            value={editForm.aadhaarNo} onChange={handleEditChange}
                            maxLength={12} pattern="\d{12}"
                            title="Must be exactly 12 digits"
                            required disabled={editSaving}
                          />
                        </div>

                        {/* Mobile */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Mobile <span className="text-danger">*</span></label>
                          <input
                            type="text" className="form-control" name="mobile"
                            value={editForm.mobile} onChange={handleEditChange}
                            maxLength={10} pattern="\d{10}"
                            title="Must be exactly 10 digits"
                            required disabled={editSaving}
                          />
                        </div>

                        {/* Gender */}
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Gender <span className="text-danger">*</span></label>
                          <select
                            className="form-select" name="gender"
                            value={editForm.gender} onChange={handleEditChange}
                            required disabled={editSaving}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        {/* Address */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">Address <span className="text-danger">*</span></label>
                          <textarea
                            className="form-control" name="address" rows={2}
                            value={editForm.address} onChange={handleEditChange}
                            required disabled={editSaving}
                          />
                        </div>

                        {/* Remarks */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">Remarks</label>
                          <textarea
                            className="form-control" name="remarks" rows={2}
                            value={editForm.remarks} onChange={handleEditChange}
                            disabled={editSaving}
                          />
                        </div>

                        {/* Slot change — inTime / outTime */}
                        <div className="col-12">
                          <hr className="my-1" />
                          <p className="fw-semibold mb-2 mt-2">
                            🕐 Time Slot{" "}
                            <span className="text-muted fw-normal small">
                              (change only if shifting to a different slot)
                            </span>
                          </p>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">In Time</label>
                          <input
                            type="time" className="form-control" name="inTime"
                            value={editForm.inTime} onChange={handleEditChange}
                            disabled={editSaving}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Out Time</label>
                          <input
                            type="time" className="form-control" name="outTime"
                            value={editForm.outTime} onChange={handleEditChange}
                            disabled={editSaving}
                          />
                        </div>

                        {/* Slot-change warning */}
                        {slotWillChange && (
                          <div className="col-12">
                            <div className="alert alert-warning py-2 small mb-0">
                              ⚠️ <strong>Slot change detected.</strong> This will:
                              <ul className="mb-0 mt-1">
                                <li>Cancel all current seat bookings — re-allot seat afterwards</li>
                                <li>Close the current fee config and create a new one at the new slot's rate</li>
                                <li>Recalculate current-month fee if it has not been paid yet</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                  {editResult ? (
                    <button className="btn btn-primary" onClick={closeEdit}>
                      Close
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-secondary" onClick={closeEdit} disabled={editSaving || editLoading}>
                        Cancel
                      </button>
                      <button
                        type="submit" form="editStudentForm"
                        className="btn btn-primary"
                        disabled={editSaving || editLoading}
                      >
                        {editSaving ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving...</>
                        ) : "💾 Save Changes"}
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ActiveStudents;

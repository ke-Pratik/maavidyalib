import { useState } from "react";
import { previewFee, lockFee, searchStudents } from "../services/api";
import { toast } from "react-toastify";
import axios from "axios";

function FeeCalculate() {
  // Tab: 'enquiry' or 'student'
  const [activeTab, setActiveTab] = useState("enquiry");

  // ═══════════════════════════════════════════
  // ENQUIRY MODE (no RegNo)
  // ═══════════════════════════════════════════
  const [enquiryForm, setEnquiryForm] = useState({
    inTime: "07:00",
    outTime: "12:00",
    joiningDate: "",
    discountAmount: "",
  });
  const [enquiryPreview, setEnquiryPreview] = useState(null);
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  // If enquiry person decides to register, allow lock
  const [enquiryRegNo, setEnquiryRegNo] = useState("");
  const [enquiryRemarks, setEnquiryRemarks] = useState("");
  const [enquiryLocking, setEnquiryLocking] = useState(false);
  const [enquiryLockResult, setEnquiryLockResult] = useState(null);

  // ═══════════════════════════════════════════
  // STUDENT MODE (with RegNo)
  // ═══════════════════════════════════════════
  const [studentForm, setStudentForm] = useState({
    inTime: "",
    outTime: "",
    joiningDate: "",
    discountAmount: "",
  });
  const [studentRegNo, setStudentRegNo] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentPreview, setStudentPreview] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentRemarks, setStudentRemarks] = useState("");
  const [studentLocking, setStudentLocking] = useState(false);
  const [studentLockResult, setStudentLockResult] = useState(null);

  // Search by name
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);

  // ═══════════════════════════════════════════
  // ENQUIRY: Preview
  // ═══════════════════════════════════════════
  const handleEnquiryPreview = async (e) => {
    e.preventDefault();
    setEnquiryLoading(true);
    setEnquiryPreview(null);
    setEnquiryLockResult(null);
    try {
      const payload = {
        inTime: enquiryForm.inTime,
        outTime: enquiryForm.outTime,
        joiningDate: enquiryForm.joiningDate,
        discountAmount: enquiryForm.discountAmount
          ? Number(enquiryForm.discountAmount)
          : null,
      };
      const res = await previewFee(payload);
      setEnquiryPreview(res.data);
      toast.success("Fee calculated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Calculation failed");
    } finally {
      setEnquiryLoading(false);
    }
  };

  // ENQUIRY: Lock (after person registers)
  const handleEnquiryLock = async () => {
    if (!enquiryRegNo) {
      toast.error("Enter Reg No to lock");
      return;
    }
    setEnquiryLocking(true);
    setEnquiryLockResult(null);
    try {
      const payload = {
        regNo: Number(enquiryRegNo),
        inTime: enquiryForm.inTime,
        outTime: enquiryForm.outTime,
        joiningDate: enquiryForm.joiningDate,
        discountAmount: enquiryForm.discountAmount
          ? Number(enquiryForm.discountAmount)
          : null,
        remarks: enquiryRemarks || null,
      };
      const res = await lockFee(payload);
      setEnquiryLockResult(res.data);
      setEnquiryPreview(null);
      toast.success("Fee locked!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lock failed");
    } finally {
      setEnquiryLocking(false);
    }
  };

  // ═══════════════════════════════════════════
  // STUDENT: Search by name
  // ═══════════════════════════════════════════
  const handleNameSearch = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) {
      toast.error("Enter name");
      return;
    }
    setNameSearchLoading(true);
    setSearchResults(null);
    try {
      const res = await searchStudents(searchName);
      setSearchResults(res.data);
      if (res.data.length === 0) toast.info("No students found");
    } catch (err) {
      toast.error(err.response?.data?.message || "Search failed");
    } finally {
      setNameSearchLoading(false);
    }
  };

  // STUDENT: Select from search
  const handleSelectStudent = (student) => {
    setStudentRegNo(student.regNo.toString());
    setStudentInfo(student);
    setStudentForm((prev) => ({
      ...prev,
      inTime: student.inTime || "",
      outTime: student.outTime || "",
    }));
    setSearchResults(null);
    setSearchName("");
    setStudentPreview(null);
    setStudentLockResult(null);

    if (student.inTime && student.outTime) {
      toast.success(
        `Selected: ${student.name} | Time: ${student.inTime} - ${student.outTime}`,
      );
    } else {
      toast.info(
        `Selected: ${student.name} | No preferred time. Enter manually.`,
      );
    }
  };

  // STUDENT: Fetch by RegNo
  const handleFetchByRegNo = async () => {
    if (!studentRegNo) {
      toast.error("Enter Reg No");
      return;
    }
    try {
      const res = await axios.get("http://localhost:8080/api/students/active");
      const student = res.data.find((s) => s.regNo === Number(studentRegNo));
      if (student) {
        setStudentInfo(student);
        setStudentForm((prev) => ({
          ...prev,
          inTime: student.inTime || prev.inTime,
          outTime: student.outTime || prev.outTime,
        }));
        if (student.inTime && student.outTime) {
          toast.success(
            `Found: ${student.name} | Time: ${student.inTime} - ${student.outTime}`,
          );
        } else {
          toast.info(`Found: ${student.name} | No preferred time set.`);
        }
      } else {
        toast.error("Active student not found with RegNo " + studentRegNo);
        setStudentInfo(null);
      }
    } catch {
      toast.error("Failed to fetch student");
    }
  };

  // STUDENT: Preview
  const handleStudentPreview = async (e) => {
    e.preventDefault();
    setStudentLoading(true);
    setStudentPreview(null);
    setStudentLockResult(null);
    try {
      const payload = {
        inTime: studentForm.inTime,
        outTime: studentForm.outTime,
        joiningDate: studentForm.joiningDate,
        discountAmount: studentForm.discountAmount
          ? Number(studentForm.discountAmount)
          : null,
      };
      const res = await previewFee(payload);
      setStudentPreview(res.data);
      toast.success("Fee calculated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Calculation failed");
    } finally {
      setStudentLoading(false);
    }
  };

  // STUDENT: Lock
  const handleStudentLock = async () => {
    if (!studentRegNo) {
      toast.error("No student selected");
      return;
    }
    setStudentLocking(true);
    setStudentLockResult(null);
    try {
      const payload = {
        regNo: Number(studentRegNo),
        inTime: studentForm.inTime,
        outTime: studentForm.outTime,
        joiningDate: studentForm.joiningDate,
        discountAmount: studentForm.discountAmount
          ? Number(studentForm.discountAmount)
          : null,
        remarks: studentRemarks || null,
      };
      const res = await lockFee(payload);
      setStudentLockResult(res.data);
      setStudentPreview(null);
      toast.success("Fee locked!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lock failed");
    } finally {
      setStudentLocking(false);
    }
  };

  // ═══════════════════════════════════════════
  // SHARED: Render fee table
  // ═══════════════════════════════════════════
  const renderFeeTable = (data) => (
    <table className="table table-sm mt-2 mb-0">
      <tbody>
        <tr>
          <td>Slot</td>
          <td className="fw-bold">
            {data.slotName} ({data.timeSlot})
          </td>
        </tr>
        <tr>
          <td>Method</td>
          <td>{data.calculationMethod}</td>
        </tr>
        <tr>
          <td>Joining Date</td>
          <td>{data.joiningDate}</td>
        </tr>
        <tr>
          <td>Month / Year</td>
          <td>
            {data.feeMonth} / {data.feeYear} (auto-extracted ✅)
          </td>
        </tr>
        <tr>
          <td>Monthly Fee</td>
          <td>₹{data.monthlyFee}</td>
        </tr>
        <tr>
          <td>Monthly Discount</td>
          <td className="text-info">₹{data.monthlyDiscount}</td>
        </tr>
        {data.isMidMonthJoining && (
          <>
            <tr className="table-light">
              <td colSpan="2" className="fw-bold text-center">
                ── Pro-ration ({data.applicableDays} of {data.totalDaysInMonth}{" "}
                days) ──
              </td>
            </tr>
            <tr>
              <td>Pro-rated Fee</td>
              <td>₹{data.proratedFee}</td>
            </tr>
            <tr>
              <td>Pro-rated Discount</td>
              <td className="text-info">- ₹{data.proratedDiscount}</td>
            </tr>
          </>
        )}
        {!data.isMidMonthJoining && (
          <>
            <tr>
              <td>Days</td>
              <td>
                {data.applicableDays} / {data.totalDaysInMonth} (Full month)
              </td>
            </tr>
            <tr>
              <td>Discount Applied</td>
              <td className="text-info">- ₹{data.discountAmount}</td>
            </tr>
          </>
        )}
        <tr className="table-success">
          <td className="fw-bold fs-5">This Month Fee</td>
          <td className="fw-bold fs-4 text-success">₹{data.finalFee}</td>
        </tr>
        <tr>
          <td>Formula</td>
          <td className="text-muted small">{data.calculationFormula}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderNextMonthInfo = (data) => (
    <div
      className={`mt-3 p-3 rounded ${data.isMidMonthJoining ? "bg-warning bg-opacity-10 border border-warning" : "bg-success bg-opacity-10 border border-success"}`}
    >
      <h6 className="fw-bold mb-2">
        {data.isMidMonthJoining
          ? "📅 Mid-Month Joining Detected"
          : "📅 Full Month Joining"}
      </h6>
      {data.isMidMonthJoining ? (
        <div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="card border-warning h-100">
                <div className="card-body text-center">
                  <small className="text-muted">THIS MONTH (Pro-rated)</small>
                  <h3 className="text-warning fw-bold mt-1">
                    ₹{data.finalFee}
                  </h3>
                  <small className="d-block">
                    {data.applicableDays} days of {data.totalDaysInMonth}
                  </small>
                  <small className="text-muted">
                    Fee ₹{data.proratedFee} - Disc ₹{data.proratedDiscount}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-primary h-100">
                <div className="card-body text-center">
                  <small className="text-muted">
                    FROM {data.nextMonthLabel.toUpperCase()} ONWARDS
                  </small>
                  <h3 className="text-primary fw-bold mt-1">
                    ₹{data.nextMonthFinalFee}
                  </h3>
                  <small className="d-block">Full month (every month)</small>
                  <small className="text-muted">
                    Fee ₹{data.nextMonthFee} - Disc ₹{data.nextMonthDiscount}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted small mb-0">💡 {data.nextMonthMessage}</p>
        </div>
      ) : (
        <div>
          <div className="row g-3 mb-3">
            <div className="col-md-6 mx-auto">
              <div className="card border-success">
                <div className="card-body text-center">
                  <small className="text-muted">EVERY MONTH</small>
                  <h3 className="text-success fw-bold mt-1">
                    ₹{data.nextMonthFinalFee}
                  </h3>
                  <small className="d-block">
                    Same fee applies every month
                  </small>
                  <small className="text-muted">
                    Fee ₹{data.nextMonthFee} - Disc ₹{data.nextMonthDiscount}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted small mb-0">💡 {data.nextMonthMessage}</p>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div>
      <h2 className="page-title">💰 Fee Calculator</h2>

      {/* ─── TABS ──────────────────────────── */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "enquiry" ? "active fw-bold" : ""}`}
            onClick={() => setActiveTab("enquiry")}
          >
            🆕 New Enquiry <small className="text-muted">(Walk-in)</small>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "student" ? "active fw-bold" : ""}`}
            onClick={() => setActiveTab("student")}
          >
            👤 Existing Student{" "}
            <small className="text-muted">(Registered)</small>
          </button>
        </li>
      </ul>

      {/* ═════════════════════════════════════════════════ */}
      {/* TAB 1: NEW ENQUIRY                               */}
      {/* ═════════════════════════════════════════════════ */}
      {activeTab === "enquiry" && (
        <div>
          <div className="alert alert-light border mb-4">
            <strong>📋 When to use:</strong> A new person walks in and wants to
            know the fee before deciding to take admission. No registration
            needed.
          </div>

          {/* Enquiry Form */}
          <div className="form-section col-lg-8 mb-4">
            <h5 className="fw-bold mb-3">🧮 Quick Fee Preview</h5>
            <form onSubmit={handleEnquiryPreview}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">In Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={enquiryForm.inTime}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, inTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Out Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={enquiryForm.outTime}
                    onChange={(e) =>
                      setEnquiryForm({
                        ...enquiryForm,
                        outTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Expected Joining *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={enquiryForm.joiningDate}
                    onChange={(e) =>
                      setEnquiryForm({
                        ...enquiryForm,
                        joiningDate: e.target.value,
                      })
                    }
                    required
                  />
                  <small className="text-muted">
                    Month & year auto-extracted
                  </small>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Monthly Discount ₹
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={enquiryForm.discountAmount}
                    onChange={(e) =>
                      setEnquiryForm({
                        ...enquiryForm,
                        discountAmount: e.target.value,
                      })
                    }
                  />
                  <small className="text-muted">Auto pro-rated</small>
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={enquiryLoading}
                  >
                    {enquiryLoading ? "Calculating..." : "🧮 Show Fee Preview"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Enquiry Preview */}
          {enquiryPreview && (
            <div
              className="result-card mb-4"
              style={{ borderColor: "#3b82f6", backgroundColor: "#eff6ff" }}
            >
              <h5 className="fw-bold">🧮 Fee Preview</h5>
              <span className="badge bg-info mb-2">
                👁️ PREVIEW ONLY — Show this to the student
              </span>

              {renderFeeTable(enquiryPreview)}
              {renderNextMonthInfo(enquiryPreview)}

              {/* Lock section */}
              <hr className="my-4" />
              <div className="p-3 bg-light rounded border">
                <h5 className="fw-bold mb-1">🔒 Student Agreed? Lock Fee</h5>
                <p className="text-muted small mb-3">
                  If the student decides to join, register them first on the
                  <strong> 📝 Register</strong> page, then enter their RegNo
                  below to lock this fee.
                </p>

                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Reg No *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter after registration"
                      value={enquiryRegNo}
                      onChange={(e) => setEnquiryRegNo(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Remarks</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional"
                      value={enquiryRemarks}
                      onChange={(e) => setEnquiryRemarks(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      type="button"
                      className="btn btn-success px-4 w-100"
                      onClick={handleEnquiryLock}
                      disabled={enquiryLocking}
                    >
                      {enquiryLocking ? "Locking..." : "🔒 Lock Fee & Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enquiry Lock Result */}
          {enquiryLockResult && (
            <div className="result-card success">
              <h5 className="fw-bold">🔒 Fee Locked!</h5>
              <span className="badge bg-success mb-2">
                ✅ Saved to Database
              </span>
              <table className="table table-sm mt-2">
                <tbody>
                  <tr>
                    <td>Fee ID</td>
                    <td className="fw-bold">{enquiryLockResult.feeId}</td>
                  </tr>
                  <tr>
                    <td>Student</td>
                    <td className="fw-bold">
                      {enquiryLockResult.studentName} (RegNo:{" "}
                      {enquiryLockResult.regNo})
                    </td>
                  </tr>
                </tbody>
              </table>
              {renderFeeTable(enquiryLockResult)}
              {renderNextMonthInfo(enquiryLockResult)}
              <div className="mt-3 alert alert-success mb-0">
                ✅ Fee locked. Go to <strong>💳 Payment</strong> page to collect
                money.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════ */}
      {/* TAB 2: EXISTING STUDENT                          */}
      {/* ═════════════════════════════════════════════════ */}
      {activeTab === "student" && (
        <div>
          <div className="alert alert-light border mb-4">
            <strong>📋 When to use:</strong> Student is already registered.
            Search by name or enter RegNo — time will auto-fill from their
            profile.
          </div>

          {/* Search by Name */}
          <div className="form-section col-lg-8 mb-4">
            <h5 className="fw-bold mb-2">🔍 Find Student</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <form onSubmit={handleNameSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary"
                    disabled={nameSearchLoading}
                  >
                    {nameSearchLoading ? "..." : "🔍"}
                  </button>
                </form>
              </div>
              <div className="col-md-6">
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Or enter Reg No"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleFetchByRegNo}
                  >
                    🔍 Fetch
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results Table */}
            {searchResults && searchResults.length > 0 && (
              <div className="table-responsive mb-3">
                <table className="table table-sm table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>RegNo</th>
                      <th>Name</th>
                      <th>Father</th>
                      <th>Mobile</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((s) => (
                      <tr key={s.regNo}>
                        <td className="fw-bold">{s.regNo}</td>
                        <td>{s.name}</td>
                        <td>{s.fatherName || "-"}</td>
                        <td>{s.mobile}</td>
                        <td>
                          {s.inTime && s.outTime ? (
                            `${s.inTime} - ${s.outTime}`
                          ) : (
                            <span className="text-muted">Not set</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSelectStudent(s)}
                          >
                            ✅ Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Student Info Banner */}
            {studentInfo && (
              <div className="alert alert-info py-2">
                👤 <strong>{studentInfo.name}</strong> (Reg: {studentRegNo}) |{" "}
                {studentInfo.gender}|{" "}
                {studentInfo.isActive ? "✅ Active" : "❌ Inactive"}
                {studentInfo.inTime &&
                  studentInfo.outTime &&
                  ` | Time: ${studentInfo.inTime} - ${studentInfo.outTime}`}
              </div>
            )}
          </div>

          {/* Fee Form */}
          <div className="form-section col-lg-8 mb-4">
            <h5 className="fw-bold mb-3">🧮 Calculate Fee</h5>
            <form onSubmit={handleStudentPreview}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">In Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={studentForm.inTime}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, inTime: e.target.value })
                    }
                    required
                  />
                  {studentForm.inTime && (
                    <small className="text-success">
                      ✅ {studentForm.inTime}
                    </small>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Out Time *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={studentForm.outTime}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        outTime: e.target.value,
                      })
                    }
                    required
                  />
                  {studentForm.outTime && (
                    <small className="text-success">
                      ✅ {studentForm.outTime}
                    </small>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Joining Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={studentForm.joiningDate}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        joiningDate: e.target.value,
                      })
                    }
                    required
                  />
                  <small className="text-muted">
                    Month & year auto-extracted
                  </small>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Monthly Discount ₹
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={studentForm.discountAmount}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        discountAmount: e.target.value,
                      })
                    }
                  />
                  <small className="text-muted">Auto pro-rated</small>
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={studentLoading}
                  >
                    {studentLoading
                      ? "Calculating..."
                      : "🧮 Calculate Fee Preview"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Student Preview */}
          {studentPreview && (
            <div
              className="result-card mb-4"
              style={{ borderColor: "#3b82f6", backgroundColor: "#eff6ff" }}
            >
              <h5 className="fw-bold">
                🧮 Fee Preview for {studentInfo?.name || "Student"}
              </h5>
              <span className="badge bg-info mb-2">
                👁️ PREVIEW — Click Lock to save
              </span>

              {renderFeeTable(studentPreview)}
              {renderNextMonthInfo(studentPreview)}

              <hr className="my-4" />
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Reg No</label>
                  <input
                    type="number"
                    className="form-control"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    disabled={!!studentInfo}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Remarks</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional"
                    value={studentRemarks}
                    onChange={(e) => setStudentRemarks(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    className="btn btn-success px-4 w-100"
                    onClick={handleStudentLock}
                    disabled={studentLocking}
                  >
                    {studentLocking ? "Locking..." : "🔒 Lock Fee & Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Lock Result */}
          {studentLockResult && (
            <div className="result-card success">
              <h5 className="fw-bold">🔒 Fee Locked!</h5>
              <span className="badge bg-success mb-2">
                ✅ Saved to Database
              </span>
              <table className="table table-sm mt-2">
                <tbody>
                  <tr>
                    <td>Fee ID</td>
                    <td className="fw-bold">{studentLockResult.feeId}</td>
                  </tr>
                  <tr>
                    <td>Student</td>
                    <td className="fw-bold">
                      {studentLockResult.studentName} (RegNo:{" "}
                      {studentLockResult.regNo})
                    </td>
                  </tr>
                </tbody>
              </table>
              {renderFeeTable(studentLockResult)}
              {renderNextMonthInfo(studentLockResult)}
              <div className="mt-3 alert alert-success mb-0">
                ✅ Fee locked. Go to <strong>💳 Payment</strong> page to collect
                money.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FeeCalculate;

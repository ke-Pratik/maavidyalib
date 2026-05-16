import { useState, useEffect, useCallback } from "react";
import { getActiveStudents, deactivateStudent } from "../services/api";
import { toast } from "react-toastify";

const PAGE_SIZE = 10;

function ActiveStudents() {
  const [students, setStudents]           = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [loading, setLoading]             = useState(true);

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

  useEffect(() => {
    fetchStudents(page);
  }, [page, fetchStudents]);

  const handleDeactivate = async (regNo) => {
    const remarks = prompt("Reason for deactivation (optional):");
    if (remarks === null) return;
    try {
      const res = await deactivateStudent({ regNo, remarks });
      toast.success(res.data.message || "Student deactivated");
      fetchStudents(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const feeStatusBadge = (status) =>
    status === "PAID" ? (
      <span className="badge bg-success">✅ PAID</span>
    ) : (
      <span className="badge bg-danger">🔴 DUES</span>
    );

  return (
    <div>
      <h2 className="page-title">
        👥 Active Students{" "}
        {!loading && (
          <span className="fs-6 fw-normal text-muted">({totalElements} total)</span>
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
                      <div className="fs-5">📭</div>
                      No active students found
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => (
                    <tr key={s.regNo}>
                      <td className="text-muted">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="fw-bold">{s.regNo}</td>
                      <td>{s.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            s.gender === "Male" ? "bg-primary" : "bg-danger"
                          }`}
                        >
                          {s.gender}
                        </span>
                      </td>
                      <td>{s.mobile}</td>
                      <td>
                        {s.seatNo > 0 ? (
                          <span className="badge bg-info text-dark fw-bold">
                            {s.seatNo}
                          </span>
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeactivate(s.regNo)}
                        >
                          🔴 Deactivate
                        </button>
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
                {Math.min((page + 1) * PAGE_SIZE, totalElements)} of{" "}
                {totalElements} students
              </span>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                >
                  « First
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹ Prev
                </button>
                <span className="badge bg-secondary px-3 py-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next ›
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                >
                  Last »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActiveStudents;

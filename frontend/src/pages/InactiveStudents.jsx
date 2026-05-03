import { useState, useEffect } from "react";
import { getInactiveStudents, reactivateStudent } from "../services/api";
import { toast } from "react-toastify";

function InactiveStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await getInactiveStudents();
      setStudents(res.data);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleReactivate = async (regNo) => {
    const remarks = prompt("Remark for reactivation (optional):");
    if (remarks === null) return;
    try {
      const res = await reactivateStudent({ regNo, remarks });
      toast.success(res.data.message || "Student reactivated!");
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );

  return (
    <div>
      <h2 className="page-title">👥 Inactive Students ({students.length})</h2>
      <div className="table-responsive">
        <table className="table table-custom table-hover">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Deactivated</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No inactive students
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.regNo}>
                  <td className="fw-bold">{s.regNo}</td>
                  <td>{s.name}</td>
                  <td>{s.gender}</td>
                  <td>{s.deactivationDate || "-"}</td>
                  <td>{s.remarks || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleReactivate(s.regNo)}
                    >
                      🟢 Reactivate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InactiveStudents;

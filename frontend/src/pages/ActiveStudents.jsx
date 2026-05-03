import { useState, useEffect } from "react";
import { getActiveStudents, deactivateStudent } from "../services/api";
import { toast } from "react-toastify";

function ActiveStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await getActiveStudents();
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

  const handleDeactivate = async (regNo) => {
    const remarks = prompt("Reason for deactivation (optional):");
    if (remarks === null) return;
    try {
      const res = await deactivateStudent({ regNo, remarks });
      toast.success(res.data.message || "Student deactivated");
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
      <h2 className="page-title">👥 Active Students ({students.length})</h2>
      <div className="table-responsive">
        <table className="table table-custom table-hover">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Mobile</th>
              <th>Time Slot</th>
              <th>Admission</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  No active students found
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.regNo}>
                  <td className="fw-bold">{s.regNo}</td>
                  <td>{s.name}</td>
                  <td>
                    <span
                      className={`badge ${s.gender === "Male" ? "bg-primary" : "bg-danger"}`}
                    >
                      {s.gender}
                    </span>
                  </td>
                  <td>{s.mobile}</td>
                  <td>
                    {s.inTime && s.outTime ? (
                      <span className="badge bg-success">
                        {s.inTime} - {s.outTime}
                      </span>
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </td>
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
    </div>
  );
}

export default ActiveStudents;

import { useState } from "react";
import { checkSeat } from "../services/api";
import { toast } from "react-toastify";

function SeatCheck() {
  const [form, setForm] = useState({
    seatNo: "",
    gender: "Male",
    inTime: "07:00",
    outTime: "12:00",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await checkSeat(form);
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error checking seat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">🔍 Check Seat Availability</h2>
      <div className="form-section col-lg-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Seat No (1-65)</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="65"
              value={form.seatNo}
              onChange={(e) => setForm({ ...form, seatNo: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Gender</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="row g-3 mb-3">
            <div className="col">
              <label className="form-label fw-bold">In Time</label>
              <input
                type="time"
                className="form-control"
                value={form.inTime}
                onChange={(e) => setForm({ ...form, inTime: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <label className="form-label fw-bold">Out Time</label>
              <input
                type="time"
                className="form-control"
                value={form.outTime}
                onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Checking..." : "🔍 Check Availability"}
          </button>
        </form>
      </div>

      {result && (
        <div
          className={`result-card mt-4 ${result.available ? "success" : result.status === "GENDER_NOT_ALLOWED" ? "warning" : "error"}`}
        >
          <h5 className="fw-bold">
            {result.available
              ? "✅ SEAT VACANT"
              : result.status === "GENDER_NOT_ALLOWED"
                ? "🚫 GENDER NOT ALLOWED"
                : "❌ SEAT NOT VACANT"}
          </h5>
          <p>
            <strong>Zone:</strong> {result.zone}
          </p>
          <p>
            <strong>Message:</strong> {result.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default SeatCheck;

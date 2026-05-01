import { useState } from "react";
import { getVacantSeats } from "../services/api";
import { toast } from "react-toastify";

function VacantSeats() {
  const [form, setForm] = useState({
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
      const res = await getVacantSeats({
        gender: form.gender,
        inTime: form.inTime,
        outTime: form.outTime,
      });
      setResult(res.data);
      if (res.data.totalVacant === 0) {
        toast.info("No vacant seats found for this slot");
      } else {
        toast.success(`Found ${res.data.totalVacant} vacant seats!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to find vacant seats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">🔍 Find Vacant Seats</h2>

      <div className="form-section col-lg-6 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Gender *</label>
              <select
                className="form-select"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">In Time *</label>
              <input
                type="time"
                className="form-control"
                value={form.inTime}
                onChange={(e) => setForm({ ...form, inTime: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Out Time *</label>
              <input
                type="time"
                className="form-control"
                value={form.outTime}
                onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? "Searching..." : "🔍 Find Seats"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {result && (
        <div>
          <div className="result-card mb-3">
            <h5 className="fw-bold">
              {result.totalVacant > 0
                ? `✅ ${result.totalVacant} Vacant Seats Found`
                : "❌ No Vacant Seats"}
            </h5>
            <p className="text-muted mb-0">
              Gender: <strong>{result.gender}</strong> | Slot:{" "}
              <strong>{result.requestedSlot}</strong>
            </p>
          </div>

          {result.totalVacant > 0 && result.vacantSeats && (
            <div className="d-flex flex-wrap gap-2">
              {result.vacantSeats.map((seat) => (
                <div
                  key={seat.seatNo}
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor:
                      seat.zone === "BOYS_ONLY"
                        ? "#0d6efd"
                        : seat.zone === "GIRLS_ONLY"
                          ? "#e91e8c"
                          : "#198754",
                    color: "white",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  <span>{seat.seatNo}</span>
                  <span style={{ fontSize: 8 }}>{seat.zone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VacantSeats;

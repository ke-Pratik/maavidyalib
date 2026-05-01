import { useState, useEffect } from "react";
import { getSeatStatus } from "../services/api";
import { toast } from "react-toastify";

function SeatStatus() {
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await getSeatStatus();
      setSeatData(res.data);
    } catch (err) {
      toast.error("Failed to load seat status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  const getZoneColor = (zone, status) => {
    if (status === "OCCUPIED") return "#dc3545";
    if (zone === "BOYS_ONLY") return "#0d6efd";
    if (zone === "GIRLS_ONLY") return "#e91e8c";
    return "#198754";
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  if (!seatData)
    return <div className="alert alert-danger">Failed to load seat data</div>;

  return (
    <div>
      <h2 className="page-title">📊 Seat Status Dashboard</h2>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card text-center border-primary">
            <div className="card-body">
              <h6 className="text-muted">Total Seats</h6>
              <h2 className="fw-bold text-primary">{seatData.totalSeats}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-danger">
            <div className="card-body">
              <h6 className="text-muted">Occupied</h6>
              <h2 className="fw-bold text-danger">{seatData.occupiedSeats}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-success">
            <div className="card-body">
              <h6 className="text-muted">Vacant</h6>
              <h2 className="fw-bold text-success">{seatData.vacantSeats}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <span>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              backgroundColor: "#0d6efd",
              borderRadius: 3,
              marginRight: 5,
            }}
          ></span>{" "}
          Boys Zone (1-25)
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              backgroundColor: "#e91e8c",
              borderRadius: 3,
              marginRight: 5,
            }}
          ></span>{" "}
          Girls Zone (26-40)
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              backgroundColor: "#198754",
              borderRadius: 3,
              marginRight: 5,
            }}
          ></span>{" "}
          Common Zone (41-65)
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              backgroundColor: "#dc3545",
              borderRadius: 3,
              marginRight: 5,
            }}
          ></span>{" "}
          Occupied
        </span>
      </div>

      {/* Seat Grid */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {seatData.seats &&
          seatData.seats.map((seat) => (
            <div
              key={seat.seatNo}
              onClick={() => handleSeatClick(seat)}
              style={{
                width: 52,
                height: 52,
                backgroundColor: getZoneColor(seat.zone, seat.status),
                color: "white",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
                opacity: seat.status === "OCCUPIED" ? 1 : 0.7,
                border:
                  selectedSeat && selectedSeat.seatNo === seat.seatNo
                    ? "3px solid #ffc107"
                    : "2px solid transparent",
              }}
            >
              {seat.seatNo}
            </div>
          ))}
      </div>

      {/* Selected Seat Detail */}
      {selectedSeat && (
        <div className="form-section col-lg-6">
          <h5 className="fw-bold mb-3">
            🪑 Seat {selectedSeat.seatNo} — {selectedSeat.zone}
            <span
              className={`badge ms-2 ${selectedSeat.status === "OCCUPIED" ? "bg-danger" : "bg-success"}`}
            >
              {selectedSeat.status}
            </span>
          </h5>

          {selectedSeat.status === "VACANT" ? (
            <p className="text-success fw-bold">
              ✅ This seat is available for booking
            </p>
          ) : (
            <div>
              <p className="text-muted mb-2">Current bookings on this seat:</p>
              <table className="table table-sm table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Booking ID</th>
                    <th>RegNo</th>
                    <th>Student</th>
                    <th>Gender</th>
                    <th>Time Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSeat.bookings &&
                    selectedSeat.bookings.map((b) => (
                      <tr key={b.bookingId}>
                        <td>{b.bookingId}</td>
                        <td className="fw-bold">{b.regNo}</td>
                        <td>{b.studentName}</td>
                        <td>
                          <span
                            className={`badge ${b.gender === "Male" ? "bg-primary" : "bg-danger"}`}
                          >
                            {b.gender}
                          </span>
                        </td>
                        <td>{b.timeSlot}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SeatStatus;

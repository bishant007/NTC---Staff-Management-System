import { useEffect, useState } from "react";
import { getLeaveRequests, updateRequestStatus } from "../../services/authService";

function FieldRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("");
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getLeaveRequests(filter || undefined);
      setRequests(res.data);
    } catch (err) {
      alert("Failed to fetch requests");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateRequestStatus(id, status, remarks[id] || "");
      fetchRequests();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <div
        style={{
          background: "#fff",
          padding: "24px 30px",
          borderRadius: "18px",
          border: "3px solid #cfe0fc",
          boxShadow: "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
        }}
      >
        <h2 style={{ color: "#0b2e6f", fontSize: "28px", marginBottom: "4px" }}>Field Requests</h2>
        <p style={{ color: "#5b7bab", marginBottom: "20px", fontSize: "15px" }}>Review and manage staff leave requests.</p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Filter: </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "2px solid #a9c6f5",
              background: "#f4f8ff",
              fontWeight: "600",
              outline: "none",
            }}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        {loading ? (
          <p>Loading requests...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0b2e6f", color: "#fff" }}>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Staff</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Reason</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Start</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Return</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr key={req.id} style={{ borderBottom: index % 2 === 0 ? "2px solid #edf2f7" : "none", background: index % 2 === 0 ? "#f9fcff" : "transparent" }}>
                    <td style={{ padding: "12px 15px" }}>{req.staff.fullName}</td>
                    <td style={{ padding: "12px 15px" }}>{req.reason}</td>
                    <td style={{ padding: "12px 15px" }}>{new Date(req.leaveStartTime).toLocaleString()}</td>
                    <td style={{ padding: "12px 15px" }}>{new Date(req.returnDateTime).toLocaleString()}</td>
                    <td style={{ padding: "12px 15px", fontWeight: "bold", color: req.status === "PENDING" ? "#ea580c" : req.status === "APPROVED" ? "#16a34a" : req.status === "REJECTED" ? "#dc2626" : "#7c3aed" }}>
                      {req.status}
                    </td>
                    <td style={{ padding: "12px 15px" }}>
                      <input
                        type="text"
                        placeholder="Remarks"
                        value={remarks[req.id] || ""}
                        onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                        style={{
                          padding: "6px 10px",
                          border: "2px solid #a9c6f5",
                          borderRadius: "8px",
                          marginRight: "8px",
                          width: "120px",
                          background: "#f4f8ff",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleStatusChange(req.id, "APPROVED")}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          marginRight: "6px",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, "REJECTED")}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          marginRight: "6px",
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, "ON_HOLD")}
                        style={{
                          background: "#7c3aed",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Hold
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldRequests;
import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://bank-backend-yopd.onrender.com/accounts";

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_holder: "", account_number: "", bank_name: "",
    balance: "", account_type: "savings", phone: "",
    email: "", branch_name: "", ifsc_code: ""
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    const res = await axios.get(API);
    setAccounts(res.data);
  };

  const handleSubmit = async () => {
    if (!form.account_holder || !form.account_number) {
      setMessage("⚠️ Please fill all required fields!");
      return;
    }
    if (editId) {
      await axios.put(`${API}/${editId}`, form);
      setMessage("✅ Account updated successfully!");
      setEditId(null);
    } else {
      await axios.post(API, form);
      setMessage("✅ Account added successfully!");
    }
    setForm({
      account_holder: "", account_number: "", bank_name: "",
      balance: "", account_type: "savings", phone: "",
      email: "", branch_name: "", ifsc_code: ""
    });
    fetchAccounts();
  };

  const handleEdit = (acc) => {
    setForm(acc);
    setEditId(acc._id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      await axios.delete(`${API}/${id}`);
      setMessage("🗑️ Account deleted successfully!");
      fetchAccounts();
    }
  };

  return (
    <div style={{ padding: "16px", fontFamily: "Arial", maxWidth: "1100px", margin: "auto" }}>
      <h1 style={{ fontSize: "24px", textAlign: "center" }}>🏦 Bank Account Manager</h1>
      {message && (
        <p style={{ color: "green", textAlign: "center", background: "#f0fff0", padding: "10px", borderRadius: "6px" }}>
          {message}
        </p>
      )}

      {/* FORM */}
      <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>{editId ? "✏️ Edit Account" : "➕ Add New Account"}</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "10px"
        }}>
          <input style={inputStyle} placeholder="Account Holder Name *" value={form.account_holder}
            onChange={e => setForm({...form, account_holder: e.target.value})} />
          <input style={inputStyle} placeholder="Account Number *" value={form.account_number}
            onChange={e => setForm({...form, account_number: e.target.value})} />
          <input style={inputStyle} placeholder="Bank Name" value={form.bank_name}
            onChange={e => setForm({...form, bank_name: e.target.value})} />
          <input style={inputStyle} placeholder="Balance (₹)" type="number" value={form.balance}
            onChange={e => setForm({...form, balance: e.target.value})} />
          <input style={inputStyle} placeholder="Phone Number" value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})} />
          <input style={inputStyle} placeholder="Email Address" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} />
          <input style={inputStyle} placeholder="Branch Name" value={form.branch_name}
            onChange={e => setForm({...form, branch_name: e.target.value})} />
          <input style={inputStyle} placeholder="IFSC Code" value={form.ifsc_code}
            onChange={e => setForm({...form, ifsc_code: e.target.value})} />
          <select style={inputStyle} value={form.account_type}
            onChange={e => setForm({...form, account_type: e.target.value})}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="fixed">Fixed Deposit</option>
            <option value="recurring">Recurring Deposit</option>
          </select>
        </div>
        <div style={{ marginTop: "12px" }}>
          <button style={btnStyle} onClick={handleSubmit}>
            {editId ? "Update Account" : "Add Account"}
          </button>
          {editId && (
            <button style={{...btnStyle, background: "gray"}} onClick={() => setEditId(null)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div style={{ display: "block" }} className="mobile-cards">
        {accounts.map((acc, i) => (
          <div key={acc._id} style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{acc.account_holder}</h3>
                <p style={{ margin: "0", color: "#666", fontSize: "13px" }}>
                  {acc.bank_name} • {acc.account_type}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0", fontWeight: "bold", fontSize: "18px", color: "#2d8a2d" }}>
                  ₹{acc.balance}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "10px", fontSize: "13px", color: "#444" }}>
              <p style={{ margin: "4px 0" }}>📋 Acc No: <strong>{acc.account_number}</strong></p>
              {acc.ifsc_code && <p style={{ margin: "4px 0" }}>🏛️ IFSC: {acc.ifsc_code}</p>}
              {acc.branch_name && <p style={{ margin: "4px 0" }}>📍 Branch: {acc.branch_name}</p>}

              {expandedId === acc._id && (
                <div style={{ marginTop: "8px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  {acc.phone && <p style={{ margin: "4px 0" }}>📞 Phone: {acc.phone}</p>}
                  {acc.email && <p style={{ margin: "4px 0" }}>📧 Email: {acc.email}</p>}
                </div>
              )}

              <button
                onClick={() => setExpandedId(expandedId === acc._id ? null : acc._id)}
                style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: "4px 0", fontSize: "13px" }}>
                {expandedId === acc._id ? "▲ Show Less" : "▼ Show More"}
              </button>
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <button onClick={() => handleEdit(acc)} style={{
                flex: 1, padding: "8px", background: "#333", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer"
              }}>✏️ Edit</button>
              <button onClick={() => handleDelete(acc._id)} style={{
                flex: 1, padding: "8px", background: "#dc3545", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer"
              }}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  width: "100%",
  fontSize: "14px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  boxSizing: "border-box"
};

const btnStyle = {
  padding: "10px 20px",
  background: "#333",
  color: "white",
  border: "none",
  cursor: "pointer",
  marginRight: "10px",
  borderRadius: "4px",
  fontSize: "14px"
};
import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://bank-backend-yopd.onrender.com/accounts";

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_holder: "",
    account_number: "",
    bank_name: "",
    balance: "",
    account_type: "savings",
    phone: "",
    email: "",
    branch_name: "",
    ifsc_code: ""
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

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
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      await axios.delete(`${API}/${id}`);
      setMessage("🗑️ Account deleted successfully!");
      fetchAccounts();
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", maxWidth: "1100px", margin: "auto" }}>
      <h1>🏦 Bank Account Manager</h1>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>{editId ? "✏️ Edit Account" : "➕ Add New Account"}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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

        <button style={btnStyle} onClick={handleSubmit}>
          {editId ? "Update Account" : "Add Account"}
        </button>
        {editId && (
          <button style={{...btnStyle, background: "gray"}} onClick={() => setEditId(null)}>
            Cancel
          </button>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#333", color: "white" }}>
            <tr>
              {["Name", "Acc No.", "Bank", "Balance", "Type", "Phone", "Email", "Branch", "IFSC", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr key={acc._id} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                <td style={tdStyle}>{acc.account_holder}</td>
                <td style={tdStyle}>{acc.account_number}</td>
                <td style={tdStyle}>{acc.bank_name}</td>
                <td style={tdStyle}>₹{acc.balance}</td>
                <td style={tdStyle}>{acc.account_type}</td>
                <td style={tdStyle}>{acc.phone}</td>
                <td style={tdStyle}>{acc.email}</td>
                <td style={tdStyle}>{acc.branch_name}</td>
                <td style={tdStyle}>{acc.ifsc_code}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(acc)} style={{marginRight: "5px"}}>✏️</button>
                  <button onClick={() => handleDelete(acc._id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  width: "100%",
  fontSize: "14px",
  borderRadius: "4px",
  border: "1px solid #ddd"
};

const btnStyle = {
  marginTop: "15px",
  padding: "10px 20px",
  background: "#333",
  color: "white",
  border: "none",
  cursor: "pointer",
  marginRight: "10px",
  borderRadius: "4px"
};

const tdStyle = {
  padding: "10px",
  textAlign: "center",
  border: "1px solid #ddd"
};
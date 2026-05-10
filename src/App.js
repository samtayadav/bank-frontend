import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/accounts";

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    account_holder: "",
    account_number: "",
    bank_name: "",
    balance: "",
    account_type: "savings"
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
      setMessage("⚠️ Sab fields bharo!");
      return;
    }
    if (editId) {
      await axios.put(`${API}/${editId}`, form);
      setMessage("✅ Account updated!");
      setEditId(null);
    } else {
      await axios.post(API, form);
      setMessage("✅ Account add hua!");
    }
    setForm({ account_holder: "", account_number: "", bank_name: "", balance: "", account_type: "savings" });
    fetchAccounts();
  };

  const handleEdit = (acc) => {
    setForm(acc);
    setEditId(acc._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete karna hai?")) {
      await axios.delete(`${API}/${id}`);
      setMessage("🗑️ Deleted!");
      fetchAccounts();
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", maxWidth: "900px", margin: "auto" }}>
      <h1>🏦 Bank Account Manager</h1>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>{editId ? "✏️ Edit Account" : "➕ New Account"}</h3>
        <input style={inputStyle} placeholder="Account Holder Name" value={form.account_holder}
          onChange={e => setForm({...form, account_holder: e.target.value})} />
        <input style={inputStyle} placeholder="Account Number" value={form.account_number}
          onChange={e => setForm({...form, account_number: e.target.value})} />
        <input style={inputStyle} placeholder="Bank Name" value={form.bank_name}
          onChange={e => setForm({...form, bank_name: e.target.value})} />
        <input style={inputStyle} placeholder="Balance (₹)" type="number" value={form.balance}
          onChange={e => setForm({...form, balance: e.target.value})} />
        <select style={inputStyle} value={form.account_type}
          onChange={e => setForm({...form, account_type: e.target.value})}>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
        </select>
        <button style={btnStyle} onClick={handleSubmit}>
          {editId ? "Update Account" : "Add Account"}
        </button>
        {editId && (
          <button style={{...btnStyle, background: "gray"}} onClick={() => setEditId(null)}>
            Cancel
          </button>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#333", color: "white" }}>
          <tr>
            {["Name", "Acc No.", "Bank", "Balance", "Type", "Actions"].map(h => (
              <th key={h} style={{ padding: "10px" }}>{h}</th>
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
              <td style={tdStyle}>
                <button onClick={() => handleEdit(acc)} style={{marginRight: "5px"}}>✏️</button>
                <button onClick={() => handleDelete(acc._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = { 
  display: "block", 
  margin: "8px 0", 
  padding: "8px", 
  width: "100%", 
  fontSize: "14px" 
};

const btnStyle = { 
  marginTop: "10px", 
  padding: "10px 20px", 
  background: "#333", 
  color: "white", 
  border: "none", 
  cursor: "pointer", 
  marginRight: "10px" 
};

const tdStyle = { 
  padding: "10px", 
  textAlign: "center", 
  border: "1px solid #ddd" 
};
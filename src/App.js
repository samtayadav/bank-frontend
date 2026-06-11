import { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
const ACCOUNTS_API = `${API_BASE}/accounts`;
const AUTH_API = `${API_BASE}/auth`;
const TRANSFERS_API = `${API_BASE}/transfers`;

const emptyAccountForm = {
  account_holder: "",
  account_number: "",
  bank_name: "",
  balance: "",
  account_type: "savings",
  phone: "",
  email: "",
  branch_name: "",
  ifsc_code: "",
};

const emptyTransferForm = {
  from_account_id: "",
  to_account_id: "",
  amount: "",
  note: "",
};

const emptyLoginForm = {
  username: "",
  password: "",
};

export default function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("bankToken") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("bankUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [authMode, setAuthMode] = useState("login");
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState(emptyAccountForm);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const accountsById = useMemo(() => {
    return accounts.reduce((map, account) => {
      map[account._id] = account;
      return map;
    }, {});
  }, [accounts]);

  const authConfig = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }), [authToken]);

  const saveLogin = (data) => {
    localStorage.setItem("bankToken", data.token);
    localStorage.setItem("bankUser", JSON.stringify(data.user));
    setAuthToken(data.token);
    setCurrentUser(data.user);
    setLoginForm(emptyLoginForm);
    setMessage("");
  };

  const handleAuthSubmit = async () => {
    if (!loginForm.username || !loginForm.password) {
      setMessage("Please enter your username and password.");
      return;
    }

    try {
      const res = await axios.post(`${AUTH_API}/${authMode}`, loginForm);
      saveLogin(res.data);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Login failed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bankToken");
    localStorage.removeItem("bankUser");
    setAuthToken("");
    setCurrentUser(null);
    setAccounts([]);
    setTransfers([]);
    setForm(emptyAccountForm);
    setTransferForm(emptyTransferForm);
    setMessage("");
  };

  const fetchAccounts = useCallback(async () => {
    const res = await axios.get(ACCOUNTS_API, authConfig());
    setAccounts(res.data);
  }, [authConfig]);

  const fetchTransfers = useCallback(async () => {
    const res = await axios.get(`${TRANSFERS_API}?status=pending`, authConfig());
    setTransfers(res.data);
  }, [authConfig]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchTransfers()]);
  }, [fetchAccounts, fetchTransfers]);

  useEffect(() => {
    if (authToken) {
      refreshDashboard();
    }
  }, [authToken, refreshDashboard]);

  const getAccountLabel = (accountId) => {
    const account = accountsById[accountId];
    if (!account) return accountId;
    return `${account.account_holder} (${account.account_number})`;
  };

  const handleSubmit = async () => {
    if (!form.account_holder || !form.account_number) {
      setMessage("Please fill all required account fields.");
      return;
    }

    if (editId) {
      await axios.put(`${ACCOUNTS_API}/${editId}`, form, authConfig());
      setMessage("Account updated successfully.");
      setEditId(null);
    } else {
      await axios.post(ACCOUNTS_API, form, authConfig());
      setMessage("Account added successfully.");
    }

    setForm(emptyAccountForm);
    fetchAccounts();
  };

  const handleTransferSubmit = async () => {
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      setMessage("Please select both accounts and enter a transfer amount.");
      return;
    }

    if (transferForm.from_account_id === transferForm.to_account_id) {
      setMessage("Source and destination accounts must be different.");
      return;
    }

    try {
      await axios.post(TRANSFERS_API, {
        ...transferForm,
        amount: Number(transferForm.amount),
      }, authConfig());
      setMessage("Transfer request created. Approve it to move the money.");
      setTransferForm(emptyTransferForm);
      fetchTransfers();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Transfer request failed.");
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      await axios.post(`${TRANSFERS_API}/${transferId}/approve`, {}, authConfig());
      setMessage("Transfer approved successfully.");
      refreshDashboard();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Transfer approval failed.");
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      await axios.post(`${TRANSFERS_API}/${transferId}/reject`, {}, authConfig());
      setMessage("Transfer rejected successfully.");
      fetchTransfers();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Transfer rejection failed.");
    }
  };

  const handleEdit = (acc) => {
    setForm(acc);
    setEditId(acc._id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      await axios.delete(`${ACCOUNTS_API}/${id}`, authConfig());
      setMessage("Account deleted successfully.");
      fetchAccounts();
    }
  };

  if (!authToken) {
    return (
      <div style={{ padding: "16px", fontFamily: "Arial", maxWidth: "420px", margin: "60px auto" }}>
        <h1 style={{ fontSize: "24px", textAlign: "center" }}>Bank Account Manager</h1>
        {message && (
          <p style={{ color: "#b00020", textAlign: "center", background: "#fff4f4", padding: "10px", borderRadius: "6px" }}>
            {message}
          </p>
        )}

        <div style={sectionStyle}>
          <h3>{authMode === "login" ? "Login" : "Create Login"}</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            <input style={inputStyle} placeholder="Username" value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            <input style={inputStyle} placeholder="Password" type="password" value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button style={btnStyle} onClick={handleAuthSubmit}>
              {authMode === "login" ? "Login" : "Register"}
            </button>
            <button style={{...btnStyle, background: "#666"}} onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setMessage("");
            }}>
              {authMode === "login" ? "Create Account" : "Use Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", fontFamily: "Arial", maxWidth: "1100px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "24px", margin: "10px 0" }}>Bank Account Manager</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#444", fontSize: "14px" }}>{currentUser?.username}</span>
          <button style={{...btnStyle, marginRight: 0, background: "#666"}} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      {message && (
        <p style={{ color: "green", textAlign: "center", background: "#f0fff0", padding: "10px", borderRadius: "6px" }}>
          {message}
        </p>
      )}

      <div style={sectionStyle}>
        <h3>{editId ? "Edit Account" : "Add New Account"}</h3>
        <div style={gridStyle}>
          <input style={inputStyle} placeholder="Account Holder Name *" value={form.account_holder}
            onChange={e => setForm({...form, account_holder: e.target.value})} />
          <input style={inputStyle} placeholder="Account Number *" value={form.account_number}
            onChange={e => setForm({...form, account_number: e.target.value})} />
          <input style={inputStyle} placeholder="Bank Name" value={form.bank_name}
            onChange={e => setForm({...form, bank_name: e.target.value})} />
          <input style={inputStyle} placeholder="Balance" type="number" value={form.balance}
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

      <div style={sectionStyle}>
        <h3>Raise Transfer Request</h3>
        <div style={gridStyle}>
          <select style={inputStyle} value={transferForm.from_account_id}
            onChange={e => setTransferForm({...transferForm, from_account_id: e.target.value})}>
            <option value="">From account</option>
            {accounts.map(account => (
              <option key={account._id} value={account._id}>
                {account.account_holder} - Balance {account.balance}
              </option>
            ))}
          </select>
          <select style={inputStyle} value={transferForm.to_account_id}
            onChange={e => setTransferForm({...transferForm, to_account_id: e.target.value})}>
            <option value="">To account</option>
            {accounts.map(account => (
              <option key={account._id} value={account._id}>
                {account.account_holder} - {account.account_number}
              </option>
            ))}
          </select>
          <input style={inputStyle} placeholder="Amount" type="number" min="1" value={transferForm.amount}
            onChange={e => setTransferForm({...transferForm, amount: e.target.value})} />
          <input style={inputStyle} placeholder="Note" value={transferForm.note}
            onChange={e => setTransferForm({...transferForm, note: e.target.value})} />
        </div>
        <div style={{ marginTop: "12px" }}>
          <button style={btnStyle} onClick={handleTransferSubmit}>
            Create Transfer Request
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3>Pending Transfer Approvals</h3>
        {transfers.length === 0 ? (
          <p style={{ color: "#666", margin: 0 }}>No pending transfer requests.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {transfers.map(transfer => (
              <div key={transfer._id} style={transferCardStyle}>
                <div>
                  <p style={{ margin: "0 0 6px 0", fontWeight: "bold" }}>
                    {getAccountLabel(transfer.from_account_id)} to {getAccountLabel(transfer.to_account_id)}
                  </p>
                  <p style={{ margin: "0", color: "#444" }}>Amount: {transfer.amount}</p>
                  {transfer.note && <p style={{ margin: "4px 0 0 0", color: "#666" }}>Note: {transfer.note}</p>}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button style={{...btnStyle, marginRight: 0, background: "#198754"}}
                    onClick={() => handleApproveTransfer(transfer._id)}>
                    Approve
                  </button>
                  <button style={{...btnStyle, marginRight: 0, background: "#dc3545"}}
                    onClick={() => handleRejectTransfer(transfer._id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "block" }} className="mobile-cards">
        {accounts.map((acc) => (
          <div key={acc._id} style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{acc.account_holder}</h3>
                <p style={{ margin: "0", color: "#666", fontSize: "13px" }}>
                  {acc.bank_name} - {acc.account_type}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0", fontWeight: "bold", fontSize: "18px", color: "#2d8a2d" }}>
                  {acc.balance}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "10px", fontSize: "13px", color: "#444" }}>
              <p style={{ margin: "4px 0" }}>Acc No: <strong>{acc.account_number}</strong></p>
              {acc.ifsc_code && <p style={{ margin: "4px 0" }}>IFSC: {acc.ifsc_code}</p>}
              {acc.branch_name && <p style={{ margin: "4px 0" }}>Branch: {acc.branch_name}</p>}

              {expandedId === acc._id && (
                <div style={{ marginTop: "8px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  {acc.phone && <p style={{ margin: "4px 0" }}>Phone: {acc.phone}</p>}
                  {acc.email && <p style={{ margin: "4px 0" }}>Email: {acc.email}</p>}
                </div>
              )}

              <button
                onClick={() => setExpandedId(expandedId === acc._id ? null : acc._id)}
                style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", padding: "4px 0", fontSize: "13px" }}>
                {expandedId === acc._id ? "Show Less" : "Show More"}
              </button>
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <button onClick={() => handleEdit(acc)} style={{
                flex: 1, padding: "8px", background: "#333", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer"
              }}>Edit</button>
              <button onClick={() => handleDelete(acc._id)} style={{
                flex: 1, padding: "8px", background: "#dc3545", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer"
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionStyle = {
  background: "#f5f5f5",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "10px",
};

const transferCardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "12px",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const inputStyle = {
  padding: "10px",
  width: "100%",
  fontSize: "14px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  boxSizing: "border-box",
};

const btnStyle = {
  padding: "10px 20px",
  background: "#333",
  color: "white",
  border: "none",
  cursor: "pointer",
  marginRight: "10px",
  borderRadius: "4px",
  fontSize: "14px",
};

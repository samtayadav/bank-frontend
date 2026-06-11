import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";

import App from "./App";

jest.mock("axios");

const authResponse = {
  data: {
    token: "demo-token",
    user: {
      _id: "6a1000000000000000000001",
      username: "demo1",
    },
  },
};

const demo1Accounts = [
  {
    _id: "account-1",
    owner_user_id: "6a1000000000000000000001",
    account_holder: "Aarav Sharma",
    account_number: "1001001001",
    bank_name: "State Bank of India",
    balance: 24500.75,
    account_type: "savings",
    phone: "9876543210",
    email: "aarav.sharma@example.com",
    branch_name: "Delhi Main",
    ifsc_code: "SBIN0001234",
  },
  {
    _id: "account-2",
    owner_user_id: "6a1000000000000000000001",
    account_holder: "Rohan Gupta",
    account_number: "1001001003",
    bank_name: "ICICI Bank",
    balance: 15780.5,
    account_type: "savings",
  },
];

const pendingTransfers = [
  {
    _id: "transfer-1",
    from_account_id: "account-1",
    to_account_id: "account-2",
    amount: 50,
    note: "UI test transfer",
    status: "pending",
  },
];

function mockDashboardRequests(accounts = demo1Accounts, transfers = []) {
  axios.get.mockImplementation((url) => {
    if (url.includes("/accounts")) {
      return Promise.resolve({ data: accounts });
    }
    if (url.includes("/transfers")) {
      return Promise.resolve({ data: transfers });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockDashboardRequests();
});

test("shows login first and can switch to register", async () => {
  const user = userEvent;
  render(<App />);

  expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  expect(screen.queryByText(/add new account/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /create account/i }));

  expect(screen.getByRole("heading", { name: /create login/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
});

test("logs in and shows only the current user's account details", async () => {
  const user = userEvent;
  axios.post.mockResolvedValueOnce(authResponse);
  render(<App />);

  await user.type(screen.getByPlaceholderText(/username/i), "demo1");
  await user.type(screen.getByPlaceholderText(/password/i), "password1");
  await user.click(screen.getByRole("button", { name: /^login$/i }));

  expect(await screen.findByText("demo1")).toBeInTheDocument();
  expect(await screen.findByText("Aarav Sharma")).toBeInTheDocument();
  expect(screen.getByText("Rohan Gupta")).toBeInTheDocument();
  expect(screen.queryByText("Priya Patel")).not.toBeInTheDocument();
  expect(screen.queryByText("9876543210")).not.toBeInTheDocument();

  await user.click(screen.getAllByRole("button", { name: /show more/i })[0]);

  expect(screen.getByText(/Phone:/i)).toHaveTextContent("9876543210");
  expect(screen.getByText(/Email:/i)).toHaveTextContent("aarav.sharma@example.com");
  expect(axios.get).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/accounts",
    { headers: { Authorization: "Bearer demo-token" } },
  );
});

test("creates transfer requests with the logged-in user's token", async () => {
  const user = userEvent;
  axios.post.mockResolvedValueOnce(authResponse).mockResolvedValueOnce({
    data: { id: "transfer-2", message: "Transfer request created!" },
  });
  render(<App />);

  await user.type(screen.getByPlaceholderText(/username/i), "demo1");
  await user.type(screen.getByPlaceholderText(/password/i), "password1");
  await user.click(screen.getByRole("button", { name: /^login$/i }));
  await screen.findByText("Aarav Sharma");

  await user.selectOptions(screen.getByDisplayValue("From account"), "account-1");
  await user.selectOptions(screen.getByDisplayValue("To account"), "account-2");
  await user.type(screen.getByPlaceholderText(/amount/i), "75");
  await user.type(screen.getByPlaceholderText(/note/i), "Rent");
  await user.click(screen.getByRole("button", { name: /create transfer request/i }));

  await waitFor(() => {
    expect(axios.post).toHaveBeenLastCalledWith(
      "http://127.0.0.1:8000/transfers",
      {
        from_account_id: "account-1",
        to_account_id: "account-2",
        amount: 75,
        note: "Rent",
      },
      { headers: { Authorization: "Bearer demo-token" } },
    );
  });
});

test("approves and rejects visible pending transfers with the user token", async () => {
  const user = userEvent;
  mockDashboardRequests(demo1Accounts, pendingTransfers);
  axios.post
    .mockResolvedValueOnce(authResponse)
    .mockResolvedValueOnce({ data: { message: "Transfer approved!" } })
    .mockResolvedValueOnce({ data: { message: "Transfer rejected!" } });

  render(<App />);

  await user.type(screen.getByPlaceholderText(/username/i), "demo1");
  await user.type(screen.getByPlaceholderText(/password/i), "password1");
  await user.click(screen.getByRole("button", { name: /^login$/i }));

  expect(await screen.findByText(/UI test transfer/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /approve/i }));
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/transfers/transfer-1/approve",
      {},
      { headers: { Authorization: "Bearer demo-token" } },
    );
  });

  await user.click(screen.getByRole("button", { name: /reject/i }));
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/transfers/transfer-1/reject",
      {},
      { headers: { Authorization: "Bearer demo-token" } },
    );
  });
});

test("logs out and hides private account data", async () => {
  const user = userEvent;
  axios.post.mockResolvedValueOnce(authResponse);
  render(<App />);

  await user.type(screen.getByPlaceholderText(/username/i), "demo1");
  await user.type(screen.getByPlaceholderText(/password/i), "password1");
  await user.click(screen.getByRole("button", { name: /^login$/i }));
  expect(await screen.findByText("Aarav Sharma")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /logout/i }));

  expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  expect(screen.queryByText("Aarav Sharma")).not.toBeInTheDocument();
});

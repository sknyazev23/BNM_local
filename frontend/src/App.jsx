import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import JobForm from "./pages/JobForm";
import ClientsPage from "./pages/ClientsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/job/new" element={<JobForm />} />
      <Route path="/job/:id" element={<JobForm />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
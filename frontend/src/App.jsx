import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import JobForm from "./pages/JobForm";

export default function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/job/new" element={<JobForm />} />
    </Routes>
  );
}
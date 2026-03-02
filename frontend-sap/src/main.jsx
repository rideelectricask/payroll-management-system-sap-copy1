import React, { useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./contexts/authContext";

// ✅ FIX: Import MitraAuthProvider
import { MitraAuthProvider } from "./contexts/mitraAuthContext";

import Menubar from "./components/Layouts/menubar";
import Login from "./components/pages/login";
import Home from "./components/pages/home";
import DetailedIntro from "./components/pages/detailedIntro";
import Capability from "./components/pages/capability";
import Experience from "./components/pages/experience";
import Project from "./components/pages/project";

import { DefaultSidebar } from "./components/DefaultSidebar";
import PMSLogin from "./pages/PMSLogin";
import MitraLogin from "./pages/MitraLogin";
import Logout from "./pages/Logout";
import PMS from "./pages/PMS";
import ExecutiveOverviewDashboard from "./pages/ExecutiveOverviewDashboard";
import CostAndFinancialIntelligence from "./pages/CostAndFinancialIntelligence";
import OrdersManagement from "./pages/OrdersManagement";
import InventoryControl from "./pages/InventoryControl";
import DriverPerformance from "./pages/DriverPerformance";
import FleetManagement from "./pages/FleetManagement";
import MitraPerformance from "./pages/MitraPerformance";
import MitraAccount from "./pages/MitraAccount";
import AllMitraPerformanceDashboard from "./pages/AllMitraPerformanceDashboard";
import ShipmentPerformance from "./pages/ShipmentPerformance";
import TaskManagement from "./pages/TaskManagement";
import AttendanceTracking from "./pages/AttendanceTracking";
import TrainingCertification from "./pages/TrainingCertification";
import MessageDispatcher from "./pages/MessageDispatcher";
import CareerCenter from "./pages/public/CareerCenter";
import RideExperience from "./pages/public/RideExperience";
import Inbox from "./pages/Inbox";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Scrappy from "./pages/Scrappy";

// ✅ FIX: Import halaman Mitra dashboard
import Mitra from "./pages/Mitra";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login-pms" replace />;
  }

  return children;
}

function PublicLayout() {
  return (
    <div className="bg-gray-50 flex">
      <Menubar />
      <main className="flex-1 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}

function PMSLayout({ tagFilterProps }) {
  return (
    <div className="flex bg-gray-50">
      <DefaultSidebar tagFilterProps={tagFilterProps} />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagQuery, setTagQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const inputRef = useRef(null);

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagQuery("");
    setMenuOpen(false);
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const tagFilterProps = {
    selectedTags,
    tagQuery,
    setTagQuery,
    menuOpen,
    setMenuOpen,
    filteredTags,
    addTag,
    removeTag,
    clearAllTags,
    inputRef,
    setFilteredTags,
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login-pms" element={<PMSLogin />} />
      <Route path="/career-center" element={<CareerCenter />} />
      <Route path="/ride-experience" element={<RideExperience />} />

      {/* ✅ FIX: Semua route mitra dibungkus MitraAuthProvider */}
      <Route
        path="/login-mitra"
        element={
          <MitraAuthProvider>
            <MitraLogin />
          </MitraAuthProvider>
        }
      />
      <Route
        path="/mitra"
        element={
          <MitraAuthProvider>
            <Mitra />
          </MitraAuthProvider>
        }
      />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jhonhalbert" element={<DetailedIntro />} />
        <Route path="/detailed-intro" element={<DetailedIntro />} />
        <Route path="/capability" element={<Capability />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/project" element={<Project />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <PMSLayout tagFilterProps={tagFilterProps} />
          </ProtectedRoute>
        }
      >
        <Route path="/pms" element={<PMS />} />
        <Route path="/analytics/executive-overview-dashboard" element={<ExecutiveOverviewDashboard />} />
        <Route path="/analytics/cost-and-financial-intelligence" element={<CostAndFinancialIntelligence tagFilterProps={tagFilterProps} />} />
        <Route path="/operations/orders-management" element={<OrdersManagement />} />
        <Route path="/operations/inventory-control" element={<InventoryControl />} />
        <Route path="/resources/mitra-operations" element={<DriverPerformance />} />
        <Route path="/resources/fleet-management" element={<FleetManagement />} />
        <Route path="/driver-management/mitra-performance" element={<MitraPerformance />} />
        <Route path="/driver-management/mitra-account/:driverId" element={<MitraAccount />} />
        <Route path="/driver-management/all-mitra-analytics" element={<AllMitraPerformanceDashboard />} />
        <Route path="/driver-management/shipment-performance" element={<ShipmentPerformance />} />
        <Route path="/driver-management/task-management" element={<TaskManagement />} />
        <Route path="/driver-management/attendance-tracking" element={<AttendanceTracking />} />
        <Route path="/driver-management/training-certification" element={<TrainingCertification />} />
        <Route path="/driver-management/message-dispatcher" element={<MessageDispatcher />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/scrappy" element={<Scrappy />} />
        <Route path="/logout" element={<Logout />} />
      </Route>

      <Route path="*" element={<Navigate to="/login-pms" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
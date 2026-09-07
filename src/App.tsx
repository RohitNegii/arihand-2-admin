import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import ContactInquiries from "./pages/ContactInquiries";
import Users from "./pages/Users";
import FAQs from "./pages/FAQs";
import Settings from "./pages/Settings";
import HomepageMedia from "./pages/HomepageMedia";
import { Toaster } from "sonner";

// Protected Layout Route wrapper
function ProtectedLayout() {
  const token = localStorage.getItem("aurum_admin_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-luxury-bg h-screen text-[#351E28] select-none overflow-hidden">
      {/* Sidebar drawer */}
      <Sidebar />

      {/* Main Content Workspace */}
      <main className="flex-1 ml-64 p-8 h-screen relative flex flex-col overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[10%] right-[-10%] w-[35vw] h-[35vw] bg-radial from-[#C8A96A]/6 to-transparent blur-[120px] pointer-events-none" />
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "INPUT" && (target as HTMLInputElement).type === "number") {
        if (document.activeElement === target) {
          (target as HTMLInputElement).blur();
        }
      }
    };
    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/homepage-media" element={<HomepageMedia />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/users" element={<Users />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contact" element={<ContactInquiries />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

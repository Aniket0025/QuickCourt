import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Venues from "./pages/Venues";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import OwnerDashboard from "./pages/owner/Dashboard";
import UserDashboard from "./pages/user/Dashboard";
import { HelmetProvider } from "react-helmet-async";
import VenueDetails from "./pages/venue/VenueDetails";
import BookCourt from "./pages/venue/BookCourt";
import MyBookings from "./pages/bookings/MyBookings";
import FacilityManagement from "./pages/owner/FacilityManagement";
import CourtManagement from "./pages/owner/CourtManagement";
import TimeSlotManagement from "./pages/owner/TimeSlotManagement";
import BookingOverview from "./pages/owner/BookingOverview";
import FacilityApproval from "./pages/admin/FacilityApproval";
import UserManagement from "./pages/admin/UserManagement";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HelmetProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/venues/:id" element={<VenueDetails />} />
                <Route path="/venues/:id/book" element={<BookCourt />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookings" element={<MyBookings />} />
                <Route path="/about" element={<About />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/admin/facility-approval" element={<FacilityApproval />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/dashboard/facility" element={<OwnerDashboard />} />
                <Route path="/owner/facility" element={<FacilityManagement />} />
                <Route path="/owner/courts" element={<CourtManagement />} />
                <Route path="/owner/time-slots" element={<TimeSlotManagement />} />
                <Route path="/owner/bookings" element={<BookingOverview />} />
                <Route path="/dashboard/user" element={<UserDashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </HelmetProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
//hbkj
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import { RequireAdmin, RequireSession, SessionContextProvider } from "./components/auth/SessionContext";
import { PackagingDataProvider } from "./components/app/PackagingDataProvider";
import { UserManagement } from "./components/app/UserManagement";
import { LocalPackagingDataProvider } from "./components/app/LocalPackagingDataProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/users" element={<RequireAdmin><PackagingDataProvider><UserManagement /></PackagingDataProvider></RequireAdmin>} />
            <Route path="/test" element={<LocalPackagingDataProvider><Index /></LocalPackagingDataProvider>} />
            <Route path="/" element={<RequireSession><PackagingDataProvider><Index /></PackagingDataProvider></RequireSession>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

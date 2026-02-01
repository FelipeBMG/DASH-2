import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// TooltipProvider removido temporariamente: estava causando crash em runtime
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Vendedor from "./pages/Vendedor";
import Producao from "./pages/Producao";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
        <Route path="/vendedor" element={<RequireAuth><Vendedor /></RequireAuth>} />
        <Route path="/producao" element={<RequireAuth><Producao /></RequireAuth>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

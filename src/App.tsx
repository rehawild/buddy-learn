import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MeetHome from "./pages/MeetHome";
import MeetLobby from "./pages/MeetLobby";
import MeetRoom from "./pages/MeetRoom";
import Recap from "./pages/Recap";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MeetHome />} />
          <Route path="/lobby" element={<MeetLobby />} />
          <Route path="/meet" element={<MeetRoom />} />
          <Route path="/recap" element={<Recap />} />
          <Route path="/present" element={<MeetHome />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

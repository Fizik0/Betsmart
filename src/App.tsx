import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { ThemeProvider } from "@/hooks/use-theme";
import { PiPProvider, usePiPPlayer } from "@/hooks/use-pip-player";

// Pages
import Home from "@/pages/home";
import Sports from "@/pages/sports";
import Live from "@/pages/live";
import Profile from "@/pages/profile";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Predictions from "@/pages/predictions";
import NotFound from "@/pages/not-found";

// Components
import Header from "@/components/shared/header";
import MobileNavigation from "@/components/shared/mobile-navigation";
import BettingSlip from "@/components/shared/betting-slip";
import MobileBettingSlip from "@/components/shared/mobile-betting-slip";
import PiPPlayer from "@/components/live/pip-player";

function Router() {
  const [location] = useLocation();
  const { isPiPOpen, currentStream, currentStats, closePiP } = usePiPPlayer();

  useEffect(() => {
    // Seed initial data for demo purposes
    const seedData = async () => {
      try {
        await apiRequest("POST", "/api/seed", {});
      } catch (error) {
        console.error("Failed to seed data:", error);
      }
    };
    
    seedData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-grow flex">
        <div className="flex-grow">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/sports" component={Sports} />
            <Route path="/live" component={Live} />
            <Route path="/predictions" component={Predictions} />
            <Route path="/profile" component={Profile} />
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route component={NotFound} />
          </Switch>
        </div>
        
        <BettingSlip />
      </main>
      
      <MobileNavigation />
      <MobileBettingSlip />
      
      {/* Picture-in-Picture player that follows user across the app */}
      <PiPPlayer 
        isOpen={isPiPOpen} 
        stream={currentStream} 
        stats={currentStats} 
        onClose={closePiP} 
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="sports-betting-theme">
      <QueryClientProvider client={queryClient}>
        <PiPProvider>
          <Router />
          <Toaster />
        </PiPProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

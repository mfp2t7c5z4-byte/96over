import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CoursesPage from "./pages/CoursesPage";
import HandicapPage from "./pages/HandicapPage";
import SettingsPage from "./pages/SettingsPage";
import ActiveRoundPage from "./pages/ActiveRoundPage";
import RoundHistoryPage from "./pages/RoundHistoryPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/handicap" component={HandicapPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/round/active" component={ActiveRoundPage} />
      <Route path="/round/history" component={RoundHistoryPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import AddEvent from './pages/AddEvent';
import Balances from './pages/Balances';
import Settlements from './pages/Settlements';

function AppRoutes() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/trips/:id" element={<TripDetails />} />
          <Route path="/trips/:id/add-event" element={<AddEvent />} />
          <Route path="/trips/:id/balances" element={<Balances />} />
          <Route path="/trips/:id/settlements" element={<Settlements />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

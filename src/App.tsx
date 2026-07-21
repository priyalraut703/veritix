import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Events from './pages/Events'
import Wallet from './pages/Wallet'
import Organizer from './pages/Organizer'
import Verify from './pages/Verify'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/organizer" element={<Organizer />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </>
  )
}

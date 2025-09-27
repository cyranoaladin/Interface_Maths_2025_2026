import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Premiere from './pages/Premiere';
import Terminale from './pages/Terminale';
import Expertes from './pages/Expertes';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
export default function App(){
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/premiere" element={<Premiere/>} />
            <Route path="/terminale" element={<Terminale/>} />
            <Route path="/expertes" element={<Expertes/>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

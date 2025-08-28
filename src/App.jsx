import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import BecomeAgent from './components/BecomeAgent';
import Dashboard from './components/dashboard/Dashboard';
import AuthProvider from './context/AuthContext';
import AuthFlow from './components/auth/AuthFlow';
import ProductDetails from './components/ProductDetails';
import CompanyPage from './components/CompanyPage';
import VideoChannel from './components/VideoChannel';
import TopRanking from './components/TopRanking';
import CategoryProducts from './components/CategoryProducts';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/become-agent" element={<BecomeAgent />} />
          <Route path="/login" element={<AuthFlow initialStep="login" />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/video-channel" element={<VideoChannel />} />
          <Route path="/top-ranking" element={<TopRanking />} />
          <Route path="/category/:id" element={<CategoryProducts />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

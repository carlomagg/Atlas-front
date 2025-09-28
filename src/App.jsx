import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import BecomeAgent from './components/BecomeAgent';
import Dashboard from './components/dashboard/Dashboard';
import AuthProvider from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AuthFlow from './components/auth/AuthFlow';
import ProductDetails from './components/ProductDetails';
import CompanyPage from './components/CompanyPage';
import SubsidiaryCompanyPage from './components/SubsidiaryCompanyPage';
import VideoChannel from './components/VideoChannel';
import TopRanking from './components/TopRanking';
import CategoryProducts from './components/CategoryProducts';
import SearchResults from './components/SearchResults';
import PublicFAQ from './components/PublicFAQ';
import Layout from './components/common/Layout';
import FloatingChatWidget from './components/common/FloatingChatWidget';
import ChatRestoreButton from './components/common/ChatRestoreButton';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            {/* Pages with their own headers and footers - no global header to avoid duplication */}
            <Route path="/" element={<Layout showFooter={false} showHeader={false}><LandingPage /></Layout>} />
            <Route path="/become-agent" element={<Layout showFooter={false} showHeader={false}><BecomeAgent /></Layout>} />
            
            {/* Pages that use global header and footer */}
            <Route path="/product/:id" element={<Layout showHeader={false}><ProductDetails /></Layout>} />
            <Route path="/company" element={<Layout><CompanyPage /></Layout>} />
            <Route path="/company/:sellerId" element={<Layout><CompanyPage /></Layout>} />
            <Route path="/subsidiary/:subsidiarySlug" element={<Layout><SubsidiaryCompanyPage /></Layout>} />
            <Route path="/video-channel" element={<Layout><VideoChannel /></Layout>} />
            <Route path="/top-ranking" element={<Layout><TopRanking /></Layout>} />
            <Route path="/category/:id" element={<Layout><CategoryProducts /></Layout>} />
            <Route path="/search" element={<Layout><SearchResults /></Layout>} />
            <Route path="/help" element={<Layout><PublicFAQ /></Layout>} />
            
            {/* Auth pages with global header but no footer */}
            <Route path="/login" element={<Layout showFooter={false} showHeader={false}><AuthFlow initialStep="login" /></Layout>} />
            <Route path="/auth/register" element={<Layout showFooter={false} showHeader={false}><AuthFlow initialStep="signup" /></Layout>} />
            
            {/* Dashboard with its own header - no global header to avoid duplication */}
            <Route path="/dashboard/*" element={<Layout showFooter={false} showHeader={false}><Dashboard /></Layout>} />
          </Routes>
          
          {/* Global Floating Chat Widget */}
          <FloatingChatWidget />
          
          {/* Chat Restore Button (when widget is hidden) */}
          <ChatRestoreButton />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;

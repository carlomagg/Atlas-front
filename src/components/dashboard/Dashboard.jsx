import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './DashboardHome';
import CompanyInfo from './company/CompanyInfo';
import BasicInfo from './company/BasicInfo';
import BasicInfoEdit from './company/BasicInfoEdit';
import CompanyInfoEdit from './company/CompanyInfoEdit';
import CompanyInfoView from './company/CompanyInfoView';
import ManageProducts from './products/ManageProducts';
import AddProduct from './products/AddProduct';
import ChangePassword from '../auth/ChangePassword';
import VerifyBusiness from './VerifyBusiness';
import AgentManagement from './agent/AgentManagement';
import ComingSoon from '../common/ComingSoon';
import PrivacySettings from './privacy/PrivacySettings';
import MessageGuide from './MessageGuide';

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Routes>
          {/* Main Dashboard Route */}
          <Route index element={<DashboardHome />} />
          <Route path="/" element={<DashboardHome />} />

          {/* Contact Information Routes */}
          <Route path="/contact-info/basic" element={<BasicInfo />} />
          <Route path="/contact-info/basic/edit" element={<BasicInfoEdit />} />
          <Route path="/contact-info/company" element={<CompanyInfoView />} />
          <Route path="/contact-info/company/edit" element={<CompanyInfoEdit />} />

          {/* Product Information Routes */}
          <Route path="/product-info/add" element={<AddProduct />} />
          <Route path="/product-info/manage" element={<ManageProducts />} />
          {/** Removed: Product Request Information route **/}

          {/* Quotation Builder Routes */}
          <Route path="/quotation-builder/add" element={<ComingSoon title="Add Auto Quotation" description="Add auto quotation functionality coming soon..." />} />
          <Route path="/quotation-builder/manage" element={<ComingSoon title="Manage Auto Quotation" description="Manage auto quotation functionality coming soon..." />} />

          {/* Business Verification */}
          <Route path="/verification" element={<VerifyBusiness />} />

          {/* Privacy Information Routes */}
          <Route path="/privacy-info/privacy" element={<PrivacySettings />} />
          <Route path="/privacy-info/password" element={<ChangePassword />} />
          <Route path="/privacy-info/email" element={<ComingSoon title="Email Subscription" description="Email subscription functionality coming soon..." />} />

          {/* Top Navigation Routes */}
          <Route path="/message-guide" element={<MessageGuide />} />
          <Route path="/agent-management" element={<AgentManagement />} />
          <Route path="/transaction-activities" element={<ComingSoon title="Transaction Activities" description="Transaction activities functionality coming soon..." />} />
          <Route path="/payment-platform" element={<ComingSoon title="Payment Platform" description="Payment platform functionality coming soon..." />} />
          <Route path="/reports" element={<ComingSoon title="Reports" description="Reports functionality coming soon..." />} />

          {/* Legacy routes for backward compatibility */}
          <Route path="/company-info" element={<Navigate to="/dashboard/contact-info/basic" replace />} />
          <Route path="/company-info/view" element={<Navigate to="/dashboard/contact-info/company" replace />} />
          <Route path="/company-info/edit" element={<Navigate to="/dashboard/contact-info/company/edit" replace />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;

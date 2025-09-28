import React from 'react';
import GlobalHeader from './GlobalHeader';
import GlobalFooter from './GlobalFooter';

const Layout = ({ children, showFooter = true, showHeader = true }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <GlobalHeader />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <GlobalFooter />}
    </div>
  );
};

export default Layout;

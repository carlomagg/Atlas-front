import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose, className = '', isMobile = false }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    {
      name: 'Contact Information',
      href: '/dashboard/contact-info',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      subItems: [
        {
          name: 'Basic Information',
          href: '/dashboard/contact-info/basic',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Company Information',
          href: '/dashboard/contact-info/company',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
            </svg>
          )
        },
        {
          name: 'Company Subsidiaries',
          href: '/dashboard/contact-info/subsidiaries',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'Product Information',
      href: '/dashboard/product-info',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      subItems: [
        {
          name: 'Add New Products',
          href: '/dashboard/product-info/add',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )
        },
        {
          name: 'Manage Products',
          href: '/dashboard/product-info/manage',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )
        },
        {
          name: 'Manage Group Products',
          href: '/dashboard/product-info/manage-groups',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        },
        // Removed: Product Request Information
      ]
    },
    // Temporarily hidden - Quotation Builder section
    // {
    //   name: 'Quotation Builder',
    //   href: '/dashboard/quotation-builder',
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    //     </svg>
    //   ),
    //   subItems: [
    //     {
    //       name: 'Add Auto Quotation',
    //       href: '/dashboard/quotation-builder/add',
    //       icon: (
    //         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    //         </svg>
    //       )
    //     },
    //     {
    //       name: 'Manage auto quotation',
    //       href: '/dashboard/quotation-builder/manage',
    //       icon: (
    //         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    //         </svg>
    //       )
    //     }
    //   ]
    // },
    {
      name: 'Manage Privacy Information',
      href: '/dashboard/privacy-info',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      subItems: [
        {
          name: 'Privacy Information',
          href: '/dashboard/privacy-info/privacy',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        },
        {
          name: 'Edit Password',
          href: '/dashboard/privacy-info/password',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          )
        },
        {
          name: 'Email Subscription',
          href: '/dashboard/privacy-info/email',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )
        },
        // Removed: My Chatroom and Bonus Points
      ]
    }
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Collapses are disabled globally; no expanded state is needed

  const handleLogout = () => {
    logout();
    onClose();
  };

  const sidebarClasses = isMobile
    ? "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
    : className || "w-64 bg-white border-r border-gray-200";

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarClasses} ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Header - only show on mobile */}
          {isMobile && (
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">Company Info</h1>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Desktop header */}
          {!isMobile && (
            <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-gray-50 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Company Info</h2>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  // Menu item with submenu (no collapse globally)
                  <div>
                    <div
                      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${isActive(item.href) ? 'text-blue-700' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </div>
                      {/* No collapse arrow anywhere */}
                    </div>

                    {/* Submenu - always visible */}
                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          onClick={onClose}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                            isActive(subItem.href)
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.icon && (
                            <span className={`mr-2 ${isActive(subItem.href) ? 'text-blue-700' : 'text-gray-400'}`}>
                              {subItem.icon}
                            </span>
                          )}
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Regular menu item
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`mr-3 ${isActive(item.href) ? 'text-blue-700' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-4 py-6 border-t border-gray-200 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

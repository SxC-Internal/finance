"use client";

import { useState } from "react";
import { useAppController } from "@/hooks/useAppController";
import { renderActiveView } from "@/lib/view";

import LoginView from "@/components/auth/LoginView";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CreateReportModal from "@/components/shared/CreateReportModal";

export default function App() {
  const {
    activeView,
    isMobileMenuOpen,
    currentUser,
    isHydrating,
    theme,
    toggleTheme,
    handleLogout,
    openMobileMenu,
    closeMobileMenu,
    navigate,
    navigateFromMobile,
  } = useAppController();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (isHydrating) {
    return null;
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const viewNode = renderActiveView({
    activeView,
    currentUser,
    theme,
    onToggleTheme: toggleTheme,
  });

  return (
    <div className={theme}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
        
        <Sidebar 
          currentUser={currentUser}
          activeView={activeView}
          navigate={navigate}
          navigateFromMobile={navigateFromMobile}
          handleLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
        />

        {/* Layout: Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-96 bg-white dark:bg-slate-900 z-0 pointer-events-none opacity-50 transition-colors duration-300"></div>
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl z-0 pointer-events-none transition-colors duration-300"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/5 rounded-full blur-3xl z-0 pointer-events-none transition-colors duration-300"></div>

          <Header
            currentUser={currentUser}
            openMobileMenu={openMobileMenu}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />

          <div className="flex-1 overflow-y-auto p-8 z-10 scroll-smooth custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              {viewNode}
            </div>
          </div>
        </main>

        <CreateReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          user={currentUser}
        />
      </div>
    </div>
  );
}
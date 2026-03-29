import { useState } from 'react';
import { HomeIcon, SettingsIcon, LogoutIcon, DownloadIcon, SparklesIcon } from './Icons';

export default function MainLayout({ user, onLogout, children, activeView = 'dashboard', onNavigate = () => {}, onDownloadCsv = null, onGenerateSummary = null, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const canSeeConfig = activeRole === 'Employee' || (!activeRole && user.roles?.includes('Employee'));
  const navLinkClasses = "flex items-center w-full mt-2 py-3 px-4 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors";
  const activeNavLinkClasses = "flex items-center w-full mt-2 py-3 px-4 bg-sky-100 text-sky-700 font-semibold rounded-lg shadow-inner";

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className={`w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex-col absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex`}>
        <div className="h-16 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Icon" className="h-10 w-10 rounded-xl shadow-md" />
            <span className="font-bold text-2xl text-sky-600 tracking-tight">Workpulse</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-6 flex-1">
          <button onClick={() => { onNavigate('dashboard'); setIsSidebarOpen(false); }} className={activeView === 'dashboard' ? activeNavLinkClasses : navLinkClasses}>
            <HomeIcon />
            <span className="mx-4">Dashboard</span>
          </button>
          {canSeeConfig && (
            <button onClick={() => { onNavigate('config'); setIsSidebarOpen(false); }} className={activeView === 'config' ? activeNavLinkClasses : navLinkClasses}>
              <SettingsIcon />
              <span className="mx-4">Configuration</span>
            </button>
          )}
        </nav>
        <div className="mt-auto">
          <button onClick={onLogout} className="flex items-center w-full mt-2 py-3 px-4 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
            <LogoutIcon />
            <span className="mx-4">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <img src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" alt="Zuari Logo" className="h-8 md:h-10 object-contain drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {hasBothRoles && onToggleRole && (
              <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => onToggleRole('Employee')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeRole === 'Employee' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Employee
                </button>
                <button
                  onClick={() => onToggleRole('Manager')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeRole === 'Manager' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Manager
                </button>
              </div>
            )}
            {onGenerateSummary && (
              <button onClick={onGenerateSummary} title="Generate AI Summary" className="p-2 text-white bg-indigo-500 hover:bg-indigo-600 rounded-full transition-colors flex items-center justify-center sm:px-4 shadow-sm font-medium">
                <SparklesIcon /> <span className="hidden sm:inline ml-2">AI Summary</span>
              </button>
            )}
            {onDownloadCsv && (
              <button onClick={onDownloadCsv} title="Download CSV" className="p-2 text-white bg-sky-500 hover:bg-sky-600 rounded-full transition-colors flex items-center justify-center sm:px-4 shadow-sm font-medium">
                <DownloadIcon /> <span className="hidden sm:inline ml-2">CSV</span>
              </button>
            )}
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-slate-600 text-xs font-semibold whitespace-nowrap">Welcome, {user.name.split(' ')[0]}</span>
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">({activeRole || user.roles?.join(', ')})</span>
            </div>
            <img src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" alt="Adventz Logo" className="h-8 md:h-10 object-contain hidden lg:block drop-shadow-sm" />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

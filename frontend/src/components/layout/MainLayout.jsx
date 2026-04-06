import { useState } from 'react';
import iconUrl from '../../assets/briefcase.png';

export default function MainLayout({ user, onLogout, children, activeView = 'dashboard', onNavigate = () => {}, onDownloadCsv = null, onGenerateSummary = null, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const canSeeConfig = activeRole === 'Employee' || (!activeRole && user.roles?.includes('Employee'));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-200 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col p-6 shrink-0 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10  rounded-xl flex items-center justify-center  shadow-blue-200 shrink-0">
            <img src={iconUrl} alt="Zuari Industries" className="h-15 shadow-lgobject-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-900">Workpulse</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {/* Dashboard Nav Item */}
          <button onClick={() => { onNavigate('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span>Dashboard</span>
            {activeView === 'dashboard' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-300"></div>}
          </button>

          {/* Configuration Nav Item */}
          {canSeeConfig && (
            <button onClick={() => { onNavigate('config'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'config' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Configuration</span>
              {activeView === 'config' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-300"></div>}
            </button>
          )}
        </nav>

        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 transition-colors mt-auto font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Header */}
        <header className="glass-header bg-white sticky top-0 z-10 px-4 md:px-8 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center shrink-0">
              <img src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" alt="Zuari Industries" className="h-8 md:h-10 object-contain" />
            </div>
            
            {hasBothRoles && onToggleRole && (
              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 overflow-x-auto max-w-[200px] md:max-w-none">
                <button
                  onClick={() => onToggleRole('Employee')}
                  className={`px-3 md:px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeRole === 'Employee' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >Employee</button>
                <button
                  onClick={() => onToggleRole('Manager')}
                  className={`px-3 md:px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeRole === 'Manager' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >Manager</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {onGenerateSummary && (
              <button onClick={onGenerateSummary} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-2 md:px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-100 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <span className="hidden lg:inline">AI Summary</span>
              </button>
            )}
            {onDownloadCsv && (
              <button onClick={onDownloadCsv} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-2 md:px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span className="hidden lg:inline">CSV Export</span>
              </button>
            )}
            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1 md:mx-2 shrink-0"></div>
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Welcome,</p>
              <p className="text-sm font-bold text-slate-800">{user.name.split(' ')[0]} <span className="text-slate-400 font-normal">({(activeRole || user.roles?.[0])?.toUpperCase()})</span></p>
            </div>
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="flex items-center shrink-0 ml-2">
              <img src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" alt="Adventz" className="h-8 md:h-10 object-contain" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-2 md:p-8 space-y-8 max-w-10xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

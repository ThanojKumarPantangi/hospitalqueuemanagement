import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import {useAuth} from "../../hooks/useAuth"


const Navbar = ({ activePage='Dashboard' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();


  const navLinks = [
    { name: 'Dashboard', href: '/patient/dashboard' },
    { name: 'My Tokens', href: '/tokens' },
    { name: 'Visit History', href: '/history' },
  ];
  const onLogout = () => {
    navigate("/logout")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-xl">+</span>
            </div>
            <span className="text-lg font-black tracking-tighter text-gray-800 dark:text-white uppercase">
              Care<span className="text-teal-500">Queue</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                onClick={()=>navigate(link.href)}
                className={`cursor-pointer relative text-sm font-bold transition-colors duration-300 ${
                  activePage === link.name 
                    ? 'text-teal-600 dark:text-teal-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {link.name}
                {activePage === link.name && (
                  <span className="absolute -bottom-[21px] left-0 w-full h-0.5 bg-teal-500 rounded-full shadow-[0_-2px_10px_rgba(20,184,166,0.5)]" />
                )}
              </a>
            ))}
          </div>


          {/* User Profile & Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-800 dark:text-white leading-none">{user?.name?.toUpperCase() || "NULL"}</p>
                <p className="text-[10px] text-gray-400 font-medium">{user?.role || "NULL"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 shadow-sm overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="profile" />
              </div>
            </div>
            
            <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" /> {/* Divider */}
            
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[400px] border-b border-gray-100 dark:border-gray-800' : 'max-h-0'}`}>
        
        <div className="px-4 pt-2 pb-6 space-y-2 bg-white dark:bg-gray-950">
          {navLinks.map((link) => (
            <a
              key={link.name}
              onClick={()=>navigate(link.href)}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                activePage === link.name 
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              {link.name}
            </a>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
             <div className="flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="profile" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-none">{user?.name?.toUpperCase() || "NULL"}</p>
                  <p className="text-[10px] text-gray-400">{user?.role || "NULL"}</p>
                </div>
             </div>
             
             <button 
               onClick={onLogout}
               className="w-full text-left px-4 py-3 rounded-xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
             >
               Logout Account
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
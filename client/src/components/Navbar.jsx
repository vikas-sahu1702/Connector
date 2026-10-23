import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Mic, 
  FileText, 
  User, 
  Menu, 
  X, 
  Globe, 
  Search,
  CheckCircle2,
  Building2,
  Calculator,
  Lock,
  SlidersHorizontal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useUser } from '../context/UserContext';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenVoiceAssistant, 
  onOpenSearch, 
  onOpenDigiLocker,
  comparedSchemes = [],
  onOpenComparison
}) {
  const { lang, toggleLang, t } = useLanguage();
  const { 
    fontSize, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize
  } = useAccessibility();
  const { profile } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: lang === 'hi' ? 'योजनाएं' : 'Explore Schemes', icon: Compass },
    { id: 'finder', label: lang === 'hi' ? 'पात्रता कैलकुलेटर' : 'Check Eligibility', icon: Sparkles, badge: lang === 'hi' ? 'AI संचालित' : 'AI Powered' },
    { id: 'calculator', label: lang === 'hi' ? 'डीबीटी कैलकुलेटर' : 'DBT Calculator', icon: Calculator, badge: 'New' },
    { id: 'guide', label: lang === 'hi' ? 'आवेदन गाइड' : 'Application Guide', icon: FileText },
    { id: 'dashboard', label: lang === 'hi' ? 'नागरिक डैशबोर्ड' : 'Citizen Dashboard', icon: User },
    { id: 'admin', label: lang === 'hi' ? 'एडमिन पैनल' : 'Admin Portal', icon: Building2 }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
      {/* Requested Palette Hero Accent Bar: Marigold | Ice Silver | Deep Aubergine */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#EAAA00]" title="Marigold (#EAAA00)"></div>
        <div className="bg-[#DDE3E8] border-x border-[#C5D0D9]" title="Ice Silver (#DDE3E8)"></div>
        <div className="bg-[#3A0F34]" title="Deep Aubergine (#3A0F34)"></div>
      </div>

      {/* Accessibility & Language Utility Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-amber-400 font-medium">Digital India Initiative</span>
            <span className="hidden sm:inline-block text-slate-500">•</span>
            <span className="text-slate-300">National Welfare Guidance Platform</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* DigiLocker Sandbox Link */}
            {onOpenDigiLocker && (
              <button
                onClick={onOpenDigiLocker}
                className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900 text-blue-200 hover:text-white border border-blue-700 font-medium text-[11px] transition-colors cursor-pointer"
                title="DigiLocker Document Verification"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>DigiLocker Vault</span>
              </button>
            )}

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700">
              <span className="text-[11px] text-slate-400 mr-1.5 font-medium hidden xs:inline">Text:</span>
              <button 
                onClick={decreaseFontSize}
                title="Decrease Font Size"
                className={`px-1.5 py-0.5 rounded text-xs font-bold hover:bg-slate-700 ${fontSize === 'sm' ? 'text-amber-400' : 'text-slate-300'}`}
              >
                A-
              </button>
              <button 
                onClick={resetFontSize}
                title="Normal Font Size"
                className={`px-1.5 py-0.5 rounded text-xs font-bold hover:bg-slate-700 ${fontSize === 'base' ? 'text-amber-400' : 'text-slate-300'}`}
              >
                A
              </button>
              <button 
                onClick={increaseFontSize}
                title="Increase Font Size"
                className={`px-1.5 py-0.5 rounded text-xs font-bold hover:bg-slate-700 ${fontSize === 'lg' || fontSize === 'xl' ? 'text-amber-400' : 'text-slate-300'}`}
              >
                A+
              </button>
            </div>



            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-700 text-white hover:bg-blue-600 font-medium transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Emblem */}
          <div 
            onClick={() => handleNavClick('explore')}
            className="flex items-center gap-3.5 cursor-pointer select-none group shrink-0"
          >
            {/* National Crest Badge */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 text-white flex flex-col items-center justify-center p-1.5 shadow-md border border-blue-800 group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase mt-0.5">INDIA</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-blue-950 font-sans">
                  CONNECTOR
                </span>
                <span className="bg-[#DDE3E8] text-[#3A0F34] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#C5D0D9] hidden md:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#EAAA00]" /> Verified GovTech
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                {lang === 'hi' ? 'हर नागरिक को हर अवसर से जोड़ना' : 'Connecting Every Citizen to Every Opportunity'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative cursor-pointer ${
                    isActive
                      ? 'text-blue-900 bg-blue-50 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.2 rounded-full border border-amber-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Voice Assistant Button, Comparison Trigger & Search Action */}
          <div className="flex items-center gap-2">
            
            {/* Compare Floating Trigger */}
            {comparedSchemes.length > 0 && (
              <button
                onClick={onOpenComparison}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-900 hover:bg-blue-200 text-xs font-bold border border-blue-300 transition-colors animate-bounce"
                title="View Side-by-Side Comparison"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-800" />
                <span>Compare ({comparedSchemes.length})</span>
              </button>
            )}

            {/* Quick Search Omnibox Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Search Schemes"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* AI Voice Assistant Trigger */}
            <button
              onClick={onOpenVoiceAssistant}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-[#EAAA00] to-[#D49B00] hover:from-[#D49B00] hover:to-[#BD8700] text-[#190516] font-bold text-xs sm:text-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border border-[#FFE594]/50"
            >
              <div className="relative">
                <Mic className="w-4 h-4 text-[#190516]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#3A0F34] rounded-full animate-ping"></span>
              </div>
              <span className="hidden sm:inline">
                {lang === 'hi' ? 'AI वॉयस सहायक' : 'AI Voice Assistant'}
              </span>
              <span className="sm:hidden">Voice</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-400 text-blue-950 font-bold' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

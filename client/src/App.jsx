import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Sparkles, 
  Building, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  Calculator,
  Lock,
  Printer
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { UserProvider, useUser } from './context/UserContext';

import DisclaimerBanner from './components/DisclaimerBanner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import CategoryGrid from './components/CategoryGrid';
import SchemeCard from './components/SchemeCard';
import SchemeDetailsModal from './components/SchemeDetailsModal';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import SchemeFinderWizard from './components/SchemeFinderWizard';
import SmartApplicationGuide from './components/SmartApplicationGuide';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import BenefitCalculator from './components/BenefitCalculator';
import SchemeComparisonModal from './components/SchemeComparisonModal';
import PrintablePreparationSlip from './components/PrintablePreparationSlip';
import DigiLockerVaultModal from './components/DigiLockerVaultModal';
import Footer from './components/Footer';

function MainApp() {
  const { lang, t } = useLanguage();

  // Navigation State: 'explore', 'finder', 'calculator', 'guide', 'dashboard', 'admin'
  const [activeTab, setActiveTab] = useState('explore');

  // Scheme Catalog State
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sponsorFilter, setSponsorFilter] = useState('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState('all');
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);

  // Modals & Overlays State
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState(null);
  const [schemeForGuide, setSchemeForGuide] = useState(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);
  const [slipScheme, setSlipScheme] = useState(null);

  // Side-by-side comparison state
  const [comparedSchemes, setComparedSchemes] = useState([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Fetch schemes & categories on load
  const loadData = async () => {
    setIsLoadingSchemes(true);
    try {
      const [schemesRes, catsRes] = await Promise.all([
        fetch('/api/schemes'),
        fetch('/api/categories')
      ]);
      const schemesData = await schemesRes.json();
      const catsData = await catsRes.json();

      if (schemesData.success) setSchemes(schemesData.schemes || []);
      if (catsData.success) setCategories(catsData.categories || []);
    } catch (err) {
      console.error("Failed to load platform data:", err);
    } finally {
      setIsLoadingSchemes(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter schemes
  const filteredSchemes = schemes.filter(s => {
    // Category match
    if (selectedCategory !== 'all' && s.category !== selectedCategory) {
      return false;
    }
    // Sponsor match
    if (sponsorFilter !== 'all' && !s.sponsor.toLowerCase().includes(sponsorFilter.toLowerCase())) {
      return false;
    }
    // State match
    if (selectedStateFilter !== 'all') {
      const stCrit = s.eligibilityCriteria?.states;
      if (stCrit && !stCrit.includes('all') && !stCrit.includes(selectedStateFilter)) {
        return false;
      }
    }
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchHindi = s.hindiName && s.hindiName.toLowerCase().includes(q);
      const matchMinistry = s.ministry.toLowerCase().includes(q);
      const matchTagline = s.tagline.toLowerCase().includes(q);
      const matchBrief = s.brief.toLowerCase().includes(q);
      const matchTags = s.tags && s.tags.some(t => t.toLowerCase().includes(q));
      return matchName || matchHindi || matchMinistry || matchTagline || matchBrief || matchTags;
    }
    return true;
  });

  const handleHeroSearch = (term) => {
    setSearchQuery(term);
    setActiveTab('explore');
    const catalogElement = document.getElementById('schemes-catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setActiveTab('explore');
    const catalogElement = document.getElementById('schemes-catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrepareApplication = (scheme) => {
    setSchemeForGuide(scheme);
    setActiveTab('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVoiceWithPrompt = (prompt) => {
    setVoicePrompt(prompt);
    setIsVoiceOpen(true);
  };

  const handleToggleCompare = (scheme) => {
    setComparedSchemes(prev => {
      const exists = prev.some(s => s.id === scheme.id);
      if (exists) {
        return prev.filter(s => s.id !== scheme.id);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 schemes at a time.");
          return prev;
        }
        return [...prev, scheme];
      }
    });
  };

  const handleRemoveCompare = (schemeId) => {
    setComparedSchemes(prev => prev.filter(s => s.id !== schemeId));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#E7EDF1] text-[#190516]">
      
      {/* 1. Official Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Top Accessible Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenVoiceAssistant={() => {
          setVoicePrompt('');
          setIsVoiceOpen(true);
        }}
        onOpenSearch={() => {
          setActiveTab('explore');
          document.getElementById('catalog-search-input')?.focus();
        }}
        onOpenDigiLocker={() => setIsDigiLockerOpen(true)}
        comparedSchemes={comparedSchemes}
        onOpenComparison={() => setIsComparisonOpen(true)}
      />

      {/* 3. Main Views */}
      <main className="flex-1">

        {/* VIEW 1: EXPLORE & HOMEPAGE */}
        {activeTab === 'explore' && (
          <div>
            {/* Hero Section */}
            <Hero
              onSearchSubmit={handleHeroSearch}
              onFindSchemesClick={() => {
                setActiveTab('finder');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onVoiceAssistantClick={() => {
                setVoicePrompt('');
                setIsVoiceOpen(true);
              }}
              onExploreClick={() => {
                document.getElementById('schemes-catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Categories Grid */}
            <CategoryGrid
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              categories={categories}
            />

            {/* How It Works 3-Step Guide */}
            <HowItWorks 
              onStartFinderClick={() => {
                setActiveTab('finder');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Comprehensive Schemes Catalog Section */}
            <section id="schemes-catalog-section" className="py-20 bg-[#DDE3E8]/50 border-b border-[#DDE3E8]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Catalog Controls Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#EAAA00] mb-1">
                      {lang === 'hi' ? 'समस्त सरकारी योजनाएं' : 'National Scheme Repository'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A0F34]">
                      {lang === 'hi' ? 'योजना सूची एवं खोज' : 'Explore All Government Schemes'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {lang === 'hi' 
                        ? `${filteredSchemes.length} योजनाएं उपलब्ध • सरकारी पोर्टल से प्रमाणित` 
                        : `Showing ${filteredSchemes.length} verified welfare initiatives • Gazette cross-checked`}
                    </p>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Catalog Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="catalog-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'hi' ? 'योजना खोजें...' : 'Search by name or benefit...'}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-blue-950 shadow-2xs"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* State Filter */}
                    <select
                      value={selectedStateFilter}
                      onChange={(e) => setSelectedStateFilter(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden shadow-2xs"
                    >
                      <option value="all">All States & Central</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Bihar">Bihar</option>
                    </select>

                    {/* Sponsor Filter Dropdown */}
                    <select
                      value={sponsorFilter}
                      onChange={(e) => setSponsorFilter(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden shadow-2xs"
                    >
                      <option value="all">All Sponsorships</option>
                      <option value="Central Sector">Central Sector</option>
                      <option value="Centrally Sponsored">Centrally Sponsored</option>
                      <option value="State Government">State Governments</option>
                    </select>

                    {/* Reset Button */}
                    {(selectedCategory !== 'all' || searchQuery || sponsorFilter !== 'all' || selectedStateFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                          setSponsorFilter('all');
                          setSelectedStateFilter('all');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Schemes Cards Grid */}
                {isLoadingSchemes ? (
                  <div className="py-20 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-900 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Loading verified welfare schemes...</p>
                  </div>
                ) : filteredSchemes.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {lang === 'hi' ? 'कोई योजना नहीं मिली' : 'No matching schemes found'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      {lang === 'hi' 
                        ? 'कृपया अपने खोज शब्दों या फ़िल्टर को बदलकर देखें।' 
                        : 'Try searching with different keywords like "kisan", "scholarship", "hospital", or "women".'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                        setSponsorFilter('all');
                        setSelectedStateFilter('all');
                      }}
                      className="px-5 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      View All Schemes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchemes.map((scheme) => (
                      <SchemeCard
                        key={scheme.id}
                        scheme={scheme}
                        onViewDetails={(s) => setSelectedSchemeForModal(s)}
                        onPrepareApplication={handlePrepareApplication}
                        onToggleCompare={handleToggleCompare}
                        isCompared={comparedSchemes.some(c => c.id === scheme.id)}
                        onOpenPrintSlip={(s) => setSlipScheme(s)}
                      />
                    ))}
                  </div>
                )}

              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: AI ELIGIBILITY FINDER */}
        {activeTab === 'finder' && (
          <SchemeFinderWizard
            onViewScheme={(s) => setSelectedSchemeForModal(s)}
            onPrepareApplication={handlePrepareApplication}
          />
        )}

        {/* VIEW 3: BENEFIT CALCULATOR */}
        {activeTab === 'calculator' && (
          <BenefitCalculator
            onExploreSchemes={() => {
              setActiveTab('explore');
              document.getElementById('schemes-catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onViewScheme={(s) => setSelectedSchemeForModal(s)}
          />
        )}

        {/* VIEW 4: SMART APPLICATION GUIDE */}
        {activeTab === 'guide' && (
          <SmartApplicationGuide
            preselectedScheme={schemeForGuide}
            allSchemes={schemes}
            onSelectScheme={(s) => setSchemeForGuide(s)}
          />
        )}

        {/* VIEW 5: CITIZEN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <UserDashboard
            allSchemes={schemes}
            onViewScheme={(s) => setSelectedSchemeForModal(s)}
            onPrepareApplication={handlePrepareApplication}
            onStartFinder={() => {
              setActiveTab('finder');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW 6: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <AdminDashboard
            schemes={schemes}
            onRefreshSchemes={loadData}
          />
        )}

      </main>

      {/* 4. Scheme Deep-Dive Details Modal */}
      {selectedSchemeForModal && (
        <SchemeDetailsModal
          scheme={selectedSchemeForModal}
          onClose={() => setSelectedSchemeForModal(null)}
          onPrepareApplication={handlePrepareApplication}
          onOpenAssistantWithPrompt={handleOpenVoiceWithPrompt}
        />
      )}

      {/* 5. AI Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        initialPrompt={voicePrompt}
        onViewScheme={(s) => setSelectedSchemeForModal(s)}
        onPrepareApplication={handlePrepareApplication}
      />

      {/* 6. Side-by-Side Comparison Modal */}
      {isComparisonOpen && (
        <SchemeComparisonModal
          schemes={comparedSchemes}
          onClose={() => setIsComparisonOpen(false)}
          onPrepareApplication={handlePrepareApplication}
          onRemoveScheme={handleRemoveCompare}
        />
      )}

      {/* 7. DigiLocker Document Vault Modal */}
      <DigiLockerVaultModal
        isOpen={isDigiLockerOpen}
        onClose={() => setIsDigiLockerOpen(false)}
      />

      {/* 8. Printable Citizen Preparation Slip */}
      {slipScheme && (
        <PrintablePreparationSlip
          scheme={slipScheme}
          onClose={() => setSlipScheme(null)}
        />
      )}

      {/* 9. Footer */}
      <Footer onOpenFeedback={() => {}} />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <UserProvider>
          <MainApp />
        </UserProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}

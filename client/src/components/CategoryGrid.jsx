import React from 'react';
import { 
  Sprout, 
  HeartPulse, 
  GraduationCap, 
  Home, 
  Sparkles, 
  Briefcase, 
  Hammer, 
  ShieldCheck, 
  Accessibility, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryGrid({ selectedCategory, onSelectCategory, categories = [] }) {
  const { lang } = useLanguage();

  const iconMap = {
    all: Layers,
    agriculture: Sprout,
    healthcare: HeartPulse,
    scholarships: GraduationCap,
    housing: Home,
    women: Sparkles,
    business: Briefcase,
    employment: Hammer,
    social_security: ShieldCheck,
    divyangjan: Accessibility
  };

  const colorStyles = {
    all: "group-hover:border-blue-600 group-hover:bg-blue-50 text-blue-800",
    agriculture: "group-hover:border-emerald-600 group-hover:bg-emerald-50 text-emerald-800",
    healthcare: "group-hover:border-rose-600 group-hover:bg-rose-50 text-rose-800",
    scholarships: "group-hover:border-amber-600 group-hover:bg-amber-50 text-amber-800",
    housing: "group-hover:border-indigo-600 group-hover:bg-indigo-50 text-indigo-800",
    women: "group-hover:border-pink-600 group-hover:bg-pink-50 text-pink-800",
    business: "group-hover:border-violet-600 group-hover:bg-violet-50 text-violet-800",
    employment: "group-hover:border-cyan-600 group-hover:bg-cyan-50 text-cyan-800",
    social_security: "group-hover:border-teal-600 group-hover:bg-teal-50 text-teal-800",
    divyangjan: "group-hover:border-orange-600 group-hover:bg-orange-50 text-orange-800"
  };

  return (
    <section className="py-16 bg-[#E7EDF1]/60 border-b border-[#DDE3E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#EAAA00] mb-1">
              {lang === 'hi' ? 'श्रेणी अनुसार खोजें' : 'Targeted Portals'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A0F34]">
              {lang === 'hi' ? 'आवश्यकता के अनुसार योजनाएं' : 'Explore Schemes by Category'}
            </h2>
          </div>
          <p className="text-sm text-[#425466] max-w-md font-medium">
            {lang === 'hi' 
              ? 'किसान, छात्र, महिला, वरिष्ठ नागरिक और उद्यमी सभी के लिए विशिष्ट सरकारी योजनाएं उपलब्ध हैं।'
              : 'Tailored welfare initiatives covering farmers, students, artisans, women, seniors, and entrepreneurs.'}
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.id] || Layers;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`category-card group text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative cursor-pointer ${
                  isSelected
                    ? 'border-[#EAAA00] bg-[#3A0F34] text-white shadow-xl ring-2 ring-[#EAAA00]/40'
                    : 'border-[#DDE3E8] bg-white hover:border-[#EAAA00] hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className={`category-icon-box w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected 
                      ? 'bg-[#EAAA00] text-[#190516] shadow-sm' 
                      : 'bg-[#DDE3E8] text-[#3A0F34] group-hover:bg-[#EAAA00] group-hover:text-[#190516]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className={`category-title text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                    isSelected ? 'text-white' : 'text-[#190516] group-hover:text-[#3A0F34]'
                  }`}>
                    {lang === 'hi' && cat.hindiName ? cat.hindiName : cat.name}
                  </h3>
                </div>

                <div className="mt-4 pt-2 border-t border-[#DDE3E8]/60 flex items-center justify-between text-xs">
                  <span className={`category-count font-bold ${isSelected ? 'text-[#EAAA00]' : 'text-[#61758A] group-hover:text-[#EAAA00]'}`}>
                    {cat.count !== undefined ? `${cat.count} ${lang === 'hi' ? 'योजनाएं' : 'Schemes'}` : ''}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${
                    isSelected ? 'text-[#EAAA00]' : 'text-[#889DB0] group-hover:text-[#EAAA00]'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}

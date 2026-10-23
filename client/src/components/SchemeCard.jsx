import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bookmark, 
  ExternalLink, 
  ArrowRight, 
  FileCheck, 
  Users, 
  CheckCircle2,
  Calendar,
  IndianRupee,
  Building,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Printer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

export default function SchemeCard({ 
  scheme, 
  onViewDetails, 
  onPrepareApplication, 
  onToggleCompare, 
  isCompared = false,
  onOpenPrintSlip 
}) {
  const { lang, t } = useLanguage();
  const { isBookmarked, toggleBookmark } = useUser();
  const bookmarked = isBookmarked(scheme.id);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleReadAloud = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = lang === 'hi'
      ? `${scheme.name}। ${scheme.hindiName || ''}। लाभ: ${scheme.financialBenefit || scheme.tagline}। पात्रता: ${scheme.eligibilityCriteria.summary}`
      : `${scheme.name}. Benefits: ${scheme.financialBenefit || scheme.tagline}. Target: ${scheme.eligibilityCriteria.summary}`;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <article aria-label={scheme.name} className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      
      {/* Top Header Strip */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Ministry & Sponsor Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDE3E8] text-[#3A0F34] border border-[#C5D0D9]">
              <Building className="w-3 h-3 text-[#3A0F34]" />
              {scheme.sponsor}
            </span>
            {scheme.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3A0F34] text-[#EAAA00] border border-[#EAAA00]/40">
                <ShieldCheck className="w-3 h-3 text-[#EAAA00]" />
                {lang === 'hi' ? 'सत्यापित' : 'Govt Verified'}
              </span>
            )}
          </div>

          {/* Audio Listen, Compare & Bookmark Buttons */}
          <div className="flex items-center gap-1">
            {/* Audio Listen Button */}
            <button
              onClick={handleReadAloud}
              title={isSpeaking ? "Stop Speaking" : "Listen / सुनें (Audio Narration)"}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSpeaking 
                  ? 'bg-amber-500 text-slate-950 border-amber-600 animate-pulse' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Compare Checkbox Button */}
            {onToggleCompare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(scheme);
                }}
                title={isCompared ? "Remove from comparison" : "Add to Compare"}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isCompared
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-900 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            {/* Bookmark Button */}
            <button
              onClick={() => toggleBookmark(scheme.id)}
              title={bookmarked ? "Remove Bookmark" : "Save Scheme"}
              aria-label={bookmarked ? "Remove Bookmark" : "Save Scheme"}
              className={`p-1.5 rounded-lg border transition-colors ${
                bookmarked
                  ? 'bg-amber-50 border-amber-300 text-amber-600'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scheme Title & Ministry */}
        <div className="mb-3">
          <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mb-1">
            {scheme.ministry}
          </div>
          <h3 className="text-lg font-bold text-blue-950 group-hover:text-blue-700 transition-colors leading-snug">
            {scheme.name}
          </h3>
          {scheme.hindiName && (
            <div className="text-xs text-slate-500 font-medium mt-0.5 font-hindi">
              {scheme.hindiName}
            </div>
          )}
        </div>

        {/* Financial Benefit Badge */}
        {scheme.financialBenefit && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 my-3.5 flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
              <IndianRupee className="w-4 h-4 font-bold" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                {lang === 'hi' ? 'सीधा आर्थिक लाभ' : 'Direct Assistance'}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                {scheme.financialBenefit}
              </div>
            </div>
          </div>
        )}

        {/* Brief Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {scheme.brief}
        </p>

        {/* Quick Criteria Pills */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-700">{lang === 'hi' ? 'पात्रता:' : 'Target:'}</span>
            <span className="text-slate-600 line-clamp-1">{scheme.eligibilityCriteria.summary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#EAAA00] shrink-0" />
            <span className="font-semibold text-slate-700">{lang === 'hi' ? 'दस्तावेज:' : 'Docs:'}</span>
            <span className="text-slate-600">
              {scheme.documentsRequired.length} {lang === 'hi' ? 'अनिवार्य प्रमाण पत्र' : 'Required documents'}
            </span>
          </div>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="px-5 sm:px-6 py-3.5 bg-[#E7EDF1]/60 border-t border-[#DDE3E8] flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(scheme)}
          className="text-xs sm:text-sm font-bold text-[#3A0F34] hover:text-[#EAAA00] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{lang === 'hi' ? 'विस्तृत विवरण' : 'View Details'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenPrintSlip && (
            <button
              onClick={() => onOpenPrintSlip(scheme)}
              title="Print Application Preparation Slip"
              className="p-1.5 text-slate-500 hover:text-[#3A0F34] hover:bg-[#DDE3E8] rounded transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onPrepareApplication(scheme)}
            className="px-3 py-1.5 rounded-xl bg-[#3A0F34] hover:bg-[#190516] text-[#EAAA00] hover:text-white font-bold text-xs transition-colors shadow-xs border border-[#EAAA00]/40 cursor-pointer"
          >
            {lang === 'hi' ? 'आवेदन सहायता' : 'Prepare App'}
          </button>
          
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Official Government Portal"
            className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-200 rounded transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

    </article>
  );
}

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  ExternalLink, 
  Heart, 
  Send, 
  Lock, 
  CheckCircle2,
  Building,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ onOpenFeedback }) {
  const { lang, t } = useLanguage();
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const submitQuickFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText, role: 'Citizen via Footer' })
      });
      setFeedbackSent(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSent(false), 4000);
    } catch (err) {}
  };

  const emergencyHelplines = [
    { name: "Ayushman PM-JAY (Health)", num: "14555 / 1800-111-565" },
    { name: "PM-KISAN Helpline (Farmer)", num: "155261 / 011-24300606" },
    { name: "National Scholarship Portal", num: "0120-6619540" },
    { name: "PM SVANidhi (Street Vendors)", num: "1800-11-1979" },
    { name: "Cyber Financial Fraud", num: "1930" },
    { name: "UIDAI Aadhaar Helpline", num: "1947" }
  ];

  const officialGovLinks = [
    { name: "National Portal of India", url: "https://www.india.gov.in" },
    { name: "myScheme Central Platform", url: "https://www.myscheme.gov.in" },
    { name: "Direct Benefit Transfer (DBT Bharat)", url: "https://dbtbharat.gov.in" },
    { name: "Digital India Initiative", url: "https://www.digitalindia.gov.in" },
    { name: "Common Services Centres (CSC)", url: "https://csc.gov.in" }
  ];

  return (
    <footer className="bg-gradient-to-b from-[#190516] to-[#0E030C] text-[#DDE3E8] pt-16 pb-12 border-t border-[#3A0F34]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Trust & Non-Impersonation Disclaimer Banner */}
        <div className="p-6 rounded-2xl bg-[#260822] border border-[#3A0F34] text-xs sm:text-sm text-[#DDE3E8]/90 flex flex-col md:flex-row items-start gap-4 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-white text-sm">
              {lang === 'hi' ? 'महत्वपूर्ण वैधानिक अस्वीकरण एवं नागरिक सुरक्षा नीति' : 'Statutory Independence & Security Disclaimer'}
            </h4>
            <p className="leading-relaxed text-slate-400">
              {lang === 'hi'
                ? 'CONNECTOR भारतीय नागरिकों के लिए विकसित एक स्वतंत्र मार्गदर्शन और सूचना मंच है। यह किसी भी सरकारी मंत्रालय, विभाग या प्राधिकरण का प्रतिरूपण नहीं करता है। सभी वित्तीय लाभ और योजनाओं की अंतिम स्वीकृति संबंधित राज्य व केंद्र सरकार के विभागों द्वारा उनके आधिकारिक पोर्टल्स (.gov.in / .nic.in) पर ही दी जाती है। हम कभी भी आपसे ओटीपी, पासवर्ड या किसी सेवा के लिए पैसे नहीं मांगते।'
                : 'CONNECTOR is an independent welfare discovery and guidance platform created for Indian citizens. It does not impersonate or claim to represent any government ministry or department. All scheme approvals, financial disbursements, and welfare determinations remain strictly under the jurisdiction of designated Government of India and State authorities via verified official portals (.gov.in / .nic.in). We never request OTPs, passwords, or processing fees.'}
            </p>
          </div>
        </div>

        {/* 4-Columns Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: About CONNECTOR */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
              <span>CONNECTOR</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'हर नागरिक को हर सरकारी अवसर से जोड़ने वाला पारदर्शी, निःशुल्क और सुलभ मंच।'
                : 'Connecting every citizen to every opportunity through transparent AI assistance and verified welfare data.'}
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Built in alignment with the Digital Public Infrastructure (DPI) vision for inclusive welfare delivery.
            </div>
          </div>

          {/* Col 2: Official Toll-Free Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Official National Helplines</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {emergencyHelplines.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">{item.name}:</span>
                  <span className="font-bold text-white font-mono">{item.num}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Official Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Verified Portals (.gov.in)</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {officialGovLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>{item.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Citizen Feedback */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {lang === 'hi' ? 'नागरिक सुझाव / प्रतिक्रिया' : 'Citizen Feedback'}
            </h4>
            <p className="text-xs text-slate-400">
              Help us improve scheme accuracy and language clarity.
            </p>

            <form onSubmit={submitQuickFeedback} className="space-y-2">
              <textarea
                rows="2"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your suggestion or report outdated info..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              ></textarea>

              <button
                type="submit"
                disabled={!feedbackText.trim()}
                className="w-full py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Submit Feedback</span>
              </button>

              {feedbackSent && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Thank you! Your feedback has been recorded.</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} CONNECTOR Platform. Open Citizen Guidance Interface.
          </div>
          <div className="flex items-center gap-4">
            <span>WCAG 2.1 AA Accessible</span>
            <span>•</span>
            <span>Zero-Data Commercialization</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">100% Free Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

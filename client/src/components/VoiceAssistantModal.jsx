import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ExternalLink, 
  FileText, 
  ArrowRight, 
  CheckCircle2,
  RefreshCw,
  Languages,
  Key,
  Check,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceAssistantModal({ isOpen, onClose, initialPrompt = '', onViewScheme, onPrepareApplication }) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: lang === 'hi'
        ? "नमस्ते! मैं CONNECTOR सहायक हूँ। आप बोलकर या लिखकर सरकारी योजनाओं के बारे में पूछ सकते हैं। जैसे: \"मुझे स्कॉलरशिप के लिए कौनसी योजना मिलेगी?\" या \"किसान खाद और बीज सब्सिडी\"।"
        : "Namaste! I am Connector Sahayak. You can speak or type your question to find matching government schemes. For example: \"Which scholarship scheme can I get?\" or \"How to get ₹5 Lakh free hospital cover?\"",
      schemes: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(lang === 'hi' ? 'hi-IN' : 'en-IN');

  // LLM API Key Configuration State
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [inputApiKey, setInputApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState(null);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/assistant/status');
      const data = await res.json();
      if (data.success) {
        setAssistantStatus(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!inputApiKey.trim()) return;
    setIsSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/assistant/configure-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, apiKey: inputApiKey.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setKeySaveMessage({ type: 'success', text: data.message });
        setInputApiKey('');
        await fetchStatus();
        setTimeout(() => {
          setApiKeyModalOpen(false);
          setKeySaveMessage(null);
        }, 1500);
      } else {
        setKeySaveMessage({ type: 'error', text: data.error || 'Failed to save key' });
      }
    } catch (err) {
      setKeySaveMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingKey(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Initial Prompt if passed
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  // Text to Speech
  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any active utterance
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.95; // Gentle, clear speed

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = selectedLanguage;
          recognitionRef.current.start();
        } else {
          alert(lang === 'hi' ? 'आपके ब्राउज़र में वॉयस रिकॉग्निशन समर्थित नहीं है। कृपया लिखकर पूछें।' : 'Speech recognition is not supported in this browser. Please type your query.');
        }
      } catch (err) {
        console.error("Recognition start err:", err);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query, 
          language: selectedLanguage.startsWith('hi') ? 'hi' : 'en' 
        })
      });

      const data = await res.json();
      if (data.success) {
        const botMsg = {
          sender: 'bot',
          text: data.reply,
          schemes: data.matchedSchemes || [],
          suggestedQueries: data.suggestedQueries || [],
          isLLMPowered: data.isLLMPowered,
          provider: data.provider
        };
        setMessages(prev => [...prev, botMsg]);

        // Speak aloud
        if (ttsEnabled) {
          speakText(data.voiceText || data.reply);
        }
      } else {
        throw new Error('Assistant API error');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: lang === 'hi' 
            ? "माफ़ कीजिए, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।" 
            : "I am having trouble connecting to the knowledge base right now. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    { text: lang === 'hi' ? 'मुझे स्कॉलरशिप के लिए कौनसी योजना मिलेगी?' : 'Which scholarship scheme can I get?', icon: '🎓' },
    { text: lang === 'hi' ? 'किसान भाईयों के लिए सरकारी योजनाएं' : 'Welfare schemes for farmers & crops', icon: '🌾' },
    { text: lang === 'hi' ? 'आयुष्मान कार्ड में 5 लाख का मुफ्त इलाज कैसे मिलेगा?' : 'Free ₹5 Lakh hospitalization with Ayushman Bharat', icon: '🏥' },
    { text: lang === 'hi' ? 'पीएम विश्वकर्मा योजना में 15000 टूलकिट सहायता' : 'PM Vishwakarma ₹15,000 modern toolkit grant', icon: '🔨' },
    { text: lang === 'hi' ? 'सुकन्या समृद्धि योजना में खाता कैसे खोलें?' : 'Sukanya Samriddhi Yojana for daughter', icon: '👧' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div className="bg-white rounded-3xl w-full max-w-3xl h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Assistant Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-800 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-blue-950 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {lang === 'hi' ? 'CONNECTOR वाणी सहायक' : 'CONNECTOR Sahayak'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  AI Voice
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {lang === 'hi' ? 'बोलकर या लिखकर पूछें • हिंदी और English' : 'Speak or Type in Hindi & English'}
              </p>
            </div>
          </div>

          {/* Controls: API Key, Audio mute, Language, Close */}
          <div className="flex items-center gap-2">
            {/* Free API Key Manager Trigger */}
            <button
              onClick={() => setApiKeyModalOpen(!apiKeyModalOpen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                assistantStatus?.isLLMConfigured 
                  ? 'bg-[#EAAA00] text-[#190516] border-[#FFE594] font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-[#DDE3E8] border-[#DDE3E8]/30'
              }`}
              title="Configure Free AI / LLM API Key"
            >
              <Key className="w-3.5 h-3.5 text-[#EAAA00]" />
              <span className="hidden sm:inline">
                {assistantStatus?.isLLMConfigured ? 'LLM Active' : 'Free API Key'}
              </span>
            </button>

            {/* Language Toggle for STT */}
            <button
              onClick={() => {
                const next = selectedLanguage === 'hi-IN' ? 'en-IN' : 'hi-IN';
                setSelectedLanguage(next);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-xs font-semibold text-blue-200 flex items-center gap-1.5 border border-blue-700 transition-colors cursor-pointer"
              title="Change Voice Recognition Language"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedLanguage === 'hi-IN' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setTtsEnabled(!ttsEnabled);
              }}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                ttsEnabled ? 'bg-blue-900 text-amber-400 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={ttsEnabled ? "Read Aloud Enabled" : "Muted"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopSpeaking();
                if (isListening) recognitionRef.current?.stop();
                onClose();
              }}
              className="p-2 rounded-lg bg-blue-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
              title="Close Voice Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Free API Key Configuration Drawer */}
        {apiKeyModalOpen && (
          <div className="bg-[#190516] text-white p-4 sm:p-5 border-b border-[#3A0F34] animate-in slide-in-from-top-2 shrink-0 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#EAAA00]" />
                <h4 className="font-bold text-sm text-[#DDE3E8]">
                  Connect Free AI Key (Google Gemini / Groq)
                </h4>
              </div>
              <button 
                onClick={() => setApiKeyModalOpen(false)}
                className="text-[#889DB0] hover:text-white text-xs p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {keySaveMessage && (
              <div className={`p-2.5 rounded-xl text-xs mb-3 flex items-center gap-2 ${
                keySaveMessage.type === 'success' ? 'bg-[#EAAA00]/20 text-[#EAAA00] border border-[#EAAA00]/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {keySaveMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{keySaveMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-3">
              {/* Provider Radio Tabs */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('gemini')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedProvider === 'gemini'
                      ? 'bg-[#EAAA00] text-[#190516] font-bold border-[#EAAA00]'
                      : 'bg-white/5 border-[#DDE3E8]/20 text-[#DDE3E8] hover:bg-white/10'
                  }`}
                >
                  Google Gemini (Free)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('groq')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedProvider === 'groq'
                      ? 'bg-[#EAAA00] text-[#190516] font-bold border-[#EAAA00]'
                      : 'bg-white/5 border-[#DDE3E8]/20 text-[#DDE3E8] hover:bg-white/10'
                  }`}
                >
                  Groq LLaMA (Free)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('openai')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedProvider === 'openai'
                      ? 'bg-[#EAAA00] text-[#190516] font-bold border-[#EAAA00]'
                      : 'bg-white/5 border-[#DDE3E8]/20 text-[#DDE3E8] hover:bg-white/10'
                  }`}
                >
                  OpenAI
                </button>
              </div>

              {/* Helper info with direct link to free key */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-[#DDE3E8]/10 text-xs text-[#DDE3E8]/90 flex items-center justify-between gap-2">
                <span>
                  {selectedProvider === 'gemini' 
                    ? '✨ Get free Gemini key (no credit card needed):' 
                    : selectedProvider === 'groq'
                      ? '⚡ Get free Groq Cloud API key:'
                      : '🔑 OpenAI API key:'}
                </span>
                <a
                  href={selectedProvider === 'gemini' 
                    ? "https://aistudio.google.com/app/apikey" 
                    : selectedProvider === 'groq' 
                      ? "https://console.groq.com/keys" 
                      : "https://platform.openai.com/api-keys"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EAAA00] hover:underline font-bold flex items-center gap-1 shrink-0"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Input Box and Submit */}
              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder={selectedProvider === 'gemini' ? 'Paste Gemini Key (AIzaSy...)' : 'Paste API Key'}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-black/40 border border-[#DDE3E8]/30 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#EAAA00]"
                />
                <button
                  type="submit"
                  disabled={isSavingKey || !inputApiKey.trim()}
                  className="px-4 py-2 bg-[#EAAA00] hover:bg-[#D49B00] disabled:opacity-50 text-[#190516] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isSavingKey ? 'Activating...' : 'Activate Key'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
          
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-900 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {/* Formatted Text */}
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>

                {/* Provider Tag */}
                {msg.provider && (
                  <div className="mt-2 text-[10px] text-[#61758A] flex items-center gap-1 font-mono pt-1.5 border-t border-slate-100">
                    <Sparkles className="w-3 h-3 text-[#EAAA00]" />
                    <span>{msg.provider}</span>
                  </div>
                )}

                {/* Attached Scheme Cards if any */}
                {msg.schemes && msg.schemes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'hi' ? 'संबंधित सरकारी योजनाएं:' : 'Matching Welfare Schemes:'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.schemes.slice(0, 3).map((s) => (
                        <div 
                          key={s.id} 
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-blue-950">{s.name}</div>
                            {s.financialBenefit && (
                              <div className="text-xs font-semibold text-emerald-700 mt-0.5">{s.financialBenefit}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                onClose();
                                onViewScheme(s);
                              }}
                              className="px-2.5 py-1 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => {
                                onClose();
                                onPrepareApplication(s);
                              }}
                              className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Playing Indicator */}
                {msg.sender === 'bot' && isSpeaking && idx === messages.length - 1 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 font-semibold animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speaking response...</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-1 shadow-xs font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
                <span>{lang === 'hi' ? 'सरकारी योजना नियमों की खोज जारी है...' : 'Retrieving verified government scheme data...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {lang === 'hi' ? 'पूछें:' : 'Ask:'}
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>{p.icon}</span>
              <span>{p.text}</span>
            </button>
          ))}
        </div>

        {/* Input Bar & Big Mic Action */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0">
          
          <div className="flex items-center gap-3">
            
            {/* Big Mic Button with Pulse Waveform */}
            <button
              onClick={toggleListening}
              className={`relative p-3.5 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              }`}
              title={isListening ? "Listening... Click to stop" : "Click to Speak"}
            >
              {isListening ? (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-30 pointer-events-none"></div>
                  <MicOff className="w-5 h-5 relative z-10" />
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Text Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex-1 flex items-center bg-slate-100 rounded-2xl px-4 py-2 border border-slate-200 focus-within:border-blue-900 focus-within:bg-white transition-all"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening 
                  ? (lang === 'hi' ? 'सुन रहे हैं... बोलिए...' : 'Listening... Speak now...')
                  : (lang === 'hi' ? 'अपनी भाषा में पूछें या माइक दबाएं...' : 'Ask a question or click the mic...')
                }
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
              
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-1.5 text-blue-900 disabled:text-slate-300 hover:scale-110 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

          <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>Powered by National Welfare NLP Engine</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Bilingual Speech-to-Text & Voice Synthesis</span>
          </div>

        </div>

      </div>

    </div>
  );
}

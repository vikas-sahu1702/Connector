require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateAssistantReply } = require('./llmService');
const {
  isSupabaseConfigured,
  getSchemesFromSupabase,
  upsertSchemeInSupabase,
  deleteSchemeFromSupabase
} = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory + JSON file storage (with Supabase sync)
const schemesFilePath = path.join(__dirname, 'data', 'schemes.json');
let schemesData = [];

async function loadSchemes() {
  // 1. Initial fast load from local disk cache
  try {
    const raw = fs.readFileSync(schemesFilePath, 'utf8');
    schemesData = JSON.parse(raw);
    console.log(`[INFO] Loaded ${schemesData.length} schemes from disk cache.`);
  } catch (err) {
    console.error('[ERROR] Could not load schemes from disk cache:', err);
    schemesData = [];
  }

  // 2. If Supabase is connected, synchronize from Supabase database
  if (isSupabaseConfigured()) {
    try {
      const liveSchemes = await getSchemesFromSupabase();
      if (liveSchemes && liveSchemes.length > 0) {
        schemesData = liveSchemes;
        console.log(`[INFO] Successfully synchronized ${schemesData.length} schemes from Supabase database.`);
      } else {
        console.log('[INFO] Supabase connected. Schemes table is ready to be seeded (run: npm run seed:supabase).');
      }
    } catch (err) {
      console.warn('[WARN] Could not fetch schemes from Supabase, keeping local cache:', err.message);
    }
  }
}
loadSchemes();

// Feedback store
let feedbackList = [
  {
    id: "fb-1",
    name: "Ramesh Sharma",
    phoneOrEmail: "ramesh.kisan@gmail.com",
    role: "Farmer, UP",
    message: "PM-KISAN e-KYC instructions were very helpful. Was able to resolve my pending 16th installment.",
    rating: 5,
    timestamp: "2026-10-10T14:30:00.000Z",
    status: "reviewed"
  },
  {
    "id": "fb-2",
    name: "Sunita Devi",
    phoneOrEmail: "+91 98765 43210",
    role: "SHG Member, Bihar",
    message: "Voice assistant in Hindi helped me understand Lakhpati Didi eligibility without needing an agent.",
    rating: 5,
    timestamp: "2026-10-11T09:15:00.000Z",
    status: "reviewed"
  }
];

// Categories definition
const categories = [
  { id: "all", name: "All Schemes", hindiName: "सभी योजनाएं", icon: "Layers", color: "blue" },
  { id: "agriculture", name: "Agriculture & Farmers", hindiName: "कृषि एवं किसान कल्याण", icon: "Sprout", color: "emerald" },
  { id: "healthcare", name: "Healthcare & Wellness", hindiName: "स्वास्थ्य एवं चिकित्सा", icon: "HeartPulse", color: "rose" },
  { id: "scholarships", name: "Education & Scholarships", hindiName: "शिक्षा एवं छात्रवृत्ति", icon: "GraduationCap", color: "amber" },
  { id: "housing", name: "Housing & Shelter", hindiName: "आवास एवं मकान", icon: "Home", color: "indigo" },
  { id: "women", name: "Women & Child Care", hindiName: "महिला एवं बाल विकास", icon: "Sparkles", color: "pink" },
  { id: "business", name: "Business & MSME", hindiName: "व्यापार, कारीगर एवं ऋण", icon: "Briefcase", color: "violet" },
  { id: "employment", name: "Employment & Skill", hindiName: "रोजगार एवं कौशल विकास", icon: "Hammer", color: "cyan" },
  { id: "social_security", name: "Pension & Social Security", hindiName: "पेंशन एवं सामाजिक सुरक्षा", icon: "ShieldCheck", color: "teal" },
  { id: "divyangjan", name: "Divyangjan (Differently Abled)", hindiName: "दिव्यांगजन सशक्तिकरण", icon: "Accessibility", color: "orange" }
];

// 1. Get Categories
app.get('/api/categories', (req, res) => {
  const categoriesWithCounts = categories.map(cat => {
    const count = cat.id === 'all' 
      ? schemesData.length 
      : schemesData.filter(s => s.category === cat.id).length;
    return { ...cat, count };
  });
  res.json({ success: true, categories: categoriesWithCounts });
});

// 2. Get Schemes with filters & search
app.get('/api/schemes', (req, res) => {
  const { q, category, sponsor, limit } = req.query;
  let results = [...schemesData];

  if (category && category !== 'all') {
    results = results.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (sponsor && sponsor !== 'all') {
    results = results.filter(s => s.sponsor.toLowerCase().includes(sponsor.toLowerCase()));
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(s => {
      const matchName = s.name.toLowerCase().includes(query);
      const matchHindi = s.hindiName && s.hindiName.toLowerCase().includes(query);
      const matchMinistry = s.ministry.toLowerCase().includes(query);
      const matchBrief = s.brief.toLowerCase().includes(query);
      const matchTagline = s.tagline.toLowerCase().includes(query);
      const matchTags = s.tags && s.tags.some(t => t.toLowerCase().includes(query));
      return matchName || matchHindi || matchMinistry || matchBrief || matchTagline || matchTags;
    });
  }

  if (limit) {
    const n = parseInt(limit, 10);
    if (!isNaN(n)) results = results.slice(0, n);
  }

  res.json({
    success: true,
    total: results.length,
    schemes: results
  });
});

// 3. Get Single Scheme by ID
app.get('/api/schemes/:id', (req, res) => {
  const scheme = schemesData.find(s => s.id === req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, message: 'Scheme not found' });
  }
  res.json({ success: true, scheme });
});

// 3b. Compare Multiple Schemes by IDs
app.get('/api/schemes-compare', (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ success: false, message: 'Comma-separated ids parameter required' });
  }
  const idList = ids.split(',').map(s => s.trim().toLowerCase());
  const selectedSchemes = schemesData.filter(s => idList.includes(s.id.toLowerCase()));
  res.json({ success: true, schemes: selectedSchemes });
});

// 3c. Family DBT Benefit Calculator
app.post('/api/calculator/dbt', (req, res) => {
  const { members = [], state = "All India" } = req.body;
  
  let totalDirectCashAnnual = 0;
  let totalHealthInsuranceCover = 0;
  let totalLoanCreditFacility = 0;
  let totalScholarshipsGrant = 0;
  const eligibleSchemeList = [];

  members.forEach(member => {
    const { role, age = 30, gender = "male", inSchoolOrCollege = false } = member;

    // Evaluate matching benefits
    if (role === 'farmer') {
      const pmkisan = schemesData.find(s => s.id === 'pm-kisan');
      if (pmkisan) {
        totalDirectCashAnnual += 6000;
        eligibleSchemeList.push({ member: role, scheme: pmkisan, benefit: "₹6,000 / yr DBT", amount: 6000 });
      }
    }

    if (role === 'homemaker' || role === 'woman' || gender === 'female') {
      if (state === 'Madhya Pradesh') {
        totalDirectCashAnnual += 15000;
        eligibleSchemeList.push({ member: role, schemeName: "MP Ladli Behna Yojana", benefit: "₹15,000 / yr DBT", amount: 15000 });
      } else if (state === 'Maharashtra') {
        totalDirectCashAnnual += 18000;
        eligibleSchemeList.push({ member: role, schemeName: "Maharashtra Ladki Bahin Yojana", benefit: "₹18,000 / yr DBT", amount: 18000 });
      } else if (state === 'Karnataka') {
        totalDirectCashAnnual += 24000;
        eligibleSchemeList.push({ member: role, schemeName: "Karnataka Gruha Lakshmi", benefit: "₹24,000 / yr DBT", amount: 24000 });
      } else {
        totalDirectCashAnnual += 5000;
        eligibleSchemeList.push({ member: role, schemeName: "PMMVY (Matru Vandana)", benefit: "₹5,000 Maternity DBT", amount: 5000 });
      }
    }

    if (role === 'daughter' || (gender === 'female' && age <= 10)) {
      totalDirectCashAnnual += 25000; // SSY long term maturity + MKSY
      eligibleSchemeList.push({ member: role, schemeName: "Sukanya Samriddhi / Kanya Sumangala", benefit: "8.2% Compound Sovereign Savings + Milestone Grants", amount: 25000 });
    }

    if (role === 'student' || inSchoolOrCollege) {
      totalScholarshipsGrant += 13500;
      eligibleSchemeList.push({ member: role, schemeName: "Post-Matric Scholarship / NSP", benefit: "100% Fees + ₹13,500 Maintenance Allowance", amount: 13500 });
    }

    if (role === 'senior' || age >= 60) {
      totalDirectCashAnnual += 12000; // APY / NSAP
      totalHealthInsuranceCover = Math.max(totalHealthInsuranceCover, 500000); // Dedicated Ayushman cover
      eligibleSchemeList.push({ member: role, schemeName: "Ayushman Vay Vandana & APY Pension", benefit: "₹5,00,000 Top-up Cover + Guaranteed Monthly Pension", amount: 12000 });
    }

    if (role === 'artisan') {
      totalDirectCashAnnual += 15000; // toolkit
      totalLoanCreditFacility += 300000;
      eligibleSchemeList.push({ member: role, schemeName: "PM Vishwakarma", benefit: "₹15,000 Toolkit + ₹3,00,000 Loan @ 5%", amount: 15000 });
    }

    if (role === 'vendor') {
      totalLoanCreditFacility += 50000;
      eligibleSchemeList.push({ member: role, schemeName: "PM SVANidhi", benefit: "Up to ₹50,000 Loan + 7% Interest Subsidy", amount: 50000 });
    }
  });

  // Standard family health cover (Ayushman PM-JAY)
  if (totalHealthInsuranceCover === 0) {
    totalHealthInsuranceCover = 500000;
  }

  res.json({
    success: true,
    summary: {
      totalDirectCashAnnual,
      totalHealthInsuranceCover,
      totalLoanCreditFacility,
      totalScholarshipsGrant,
      totalFinancialEntitlement: totalDirectCashAnnual + totalHealthInsuranceCover + totalScholarshipsGrant,
      eligibleSchemes: eligibleSchemeList
    }
  });
});

// 4. AI-Powered Eligibility Checker
app.post('/api/eligibility/check', (req, res) => {
  const {
    age,
    gender,
    occupation,
    income,
    category: socialCategory,
    education,
    hasLand,
    isDisability,
    isPregnant,
    hasPuccaHouse,
    hasGirlChildUnder10
  } = req.body;

  const parsedAge = age ? parseInt(age, 10) : 25;
  const parsedIncome = income !== undefined && income !== '' ? parseInt(income, 10) : 150000;

  const evaluated = schemesData.map(scheme => {
    let score = 100;
    const reasons = [];
    const missing = [];
    const crit = scheme.eligibilityCriteria;

    // Age Check
    if (crit.minAge !== undefined && crit.maxAge !== undefined) {
      if (parsedAge >= crit.minAge && parsedAge <= crit.maxAge) {
        reasons.push(`Age ${parsedAge} is within eligible range (${crit.minAge}-${crit.maxAge} years)`);
      } else {
        score -= 40;
        missing.push(`Age is outside required criteria (${crit.minAge}-${crit.maxAge} years)`);
      }
    }

    // Gender Check
    if (crit.genders && !crit.genders.includes("all")) {
      if (crit.genders.includes(gender)) {
        reasons.push(`Targeted gender requirement fulfilled (${gender})`);
      } else {
        score -= 50;
        missing.push(`Scheme specifically targets ${crit.genders.join('/')}`);
      }
    }

    // Income Check
    if (crit.maxIncome !== null && crit.maxIncome !== undefined) {
      if (parsedIncome <= crit.maxIncome) {
        reasons.push(`Annual income ₹${parsedIncome.toLocaleString('en-IN')} meets limit (≤ ₹${crit.maxIncome.toLocaleString('en-IN')})`);
      } else {
        score -= 35;
        missing.push(`Annual income ₹${parsedIncome.toLocaleString('en-IN')} exceeds threshold (₹${crit.maxIncome.toLocaleString('en-IN')})`);
      }
    }

    // Occupation Check
    if (crit.occupations && !crit.occupations.includes("all")) {
      const occMatch = crit.occupations.some(o => 
        o === occupation || 
        (occupation === 'farmer' && o.includes('agri')) ||
        (occupation === 'artisan' && ['carpenter', 'blacksmith', 'tailor', 'potter', 'barber'].includes(o))
      );
      if (occMatch) {
        score += 15;
        reasons.push(`Occupation (${occupation}) strongly aligns with scheme focus`);
      } else if (occupation) {
        score -= 30;
        missing.push(`Scheme prioritizes: ${crit.occupations.slice(0, 4).join(', ')}`);
      }
    }

    // Specific Conditions Check
    if (crit.landRequired) {
      if (hasLand) {
        reasons.push(`Landholding record criteria fulfilled`);
      } else {
        score -= 50;
        missing.push(`Cultivable agricultural landholding required`);
      }
    }

    if (scheme.id === 'pm-awas-yojana-urban' || scheme.id === 'pm-awas-yojana-gramin') {
      if (!hasPuccaHouse) {
        reasons.push(`Eligible: Does not currently own a pucca house`);
      } else {
        score -= 60;
        missing.push(`Exclusion: Beneficiary family already owns a pucca house`);
      }
    }

    if (scheme.id === 'sukanya-samriddhi-yojana') {
      if (hasGirlChildUnder10) {
        reasons.push(`Eligible girl child under 10 years present in household`);
      } else {
        score -= 60;
        missing.push(`Requires a girl child below 10 years of age`);
      }
    }

    if (scheme.id === 'pm-matru-vandana-yojana') {
      if (isPregnant) {
        reasons.push(`Applicant is pregnant or lactating mother`);
      } else {
        score -= 50;
        missing.push(`Restricted to pregnant women and nursing mothers`);
      }
    }

    if (scheme.id === 'adip-divyangjan') {
      if (isDisability) {
        reasons.push(`Divyangjan beneficiary with 40%+ disability status`);
      } else {
        score -= 70;
        missing.push(`Requires verified disability certificate / UDID Card (40%+)`);
      }
    }

    // Clamp score
    const finalScore = Math.max(10, Math.min(100, score));
    let matchStatus = "eligible";
    if (finalScore < 60) matchStatus = "ineligible";
    else if (finalScore < 85) matchStatus = "partially_eligible";

    return {
      scheme,
      matchScore: finalScore,
      matchStatus,
      reasons: reasons.slice(0, 3),
      missing: missing.slice(0, 2)
    };
  });

  // Sort by highest score first
  evaluated.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    success: true,
    totalEvaluated: evaluated.length,
    eligibleCount: evaluated.filter(e => e.matchStatus === 'eligible').length,
    partialCount: evaluated.filter(e => e.matchStatus === 'partially_eligible').length,
    matches: evaluated
  });
});

// 5. AI Conversational Assistant ("Connector Sahayak / वानी")
// Returns assistant status and active provider
app.get('/api/assistant/status', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());

  let activeProvider = "Built-in Verified Engine (Pattern Matching)";
  if (hasGroq) activeProvider = "Groq API (Free LLaMA 3.3 active)";
  else if (hasGemini) activeProvider = "Google Gemini API (Free tier active)";
  else if (hasOpenAI) activeProvider = "OpenAI API active";

  res.json({
    success: true,
    isLLMConfigured: hasGemini || hasGroq || hasOpenAI,
    activeProvider,
    providers: {
      gemini: hasGemini,
      groq: hasGroq,
      openai: hasOpenAI
    }
  });
});

// Save API key dynamically (also persists to .env)
app.post('/api/assistant/configure-key', (req, res) => {
  const { provider = 'gemini', apiKey = '' } = req.body;
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return res.status(400).json({ success: false, error: "API key cannot be empty." });
  }

  if (provider === 'gemini') process.env.GEMINI_API_KEY = trimmed;
  else if (provider === 'groq') process.env.GROQ_API_KEY = trimmed;
  else if (provider === 'openai') process.env.OPENAI_API_KEY = trimmed;

  try {
    const envPath = path.join(__dirname, '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const varName = provider === 'gemini' ? 'GEMINI_API_KEY' : (provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY');
    
    if (content.includes(`${varName}=`)) {
      content = content.replace(new RegExp(`${varName}=.*`), `${varName}=${trimmed}`);
    } else {
      content += `\n${varName}=${trimmed}\n`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`[INFO] Successfully persisted ${varName} to ${envPath}`);
  } catch (err) {
    console.warn("[WARN] Could not persist to .env file:", err.message);
  }

  res.json({
    success: true,
    message: `${provider.toUpperCase()} API key configured and activated successfully!`,
    activeProvider: provider
  });
});

// Chat endpoint with LLM + Grounded RAG + Fallback
app.post('/api/assistant/chat', async (req, res) => {
  const { message = '', language = 'en', customApiKey, customProvider } = req.body;
  const q = message.trim().toLowerCase();

  // Try LLM Service first (Gemini / Groq / OpenAI)
  try {
    const llmResult = await generateAssistantReply({
      message,
      language,
      schemesData,
      customApiKey,
      customProvider
    });

    if (llmResult && llmResult.isLLMPowered) {
      return res.json({
        success: true,
        reply: llmResult.reply,
        voiceText: llmResult.voiceText,
        matchedSchemes: llmResult.matchedSchemes,
        isLLMPowered: true,
        provider: llmResult.provider,
        suggestedQueries: [
          "How to check eligibility for PM-KISAN?",
          "Free hospital treatment under Ayushman Bharat",
          "PM Vishwakarma ₹15,000 toolkit application",
          "Sukanya Samriddhi Yojana account opening rules"
        ]
      });
    }
  } catch (llmErr) {
    console.warn("[WARN] LLM Generation encountered an error, falling back to verified engine:", llmErr.message);
  }

  // Graceful fallback to built-in verified engine
  let matched = [];
  let answerText = "";
  let voiceText = "";

  if (q.includes("kisan") || q.includes("farmer") || q.includes("khet") || q.includes("krishi") || q.includes("khad") || q.includes("6000")) {
    matched = schemesData.filter(s => s.category === 'agriculture');
    if (language === 'hi' || q.includes("mujhe") || q.includes("kaunsi") || q.includes("kare")) {
      answerText = "किसानों के लिए भारत सरकार की सबसे प्रमुख योजना **PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)** है। इसमें हर साल ₹6,000 तीन किस्तों में (₹2,000 x 3) सीधे बैंक खाते में DBT के माध्यम से दिए जाते हैं। फसल सुरक्षा के लिए **PM फसल बीमा योजना (PMFBY)** में केवल 1.5% से 2% प्रीमियम पर संपूर्ण मुआवजा मिलता है।";
      voiceText = "किसानों के लिए पीएम किसान सम्मान निधि में हर साल छह हजार रुपये और फसल बीमा योजना में फसल सुरक्षा मिलती है।";
    } else {
      answerText = "For farmers, the premier government welfare initiative is **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**, offering guaranteed direct financial aid of ₹6,000 annually across 3 installments directly via DBT. For crop loss safety, **PM Fasal Bima Yojana (PMFBY)** protects against drought and excess rain at just 1.5% - 2% nominal premium.";
      voiceText = "For farmers, PM-KISAN provides six thousand rupees per year, and PM Fasal Bima Yojana offers crop insurance at minimal cost.";
    }
  } else if (q.includes("scholarship") || q.includes("student") || q.includes("chhatravritti") || q.includes("padhai") || q.includes("college") || q.includes("school")) {
    matched = schemesData.filter(s => s.category === 'scholarships' || s.id === 'pm-kvy');
    if (language === 'hi' || q.includes("mujhe") || q.includes("kaunsi")) {
      answerText = "विद्यार्थियों के लिए **पोस्ट-मैट्रिक छात्रवृत्ति योजना (Post-Matric Scholarship)** उपलब्ध है, जिसमें कॉलेज/विश्वविद्यालय की 100% अनिवार्य फीस माफ होती है और ₹13,500 प्रति वर्ष का मेंटेनेंस भत्ता मिलता है। आप नेशनल स्कॉलरशिप पोर्टल (scholarships.gov.in) पर OTR बनाकर आवेदन कर सकते हैं। कौशल सीखने के लिए **PMKVY 4.0** में मुफ्त प्रशिक्षण व प्रमाण पत्र मिलता है।";
      voiceText = "छात्रों के लिए पोस्ट मैट्रिक स्कॉलरशिप में पूरी कॉलेज फीस और तेरह हजार पांच सौ रुपये सालाना भत्ता मिलता है।";
    } else {
      answerText = "For students, the **Post-Matric Scholarship Scheme** provides 100% compulsory college/university tuition fee coverage plus up to ₹13,500 per year maintenance allowance deposited directly into your bank account. You can apply via the National Scholarship Portal (scholarships.gov.in). Additionally, **PMKVY 4.0** offers free industry-recognized skill courses.";
      voiceText = "Eligible students can receive complete tuition fee waiver and maintenance allowance through the Post-Matric Scholarship scheme.";
    }
  } else if (q.includes("hospital") || q.includes("health") || q.includes("ilaj") || q.includes("swasthya") || q.includes("ayushman") || q.includes("5 lakh") || q.includes("bima")) {
    matched = schemesData.filter(s => s.category === 'healthcare');
    if (language === 'hi' || q.includes("mujhe") || q.includes("kaise")) {
      answerText = "इलाज और अस्पताल खर्च के लिए **आयुष्मान भारत PM-JAY** योजना है। इसके तहत प्रत्येक पात्र परिवार को देश भर के सरकारी एवं निजी अस्पतालों में हर साल ₹5,00,000 तक का कैशलेस व मुफ्त इलाज मिलता है। 70 वर्ष या उससे अधिक उम्र के सभी बुजुर्गों के लिए 'आयुष्मान वय वंदना' के तहत यह पूरी तरह निःशुल्क है।";
      voiceText = "आयुष्मान भारत योजना के तहत प्रति परिवार पांच लाख रुपये तक का कैशलेस इलाज सरकारी और प्राइवेट अस्पतालों में मुफ्त मिलता है।";
    } else {
      answerText = "For medical treatment and hospitalization, **Ayushman Bharat PM-JAY** provides up to ₹5,00,000 cashless health cover per family per year across empaneled public and private hospitals. Furthermore, all senior citizens aged 70 and above are now eligible for free dedicated health coverage irrespective of income under Ayushman Vay Vandana.";
      voiceText = "Ayushman Bharat PM-JAY provides up to five lakh rupees cashless hospital treatment per family per year.";
    }
  } else if (q.includes("house") || q.includes("ghar") || q.includes("makaan") || q.includes("awas") || q.includes("housing") || q.includes("pucca")) {
    matched = schemesData.filter(s => s.category === 'housing');
    if (language === 'hi' || q.includes("kaise") || q.includes("apply")) {
      answerText = "पक्के मकान के निर्माण या खरीद के लिए दो मुख्य योजनाएं हैं:\n1. **PMAY-G (ग्रामीण)**: ग्रामीण क्षेत्रों में कच्चे मकान वाले परिवारों को ₹1.20 लाख से ₹1.30 लाख की सीधी आर्थिक मदद और मनरेगा मजदूरी मिलती है।\n2. **PMAY-U 2.0 (शहरी)**: शहरी क्षेत्रों में होम लोन पर ₹2.5 लाख तक की ब्याज सब्सिडी व आर्थिक अनुदान मिलता है।";
      voiceText = "पीएम आवास योजना में ग्रामीण परिवारों को एक लाख बीस हजार रुपये और शहरी नागरिकों को होम लोन सब्सिडी मिलती है।";
    } else {
      answerText = "For housing assistance, there are two key verticals:\n1. **PMAY-Gramin**: Rural homeless families receive ₹1,20,000 to ₹1,30,000 direct grant plus 90 days MGNREGA wages.\n2. **PMAY-Urban 2.0**: Urban families without a pucca house receive up to ₹2.5 Lakhs in interest subsidies on affordable housing loans.";
      voiceText = "Pradhan Mantri Awas Yojana provides one lakh twenty thousand rupees for rural home building and interest subsidies in urban areas.";
    }
  } else if (q.includes("loan") || q.includes("business") || q.includes("vyapar") || q.includes("dukan") || q.includes("mudra") || q.includes("svanidhi") || q.includes("karobar") || q.includes("artisan") || q.includes("vishwakarma")) {
    matched = schemesData.filter(s => s.category === 'business');
    if (language === 'hi' || q.includes("kaise")) {
      answerText = "व्यवसाय और स्वरोजगार के लिए सरकार की प्रमुख योजनाएं:\n- **PM स्वनिधि**: रेहड़ी-पटरी वालों के लिए ₹10,000 से ₹50,000 तक बिना गारंटी कर्ज व 7% ब्याज छूट।\n- **PM विश्वकर्मा**: 18 पारंपरिक कारीगरों (बढ़ई, लोहार, दर्जी आदि) को ₹15,000 टूलकिट वाउचर और 5% ब्याज पर ₹3 लाख का बिना गारंटी लोन।\n- **MUDRA योजना**: गैर-कृषि व्यवसाय के लिए ₹50,000 से ₹20 लाख तक का बिना गारंटी लोन।";
      voiceText = "व्यवसाय के लिए मुद्रा योजना और पीएम विश्वकर्मा योजना में बिना गारंटी सस्ता लोन और टूलकिट सहायता मिलती है।";
    } else {
      answerText = "For self-employment and small enterprises:\n- **PM SVANidhi**: Collateral-free working capital from ₹10,000 up to ₹50,000 with 7% interest subsidy for street vendors.\n- **PM Vishwakarma**: ₹15,000 modern toolkit grant + ₹3 Lakh collateral-free loan at 5% interest for 18 traditional artisan trades.\n- **PMMY (Mudra Yojana)**: Collateral-free enterprise loans from ₹50,000 up to ₹20 Lakhs across Shishu, Kishore, and Tarun categories.";
      voiceText = "For business and trades, PM SVANidhi, PM Vishwakarma, and Mudra Yojana provide collateral-free credit and toolkit incentives.";
    }
  } else if (q.includes("women") || q.includes("mahila") || q.includes("beti") || q.includes("girl") || q.includes("sukanya") || q.includes("pregnant") || q.includes("lakhpati")) {
    matched = schemesData.filter(s => s.category === 'women');
    if (language === 'hi') {
      answerText = "महिलाओं और बेटियों के लिए प्रमुख योजनाएं:\n1. **सुकन्या समृद्धि योजना (SSY)**: 10 वर्ष से कम उम्र की बेटी के लिए 8.2% वार्षिक ब्याज और 100% टैक्स फ्री बचत।\n2. **लखपति दीदी योजना**: स्वयं सहायता समूह (SHG) की महिलाओं को ₹1 लाख+ सालाना आय के लिए ड्रोन दीदी ट्रेनिंग और रियायती लोन।\n3. **PM मातृ वंदना योजना**: गर्भवती महिलाओं को पोषण के लिए ₹5,000 से ₹6,000 की नकद सहायता।";
      voiceText = "महिलाओं के लिए सुकन्या समृद्धि योजना में आठ दशमलव दो प्रतिशत ब्याज, लखपति दीदी और मातृ वंदना योजना में सीधी आर्थिक सहायता मिलती है।";
    } else {
      answerText = "For women and daughters:\n1. **Sukanya Samriddhi Yojana (SSY)**: Highest sovereign interest of 8.2% p.a. with 100% tax-free maturity for girls under 10.\n2. **Lakhpati Didi Initiative**: Micro-credit, Namo Drone Didi flight certification, and enterprise training for SHG women to earn ₹1 Lakh+ annually.\n3. **PM Matru Vandana Yojana**: Direct financial assistance of ₹5,000-₹6,000 for pregnant women.";
      voiceText = "Top women schemes include Sukanya Samriddhi Yojana for daughters, Lakhpati Didi for SHG members, and PM Matru Vandana for maternal care.";
    }
  } else if (q.includes("pension") || q.includes("old age") || q.includes("retirement") || q.includes("bujurg") || q.includes("atal")) {
    matched = schemesData.filter(s => s.category === 'social_security');
    if (language === 'hi') {
      answerText = "**अटल पेंशन योजना (APY)** में 18 से 40 वर्ष के नागरिक मात्र ₹42 से ₹210 प्रति माह जमा कर 60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 तक की आजीवन गारंटीकृत मासिक पेंशन पा सकते हैं।";
      voiceText = "अटल पेंशन योजना में साठ वर्ष की उम्र के बाद हर महीने एक हजार से पांच हजार रुपये की सरकारी गारंटी वाली पेंशन मिलती है।";
    } else {
      answerText = "Under **Atal Pension Yojana (APY)**, any Indian citizen aged 18 to 40 can contribute modest monthly savings to secure a lifelong guaranteed monthly pension of ₹1,000 to ₹5,000 upon reaching 60 years of age.";
      voiceText = "Under Atal Pension Yojana, citizens secure a guaranteed monthly pension of up to five thousand rupees after age sixty.";
    }
  } else {
    // Default fallback to top versatile schemes
    matched = schemesData.slice(0, 3);
    if (language === 'hi') {
      answerText = `नमस्ते! CONNECTOR सहायक आपकी सेवा में है। आप अपनी आयु, पेशा (जैसे किसान, विद्यार्थी, महिला, दुकानदार), और राज्य बताकर सटीक योजनाओं की जानकारी ले सकते हैं। आप स्वास्थ्य (Ayushman Bharat), आवास (PMAY), छात्रवृत्ति, या व्यवसाय लोन के बारे में भी सीधे पूछ सकते हैं।`;
      voiceText = "नमस्ते! आप अपनी जरूरत, जैसे पढ़ाई, खेती, अस्पताल या व्यवसाय लोन के बारे में बोलकर या लिखकर पूछ सकते हैं।";
    } else {
      answerText = `Hello! I am **Connector Sahayak**, your personal government scheme guide. You can ask me naturally about scholarships, farmer subsidies, Ayushman hospital cards, PMAY housing assistance, street vendor loans, or woman empowerment schemes. Tell me your occupation or requirement, and I will find the exact benefits you qualify for!`;
      voiceText = "Hello! I am Connector Sahayak. Ask me about any government scheme for education, agriculture, health, housing, or business.";
    }
  }

  res.json({
    success: true,
    reply: answerText,
    voiceText: voiceText,
    matchedSchemes: matched,
    isLLMPowered: false,
    provider: "Built-in Verified Engine",
    suggestedQueries: [
      "How to check eligibility for PM-KISAN?",
      "Free hospital treatment under Ayushman Bharat",
      "PM Vishwakarma ₹15,000 toolkit application",
      "Sukanya Samriddhi Yojana account opening rules"
    ]
  });
});

// 6. Admin Statistics & Platform Metrics
app.get('/api/admin/stats', (req, res) => {
  const verifiedCount = schemesData.filter(s => s.isVerified).length;
  res.json({
    success: true,
    stats: {
      totalSchemes: schemesData.length,
      verifiedCount: verifiedCount,
      verifiedPercentage: Math.round((verifiedCount / schemesData.length) * 100),
      totalCategories: categories.length - 1, // exclude 'all'
      citizensHelpedEstimate: "1,248,500+",
      directBenefitsCataloged: "₹15,000+ Cr DBT",
      activeStatesIntegrated: 28,
      lastAuditDate: "October 2026",
      officialSourceStandards: "MyScheme, India.gov.in & Gazette of India"
    },
    topSearches: [
      { query: "PM-KISAN 17th Installment", count: 48210, trend: "+14%" },
      { query: "Ayushman Card 70+ Senior Citizen", count: 39150, trend: "+28%" },
      { query: "PM Vishwakarma 15000 toolkit", count: 31200, trend: "+19%" },
      { query: "Post Matric Scholarship Portal", count: 24700, trend: "+8%" },
      { query: "PMAY Urban 2.0 Interest Subsidy", count: 19800, trend: "+12%" }
    ],
    recentFeedback: feedbackList
  });
});

// 7. Admin Scheme Management (Create / Update)
app.post('/api/admin/schemes', async (req, res) => {
  const newScheme = req.body;
  if (!newScheme.id || !newScheme.name || !newScheme.category) {
    return res.status(400).json({ success: false, message: "ID, Name, and Category are required." });
  }

  // Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await upsertSchemeInSupabase(newScheme);
      console.log(`[INFO] Scheme '${newScheme.id}' saved to Supabase.`);
    } catch (err) {
      console.warn('[WARN] Supabase upsert error:', err.message);
    }
  }

  // Check if exists in local state
  const existingIndex = schemesData.findIndex(s => s.id === newScheme.id);
  if (existingIndex >= 0) {
    schemesData[existingIndex] = { ...schemesData[existingIndex], ...newScheme, verifiedDate: "Updated October 2026", isVerified: true };
  } else {
    schemesData.unshift({
      ...newScheme,
      isVerified: true,
      verifiedDate: "Updated October 2026"
    });
  }

  // Persist to local JSON file as backup
  try {
    fs.writeFileSync(schemesFilePath, JSON.stringify(schemesData, null, 2), 'utf8');
  } catch (err) {
    console.error('[ERROR] Could not save scheme to disk:', err);
  }

  res.json({ success: true, message: "Scheme saved successfully.", scheme: newScheme });
});

// 7b. Admin Scheme Delete
app.delete('/api/admin/schemes/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      await deleteSchemeFromSupabase(id);
      console.log(`[INFO] Scheme '${id}' deleted from Supabase.`);
    } catch (err) {
      console.warn('[WARN] Supabase delete error:', err.message);
    }
  }

  schemesData = schemesData.filter(s => s.id !== id);

  try {
    fs.writeFileSync(schemesFilePath, JSON.stringify(schemesData, null, 2), 'utf8');
  } catch (err) {
    console.error('[ERROR] Could not persist deletion to disk:', err);
  }

  res.json({ success: true, message: `Scheme ${id} deleted successfully.` });
});

// 8. Citizen Feedback Submission
app.post('/api/feedback', (req, res) => {
  const { name, phoneOrEmail, role, message, rating } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  const newFeedback = {
    id: `fb-${Date.now()}`,
    name: name || "Anonymous Citizen",
    phoneOrEmail: phoneOrEmail || "Not provided",
    role: role || "Citizen",
    message,
    rating: rating || 5,
    timestamp: new Date().toISOString(),
    status: "new"
  };

  feedbackList.unshift(newFeedback);
  res.json({ success: true, message: "Thank you! Your feedback helps make CONNECTOR better.", feedback: newFeedback });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    platform: "CONNECTOR",
    service: "Government Schemes for Everyone API",
    version: "2.1.0",
    database: isSupabaseConfigured() ? "Supabase (PostgreSQL)" : "Local JSON Store",
    schemesLoaded: schemesData.length,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[INFO] Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  
  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CONNECTOR] Production server running on port ${PORT}`);
  });
}

module.exports = app;

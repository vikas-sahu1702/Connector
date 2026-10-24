/**
 * LLM Service for CONNECTOR Assistant ("Sahayak / वानी")
 * Supports:
 *  1. Google Gemini API (gemini-1.5-flash / gemini-2.0-flash) - 100% free via Google AI Studio
 *  2. Groq API (llama-3.3-70b-versatile) - 100% free via Groq Console
 *  3. OpenAI API (gpt-4o-mini / gpt-4o)
 *
 * Implements RAG (Retrieval-Augmented Generation) grounded with the verified 
 * schemes catalog data from schemes.json to prevent hallucinations.
 */

// Helper to strip markdown formatting for Text-to-Speech audio reading
function cleanVoiceText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}.*?`{1,3}/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Builds compact knowledge context from catalog schemes
 */
function buildKnowledgeContext(schemesData) {
  return schemesData.map((s, idx) => {
    return `${idx + 1}. [${s.name} (${s.hindiName || ''})]
- Category: ${s.category} | Ministry: ${s.ministry}
- Financial Benefit: ${s.financialBenefit || s.tagline}
- Eligibility: ${s.eligibilityCriteria?.summary || s.brief}
- Documents: ${s.documentsRequired?.map(d => d.name).join(', ') || 'Aadhaar, Bank Account'}
- Portal: ${s.officialUrl}`;
  }).join('\n\n');
}

/**
 * Find schemes matching user query to display interactive cards
 */
function matchSchemesForQuery(query, schemesData) {
  const q = query.toLowerCase();
  const matched = schemesData.filter(s => {
    const textToMatch = `${s.name} ${s.hindiName || ''} ${s.category} ${s.brief} ${s.tagline} ${s.ministry}`.toLowerCase();
    
    if (q.includes("kisan") || q.includes("farmer") || q.includes("khet") || q.includes("crop")) {
      return s.category === 'agriculture';
    }
    if (q.includes("scholarship") || q.includes("student") || q.includes("college") || q.includes("school") || q.includes("padhai")) {
      return s.category === 'scholarships';
    }
    if (q.includes("hospital") || q.includes("health") || q.includes("ilaj") || q.includes("swasthya") || q.includes("ayushman")) {
      return s.category === 'healthcare';
    }
    if (q.includes("house") || q.includes("awas") || q.includes("makaan") || q.includes("ghar")) {
      return s.category === 'housing';
    }
    if (q.includes("women") || q.includes("mahila") || q.includes("beti") || q.includes("sukanya") || q.includes("girl") || q.includes("pregnant")) {
      return s.category === 'women';
    }
    if (q.includes("loan") || q.includes("business") || q.includes("vyapar") || q.includes("mudra") || q.includes("vishwakarma") || q.includes("svanidhi")) {
      return s.category === 'business';
    }
    if (q.includes("pension") || q.includes("bujurg") || q.includes("atal")) {
      return s.category === 'social_security';
    }

    // Keyword match
    const keywords = q.split(/\s+/).filter(w => w.length > 2);
    return keywords.some(kw => textToMatch.includes(kw));
  });

  return matched.length > 0 ? matched.slice(0, 4) : schemesData.slice(0, 3);
}

/**
 * Call Google Gemini API (Free tier from Google AI Studio)
 */
async function callGemini(apiKey, prompt, model = "gemini-1.5-flash") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response received from Gemini API");
  }
  return text;
}

/**
 * Call Groq API (Free tier from Groq Console)
 */
async function callGroq(apiKey, prompt, preferredModel = "openai/gpt-oss-120b") {
  const candidateModels = [
    preferredModel,
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile"
  ];
  const models = [...new Set(candidateModels)];

  let lastError = null;
  for (const model of models) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}) on model ${model}: ${errorText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[WARN] Groq model ${model} failed, trying next candidate...`);
    }
  }

  throw lastError || new Error("Failed to get response from any Groq model");
}

/**
 * Call OpenAI or OpenAI-compatible API
 */
async function callOpenAI(apiKey, prompt, model = "gpt-4o-mini") {
  const url = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response received from OpenAI API");
  }
  return text;
}

/**
 * Main query handler: checks for API keys, calls LLM, falls back if needed
 */
async function generateAssistantReply({ message, language = 'en', schemesData, customApiKey = null, customProvider = null }) {
  // Determine available provider and key
  const geminiKey = customProvider === 'gemini' && customApiKey ? customApiKey : (process.env.GEMINI_API_KEY || null);
  const groqKey = customProvider === 'groq' && customApiKey ? customApiKey : (process.env.GROQ_API_KEY || null);
  const openAIKey = customProvider === 'openai' && customApiKey ? customApiKey : (process.env.OPENAI_API_KEY || null);

  const matchedSchemes = matchSchemesForQuery(message, schemesData);
  const knowledgeContext = buildKnowledgeContext(matchedSchemes);

  const systemInstructions = `You are "CONNECTOR Sahayak" (वानी), a friendly, helpful, and highly authoritative government welfare scheme assistant for Indian citizens.
Your mission is to help Indian citizens understand their welfare entitlements and guide them through eligibility criteria and application processes.

IMPORTANT GUIDELINES:
1. Grounding & Accuracy: Base your answers ONLY on verified Indian Government welfare schemes. Use the Official Knowledge Base provided below. Do not invent scheme names, amounts, or links.
2. Language: Reply in the same language as the user. If the user writes in Hindi or Hinglish, reply in clear, respectful Hindi or natural conversational Hinglish. If in English, reply in English.
3. Structure:
   - Provide a direct, empathetic 1-2 sentence summary first.
   - Use bullet points for concrete financial amounts (e.g., ₹6,000, ₹5 Lakh) and required documents.
   - Mention the official government portal (.gov.in / .nic.in) or process.
4. Transparency: Remind citizens that CONNECTOR is a free guidance tool and never asks for OTPs, fees, or passwords.

OFFICIAL KNOWLEDGE BASE FOR THIS QUERY:
${knowledgeContext}

CITIZEN'S QUESTION:
"${message}"
`;

  // Build provider execution list based on priority and explicit preference
  const providersToTry = [];

  if (customProvider) {
    if (customProvider === 'groq' && groqKey) providersToTry.push('groq');
    else if (customProvider === 'gemini' && geminiKey) providersToTry.push('gemini');
    else if (customProvider === 'openai' && openAIKey) providersToTry.push('openai');
  }

  // Next order: Groq (ultra-fast LLaMA 3.3) -> Gemini -> OpenAI
  if (groqKey && !providersToTry.includes('groq')) providersToTry.push('groq');
  if (geminiKey && !providersToTry.includes('gemini')) providersToTry.push('gemini');
  if (openAIKey && !providersToTry.includes('openai')) providersToTry.push('openai');

  for (const provider of providersToTry) {
    if (provider === 'groq') {
      try {
        console.log("[INFO] Generating response using Groq API (LLaMA 3.3)...");
        const text = await callGroq(groqKey, systemInstructions);
        return {
          reply: text,
          voiceText: cleanVoiceText(text),
          matchedSchemes,
          isLLMPowered: true,
          provider: "Groq (Free LLaMA 3.3)"
        };
      } catch (err) {
        console.warn("[WARN] Groq API call failed:", err.message);
      }
    } else if (provider === 'gemini') {
      try {
        console.log("[INFO] Generating response using Google Gemini API...");
        const text = await callGemini(geminiKey, systemInstructions);
        return {
          reply: text,
          voiceText: cleanVoiceText(text),
          matchedSchemes,
          isLLMPowered: true,
          provider: "Google Gemini (Free AI Studio)"
        };
      } catch (err) {
        console.warn("[WARN] Gemini API call failed:", err.message);
      }
    } else if (provider === 'openai') {
      try {
        console.log("[INFO] Generating response using OpenAI API...");
        const text = await callOpenAI(openAIKey, systemInstructions);
        return {
          reply: text,
          voiceText: cleanVoiceText(text),
          matchedSchemes,
          isLLMPowered: true,
          provider: "OpenAI"
        };
      } catch (err) {
        console.warn("[WARN] OpenAI API call failed:", err.message);
      }
    }
  }

  // Fallback to built-in verified engine if no keys or all calls failed
  return {
    isLLMPowered: false,
    provider: "Built-in Verified Engine (No API key set)",
    matchedSchemes
  };
}

module.exports = {
  generateAssistantReply,
  cleanVoiceText
};

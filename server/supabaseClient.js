const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('[INFO] Supabase client initialized successfully.');
  } catch (err) {
    console.warn('[WARN] Could not initialize Supabase client:', err.message);
    supabase = null;
  }
} else {
  console.log('[INFO] Supabase credentials not set in .env. Using local JSON store.');
}

function isSupabaseConfigured() {
  return Boolean(supabase);
}

/**
 * Transforms Supabase database row (snake_case) to client/frontend format (camelCase)
 */
function rowToScheme(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    hindiName: row.hindi_name || row.hindiName || '',
    category: row.category,
    ministry: row.ministry || '',
    sponsor: row.sponsor || 'Central Sector',
    tagline: row.tagline || '',
    brief: row.brief || '',
    financialBenefit: row.financial_benefit || row.financialBenefit || '',
    benefits: row.benefits || [],
    eligibilityCriteria: row.eligibility_criteria || row.eligibilityCriteria || {},
    documentsRequired: row.documents_required || row.documentsRequired || [],
    applicationSteps: row.application_steps || row.applicationSteps || [],
    officialUrl: row.official_url || row.officialUrl || '',
    tags: row.tags || [],
    popular: Boolean(row.is_popular || row.popular),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Transforms client scheme object to Supabase database row
 */
function schemeToRow(scheme) {
  return {
    id: scheme.id,
    name: scheme.name,
    hindi_name: scheme.hindiName || scheme.hindi_name || null,
    category: scheme.category,
    ministry: scheme.ministry || null,
    sponsor: scheme.sponsor || 'Central Sector',
    tagline: scheme.tagline || null,
    brief: scheme.brief || null,
    financial_benefit: scheme.financialBenefit || scheme.financial_benefit || null,
    benefits: scheme.benefits || [],
    eligibility_criteria: scheme.eligibilityCriteria || scheme.eligibility_criteria || {},
    documents_required: scheme.documentsRequired || scheme.documents_required || [],
    application_steps: scheme.applicationSteps || scheme.application_steps || [],
    official_url: scheme.officialUrl || scheme.official_url || null,
    tags: Array.isArray(scheme.tags) ? scheme.tags : [],
    is_popular: Boolean(scheme.popular || scheme.is_popular),
    updated_at: new Date().toISOString()
  };
}

/**
 * Fetch all schemes from Supabase
 */
async function getSchemesFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('schemes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[WARN] Supabase error fetching schemes:', error.message);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map(rowToScheme);
    }
    return [];
  } catch (err) {
    console.warn('[WARN] Supabase fetch exception:', err.message);
    return null;
  }
}

/**
 * Insert or update a scheme in Supabase
 */
async function upsertSchemeInSupabase(scheme) {
  if (!supabase) return null;
  try {
    const row = schemeToRow(scheme);
    const { data, error } = await supabase
      .from('schemes')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return rowToScheme(data);
  } catch (err) {
    console.error('[ERROR] Supabase upsert error:', err.message);
    throw err;
  }
}

/**
 * Delete a scheme by ID from Supabase
 */
async function deleteSchemeFromSupabase(schemeId) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from('schemes')
      .delete()
      .eq('id', schemeId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[ERROR] Supabase delete error:', err.message);
    throw err;
  }
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  getSchemesFromSupabase,
  upsertSchemeInSupabase,
  deleteSchemeFromSupabase,
  rowToScheme,
  schemeToRow
};

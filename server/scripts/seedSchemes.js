require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Supabase credentials missing in server/.env');
  console.error('Please configure SUPABASE_URL and SUPABASE_KEY before running the seeder.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('\n🚀 Starting Supabase Schemes Seeding...\n');

  const schemesPath = path.join(__dirname, '..', 'data', 'schemes.json');
  if (!fs.existsSync(schemesPath)) {
    console.error('❌ schemes.json file not found at:', schemesPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(schemesPath, 'utf8');
  const schemes = JSON.parse(raw);
  console.log(`📦 Loaded ${schemes.length} schemes from disk.`);

  // Transform to database row format
  const rows = schemes.map(s => ({
    id: s.id,
    name: s.name,
    hindi_name: s.hindiName || null,
    category: s.category,
    ministry: s.ministry || null,
    sponsor: s.sponsor || 'Central Sector',
    tagline: s.tagline || null,
    brief: s.brief || null,
    financial_benefit: s.financialBenefit || null,
    benefits: s.benefits || [],
    eligibility_criteria: s.eligibilityCriteria || {},
    documents_required: s.documentsRequired || [],
    application_steps: s.applicationSteps || [],
    official_url: s.officialUrl || null,
    tags: Array.isArray(s.tags) ? s.tags : [],
    is_popular: Boolean(s.popular),
    updated_at: new Date().toISOString()
  }));

  console.log(`⏳ Uploading ${rows.length} schemes to Supabase 'schemes' table...`);

  // Batch insert in chunks of 50 to avoid payload limits
  const chunkSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('schemes')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error uploading batch ${i / chunkSize + 1}:`, error.message);
      process.exit(1);
    }
    insertedCount += chunk.length;
    console.log(`   ✓ Uploaded ${insertedCount}/${rows.length} schemes...`);
  }

  console.log(`\n🎉 SUCCESS! All ${insertedCount} welfare schemes successfully seeded to Supabase!\n`);
}

seed().catch(err => {
  console.error('❌ Unhandled seeding error:', err);
  process.exit(1);
});

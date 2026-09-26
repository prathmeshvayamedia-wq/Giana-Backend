/**
 * Giana Ledger — orphaned document cleanup
 * ---------------------------------------------------------------------
 * Finds files in the `documents` storage bucket that no user or
 * bank_details row currently references, and deletes them. This is a
 * one-time cleanup for files left behind by the old upload route (before
 * profile.js was fixed to use a fixed path per user+docType instead of a
 * timestamped one).
 *
 * SAFE BY DEFAULT: running this with no flags only lists what it *would*
 * delete. Nothing is removed until you pass --delete.
 *
 * Setup:
 *   npm install @supabase/supabase-js dotenv   (if not already installed)
 *   Make sure these are in your .env (same values your server already uses):
 *     SUPABASE_URL=...
 *     SUPABASE_SERVICE_ROLE_KEY=...   <- must be the SERVICE ROLE key, not
 *                                        the anon key, so it can list/
 *                                        delete storage objects regardless
 *                                        of RLS policies.
 *
 * Usage:
 *   node cleanup-orphaned-documents.js            # dry run - lists only
 *   node cleanup-orphaned-documents.js --delete   # actually deletes
 * ---------------------------------------------------------------------
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'documents';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Storage entries that are "folders" come back with id === null in
// Supabase Storage's list() response - that's how we tell a per-user
// folder apart from an actual file at the root.
async function listAllStoragePaths() {
  const allPaths = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: pageSize, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const entry of data) {
      if (entry.id === null) {
        // It's a folder (named after a user id) - list what's inside it.
        const { data: files, error: filesError } = await supabase.storage
          .from(BUCKET)
          .list(entry.name, { limit: 1000 });
        if (filesError) throw filesError;
        for (const f of files || []) {
          allPaths.push(`${entry.name}/${f.name}`);
        }
      } else {
        allPaths.push(entry.name);
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return allPaths;
}

// Turns a public Supabase Storage URL back into the bucket-relative path,
// e.g. ".../object/public/documents/abc-123/aadhaar_front.jpg" -> "abc-123/aadhaar_front.jpg"
function extractPathFromUrl(url) {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  // Strip any cache-busting query string (e.g. "?v=1234") if present.
  const path = url.slice(idx + marker.length);
  return decodeURIComponent(path.split('?')[0]);
}

async function getReferencedPaths() {
  const referenced = new Set();

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('aadhaar_front_url, aadhaar_back_url, pan_image_url, profile_photo_url');
  if (usersError) throw usersError;
  for (const u of users || []) {
    [u.aadhaar_front_url, u.aadhaar_back_url, u.pan_image_url, u.profile_photo_url].forEach((url) => {
      const p = extractPathFromUrl(url);
      if (p) referenced.add(p);
    });
  }

  const { data: banks, error: banksError } = await supabase
    .from('bank_details')
    .select('cancelled_cheque_url, passbook_url');
  if (banksError) throw banksError;
  for (const b of banks || []) {
    [b.cancelled_cheque_url, b.passbook_url].forEach((url) => {
      const p = extractPathFromUrl(url);
      if (p) referenced.add(p);
    });
  }

  return referenced;
}

async function main() {
  const shouldDelete = process.argv.includes('--delete');

  console.log(`Scanning "${BUCKET}" bucket...`);
  const allPaths = await listAllStoragePaths();
  console.log(`Found ${allPaths.length} file(s) in storage.`);

  console.log('Scanning database for referenced document URLs...');
  const referenced = await getReferencedPaths();
  console.log(`Found ${referenced.size} referenced file(s).`);

  const orphaned = allPaths.filter((p) => !referenced.has(p));

  console.log(`\n${orphaned.length} orphaned file(s):`);
  orphaned.forEach((p) => console.log('  -', p));

  if (orphaned.length === 0) {
    console.log('\nNothing to clean up.');
    return;
  }

  if (!shouldDelete) {
    console.log('\nDRY RUN - nothing was deleted.');
    console.log('Re-run with --delete once this list looks right:');
    console.log('  node cleanup-orphaned-documents.js --delete');
    return;
  }

  console.log('\nDeleting...');
  const { error: deleteError } = await supabase.storage.from(BUCKET).remove(orphaned);
  if (deleteError) {
    console.error('Delete failed:', deleteError);
    process.exit(1);
  }
  console.log(`Deleted ${orphaned.length} file(s).`);
}

main().catch((err) => {
  console.error('Cleanup script failed:', err);
  process.exit(1);
});

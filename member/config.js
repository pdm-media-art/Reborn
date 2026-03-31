// ============================================================
// SUPABASE CONFIGURATION
// Replace these values with your actual Supabase project credentials
// Found in: Supabase Dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://yjpgacbdqgvaoazfdwit.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nJbxieYyoh8P5mhNZp9WPQ_TDummH7L';

// ============================================================
// ADMIN CONFIG
// Your Supabase user ID (get this from Auth → Users after first login)
// ============================================================
const ADMIN_EMAIL = 'rebornmethod.patrick@gmail.com';

// ============================================================
// DO NOT EDIT BELOW
// ============================================================
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

async function getProfile(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

async function requireAuth(adminOnly = false) {
  const session = await getSession();
  if (!session) {
    window.location.href = '/member/login.html';
    return null;
  }
  const profile = await getProfile(session.user.id);
  if (!profile) {
    window.location.href = '/member/login.html';
    return null;
  }
  if (adminOnly && !profile.is_admin) {
    window.location.href = '/member/dashboard.html';
    return null;
  }
  return { session, profile };
}

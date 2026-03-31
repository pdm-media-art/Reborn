// ============================================================
// SUPABASE CONFIGURATION
// Replace these values with your actual Supabase project credentials
// Found in: Supabase Dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://yjpgacbdqgvaoazfdwit.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nJbxieYyoh8P5mhNZp9WPQ_TDummH7L';

// ============================================================
// ADMIN CONFIG
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
  const { data } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// Auto-create a profile row if none exists (handles first login after invite)
async function getOrCreateProfile(userId, email) {
  let profile = await getProfile(userId);
  if (!profile) {
    const isAdmin = email === ADMIN_EMAIL;
    const { data } = await db
      .from('profiles')
      .insert({ id: userId, full_name: email.split('@')[0], is_admin: isAdmin })
      .select()
      .single();
    profile = data;
  }
  return profile;
}

async function requireAuth(adminOnly = false) {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  const profile = await getOrCreateProfile(session.user.id, session.user.email);
  if (!profile) {
    // DB not set up yet — show error instead of silent loop
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#060606;color:#f0f0f0;font-family:sans-serif;text-align:center;padding:2rem"><div><h2 style="color:#e74c3c;margin-bottom:1rem">Setup Required</h2><p>The database tables are not set up yet.<br>Please run <code style="background:#1a1a1a;padding:.2rem .5rem;border-radius:4px">member/setup.sql</code> in your Supabase SQL Editor.</p><br><a href="login.html" style="color:#4ecdc4">Back to Login</a></div></div>';
    return null;
  }
  if (adminOnly && !profile.is_admin) {
    window.location.href = 'dashboard.html';
    return null;
  }
  return { session, profile };
}

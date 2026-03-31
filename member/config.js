const SUPABASE_URL = 'https://yjpgacbdqgvaoazfdwit.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nJbxieYyoh8P5mhNZp9WPQ_TDummH7L';
const ADMIN_EMAIL = 'rebornmethod.patrick@gmail.com';

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
  if (error && error.code !== 'PGRST116') console.error('getProfile error:', error);
  return data || null;
}

async function getOrCreateProfile(userId, email) {
  let profile = await getProfile(userId);
  if (!profile) {
    const isAdmin = email === ADMIN_EMAIL;
    const { data, error } = await db
      .from('profiles')
      .insert({ id: userId, full_name: email.split('@')[0], is_admin: isAdmin })
      .select()
      .single();
    if (error) {
      console.error('insert profile error:', error);
      // RLS blocked insert — return a minimal in-memory profile so the user
      // can still access the app. Patrick's admin flag is set by email match.
      return { id: userId, full_name: email.split('@')[0], is_admin: isAdmin, phase: 1, notes_visible: true };
    }
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
    window.location.href = 'login.html';
    return null;
  }
  if (adminOnly && !profile.is_admin) {
    window.location.href = 'dashboard.html';
    return null;
  }
  return { session, profile };
}

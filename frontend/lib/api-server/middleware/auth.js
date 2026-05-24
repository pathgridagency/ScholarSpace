export async function requireAuth(req, res, next) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.split(" ")[1];

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(`Supabase auth error ${response.status}: ${body}`);
      return res.status(401).json({ error: "Invalid or expired token", detail: `${response.status}: ${body}` });
    }

    let user;
    try { user = JSON.parse(body); } catch { user = null; }

    if (!user || !user.id) {
      return res.status(401).json({ error: "Invalid or expired token", detail: "No user ID in response" });
    }

    req.user = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch (e) {
    console.error(`Auth middleware exception:`, e);
    return res.status(401).json({ error: "Invalid or expired token", detail: e instanceof Error ? e.message : String(e) });
  }
}

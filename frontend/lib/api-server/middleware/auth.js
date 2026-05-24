export async function requireAuth(req, res, next) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
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
        apikey: supabaseServiceKey,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await response.json();

    if (!user || !user.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

import { createClient } from "@supabase/supabase-js";
import { Request, Response, Router } from "express";

const router = Router();

router.get("/profile/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const supabaseWithAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data, error } = await supabaseWithAuth
    .from("profile")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Profile fetch error:", error);
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json(data);
});

router.put("/profile", async (req: Request, res: Response) => {
  const { username, full_name, bio, avatar_url } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No Token Provided" });
  }

  const token = authHeader.split(" ")[1];

  const supabaseWithAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { data, error } = await supabaseWithAuth
    .from("profiles")
    .update({
      username,
      full_name,
      bio,
      avatar_url,
      updated_at: new Date(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;

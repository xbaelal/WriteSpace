import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are Required" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    user: data.user,
    session: data.session,
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json("Email and Password are Required");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    user: data.user,
    session: data.session,
  });
});

router.get("/test-auth", async (req: Request, res: Response) => {
  try {
    // Manually call Supabase auth endpoint
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123456",
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

export default router;

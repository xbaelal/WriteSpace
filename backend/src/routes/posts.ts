import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be atleast 1 character")
    .max(200, "Title must be 200 characters or less"),
  content: z
    .string()
    .min(1, "Content must be atleast 1 character")
    .max(1000, "Content must be 1000 characters or less"),
});

const updatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be atleast 1 character")
    .max(200, "Title must be 200 characters or less"),
  content: z
    .string()
    .min(1, "Content must be atleast 1 character")
    .max(1000, "Content must be 1000 characters or less"),
});

const router = Router();

// GET ALL POSTS (Public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    // First, get all posts
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    // ✅ If search exists, add the search condition
    if (search && typeof search === "string") {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // ✅ Execute the query
    const { data: posts, error: postsError } = await query;

    if (postsError) {
      return res.status(500).json({ error: postsError.message });
    }

    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    // Get all unique user IDs from posts
    const userIds = [
      ...new Set(posts.map((post) => post.user_id).filter(Boolean)),
    ];

    // Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Profile fetch error:", profilesError);
      // Continue without profiles - just return posts without user data
      return res.json(posts);
    }

    // Create a map of user_id -> profile
    const profileMap = new Map();
    profiles?.forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    // Attach profile data to each post
    const postsWithProfiles = posts.map((post) => ({
      ...post,
      user: {
        username: profileMap.get(post.user_id)?.username || null,
        full_name: profileMap.get(post.user_id)?.full_name || null,
        email: null, // We don't expose email for privacy
      },
    }));

    res.json(postsWithProfiles);
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// GET SINGLE POST (Public)
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (postError) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Fetch profile for the post author
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", post.user_id)
      .single();

    if (!profileError && profile) {
      post.user = {
        username: profile.username || null,
        full_name: profile.full_name || null,
      };
    }

    res.json(post);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// CREATE POST

// router.post("/", async (req: Request, res: Response) => {
//   const authHeader = req.headers.authorization;

//   console.log("Received Authorization Header:", authHeader); // <-- ADD THIS LINE
//   if (!authHeader) {
//     return res.status(401).json({
//       error: "No token provided",
//     });
//   }

//   const token = authHeader.split("")[1];
//   console.log("Extracted Token (first 20 chars):", token.substring(0, 20)); // <-- ADD THIS LINE

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser(token);

//   if (authError || !user) {
//     return res.status(401).json({
//       error: "Invalid Token",
//     });
//   }

//   const { title, content } = req.body;

//   if (!title || !content) {
//     return res.status(401).json({
//       error: "Title and Content are Required",
//     });
//   }

//   const { data, error } = await supabase
//     .from("posts")
//     .insert([{ title, content, user_id: user.id }])
//     .select()
//     .single();

//   if (error) {
//     return res.status(401).json({
//       error: error.message,
//     });
//   }

//   res.status(201).json(data);
// });

// router.post("/", async (req: Request, res: Response) => {
//   console.log("=== POST /api/posts called ===");

//   const authHeader = req.headers.authorization;
//   console.log("1. Authorization Header:", authHeader);

//   if (!authHeader) {
//     console.log("2. No auth header - returning 401");
//     return res.status(401).json({ error: "No token provided" });
//   }

//   const token = authHeader.split(" ")[1];
//   console.log("2. Extracted token (first 30 chars):", token?.substring(0, 30));
//   console.log("2. Token length:", token?.length);

//   console.log("3. Calling supabase.auth.getUser()...");
//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser(token);

//   if (authError) {
//     console.log("4. Auth Error:", authError.message);
//     return res.status(401).json({ error: "Invalid token" });
//   }

//   if (!user) {
//     console.log("4. No user found");
//     return res.status(401).json({ error: "Invalid token" });
//   }

//   console.log("4. User found:", user.email);

//   const { title, content } = req.body;
//   console.log("5. Title:", title, "Content length:", content?.length);

//   if (!title || !content) {
//     return res.status(400).json({ error: "Title and content are required" });
//   }

//   console.log("6. Inserting post...");
//   const { data, error } = await supabase
//     .from("posts")
//     .insert([{ title, content, user_id: user.id }])
//     .select()
//     .single();

//   if (error) {
//     console.log("7. Insert Error:", error.message);
//     return res.status(400).json({ error: error.message });
//   }

//   console.log("7. Post created successfully!");
//   res.status(201).json(data);
// });

router.post("/", async (req: Request, res: Response) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];

  // Create a new Supabase client with the user's token
  const supabaseWithAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  // Verify token (optional, but good practice)
  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const validationResult = createPostSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: "Validation Failed",
      details: validationResult.error.issues,
    });
  }

  const { title, content } = validationResult.data;

  // const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  // Use the new client for the insert
  const { data, error } = await supabaseWithAuth
    .from("posts")
    .insert([{ title, content, user_id: user.id }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

// UPDATE POST

// router.put("/:id", async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { title, content } = req.body;

//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({
//       error: "no token provided",
//     });
//   }

//   const token = authHeader.split("")[1];

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser(token);

//   if (authError || !user) {
//     return res.status(401).json({
//       error: "Invalid Token",
//     });
//   }

//   // post exists and belongs to the user

//   const { data: existing, error: fetchError } = await supabase
//     .from("posts")
//     .select("user_id")
//     .eq("id", id)
//     .single();

//   if (fetchError || !existing) {
//     return res.status(404).json({
//       error: "Post not Found",
//     });
//   }

//   if (existing.user_id !== user.id) {
//     return res.status(403).json({
//       error: "You can only edit your own posts",
//     });
//   }

//   // Update the post

//   const { data, error } = await supabase
//     .from("posts")
//     .update({
//       title,
//       content,
//       updated_at: new Date(),
//     })
//     .eq("id", id)
//     .select()
//     .single();

//   if (error) {
//     return res.status(400).json({
//       error: error.message,
//     });
//   }

//   res.json(data);
// });

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];

  // Create authenticated client
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

  const validationResult = createPostSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: "Validation Failed",
      details: validationResult.error.issues,
    });
  }

  // Check ownership
  const { data: existing, error: fetchError } = await supabaseWithAuth
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: "Post not found" });
  }
  if (existing.user_id !== user.id) {
    return res.status(403).json({ error: "You can only edit your own posts" });
  }

  // Update
  const { data, error } = await supabaseWithAuth
    .from("posts")
    .update({ title, content, updated_at: new Date() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Delete Post

// router.delete("/:id", async (req: Request, res: Response) => {
//   const { id } = req.params;

//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({
//       error: "No token provided",
//     });
//   }

//   const token = authHeader.split("")[1];

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser(token);

//   if (authError || !user) {
//     return res.status(401).json({
//       error: "Invalid Token",
//     });
//   }

//   const { data: existing, error: fetechError } = await supabase
//     .from("posts")
//     .select("user_id")
//     .eq("id", id)
//     .single();

//   if (fetechError || !existing) {
//     return res.status(404).json({
//       error: "Post Not Found",
//     });
//   }

//   if (existing.user_id !== user.id) {
//     return res.status(403).json({
//       error: "You can only delete your own posts",
//     });
//   }

//   // Post Delete

//   const { error } = await supabase.from("posts").delete().eq("id", id);

//   if (error) {
//     return res.status(400).json({
//       error: error.message,
//     });
//   }

//   res.json({
//     message: "Post Deleted Successfully",
//   });
// });

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

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

  const {
    data: { user },
    error: authError,
  } = await supabaseWithAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { data: existing, error: fetchError } = await supabaseWithAuth
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: "Post not found" });
  }
  if (existing.user_id !== user.id) {
    return res
      .status(403)
      .json({ error: "You can only delete your own posts" });
  }

  const { error } = await supabaseWithAuth.from("posts").delete().eq("id", id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Post deleted successfully" });
});

export default router;

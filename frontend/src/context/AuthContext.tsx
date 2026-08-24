import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../api";

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username?: string,
    fullname?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>; // NEW: To refresh user data after profile update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from backend
  const fetchUserProfile = async (userId: string, accessToken: string) => {
    try {
      const response = await api.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(atob(base64));

          // Set base user info from token
          const userData: User = {
            id: decoded.sub,
            email: decoded.email,
          };

          // Fetch profile from backend
          try {
            const profile = await fetchUserProfile(decoded.sub, token);
            if (profile) {
              userData.username = profile.username;
              userData.full_name = profile.full_name;
              userData.avatar_url = profile.avatar_url;
              userData.bio = profile.bio;
            }
          } catch (error) {
            console.error("Failed to fetch profile:", error);
          }

          setUser(userData);
        } catch (error) {
          console.error("Failed to decode token:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { user, session } = response.data;
    const token = session.access_token;
    localStorage.setItem("token", token);
    setToken(token);

    // Fetch profile after login
    try {
      const profile = await fetchUserProfile(user.id, token);
      setUser({
        id: user.id,
        email: user.email,
        username: profile?.username,
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        bio: profile?.bio,
      });
    } catch (error) {
      setUser({
        id: user.id,
        email: user.email,
      });
    }
  };

  const signup = async (
    email: string,
    password: string,
    username?: string,
    fullName?: string,
  ) => {
    const response = await api.post("/auth/signup", { email, password });
    const { user, session } = response.data;

    if (session) {
      const token = session.access_token;
      localStorage.setItem("token", token);
      setToken(token);

      // If username provided, update the profile
      if (username || fullName) {
        try {
          await api.put(
            "/users/profile",
            { username, full_name: fullName },
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } catch (error) {
          console.error("Failed to update profile:", error);
        }
      }

      // Set user with username
      setUser({
        id: user.id,
        email: user.email,
        username: username || email.split("@")[0],
        full_name: fullName || "",
      });
    } else {
      alert("Please check your email to confirm your account.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token && user) {
      try {
        const profile = await fetchUserProfile(user.id, token);
        if (profile) {
          setUser((prev) => ({
            ...prev!,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
          }));
        }
      } catch (error) {
        console.error("Failed to refresh user:", error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import {
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
  refreshUser: () => Promise<void>;
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
      return null;
    }
  };

  // Check if user is already logged in (on page refresh)
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Decode token to get user info
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
              userData.username =
                profile.username || decoded.email.split("@")[0];
              userData.full_name = profile.full_name || "";
              userData.avatar_url = profile.avatar_url || "";
              userData.bio = profile.bio || "";
            } else {
              // Fallback: use email username
              userData.username = decoded.email.split("@")[0];
            }
          } catch (error) {
            userData.username = decoded.email.split("@")[0];
          }

          setUser(userData);
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: authUser, session } = response.data;
      const accessToken = session.access_token;
      localStorage.setItem("token", accessToken);
      setToken(accessToken);

      // Set user with email first
      const userData: User = {
        id: authUser.id,
        email: authUser.email,
        username: authUser.email.split("@")[0],
      };

      // Fetch profile from backend
      try {
        const profile = await fetchUserProfile(authUser.id, accessToken);
        if (profile) {
          userData.username = profile.username || authUser.email.split("@")[0];
          userData.full_name = profile.full_name || "";
          userData.avatar_url = profile.avatar_url || "";
          userData.bio = profile.bio || "";
        }
      } catch (error) {
        // Handle error silently or keep existing email username
      }

      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    username?: string,
    fullName?: string,
  ) => {
    const response = await api.post("/auth/signup", { email, password });
    const { user: authUser, session } = response.data;

    if (session) {
      const accessToken = session.access_token;
      localStorage.setItem("token", accessToken);
      setToken(accessToken);

      // Profile is auto-created by Supabase trigger with email username
      const userData: User = {
        id: authUser.id,
        email: authUser.email,
        username: username || authUser.email.split("@")[0],
        full_name: fullName || "",
      };

      // If username was provided, update the profile with it
      if (username || fullName) {
        try {
          // Wait a moment for the profile to be created by the trigger
          setTimeout(async () => {
            // Update profile with the provided username and fullName
            await api.put(
              "/users/profile",
              {
                username: username || authUser.email.split("@")[0],
                full_name: fullName || "",
              },
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );

            // Refresh user data
            const profile = await fetchUserProfile(authUser.id, accessToken);
            if (profile) {
              userData.username =
                profile.username || username || authUser.email.split("@")[0];
              userData.full_name = profile.full_name || fullName || "";
              userData.avatar_url = profile.avatar_url || "";
              userData.bio = profile.bio || "";
            }
            setUser(userData);
          }, 1500);
        } catch (error) {
          console.error("Failed to update profile:", error);
          // Still set user with the username we have
          setUser(userData);
        }
      } else {
        // Try to fetch the profile (it might take a moment for the trigger)
        setTimeout(async () => {
          try {
            const profile = await fetchUserProfile(authUser.id, accessToken);
            if (profile) {
              userData.username =
                profile.username || authUser.email.split("@")[0];
              userData.full_name = profile.full_name || "";
              userData.avatar_url = profile.avatar_url || "";
              userData.bio = profile.bio || "";
            }
          } catch (error) {
            // Handle error silently
          }
          setUser(userData);
        }, 1000);
      }
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
            username: profile.username || prev?.email?.split("@")[0],
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url || "",
            bio: profile.bio || "",
          }));
        }
      } catch (error) {
        // Handle error silently
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

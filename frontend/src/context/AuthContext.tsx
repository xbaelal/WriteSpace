import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "../api";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
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

  // Checking if the user is already logged in

  useEffect(() => {
    if (token) {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(base64));
      setUser({
        id: decoded.sub,
        email: decoded.sub,
      });
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    const { user, session } = response.data;
    const token = session.access_token;
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  };

  const signup = async (email: string, password: string) => {
    const response = await api.post("/auth/signup", {
      email,
      password,
    });
    const { user, session } = response.data;

    if (session) {
      const token = session.access_token;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
    } else {
      alert("Please check your email and confirm your account.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(token);
    setUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
      }}
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

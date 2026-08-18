import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  console.log(user);

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          📝 BlogPlatform
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link to="/create" className="hover:text-gray-300">
                Create Post
              </Link>
              <span className="text-sm text-gray-400">
                Welcome, {user.email.split("@")[0]}
              </span>

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-400 px-4 py-1 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link to="/signup" className="hover:text-gray-300">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

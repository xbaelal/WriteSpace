import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
// import { PostForm } from "./pages/PostForm";
// import { PostDetail } from "./pages/PostDetail";

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <div className="container mx-auto px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* <Route path="/posts/:id" element={<PostDetail />} /> */}
              {/* <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <PostForm />
                  </ProtectedRoute>
                }
              /> */}
              {/* <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute>
                    <PostForm />
                  </ProtectedRoute>
                }
              /> */}
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;

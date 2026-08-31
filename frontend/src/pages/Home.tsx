import { useEffect, useState, useCallback } from "react";
import type { Post } from "../types/Posts";
import api from "../api";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const [isInitialLoad] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const fetchPosts = async () => {
      try {
        const query = searchQuery
          ? `?search=${encodeURIComponent(searchQuery)}`
          : "";
        const response = await api.get(`/posts${query}`);
        setPosts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [debouncedSearch]);

  const handleSearch = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (searchQuery.trim) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
  };

  // Show loading only on initial load
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">
          {searchQuery
            ? `No results found for "${searchQuery}"`
            : "No posts yet"}
        </h2>
        <p className="text-gray-500 mt-2">
          {searchQuery
            ? "Try a different search term"
            : "Be the first to create a post!"}
        </p>
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="mt-4 text-blue-600 hover:underline"
          >
            Clear search
          </button>
        )}
        {!searchQuery && user && (
          <Link
            to="/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create Post
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Blog Posts</h1>

        {/* ✅ ADD THIS ENTIRE BLOCK */}
        <div className="flex gap-2 w-full sm:w-auto">
          <form
            onSubmit={handleSearch}
            className="flex-1 sm:flex-none flex gap-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1 sm:w-64"
            />
            <button
              type="submit"
              disabled={loading} // ✅ ADD this
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-500 mb-4">
          Found {posts.length} result{posts.length !== 1 ? "s" : ""} for "
          {searchQuery}"
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">
                <Link to={`/posts/${post.id}`} className="hover:text-blue-600">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 line-clamp-3">{post.content}</p>
              <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                <span>
                  By{" "}
                  {post.user?.username || post.user?.full_name || "Anonymous"}
                </span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

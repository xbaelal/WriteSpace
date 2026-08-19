import { useEffect, useState } from "react";
import type { Post } from "../types/Posts";
import api from "../api";
import { Link } from "react-router-dom";

export const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInitialLoad] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get("/posts");
        setPosts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Show loading only on initial load
  if (loading && isInitialLoad) {
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
        <h2 className="text-2xl font-bold text-gray-700">No Posts Yet!</h2>
        <p className="text-gray-500 mt-2">Be the first to create a post</p>
        <Link
          to="/create"
          className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Create a Post
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className=" text-3xl font-bold ">Blog Posts</h1>
        <Link
          to="/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Post
        </Link>
      </div>

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
                <span>By {post.user_id ? "Author" : "Anonymous"}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/Posts";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get(`/posts/${id}`);
        setPost(response.data);
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || "Failed to load post";
        setError(errorMsg);
        toast.error(`❌ ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPosts();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/posts/${id}`);
      toast.success("🗑️ Post deleted successfully!");
      navigate("/");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to delete post";
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
      setDeleting(false);
    }
  };

  // check if user is the author

  const isAuthor = user && post && user.id === post.user_id;

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
        Error : {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">Post not found!</h2>
        <Link
          to="/"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Action buttons (Edit & Delete) & ONLY SHOWS WHEN THE USER IS AUTHOR */}

      {isAuthor && (
        <div className="flex justify-end gap-3 mb-6">
          <Link
            to={`/edit/${post.id}`}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      )}

      {/* post content */}

      <article className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
          {post.title}
        </h1>
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-4">
          <span className="text-sm text-gray-500">
            <span>
              By {post.user?.username || post.user?.full_name || "Anonymous"}
            </span>
          </span>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          {post.created_at !== post.updated_at && (
            <>
              <span>•</span>
              <span className="text-xs text-gray-400">
                Updated: {new Date(post.updated_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            ← Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;

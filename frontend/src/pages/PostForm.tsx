import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/Posts";

const PostForm = () => {
  const { id } = useParams<{ id: string }>();
  const naviagte = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState("");
  const isEditMode = !!id;

  // if editing fetch the existing post
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          const response = await api.get(`/posts/${id}`);
          const post: Post = response.data;

          // check if the current user is the author of the post

          if (user?.id !== post.user_id) {
            setError("You are not authorized to edit this post");
            toast.error("You are not authorized to edit this post");
            setFetching(false);
            return;
          }
          setTitle(post.title);
          setContent(post.content);
        } catch (err: any) {
          const errorMsg = err.response?.data?.error || "Failed to load post";
          setError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setFetching(false);
        }
      };
      fetchPost();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/posts/${id}`, { title, content });
        toast.success("✅ Post updated successfully!");
      } else {
        await api.post("/posts", { title, content });
        toast.success("🎉 Post created successfully!");
      }
      naviagte("/");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to save post";
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Post" : "Create New Post"}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter post title"
            maxLength={200}
          />
          <div className="text-sm text-gray-500 mt-1">
            {title.length}/200 Characters
          </div>
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Write your post content here..."
            maxLength={10000}
          />
          <div className="text-sm text-gray-500 mt-1">
            {content.length}/10000 Characters
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditMode ? "Update Post" : "Create Post"}
          </button>
          <button
            type="button"
            onClick={() => naviagte(-1)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;

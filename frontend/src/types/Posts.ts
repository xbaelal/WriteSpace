export interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    username?: string;
    full_name: string;
  };
}

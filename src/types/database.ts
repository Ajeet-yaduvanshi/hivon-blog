export type UserRole = 'author' | 'viewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  author_id: string;
  summary?: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
  comments?: Comment[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'author' | 'comments' | '_count'>;
        Update: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at' | 'author' | 'comments' | '_count'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'user'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'user'>>;
      };
    };
  };
};

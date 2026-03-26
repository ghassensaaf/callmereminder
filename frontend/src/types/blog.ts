export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMd: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  status: "DRAFT" | "PUBLISHED";
  readingTime: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  topicId: string | null;
  topic?: BlogTopic | null;
  tags: BlogTag[];
}

export interface BlogTopic {
  id: string;
  keyword: string;
  audience: string | null;
  searchIntent: string | null;
  priority: number;
  status: "PENDING" | "GENERATED" | "SKIPPED";
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number; logs: number };
}

export interface BlogGenerationLog {
  id: string;
  topicId: string;
  provider: string;
  model: string;
  success: boolean;
  error: string | null;
  createdAt: string;
  topic?: { keyword: string };
}

export interface BlogPostListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogTagPostsResponse extends BlogPostListResponse {
  tag: BlogTag;
}

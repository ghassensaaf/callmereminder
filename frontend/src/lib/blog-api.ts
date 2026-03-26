import api from "./api";
import type {
  BlogPost,
  BlogPostListResponse,
  BlogTag,
  BlogTagPostsResponse,
  BlogTopic,
  BlogGenerationLog,
} from "@/types/blog";

export const blogApi = {
  // Public
  listPublished: async (page = 1, pageSize = 12): Promise<BlogPostListResponse> => {
    const res = await api.get("/api/blog/posts", { params: { page, page_size: pageSize } });
    return res.data;
  },

  getBySlug: async (slug: string): Promise<BlogPost> => {
    const res = await api.get(`/api/blog/posts/slug/${slug}`);
    return res.data;
  },

  getRelated: async (slug: string): Promise<BlogPost[]> => {
    const res = await api.get(`/api/blog/posts/slug/${slug}/related`);
    return res.data;
  },

  listTags: async (): Promise<(BlogTag & { postCount: number })[]> => {
    const res = await api.get("/api/blog/tags");
    return res.data;
  },

  listByTag: async (tagSlug: string, page = 1): Promise<BlogTagPostsResponse> => {
    const res = await api.get(`/api/blog/tags/${tagSlug}/posts`, { params: { page } });
    return res.data;
  },

  // Admin
  adminListPosts: async (status?: string, page = 1): Promise<BlogPostListResponse> => {
    const res = await api.get("/api/blog/admin/posts", { params: { status, page } });
    return res.data;
  },

  adminGetPost: async (id: string): Promise<BlogPost> => {
    const res = await api.get(`/api/blog/admin/posts/${id}`);
    return res.data;
  },

  adminUpdatePost: async (id: string, data: Partial<BlogPost> & { tags?: string[] }): Promise<BlogPost> => {
    const res = await api.put(`/api/blog/admin/posts/${id}`, data);
    return res.data;
  },

  adminPublish: async (id: string): Promise<BlogPost> => {
    const res = await api.post(`/api/blog/admin/posts/${id}/publish`);
    return res.data;
  },

  adminUnpublish: async (id: string): Promise<BlogPost> => {
    const res = await api.post(`/api/blog/admin/posts/${id}/unpublish`);
    return res.data;
  },

  adminDelete: async (id: string): Promise<void> => {
    await api.delete(`/api/blog/admin/posts/${id}`);
  },

  adminRegenerateMeta: async (id: string): Promise<BlogPost> => {
    const res = await api.post(`/api/blog/admin/posts/${id}/regenerate-meta`);
    return res.data;
  },

  adminListTopics: async (status?: string): Promise<BlogTopic[]> => {
    const res = await api.get("/api/blog/admin/topics", { params: { status } });
    return res.data;
  },

  adminCreateTopic: async (data: { keyword: string; audience?: string; searchIntent?: string; priority?: number }): Promise<BlogTopic> => {
    const res = await api.post("/api/blog/admin/topics", data);
    return res.data;
  },

  adminGenerate: async (topicId: string): Promise<{ success: boolean; post?: BlogPost; error?: string }> => {
    const res = await api.post(`/api/blog/admin/generate/${topicId}`);
    return res.data;
  },

  adminListLogs: async (): Promise<BlogGenerationLog[]> => {
    const res = await api.get("/api/blog/admin/logs");
    return res.data;
  },
};

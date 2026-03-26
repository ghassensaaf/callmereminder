"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Header } from "@/components/layout/header";
import { Button, Input, Textarea } from "@/components/ui";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { blogApi } from "@/lib/blog-api";
import toast from "react-hot-toast";

function PostEditor({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [preview, setPreview] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-blog-post", id],
    queryFn: () => blogApi.adminGetPost(id),
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    targetKeyword: "",
    contentMd: "",
    tags: "",
  });

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        targetKeyword: post.targetKeyword,
        contentMd: post.contentMd,
        tags: post.tags.map((t) => t.name).join(", "),
      });
    }
  }, [post]);

  const saveMut = useMutation({
    mutationFn: () =>
      blogApi.adminUpdatePost(id, {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      } as never),
    onSuccess: () => {
      toast.success("Saved!");
      qc.invalidateQueries({ queryKey: ["admin-blog-post", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMut = useMutation({
    mutationFn: () => blogApi.adminPublish(id),
    onSuccess: () => {
      toast.success("Published!");
      qc.invalidateQueries({ queryKey: ["admin-blog-post", id] });
    },
  });

  const unpublishMut = useMutation({
    mutationFn: () => blogApi.adminUnpublish(id),
    onSuccess: () => {
      toast.success("Unpublished");
      qc.invalidateQueries({ queryKey: ["admin-blog-post", id] });
    },
  });

  const regenMetaMut = useMutation({
    mutationFn: () => blogApi.adminRegenerateMeta(id),
    onSuccess: (updated) => {
      toast.success("Metadata regenerated!");
      setForm((f) => ({
        ...f,
        metaTitle: updated.metaTitle,
        metaDescription: updated.metaDescription,
        excerpt: updated.excerpt,
      }));
      qc.invalidateQueries({ queryKey: ["admin-blog-post", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => blogApi.adminDelete(id),
    onSuccess: () => {
      toast.success("Deleted");
      router.push("/admin/blog");
    },
  });

  if (isLoading) {
    return <div className="py-20 text-center text-surface-500 animate-pulse">Loading post...</div>;
  }

  if (!post) {
    return <div className="py-20 text-center text-surface-500">Post not found.</div>;
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/admin/blog")}
            className="text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 mb-1"
          >
            &larr; Back to admin
          </button>
          <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
            Edit post
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              post.status === "PUBLISHED"
                ? "bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-400"
                : "bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400"
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <Input label="Title" value={form.title} onChange={handleChange("title")} />
          <Input label="Slug" value={form.slug} onChange={handleChange("slug")} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Content (Markdown)</label>
              <button
                onClick={() => setPreview((p) => !p)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6 bg-white dark:bg-surface-900/50 min-h-[400px]">
                <BlogPostContent markdown={form.contentMd} />
              </div>
            ) : (
              <Textarea
                value={form.contentMd}
                onChange={handleChange("contentMd")}
                rows={20}
                className="font-mono text-sm"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-surface-700 dark:text-surface-300">Actions</h3>
            <div className="flex flex-col gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full">
                {saveMut.isPending ? "Saving..." : "Save changes"}
              </Button>
              {post.status === "DRAFT" ? (
                <Button onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="w-full">
                  Publish
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => unpublishMut.mutate()} disabled={unpublishMut.isPending} className="w-full">
                  Unpublish
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => regenMetaMut.mutate()}
                disabled={regenMetaMut.isPending}
                className="w-full"
              >
                {regenMetaMut.isPending ? "Regenerating..." : "Regenerate metadata"}
              </Button>
              <Button
                variant="danger"
                onClick={() => { if (confirm("Delete this post permanently?")) deleteMut.mutate(); }}
                disabled={deleteMut.isPending}
                className="w-full"
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-surface-700 dark:text-surface-300">SEO Metadata</h3>
            <Input label="Meta Title" value={form.metaTitle} onChange={handleChange("metaTitle")} />
            <Textarea label="Meta Description" value={form.metaDescription} onChange={handleChange("metaDescription")} rows={3} />
            <Input label="Excerpt" value={form.excerpt} onChange={handleChange("excerpt")} />
            <Input label="Target Keyword" value={form.targetKeyword} onChange={handleChange("targetKeyword")} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={handleChange("tags")} />
          </div>

          <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-4 text-xs text-surface-500 space-y-1">
            <p>Reading time: {post.readingTime} min</p>
            <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
            {post.publishedAt && <p>Published: {new Date(post.publishedAt).toLocaleString()}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminGuard>
      <Header />
      <PostEditor id={id} />
    </AdminGuard>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui";
import { blogApi } from "@/lib/blog-api";
import Link from "next/link";
import toast from "react-hot-toast";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    DRAFT: "bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400",
    PUBLISHED: "bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-400",
    PENDING: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400",
    GENERATED: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400",
    SKIPPED: "bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || "bg-surface-100 text-surface-600"}`}>
      {status}
    </span>
  );
}

function AdminBlogContent() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"posts" | "topics" | "logs">("posts");
  const [postFilter, setPostFilter] = useState<string | undefined>(undefined);

  const postsQ = useQuery({
    queryKey: ["admin-blog-posts", postFilter],
    queryFn: () => blogApi.adminListPosts(postFilter),
  });

  const topicsQ = useQuery({
    queryKey: ["admin-blog-topics"],
    queryFn: () => blogApi.adminListTopics(),
  });

  const logsQ = useQuery({
    queryKey: ["admin-blog-logs"],
    queryFn: () => blogApi.adminListLogs(),
    enabled: tab === "logs",
  });

  const generateMut = useMutation({
    mutationFn: (topicId: string) => blogApi.adminGenerate(topicId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Draft generated successfully!");
      } else {
        toast.error(`Generation failed: ${data.error}`);
      }
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => blogApi.adminPublish(id),
    onSuccess: () => {
      toast.success("Post published!");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const unpublishMut = useMutation({
    mutationFn: (id: string) => blogApi.adminUnpublish(id),
    onSuccess: () => {
      toast.success("Post unpublished");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => blogApi.adminDelete(id),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          Blog Admin
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-surface-200 dark:border-surface-800">
        {(["posts", "topics", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary-600 text-primary-600 dark:text-primary-400"
                : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === "posts" && (
        <div>
          <div className="flex gap-2 mb-4">
            {[undefined, "DRAFT", "PUBLISHED"].map((f) => (
              <button
                key={f ?? "all"}
                onClick={() => setPostFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  postFilter === f
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                    : "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                }`}
              >
                {f ?? "All"}
              </button>
            ))}
          </div>

          {postsQ.isLoading && <p className="text-surface-500 text-sm">Loading posts...</p>}

          {postsQ.data?.posts.length === 0 && (
            <p className="text-surface-500 text-sm py-8 text-center">No posts found.</p>
          )}

          <div className="space-y-3">
            {postsQ.data?.posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {statusBadge(post.status)}
                    <span className="text-xs text-surface-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/admin/blog/edit/${post.id}`}
                    className="text-sm font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{post.excerpt}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/blog/edit/${post.id}`}>
                    <Button variant="secondary" size="sm">Edit</Button>
                  </Link>
                  {post.status === "DRAFT" ? (
                    <Button
                      size="sm"
                      onClick={() => publishMut.mutate(post.id)}
                      disabled={publishMut.isPending}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => unpublishMut.mutate(post.id)}
                      disabled={unpublishMut.isPending}
                    >
                      Unpublish
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this post?")) deleteMut.mutate(post.id);
                    }}
                    disabled={deleteMut.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics tab */}
      {tab === "topics" && (
        <div>
          {topicsQ.isLoading && <p className="text-surface-500 text-sm">Loading topics...</p>}
          <div className="space-y-3">
            {topicsQ.data?.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {statusBadge(topic.status)}
                    <span className="text-xs text-surface-400">Priority: {topic.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {topic.keyword}
                  </p>
                  {topic.audience && (
                    <p className="text-xs text-surface-500 mt-0.5">Audience: {topic.audience}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {topic.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => generateMut.mutate(topic.id)}
                      disabled={generateMut.isPending}
                    >
                      {generateMut.isPending ? "Generating..." : "Generate"}
                    </Button>
                  )}
                  {topic.status === "GENERATED" && (
                    <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">
                      Done
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <div>
          {logsQ.isLoading && <p className="text-surface-500 text-sm">Loading logs...</p>}
          <div className="space-y-2">
            {logsQ.data?.map((log) => (
              <div
                key={log.id}
                className={`rounded-lg border p-3 text-sm ${
                  log.success
                    ? "border-accent-200 dark:border-accent-900 bg-accent-50/50 dark:bg-accent-950/20"
                    : "border-danger-200 dark:border-danger-900 bg-danger-50/50 dark:bg-danger-950/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${log.success ? "text-accent-700 dark:text-accent-400" : "text-danger-700 dark:text-danger-400"}`}>
                    {log.success ? "Success" : "Failed"}
                  </span>
                  <span className="text-surface-500 text-xs">{log.provider} / {log.model}</span>
                  <span className="text-surface-400 text-xs ml-auto">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-surface-600 dark:text-surface-400 text-xs mt-1">
                  Topic: {log.topic?.keyword ?? log.topicId}
                </p>
                {log.error && (
                  <p className="text-danger-600 dark:text-danger-400 text-xs mt-1 line-clamp-2">
                    {log.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      <Header />
      <AdminBlogContent />
    </AdminGuard>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface BlogPostContentProps {
  markdown: string;
}

export function BlogPostContent({ markdown }: BlogPostContentProps) {
  return (
    <div className="prose prose-surface dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary-300 dark:prose-blockquote:border-primary-700 prose-code:text-primary-700 dark:prose-code:text-primary-300 prose-code:bg-surface-100 dark:prose-code:bg-surface-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-surface-900 dark:prose-pre:bg-surface-950 prose-pre:rounded-xl prose-li:text-surface-700 dark:prose-li:text-surface-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

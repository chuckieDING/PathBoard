'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content" style={{ color: 'var(--foreground)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) =>
            src ? (
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg max-w-lg w-full my-4"
                loading="lazy"
              />
            ) : null,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="text-left px-3 py-2 text-sm font-semibold border"
              style={{ backgroundColor: 'var(--card-hover)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-2 text-sm border"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)', opacity: 0.85 }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

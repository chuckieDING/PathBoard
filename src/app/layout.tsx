import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./navbar";

export const metadata: Metadata = {
  title: "PathBoard - 病理学习系统",
  description: "AI病理学习知识库与任务看板",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* Hidden theme toggle checkbox — :has() in CSS reads this to switch themes */}
      {/* Placed before React loads so CSS :has() works on first paint */}
      {/* Init checkbox from localStorage before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var key = 'pathboard-theme';
              var saved = localStorage.getItem(key);
              var toggle = document.getElementById('theme-toggle');
              if (toggle) {
                if (saved === 'light') toggle.checked = true;
                else toggle.checked = false; // default dark
              }
            })();
          `,
        }}
      />
      {/* Sync checkbox changes to localStorage */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var toggle = document.getElementById('theme-toggle');
              if (toggle) {
                toggle.addEventListener('change', function() {
                  localStorage.setItem('pathboard-theme', this.checked ? 'light' : 'dark');
                });
              }
            })();
          `,
        }}
      />
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Hidden checkbox — CSS :has(#theme-toggle:checked) applies dark theme */}
        <input type="checkbox" id="theme-toggle" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

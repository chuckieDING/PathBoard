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
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Hidden checkbox — CSS :has(#theme-toggle:checked) applies light theme */}
        <input type="checkbox" id="theme-toggle" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        {/* Theme init script — runs after checkbox exists in DOM */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var key='pathboard-theme';
              var toggle=document.getElementById('theme-toggle');
              if(!toggle)return;
              var saved=null;
              try{saved=localStorage.getItem(key)}catch(e){}
              if(saved==='light') toggle.checked=true;
              else if(saved==='dark') toggle.checked=false;
              else{
                var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches;
                toggle.checked=!prefersDark;
              }
              toggle.addEventListener('change',function(){
                try{localStorage.setItem(key,this.checked?'light':'dark')}catch(e){}
              });
            })();`,
          }}
        />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

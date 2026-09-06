import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Personal Archive | Intelligent Vault for Documents, Certificates & Projects',
  description:
    'An intelligent personal digital archive with automatic AI categorization, entity extraction, document summarization, semantic search, and relationship discovery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

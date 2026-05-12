import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Story Sparks ✨ — Free Illustrated Stories for Kids",
    template: "%s — Story Sparks ✨",
  },
  description:
    "Create and read free illustrated children's stories! Bedtime stories, adventure tales, dinosaur stories, fairy tales and more for ages 2-12. Imagined by kids, brought to life with AI illustrations.",
  keywords: [
    "children's stories",
    "kids stories",
    "bedtime stories",
    "illustrated stories",
    "free stories for kids",
    "story creator",
    "kids book",
    "read aloud stories",
    "dinosaur stories",
    "fairy tales",
    "adventure stories for kids",
    "toddler stories",
    "early reader books",
  ],
  authors: [{ name: "Story Sparks" }],
  creator: "Story Sparks",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://storysparks.fun"
  ),
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Story Sparks ✨",
    title: "Story Sparks ✨ — Free Illustrated Stories for Kids",
    description:
      "Create and read free illustrated children's stories! Bedtime stories, adventure tales, dinosaur stories, fairy tales and more for ages 2-12.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Story Sparks ✨ — Free Illustrated Stories for Kids",
    description:
      "Create and read free illustrated children's stories for ages 2-12!",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Story Sparks ✨",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Story Sparks",
              url:
                process.env.NEXT_PUBLIC_SITE_URL || "https://storysparks.fun",
              description:
                "Create and read free illustrated children's stories for ages 2-12.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://storysparks.fun"}/?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

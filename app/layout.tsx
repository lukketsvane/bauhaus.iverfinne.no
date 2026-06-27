import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://bauhaus.iverfinne.no";
const DESCRIPTION =
  "A generative Bauhaus grid art creator — seedable posters of petals, semicircles, blocks, isocubes and Mondrian compositions.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bauhaus — Generative Grid Art",
  description: DESCRIPTION,
  applicationName: "Bauhaus",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Bauhaus",
    title: "Bauhaus — Generative Grid Art",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Bauhaus generative grid art" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bauhaus — Generative Grid Art",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bauhaus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#E9E5D6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "elywalk — mes pas du jour",
  description: "Compteur de pas minimaliste. Aucune base de données, aucun compte.",
  applicationName: "elywalk",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "elywalk",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  // Affichage "app native" : pas de zoom, plein écran, couleur de thème sombre.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/*
          Le bridge JavaScript Median est injecté automatiquement par le WebView
          natif quand l'app tourne dans Median. Ce script est un no-op en dehors.
          Cf. https://docs.median.co/docs/npm-package — on charge ici la version
          CDN officielle pour ne pas dépendre du bundle npm côté navigateur.
        */}
        <script src="https://median.dev/js/bridge.js" async />
      </head>
      <body>{children}</body>
    </html>
  );
}

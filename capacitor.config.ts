import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.elywalk",
  appName: "elywalk",
  // Next.js exporte le site statique dans /out — Capacitor le charge dans le WebView.
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

# Elywalk

Une application mobile minimaliste qui affiche le nombre de pas réalisés dans la journée. Aucune base de données, aucun compte, aucun backend. Le compteur utilise le podomètre natif du téléphone via **Capacitor** + [@capgo/capacitor-health](https://github.com/Cap-go/capacitor-health) (HealthKit sur iOS, Google Health Connect sur Android).

> **Pas besoin de Median.co ni de plan Business.** Tu génères l’APK en local et tu l’installes sur ton téléphone (sideload), sans publication sur les stores.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, export statique) + TypeScript
- [Capacitor 8](https://capacitorjs.com/) — wrapper natif Android / iOS
- [@capgo/capacitor-health](https://www.npmjs.com/package/@capgo/capacitor-health) — HealthKit + Health Connect
- Optionnel : hébergement web [Vercel](https://vercel.com) (preview uniquement — les pas ne marchent que dans l’app native)

## Fonctionnement

1. Au lancement, l’app demande la permission d’accès aux pas (`Health.requestAuthorization`).
2. Une fois accordée, l’app lit le total du jour (`Health.queryAggregated` bucket `day`, fallback `readSamples`).
3. Le compteur se rafraîchit toutes les minutes (et via le bouton ↻).

En navigateur (preview web), l’app affiche un message invitant à ouvrir l’APK natif.

## Prérequis pour builder l’APK

- Node.js 20+
- **JDK 21** (Capacitor 8 / Gradle le demandent)
- [Android Studio](https://developer.android.com/studio) (SDK + platform-tools)
- Sur le téléphone Android : **Health Connect** installé (préinstallé sur Android 14+, sinon via le Play Store)
- Pas besoin de compte développeur Google Play si tu sideload l’APK

## Développement local (UI web)

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).  
Le compteur de pas ne fonctionnera pas ici — seulement l’UI.

## Build APK Android (sideload, sans store)

### 1. Installer les deps + plateforme Android (une seule fois)

```bash
npm install
npm run build
npx cap add android   # si le dossier android/ n'existe pas encore
npx cap sync android
```

### 2. APK debug (le plus simple pour tester)

```bash
npm run apk:debug
```

L’APK se trouve ici :

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Transfère-le sur ton téléphone et installe-le (autoriser « sources inconnues » si demandé).

### 3. Ou ouvrir dans Android Studio

```bash
npm run cap:android
```

Puis **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### 4. Après chaque modif du code web

```bash
npm run cap:sync
# puis rebuild l'APK (apk:debug) ou Run depuis Android Studio
```

## Permissions Android (Health Connect)

Le plugin déclare déjà `READ_STEPS` et les activités de rational. Au premier lancement :

1. Accepte l’accès aux **pas** dans la feuille Health Connect.
2. Si Health Connect n’est pas installé, l’app l’indiquera — installe-le depuis le Play Store.
3. Tu peux rouvrir les réglages depuis l’écran « Accès refusé ».

## iOS (optionnel)

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

Dans Xcode : active la capability **HealthKit**, puis renseigne dans `Info.plist` :

- `NSHealthShareUsageDescription` — ex. « elywalk lit tes pas du jour. »
- `NSHealthUpdateUsageDescription` — ex. « elywalk n’écrit pas de données santé. »

## Structure

```
app/
  layout.tsx       # Layout racine + métadonnées
  page.tsx         # Écran principal
  globals.css      # Styles
components/
  StepCounter.tsx  # UI + lecture des pas
lib/
  health.ts        # Capacitor Health (permissions + agrégation)
android/           # Projet Android Studio (Capacitor)
capacitor.config.ts
public/
  icon.svg
  manifest.webmanifest
  privacypolicy.html   # Requis par Health Connect
```

## Pourquoi pas Median / Health Bridge ?

Le plugin **Health Bridge** de Median.co est réservé aux plans payants élevés.  
Capacitor + `@capgo/capacitor-health` donne le **même accès** (HealthKit / Health Connect) en open source, et tu buildes l’APK toi-même sans publier sur les stores.

## Licence

MIT

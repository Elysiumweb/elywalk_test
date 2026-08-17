# Elywalk

Une application mobile minimaliste qui affiche le nombre de pas réalisés dans la journée. Aucune base de données, aucun compte, aucun backend. Le compteur de pas utilise le podomètre natif du téléphone via le plugin **Health Bridge** de [Median.co](https://median.co) (HealthKit sur iOS, Google Health Connect sur Android).

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [median-js-bridge](https://www.npmjs.com/package/median-js-bridge) pour appeler les API natives
- Hébergement : [Vercel](https://vercel.com)
- Build mobile : [Median.co](https://median.co) (le site est servi tel quel à l'intérieur du wrapper natif)

## Fonctionnement

1. Au lancement, l'app demande la permission d'accès aux données de pas (`median.healthBridge.requestPermissions`).
2. Une fois la permission accordée, l'app lit le nombre de pas du jour en cours (`median.healthBridge.getData` avec `bucket: "day"`).
3. Le compteur se met à jour automatiquement toutes les minutes pour refléter les nouveaux pas.

En dehors de l'app Median (par exemple, sur le navigateur en preview Vercel), l'app affiche un message explicatif invitant à ouvrir l'app native.

## Développement local

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Déploiement

### 1. Vercel

```bash
vercel --prod
```

Le fichier `vercel.json` configure automatiquement le projet comme une app Next.js.

### 2. Median.co

1. Crée une app sur [https://median.co/app](https://median.co/app).
2. Renseigne l'URL Vercel comme **Website URL**.
3. Dans **Native Plugins**, active le plugin **Health Bridge**.
4. Dans **Permissions** de l'app, active la permission d'accès aux données d'activité physique.
5. Build et publie pour iOS / Android.

## Structure

```
app/
  layout.tsx       # Layout racine + métadonnées
  page.tsx         # Écran principal (compteur de pas)
  globals.css      # Styles globaux
  manifest.ts      # PWA manifest
components/
  StepCounter.tsx  # Composant client qui parle au bridge Median
lib/
  median.ts        # Détection du bridge + types
public/
  icon.svg         # Favicon
```

## Licence

MIT

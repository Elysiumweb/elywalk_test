"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type HealthDataPoint,
  formatSteps,
  getTodayRange,
  isMedianBridgeAvailable,
} from "@/lib/median";

type Status =
  | "loading" // au démarrage : on vérifie le bridge
  | "needs-bridge" // pas dans Median (web preview, navigateur…)
  | "requesting" // on demande la permission
  | "denied" // permission refusée
  | "ready"; // on a les pas

const REFRESH_INTERVAL_MS = 60_000; // 1 minute

export function StepCounter() {
  const [status, setStatus] = useState<Status>("loading");
  const [steps, setSteps] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTodaySteps = useCallback(async (): Promise<number> => {
    if (!isMedianBridgeAvailable()) {
      throw new Error("Bridge Median indisponible.");
    }
    const { startDate, endDate } = getTodayRange();
    const response = await window.median!.healthBridge!.getData({
      dataTypes: ["steps"],
      startDate,
      endDate,
      bucket: "day",
    });

    const points: HealthDataPoint[] = response.data.steps ?? [];
    // Le bucket "day" renvoie un point par jour. On additionne par sécurité
    // (au cas où le téléphone a changé de fuseau ou si l'OS split en plusieurs).
    const total = points.reduce((acc, p) => acc + (p.value ?? 0), 0);
    return total;
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      try {
        const value = await fetchTodaySteps();
        setSteps(value);
        setLastUpdated(new Date());
      } catch {
        // silencieux : une erreur ponctuelle ne doit pas spammer l'UI
      }
    }, REFRESH_INTERVAL_MS);
  }, [fetchTodaySteps]);

  const init = useCallback(async () => {
    if (!isMedianBridgeAvailable()) {
      setStatus("needs-bridge");
      return;
    }

    setStatus("requesting");
    try {
      const result = await window.median!.healthBridge!.requestPermissions([
        "steps",
      ]);

      // Sur iOS, requestPermissions ne renvoie pas d'info : on tente directement.
      // Sur Android, on a granted / declined.
      if (result && Array.isArray(result.granted) && result.granted.length === 0) {
        setStatus("denied");
        return;
      }

      const value = await fetchTodaySteps();
      setSteps(value);
      setLastUpdated(new Date());
      setStatus("ready");
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("denied");
    }
  }, [fetchTodaySteps, startPolling]);

  useEffect(() => {
    init();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [init]);

  return (
    <main className="app">
      <header className="header">
        <span className="brand">elywalk</span>
        <span className="date">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
      </header>

      <section className="content">
        {status === "loading" && <LoadingState />}
        {status === "needs-bridge" && <NeedsBridgeState />}
        {status === "requesting" && <RequestingState />}
        {status === "denied" && <DeniedState error={error} onRetry={init} />}
        {status === "ready" && <ReadyState steps={steps} lastUpdated={lastUpdated} />}
      </section>

      <footer className="footer">
        <button
          type="button"
          className="refresh"
          onClick={async () => {
            try {
              const value = await fetchTodaySteps();
              setSteps(value);
              setLastUpdated(new Date());
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erreur.");
            }
          }}
          aria-label="Rafraîchir le compteur"
        >
          ↻
        </button>
      </footer>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="state">
      <p className="muted">Chargement…</p>
    </div>
  );
}

function NeedsBridgeState() {
  return (
    <div className="state">
      <h1 className="big-number">🚶</h1>
      <p className="title">elywalk a besoin de l’app native</p>
      <p className="muted">
        Ce site est conçu pour être ouvert dans l’application mobile compilée via
        <a href="https://median.co" target="_blank" rel="noreferrer"> Median.co</a>,
        qui seule peut accéder au podomètre (HealthKit / Google Health Connect).
      </p>
    </div>
  );
}

function RequestingState() {
  return (
    <div className="state">
      <h1 className="big-number">🔐</h1>
      <p className="title">Autorisation requise</p>
      <p className="muted">
        Accepte l’accès aux données d’activité physique pour afficher ton nombre
        de pas du jour.
      </p>
    </div>
  );
}

function DeniedState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="state">
      <h1 className="big-number">⚠️</h1>
      <p className="title">Accès refusé</p>
      <p className="muted">
        Sans la permission d’accès aux données de pas, l’app ne peut pas
        fonctionner. Tu peux la réactiver dans les réglages de ton téléphone
        (Santé sur iOS, Health Connect sur Android).
      </p>
      {error && <p className="error">{error}</p>}
      <button type="button" className="primary" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}

function ReadyState({ steps, lastUpdated }: { steps: number; lastUpdated: Date | null }) {
  return (
    <div className="state">
      <p className="label">Pas aujourd’hui</p>
      <h1 className="steps">{formatSteps(steps)}</h1>
      <ProgressRing value={steps} />
      <p className="muted small">
        {lastUpdated
          ? `Mis à jour à ${lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
          : "En attente de données…"}
      </p>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  // Objectif indicatif : 10 000 pas. On trace un anneau simple en SVG.
  const goal = 10_000;
  const radius = 90;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const ratio = Math.min(value / goal, 1);
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="ring-wrapper" aria-hidden="true">
      <svg width={radius * 2} height={radius * 2} className="ring">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="ring-label">{Math.round(ratio * 100)}%</span>
    </div>
  );
}

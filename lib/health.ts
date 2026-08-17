// Bridge santé natif via Capacitor (@capgo/capacitor-health).
// HealthKit sur iOS, Google Health Connect sur Android.
// Sur le web (navigateur / preview), le plugin n'est pas disponible.

import { Capacitor } from "@capacitor/core";
import { Health } from "@capgo/capacitor-health";

/** True uniquement dans l'app native Capacitor (pas dans un navigateur). */
export function isNativeHealthAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Demande l'accès en lecture aux pas du jour.
 * Renvoie true si on peut tenter la lecture (sur iOS le statut exact
 * n'est pas toujours exposé — on tente quand même).
 */
export async function requestStepsPermission(): Promise<boolean> {
  const availability = await Health.isAvailable();
  if (!availability.available) {
    throw new Error(
      availability.reason ??
        "Health Connect / HealthKit indisponible sur cet appareil.",
    );
  }

  const status = await Health.requestAuthorization({
    read: ["steps"],
    write: [],
  });

  // Sur Android on a granted/denied. Sur iOS, readDenied peut être vide
  // même si l'utilisateur refuse — on laisse la lecture décider.
  if (
    status.readDenied?.includes("steps") &&
    !status.readAuthorized?.includes("steps")
  ) {
    return false;
  }

  return true;
}

/** ISO du début (00:00) et de la fin (maintenant) du jour local. */
export function getTodayRange(): { startDate: string; endDate: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  // endDate exclusive côté plugin — on prend "maintenant" + 1 ms pour inclure
  // les derniers pas, ou fin de journée.
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** Lit le total de pas du jour via agrégation native (bucket day). */
export async function fetchTodaySteps(): Promise<number> {
  const { startDate, endDate } = getTodayRange();

  try {
    const { samples } = await Health.queryAggregated({
      dataType: "steps",
      startDate,
      endDate,
      bucket: "day",
      aggregation: "sum",
    });

    if (samples.length > 0) {
      return samples.reduce((acc, s) => acc + (s.value ?? 0), 0);
    }
  } catch {
    // Fallback : certains appareils / versions ne supportent pas l'agrégation.
  }

  const { samples } = await Health.readSamples({
    dataType: "steps",
    startDate,
    endDate,
    limit: 10_000,
    ascending: true,
  });

  return samples.reduce((acc, s) => acc + (s.value ?? 0), 0);
}

/** Ouvre les réglages Health Connect (Android). No-op sur iOS / web. */
export async function openHealthSettings(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    await Health.openHealthConnectSettings();
  } catch {
    // silencieux
  }
}

/** Formate un nombre de pas en chaîne lisible (séparateur FR). */
export function formatSteps(steps: number): string {
  return new Intl.NumberFormat("fr-FR").format(steps);
}

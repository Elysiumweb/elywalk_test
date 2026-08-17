// Types et helpers pour le bridge JavaScript de Median.co.
// Source : https://docs.median.co/docs/health-bridge
// On évite d'importer le package côté serveur pour ne pas casser le build Next.js :
// le bridge n'existe que dans le WebView natif. Tous les accès sont gardés par
// un check `typeof window !== "undefined"` et un `isMedianBridgeAvailable()`.

export type HealthDataType =
  | "steps"
  | "distance"
  | "activeEnergy"
  | "totalCaloriesBurned"
  | "exerciseTime"
  | "elevationGain"
  | "speed"
  | "height"
  | "weight"
  | "bmi"
  | "bodyFat"
  | "bodyTemperature"
  | "menstruation"
  | "calorieIntake"
  | "waterIntake"
  | "nutrition"
  | "sleep"
  | "heartRate"
  | "restingHeartRate"
  | "heartRateVariability"
  | "bloodPressure"
  | "bloodGlucose"
  | "oxygenSaturation"
  | "respiratoryRate"
  | "vo2Max";

export type HealthDataBucket = "raw" | "minute" | "hour" | "day";

export interface HealthDataPoint {
  start: string;
  end: string;
  value: number;
}

export interface HealthDataResponse {
  data: Partial<Record<HealthDataType, HealthDataPoint[]>>;
}

export interface PermissionResult {
  granted: HealthDataType[];
  declined: HealthDataType[];
}

export interface MedianHealthBridge {
  requestPermissions: (types: HealthDataType[]) => Promise<PermissionResult>;
  getData: (params: {
    dataTypes: HealthDataType[];
    startDate: string;
    endDate: string;
    bucket?: HealthDataBucket;
  }) => Promise<HealthDataResponse>;
}

export interface MedianBridge {
  healthBridge?: MedianHealthBridge;
}

// On élargit `window` plutôt que de typer le package median-js-bridge
// (qui n'est pas garanti d'être présent dans la WebView).
declare global {
  interface Window {
    median?: MedianBridge;
  }
}

export function isMedianBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.median?.healthBridge);
}

/** Renvoie l'ISO string du début (00:00:00) et de la fin (23:59:59) du jour local. */
export function getTodayRange(): { startDate: string; endDate: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** Formate un nombre de pas en chaîne lisible avec séparateur de milliers français. */
export function formatSteps(steps: number): string {
  return new Intl.NumberFormat("fr-FR").format(steps);
}

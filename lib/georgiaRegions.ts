/**
 * Administrative regions of Georgia (country).
 * Keys are used for storage; labels come from translations (market.regions.{key}).
 */
export const GEORGIA_REGIONS = [
  "tbilisi",
  "adjara",
  "kakheti",
  "imereti",
  "shida_kartli",
  "kvemo_kartli",
  "samegrelo_zemo_svaneti",
  "guria",
  "samtskhe_javakheti",
  "mtskheta_mtianeti",
  "racha_lechkhumi_kvemo_svaneti",
] as const;

export type GeorgiaRegion = (typeof GEORGIA_REGIONS)[number];

export type ImageQuality = "good" | "fair" | "poor";

export type FishCandidate = {
  japaneseName: string;
  scientificName: string | null;
  confidence: number;
  reason: string;
};

export type FishIdentification = {
  isFish: boolean;
  candidates: FishCandidate[];
  imageQuality: ImageQuality;
  warning: string | null;
};

export type DiveMetadata = {
  locationName?: string;
  encounteredAt?: string;
  depthM?: number;
  waterTemperatureC?: number;
  memo?: string;
};

export type RegistrationResult = {
  speciesId: string;
  encounterId: string;
  japaneseName: string;
  scientificName: string | null;
  encounterCount: number;
  isNewSpecies: boolean;
};

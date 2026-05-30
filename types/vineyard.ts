/**
 * Vineyard block - matches Firestore vineyardBlocks collection.
 * Same schema as Memarne mobile app.
 */
export interface VineyardBlock {
  id: string;
  userId: string;
  name: string;
  description?: string;
  area?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  grapeVariety?: string;
  grapeColor?: "red" | "white" | "amber";
  plantingDate?: string | Date;
  soilType?: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateVineyardBlockInput = Omit<
  VineyardBlock,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
export type UpdateVineyardBlockInput = Partial<CreateVineyardBlockInput>;

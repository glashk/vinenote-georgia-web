/**
 * Firestore types - matches vinenote-georgia Expo app.
 */

export interface BaseDocument {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task extends BaseDocument {
  title: string;
  description?: string;
  type: "pruning" | "spraying" | "harvesting" | "fertilizing" | "irrigation" | "other";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  vineyardBlockId?: string;
  notes?: string;
  attachments?: string[];
}

export interface Harvest extends BaseDocument {
  vineyardBlockId: string;
  date: string;
  quantity: number;
  unit: "kg" | "tons" | "lbs";
  grapeVariety?: string;
  sugarBrix?: number;
  quality?: "excellent" | "good" | "fair" | "poor";
  notes?: string;
  weatherConditions?: string;
  harvestedBy?: string;
  containers?: string[];
}

export interface ContainerNote {
  id: string;
  date: string;
  note: string;
  addedBy?: string;
}

export interface Container extends BaseDocument {
  name: string;
  type: "qvevri" | "tank" | "barrel" | "bottle" | "box" | "crate" | "other";
  capacity: number;
  unit: "liters" | "gallons";
  material?: "stainless-steel" | "oak" | "plastic" | "glass" | "clay" | "other";
  location?: string;
  status: "available" | "in-use" | "maintenance" | "retired" | "fermenting" | "aging" | "finished";
  notes?: string;
  photoUrls?: string[];
  notesLog?: ContainerNote[];
  purchaseDate?: string;
  lastCleaned?: string;
  currentHarvestIds?: string[];
}

export interface WineTasting {
  aroma?: string;
  taste?: string;
  color?: "light" | "medium" | "deep";
  acidity?: number;
  tannin?: number;
  body?: number;
  rating?: number;
  note?: string;
}

export type FermentationEventType =
  | "created"
  | "sugar_measurement"
  | "racking"
  | "notes"
  | "bottling";

export interface FermentationEvent {
  type: FermentationEventType;
  date: string;
  note?: string;
}

export interface WineBatchStage {
  stage: "vineyard" | "harvest" | "container" | "status";
  date: string;
  notes?: string;
  data?: {
    vineyardBlockId?: string;
    vineyardBlockName?: string;
    harvestId?: string;
    harvestDate?: string;
    containerId?: string;
    containerName?: string;
    status?: string;
  };
}

export interface WineBatch extends BaseDocument {
  name: string;
  vintage?: number;
  grapeVariety?: string;
  harvestId?: string;
  containerId?: string;
  vineyardBlockId?: string;
  startDate: string;
  endDate?: string;
  status: "fermenting" | "aging" | "bottled" | "completed" | "discarded";
  volume: number;
  alcoholContent?: number;
  pH?: number;
  sugarLevel?: number;
  notes?: string;
  tasting?: WineTasting;
  bottlingDate?: string;
  bottlesProduced?: number;
  photos?: { url: string; uploadedAt?: string }[];
  timeline?: WineBatchStage[];
  events?: FermentationEvent[];
  reminders?: {
    checkFermentation?: string | { id: string; scheduledAt: string };
    racking?: string | { id: string; scheduledAt: string };
    bottling?: string | { id: string; scheduledAt: string };
  };
}

export interface Inventory extends BaseDocument {
  name: string;
  category: "additive" | "packaging" | "equipment" | "chemical" | "other";
  quantity: number;
  unit: "kg" | "g" | "l" | "pcs";
  minQuantity: number;
  notes?: string;
  location?: string;
  photoUrl?: string;
}

export type CreateInput<T> = Omit<T, "id" | "userId" | "createdAt" | "updatedAt">;
export type UpdateInput<T> = Partial<CreateInput<T>>;

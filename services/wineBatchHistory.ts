import { wineBatchesService } from "./wineBatches";
import { harvestsService } from "./harvests";
import { containersService } from "./containers";
import { vineyardBlocksService } from "./vineyardBlocks";
import type {
  WineBatch,
  WineBatchStage,
  Harvest,
  Container,
  VineyardBlock,
  FermentationEvent,
  FermentationEventType,
} from "@/types/firestore";

export async function getWineBatchTimeline(
  userId: string,
  batchId: string
): Promise<{
  batch: WineBatch;
  vineyardBlock: VineyardBlock | null;
  harvest: Harvest | null;
  container: Container | null;
  timeline: WineBatchStage[];
}> {
  const batch = await wineBatchesService.getWineBatch(userId, batchId);
  if (!batch) throw new Error("wineBatches.notFound");

  const [vineyardBlock, harvest, container] = await Promise.all([
    batch.vineyardBlockId
      ? vineyardBlocksService.getVineyardBlock(userId, batch.vineyardBlockId).catch(() => null)
      : Promise.resolve(null),
    batch.harvestId
      ? harvestsService.getHarvest(userId, batch.harvestId).catch(() => null)
      : Promise.resolve(null),
    batch.containerId
      ? containersService.getContainer(userId, batch.containerId).catch(() => null)
      : Promise.resolve(null),
  ]);

  let timeline: WineBatchStage[] = batch.timeline || [];

  if (timeline.length === 0) {
    if (vineyardBlock) {
      timeline.push({
        stage: "vineyard",
        date: vineyardBlock.createdAt || new Date().toISOString(),
        data: { vineyardBlockId: vineyardBlock.id, vineyardBlockName: vineyardBlock.name },
      });
    }
    if (harvest) {
      timeline.push({
        stage: "harvest",
        date: harvest.date,
        notes: harvest.notes ?? undefined,
        data: { harvestId: harvest.id, harvestDate: harvest.date },
      });
    }
    if (container) {
      timeline.push({
        stage: "container",
        date: container.updatedAt || container.createdAt || new Date().toISOString(),
        data: { containerId: container.id, containerName: container.name },
      });
    }
    timeline.push({
      stage: "status",
      date: batch.updatedAt || batch.createdAt || new Date().toISOString(),
      data: { status: batch.status },
    });
  }

  timeline.sort((a, b) => {
    const aT = new Date(a.date).getTime();
    const bT = new Date(b.date).getTime();
    return aT - bT;
  });

  return { batch, vineyardBlock, harvest, container, timeline };
}

export async function addNoteToWineBatchStage(
  userId: string,
  batchId: string,
  stage: WineBatchStage["stage"],
  note: string
): Promise<void> {
  const { timeline } = await getWineBatchTimeline(userId, batchId);
  const now = new Date().toISOString();
  const stampedNote = `${now.slice(0, 16).replace("T", " ")} • ${note}`;

  const candidates = timeline
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => s.stage === stage);

  const target =
    candidates.length === 0
      ? null
      : candidates.reduce((best, cur) =>
          new Date(cur.s.date).getTime() >= new Date(best.s.date).getTime() ? cur : best
        );

  if (!target) {
    timeline.push({ stage, date: now, notes: stampedNote });
  } else {
    const stageEntry = timeline[target.idx];
    stageEntry.notes = stageEntry.notes
      ? `${stageEntry.notes}\n${stampedNote}`
      : stampedNote;
    stageEntry.date = now;
  }

  await wineBatchesService.updateWineBatch(userId, batchId, { timeline });
}

export async function addFermentationEvent(
  userId: string,
  batchId: string,
  event: { type: FermentationEventType; date: string; note?: string }
): Promise<void> {
  const batch = await wineBatchesService.getWineBatch(userId, batchId);
  if (!batch) throw new Error("wineBatches.notFound");

  const newEvent: FermentationEvent = {
    type: event.type,
    date: event.date,
    note: event.note?.trim() || undefined,
  };

  const updatedEvents = [...(batch.events || []), newEvent];
  await wineBatchesService.updateWineBatch(userId, batchId, { events: updatedEvents });
}

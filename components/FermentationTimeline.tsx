"use client";

import type { FermentationEvent, FermentationEventType } from "@/types/firestore";

type Props = {
  events: FermentationEvent[];
  getEventTitle?: (type: FermentationEventType) => string;
  formatDate?: (date: string) => string;
  emptyText?: string;
};

const DEFAULT_EVENT_TITLES: Record<FermentationEventType, string> = {
  created: "Created",
  sugar_measurement: "Sugar measurement",
  racking: "Racking",
  notes: "Notes",
  bottling: "Bottling",
};

function defaultFormatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function FermentationTimeline({
  events,
  getEventTitle = (type) => DEFAULT_EVENT_TITLES[type] ?? type,
  formatDate = defaultFormatDate,
  emptyText = "No events yet",
}: Props) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-0">
      {sortedEvents.map((event, index) => (
        <div key={index} className="flex gap-3 pb-4">
          <div className="flex flex-col items-center w-8">
            <div className="w-3 h-3 rounded-full bg-emerald-700 mt-1.5" />
            {index < sortedEvents.length - 1 && (
              <div className="flex-1 w-0.5 bg-slate-200 mt-1 min-h-6" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-900">
                {getEventTitle(event.type)}
              </span>
              <span className="text-xs text-slate-500">{formatDate(event.date)}</span>
            </div>
            {event.note && (
              <p className="text-sm text-slate-600 leading-relaxed">{event.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

export function KeyboardShortcutsHelp() {
  return (
    <details className="text-xs text-slate-500 dark:text-slate-400">
      <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
        Keyboard shortcuts
      </summary>
      <div className="mt-2 space-y-1">
        <p><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">1</kbd> Dashboard</p>
        <p><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">2</kbd> Reports</p>
        <p><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">3</kbd> Users</p>
        <p><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">4</kbd> Listings</p>
        <p className="pt-1 border-t border-slate-200 dark:border-slate-600 mt-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">D</kbd> Delete listing
          <span className="mx-2">|</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">B</kbd> Ban user
          <span className="mx-2">|</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600">W</kbd> Warn
        </p>
      </div>
    </details>
  );
}

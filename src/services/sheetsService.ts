/**
 * Google Sheets service for WeActive9.
 *
 * All network work happens server-side (see `src/lib/sheets.functions.ts`) so the
 * connector credentials never reach the browser. Until a Google Sheets connection
 * and `WEACTIVE9_SPREADSHEET_ID` are configured, every call resolves to
 * `{ synced: false }` and the app keeps working from local state.
 */
import { appendSheetRow, readSheetRange } from "@/lib/sheets.functions";
import type { Engineer, ExpenseEntry, ShiftLog } from "@/lib/mock-data";

export const SHEET_TABS = {
  engineers: "Engineers!A2:E",
  shifts: "Shifts!A:F",
  expenses: "Expenses!A:H",
} as const;

export interface SyncResult {
  synced: boolean;
  error?: string;
}

/** Read the engineer master records from the Engineers tab. */
export async function fetchEngineerRecords(): Promise<Engineer[]> {
  try {
    const res = await readSheetRange({ data: { range: SHEET_TABS.engineers } });
    if (!res.configured) return [];
    return res.values
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] ?? "",
        name: r[1] ?? "",
        email: r[2] ?? "",
        region: r[3] ?? "",
        hourlyRate: Number(r[4] ?? 0),
      }));
  } catch (err) {
    console.error("[sheetsService] fetchEngineerRecords failed", err);
    return [];
  }
}

/** Append a submitted shift to the Shifts tab. */
export async function pushShift(shift: ShiftLog, engineerName: string): Promise<SyncResult> {
  return append(SHEET_TABS.shifts, [
    shift.id,
    engineerName,
    shift.date,
    shift.site,
    shift.shiftType,
    shift.hours,
  ]);
}

/** Append a submitted expense claim to the Expenses tab. */
export async function pushExpense(
  expense: ExpenseEntry,
  engineerName: string,
): Promise<SyncResult> {
  return append(SHEET_TABS.expenses, [
    expense.id,
    engineerName,
    expense.date,
    expense.site,
    expense.fuel,
    expense.meals,
    expense.creditCard,
    expense.receiptName ?? "",
  ]);
}

async function append(range: string, row: (string | number)[]): Promise<SyncResult> {
  try {
    const res = await appendSheetRow({ data: { range, row } });
    return { synced: res.configured };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown Google Sheets error";
    console.error("[sheetsService] append failed", error);
    return { synced: false, error };
  }
}

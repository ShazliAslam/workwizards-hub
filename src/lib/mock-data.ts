export type Status = "Pending" | "Approved";
export type ShiftType = "Day" | "Night";

export interface Engineer {
  id: string;
  name: string;
  email: string;
  region: string;
  hourlyRate: number;
  /** Optional per-engineer Google Sheet ID used for two-way data syncing. */
  sheetId?: string | undefined;
  /** Blocked engineers stay in reports but cannot submit new records. */
  active: boolean;
}

/** UK VAT is 20%; expense amounts are captured VAT-inclusive. */
export const VAT_RATE = 0.2;
export const vatPortion = (grossInclusive: number) =>
  grossInclusive - grossInclusive / (1 + VAT_RATE);

export interface ShiftLog {
  id: string;
  engineerId: string;
  date: string; // YYYY-MM-DD
  site: string;
  shiftType: ShiftType;
  hours: number;
  status: Status;
}

export interface ExpenseEntry {
  id: string;
  engineerId: string;
  date: string;
  site: string;
  fuel: number;
  meals: number;
  creditCard: number;
  receiptName?: string | undefined;
  status: Status;
}

export const SITES = [
  "Aberdeen North Substation",
  "Bristol Data Centre",
  "Cardiff Retail Park",
  "Glasgow Rail Depot",
  "Leeds Wind Farm",
  "Manchester Tower A",
  "Norwich Solar Array",
  "Southampton Docks",
];

const FIRST = [
  "James","Sarah","Mohammed","Priya","Liam","Chloe","Daniel","Aisha","Tom","Grace",
  "Ethan","Nadia","Oliver","Fatima","Callum","Zara","Ben","Isla","Ryan","Maya",
  "Connor","Leah","Josh","Amara","Nathan","Ruby","Adam","Sofia","Jack","Elena",
];
const LAST = [
  "Whitfield","Okafor","Rahman","Sharma","Doyle","Bennett","Carver","Hassan","Lawson","Mercer",
  "Nolan","Farah","Pierce","Iqbal","Reid","Malik","Sutton","Grant","Kelly","Barnes",
  "Hughes","Foster","Ellis","Nwosu","Clarke","Dawson","Blake","Moreno","Turner","Petrov",
];

// Deterministic pseudo-random so server and client render identically.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const ENGINEERS: Engineer[] = FIRST.map((f, i) => {
  const r = rng(i + 7);
  const name = `${f} ${LAST[i]!}`;
  return {
    id: `ENG-${String(i + 1).padStart(3, "0")}`,
    name,
    email: `${f.toLowerCase()}.${LAST[i]!.toLowerCase()}@weactive9.com`,
    region: ["North", "South", "Midlands", "Scotland", "Wales"][i % 5]!,
    hourlyRate: 26 + Math.round(r() * 14),
  };
});

export const CURRENT_ENGINEER = ENGINEERS[0]!;

function dateNDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export const SHIFTS: ShiftLog[] = [];
export const EXPENSES: ExpenseEntry[] = [];

ENGINEERS.forEach((eng, ei) => {
  const r = rng(ei * 31 + 3);
  for (let d = 0; d < 28; d++) {
    if (r() < 0.32) continue;
    const site = SITES[Math.floor(r() * SITES.length)]!;
    const date = dateNDaysAgo(d);
    const status: Status = d > 6 || r() > 0.45 ? "Approved" : "Pending";
    SHIFTS.push({
      id: `SH-${ei}-${d}`,
      engineerId: eng.id,
      date,
      site,
      shiftType: r() > 0.72 ? "Night" : "Day",
      hours: 6 + Math.round(r() * 6),
      status,
    });
    if (r() < 0.75) {
      EXPENSES.push({
        id: `EX-${ei}-${d}`,
        engineerId: eng.id,
        date,
        site,
        fuel: Math.round((12 + r() * 58) * 100) / 100,
        meals: Math.round((6 + r() * 22) * 100) / 100,
        creditCard: r() > 0.6 ? Math.round((20 + r() * 180) * 100) / 100 : 0,
        receiptName: r() > 0.5 ? `receipt-${ei}-${d}.pdf` : undefined,
        status,
      });
    }
  }
});

export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

export const gbp2 = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export const expenseTotal = (e: ExpenseEntry) => e.fuel + e.meals + e.creditCard;

export function daysAgo(dateStr: string) {
  const now = new Date().toISOString().slice(0, 10);
  return Math.round(
    (Date.parse(now) - Date.parse(dateStr)) / 86400000,
  );
}

export const engineerById = (id: string) => ENGINEERS.find((e) => e.id === id);

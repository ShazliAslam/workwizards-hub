import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { toast } from "sonner";
import {
  CURRENT_ENGINEER,
  ENGINEERS,
  EXPENSES,
  SHIFTS,
  type Engineer,
  type ExpenseEntry,
  type ShiftLog,
} from "./mock-data";
import {
  fetchEngineerSheetRecords,
  pushEngineer,
  pushExpense,
  pushShift,
} from "@/services/sheetsService";

export type Role = "engineer" | "admin";

export interface NewEngineerInput {
  name: string;
  email: string;
  region: string;
  hourlyRate: number;
  sheetId?: string | undefined;
}

interface SessionValue {
  role: Role | null;
  engineerId: string;
  engineer: Engineer;
  engineers: Engineer[];
  findEngineer: (id: string) => Engineer | undefined;
  setEngineerId: (id: string) => void;
  signIn: (role: Role, engineerId?: string) => void;
  signOut: () => void;
  shifts: ShiftLog[];
  expenses: ExpenseEntry[];
  addShift: (s: Omit<ShiftLog, "id" | "engineerId" | "status">) => void;
  addExpense: (e: Omit<ExpenseEntry, "id" | "engineerId" | "status">) => void;
  addEngineer: (input: NewEngineerInput) => Engineer;
  setEngineerActive: (id: string, active: boolean) => void;
  syncEngineerFromSheet: (id: string) => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

/** Merge sheet-sourced rows into local state without duplicating ids. */
function mergeById<T extends { id: string }>(local: T[], incoming: T[]): T[] {
  const known = new Set(local.map((r) => r.id));
  const fresh = incoming.filter((r) => r.id && !known.has(r.id));
  return fresh.length ? [...fresh, ...local] : local;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [engineerId, setEngineerId] = useState<string>(CURRENT_ENGINEER.id);
  const [engineers, setEngineers] = useState<Engineer[]>(ENGINEERS);
  const [shifts, setShifts] = useState<ShiftLog[]>(SHIFTS);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(EXPENSES);

  const value = useMemo<SessionValue>(() => {
    const findEngineer = (id: string) => engineers.find((e) => e.id === id);
    const engineer = findEngineer(engineerId) ?? engineers[0]!;

    const syncToast = (label: string, result: { synced: boolean; error?: string }) => {
      if (result.synced) toast.success(`${label} synced to Google Sheets`);
      else if (result.error) toast.error(`Google Sheets sync failed`, { description: result.error });
    };

    return {
      role,
      engineerId,
      engineer,
      engineers,
      findEngineer,
      setEngineerId,
      signIn: (r, id) => {
        if (id) setEngineerId(id);
        setRole(r);
      },
      signOut: () => setRole(null),
      shifts,
      expenses,
      addShift: (s) => {
        const shift: ShiftLog = {
          ...s,
          id: `SH-new-${Date.now()}`,
          engineerId: engineer.id,
          status: "Pending",
        };
        setShifts((prev) => [shift, ...prev]);
        void pushShift(shift, engineer).then((r) => syncToast("Shift", r));
      },
      addExpense: (e) => {
        const expense: ExpenseEntry = {
          ...e,
          id: `EX-new-${Date.now()}`,
          engineerId: engineer.id,
          status: "Pending",
        };
        setExpenses((prev) => [expense, ...prev]);
        void pushExpense(expense, engineer).then((r) => syncToast("Expense claim", r));
      },
      addEngineer: (input) => {
        const next: Engineer = {
          id: `ENG-${String(engineers.length + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
          name: input.name,
          email: input.email,
          region: input.region,
          hourlyRate: input.hourlyRate,
          sheetId: input.sheetId,
          active: true,
        };
        setEngineers((prev) => [...prev, next]);
        void pushEngineer(next).then((r) => syncToast("Engineer record", r));
        return next;
      },
      setEngineerActive: (id, active) => {
        setEngineers((prev) => prev.map((e) => (e.id === id ? { ...e, active } : e)));
        const target = findEngineer(id);
        toast.success(`${target?.name ?? "Engineer"} ${active ? "activated" : "blocked"}`);
      },
      syncEngineerFromSheet: async (id) => {
        const target = findEngineer(id);
        if (!target?.sheetId) {
          toast.info("No Google Sheet linked", {
            description: "Add a Sheet ID to this engineer to pull their external records.",
          });
          return;
        }
        const res = await fetchEngineerSheetRecords(target);
        if (!res.configured) {
          toast.error("Google Sheets is not connected yet");
          return;
        }
        setShifts((prev) => mergeById(prev, res.shifts));
        setExpenses((prev) => mergeById(prev, res.expenses));
        toast.success(`Synced ${target.name}'s sheet`, {
          description: `${res.shifts.length} shifts · ${res.expenses.length} claims reviewed`,
        });
      },
    };
  }, [role, engineerId, engineers, shifts, expenses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

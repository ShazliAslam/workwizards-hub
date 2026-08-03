import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  CURRENT_ENGINEER,
  ENGINEERS,
  EXPENSES,
  SHIFTS,
  engineerById,
  type Engineer,
  type ExpenseEntry,
  type ShiftLog,
} from "./mock-data";
import { pushExpense, pushShift } from "@/services/sheetsService";

export type Role = "engineer" | "admin";

interface SessionValue {
  role: Role | null;
  engineerId: string;
  engineer: Engineer;
  setEngineerId: (id: string) => void;
  signIn: (role: Role, engineerId?: string) => void;
  signOut: () => void;
  shifts: ShiftLog[];
  expenses: ExpenseEntry[];
  addShift: (s: Omit<ShiftLog, "id" | "engineerId" | "status">) => void;
  addExpense: (e: Omit<ExpenseEntry, "id" | "engineerId" | "status">) => void;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [engineerId, setEngineerId] = useState<string>(CURRENT_ENGINEER.id);
  const [shifts, setShifts] = useState<ShiftLog[]>(SHIFTS);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(EXPENSES);

  const value = useMemo<SessionValue>(() => {
    const engineer = engineerById(engineerId) ?? ENGINEERS[0]!;

    const syncToast = (label: string, result: { synced: boolean; error?: string }) => {
      if (result.synced) toast.success(`${label} synced to Google Sheets`);
      else if (result.error) toast.error(`Google Sheets sync failed`, { description: result.error });
    };

    return {
      role,
      engineerId,
      engineer,
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
        void pushShift(shift, engineer.name).then((r) => syncToast("Shift", r));
      },
      addExpense: (e) => {
        const expense: ExpenseEntry = {
          ...e,
          id: `EX-new-${Date.now()}`,
          engineerId: engineer.id,
          status: "Pending",
        };
        setExpenses((prev) => [expense, ...prev]);
        void pushExpense(expense, engineer.name).then((r) => syncToast("Expense claim", r));
      },
    };
  }, [role, engineerId, shifts, expenses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

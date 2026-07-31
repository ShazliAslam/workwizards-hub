import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CURRENT_ENGINEER,
  EXPENSES,
  SHIFTS,
  type ExpenseEntry,
  type ShiftLog,
} from "./mock-data";

export type Role = "engineer" | "admin";

interface SessionValue {
  role: Role | null;
  engineerId: string;
  signIn: (role: Role) => void;
  signOut: () => void;
  shifts: ShiftLog[];
  expenses: ExpenseEntry[];
  addShift: (s: Omit<ShiftLog, "id" | "engineerId" | "status">) => void;
  addExpense: (e: Omit<ExpenseEntry, "id" | "engineerId" | "status">) => void;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [shifts, setShifts] = useState<ShiftLog[]>(SHIFTS);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(EXPENSES);

  const value = useMemo<SessionValue>(
    () => ({
      role,
      engineerId: CURRENT_ENGINEER.id,
      signIn: setRole,
      signOut: () => setRole(null),
      shifts,
      expenses,
      addShift: (s) =>
        setShifts((prev) => [
          {
            ...s,
            id: `SH-new-${prev.length}-${Date.now()}`,
            engineerId: CURRENT_ENGINEER.id,
            status: "Pending",
          },
          ...prev,
        ]),
      addExpense: (e) =>
        setExpenses((prev) => [
          {
            ...e,
            id: `EX-new-${prev.length}-${Date.now()}`,
            engineerId: CURRENT_ENGINEER.id,
            status: "Pending",
          },
          ...prev,
        ]),
    }),
    [role, shifts, expenses],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

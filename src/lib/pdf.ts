import type { Engineer, ExpenseEntry, ShiftLog } from "@/lib/mock-data";
import { expenseTotal } from "@/lib/mock-data";

const NAVY: [number, number, number] = [16, 34, 66];
const EMERALD: [number, number, number] = [16, 145, 105];

const money = (n: number) =>
  `GBP ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function newDoc(title: string, subtitle: string) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, width, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("WeActive9", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(190, 205, 225);
  doc.text("Field Operations · Shifts, Expenses & Payroll", 40, 58);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 40, 116);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 118, 130);
  doc.text(subtitle, 40, 132);
  doc.setTextColor(20, 20, 20);

  return { doc, autoTable, width };
}

function sectionTitle(doc: import("jspdf").jsPDF, startY: number, label: string) {
  const y = doc.getNumberOfPages() > 1 && startY > 200 ? 46 : startY - 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 34, 66);
  doc.text(label, 40, y);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
}

function footer(doc: import("jspdf").jsPDF) {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 148, 160);
    doc.text(
      `Generated ${new Date().toLocaleString("en-GB")} · WeActive9 confidential`,
      40,
      height - 24,
    );
    doc.text(`Page ${i} of ${pages}`, width - 40, height - 24, { align: "right" });
  }
}

export async function generateEngineerStatementPdf(
  engineer: Engineer,
  shifts: ShiftLog[],
  expenses: ExpenseEntry[],
) {
  const { doc, autoTable } = await newDoc(
    "Engineer statement · last 28 days",
    `${engineer.name} · ${engineer.region} region · ${engineer.email}`,
  );

  const totalHours = shifts.reduce((a, s) => a + s.hours, 0);
  const totalClaims = expenses.reduce((a, e) => a + expenseTotal(e), 0);

  let startY = 150;
  autoTable(doc, {
    startY,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 6 },
    body: [
      ["Total hours logged", `${totalHours} h`],
      ["Base rate", money(engineer.hourlyRate) + " / hour"],
      ["Estimated base pay", money(totalHours * engineer.hourlyRate)],
      ["Total expense claims", money(totalClaims)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 200 }, 1: { halign: "right" } },
    tableWidth: 380,
  });

  startY = (doc as never as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  autoTable(doc, {
    startY,
    head: [["Date", "Site", "Shift", "Hours", "Status"]],
    body: shifts.map((s) => [s.date, s.site, s.shiftType, `${s.hours}`, s.status]),
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [243, 246, 250] },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: 40, right: 40, top: 60 },
    pageBreak: "auto",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didDrawPage: () => sectionTitle(doc, startY, "Shift log"),
  });

  startY = (doc as never as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  autoTable(doc, {
    startY,
    head: [["Date", "Site", "Fuel", "Meals", "Card", "Total", "Receipt", "Status"]],
    body: expenses.map((e) => [
      e.date,
      e.site,
      money(e.fuel),
      money(e.meals),
      money(e.creditCard),
      money(expenseTotal(e)),
      e.receiptName ? "Yes" : "—",
      e.status,
    ]),
    foot: [["", "Total claimed", "", "", "", money(totalClaims), "", ""]],
    headStyles: { fillColor: EMERALD, textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [235, 240, 246], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [243, 246, 250] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: 40, right: 40, top: 60 },
    pageBreak: "avoid",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didDrawPage: () => sectionTitle(doc, startY, "Expense claims"),
  });

  footer(doc);
  doc.save(`weactive9-statement-${engineer.id}.pdf`);
}

export interface PayrollRow {
  name: string;
  region: string;
  rate: number;
  dayHours: number;
  nightHours: number;
  base: number;
  reimb: number;
  gross: number;
}

export async function generatePayrollPdf(rows: PayrollRow[], periodLabel: string) {
  const { doc, autoTable } = await newDoc(
    "Payroll run",
    `${periodLabel} · ${rows.length} engineers`,
  );

  const total = rows.reduce((a, r) => a + r.gross, 0);
  const baseTotal = rows.reduce((a, r) => a + r.base, 0);
  const reimbTotal = rows.reduce((a, r) => a + r.reimb, 0);

  let startY = 150;
  autoTable(doc, {
    startY,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 6 },
    body: [
      ["Base pay (incl. 15% night uplift)", money(baseTotal)],
      ["Approved reimbursements", money(reimbTotal)],
      ["Gross payroll", money(total)],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 240 }, 1: { halign: "right" } },
    tableWidth: 400,
  });

  startY = (doc as never as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  autoTable(doc, {
    startY,
    head: [["Engineer", "Region", "Rate", "Day h", "Night h", "Base", "Reimb.", "Gross"]],
    body: rows.map((r) => [
      r.name,
      r.region,
      money(r.rate),
      `${r.dayHours}`,
      `${r.nightHours}`,
      money(r.base),
      money(r.reimb),
      money(r.gross),
    ]),
    foot: [["Total", "", "", "", "", money(baseTotal), money(reimbTotal), money(total)]],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [235, 240, 246], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 4 },
    alternateRowStyles: { fillColor: [243, 246, 250] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 40, right: 40, top: 60 },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didDrawPage: () => sectionTitle(doc, startY, "Payroll breakdown"),
  });

  footer(doc);
  doc.save(`weactive9-payroll-${new Date().toISOString().slice(0, 10)}.pdf`);
}

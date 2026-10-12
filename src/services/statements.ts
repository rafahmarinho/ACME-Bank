import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Account, Transaction } from "@/lib/types";
import { money } from "./bank";
const escapeCsv = (value: string) =>
  `"${value.replace(/^[=+@\-]/, "'$&").replaceAll('"', '""')}"`;
export function statementRows(
  transactions: Transaction[],
  accountId: string,
  month: string,
) {
  return transactions
    .filter(
      (item) =>
        item.accountId === accountId &&
        item.date.startsWith(month) &&
        item.status === "completed",
    )
    .sort((first, second) => first.date.localeCompare(second.date));
}
export function exportStatement(
  format: "csv" | "pdf",
  account: Account,
  all: Transaction[],
  month: string,
  name: string,
) {
  const rows = statementRows(all, account.id, month);
  const opening = all
    .filter(
      (item) =>
        item.accountId === account.id &&
        item.status === "completed" &&
        item.date.slice(0, 7) < month,
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const closing = opening + rows.reduce((sum, item) => sum + item.amount, 0);
  const filename = `ACME-${account.number.slice(-4)}-${month}.${format}`;
  if (format === "csv") {
    const content = [
      "Date,Description,Category,Amount (cents),Reference",
      ...rows.map((item) =>
        [
          item.date.slice(0, 10),
          escapeCsv(item.description),
          escapeCsv(item.category),
          item.amount,
          escapeCsv(item.reference),
        ].join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  } else {
    const doc = new jsPDF();
    doc.setFontSize(23);
    doc.setTextColor(22, 39, 57);
    doc.text("ACME Bank", 16, 22);
    doc.setFontSize(11);
    doc.text(
      `${name} | ${account.name} | ending ${account.number.slice(-4)}`,
      16,
      33,
    );
    doc.text(`Statement: ${month} | USD | Simulated banking account`, 16, 41);
    doc.text(
      `Opening: ${money(opening)}    Closing: ${money(closing)}`,
      16,
      51,
    );
    autoTable(doc, {
      startY: 60,
      head: [["Date", "Description", "Category", "Amount", "Reference"]],
      body: rows.map((item) => [
        item.date.slice(0, 10),
        item.description,
        item.category,
        money(item.amount),
        item.reference,
      ]),
      headStyles: { fillColor: [22, 39, 57] },
      styles: { fontSize: 8 },
    });
    doc.save(filename);
  }
}

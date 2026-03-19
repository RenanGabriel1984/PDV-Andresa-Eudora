import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getStoreSettings } from "@/app/configuracoes/page";

export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = "Sheet1"
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (
  title: string,
  columns: string[],
  data: any[][],
  filename: string
) => {
  const doc = new jsPDF();
  const settings = getStoreSettings();

  // Add store logo if available (this is a bit complex with jsPDF, skipping for now, just text)
  doc.setFontSize(18);
  doc.text(settings.storeName || "Minha Loja", 14, 22);

  doc.setFontSize(14);
  doc.text(title, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [columns],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
  });

  doc.save(`${filename}.pdf`);
};

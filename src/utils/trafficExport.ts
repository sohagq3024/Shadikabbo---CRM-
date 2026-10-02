import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportTrafficItem {
  id: string;
  serialNumber: number;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  profession?: string;
  jobType?: string;
  maritalStatus?: string;
  religion?: string;
  height?: string;
  package?: string;
  price?: number;
  discount?: number;
  paidAmount?: number;
  dueAmount?: number;
  assignBy?: string;
  assignedTo?: { id: string; name: string };
  createdAt?: string;
  paymentStatus?: string;
}

/**
 * Exports traffic records to an Excel (.xlsx) file.
 */
export const exportTrafficToExcel = (data: ExportTrafficItem[], filterSummary?: string) => {
  if (!data || data.length === 0) {
    throw new Error('No traffic data available to export.');
  }

  const rows = data.map((item) => ({
    'Sl.': item.serialNumber,
    'Traffic ID': item.id,
    'Date': item.createdAt || 'N/A',
    'Candidate Name': item.name,
    'Gender': item.gender || 'N/A',
    'Phone Number': item.phone,
    'Email': item.email || 'N/A',
    'Profession': item.profession || 'N/A',
    'Marital Status': item.maritalStatus || 'N/A',
    'Package': item.package || 'N/A',
    'Price (BDT)': item.price ?? 0,
    'Discount (BDT)': item.discount ?? 0,
    'Paid (BDT)': item.paidAmount ?? 0,
    'Due (BDT)': item.dueAmount ?? 0,
    'Assign By': item.assignBy || 'MK Official',
    'Assigned To': item.assignedTo?.name || 'Unassigned',
    'Payment Status': item.paymentStatus || 'Pending',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // Sl
    { wch: 14 }, // Traffic ID
    { wch: 14 }, // Date
    { wch: 22 }, // Name
    { wch: 10 }, // Gender
    { wch: 16 }, // Phone
    { wch: 24 }, // Email
    { wch: 20 }, // Profession
    { wch: 16 }, // Marital Status
    { wch: 14 }, // Package
    { wch: 12 }, // Price
    { wch: 14 }, // Discount
    { wch: 12 }, // Paid
    { wch: 12 }, // Due
    { wch: 16 }, // Assign By
    { wch: 16 }, // Assigned To
    { wch: 14 }, // Status
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Traffic Records');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Traffic_Records_${today}.xlsx`);
};

/**
 * Exports traffic records to a PDF (.pdf) file.
 */
export const exportTrafficToPdf = (data: ExportTrafficItem[], filterSummary?: string) => {
  if (!data || data.length === 0) {
    throw new Error('No traffic data available to export.');
  }

  // Create landscape document for good tabular spacing
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const primaryColor = [24, 30, 84]; // #181E54 navy
  const accentColor = [216, 17, 36]; // #D81124 crimson

  // Document Title Header
  doc.setFillColor(24, 30, 84);
  doc.rect(0, 0, 842, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Matrimonial Traffic Records Report', 40, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated: ${dateStr}`, 650, 32);

  // Subtitle / Filter info
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text(
    `Total Records: ${data.length}${filterSummary ? ` | Filter: ${filterSummary}` : ''}`,
    40,
    72
  );

  // Prepare table columns and rows
  const tableColumns = [
    'Sl.',
    'Traffic ID',
    'Date',
    'Name',
    'Gender',
    'Phone',
    'Package',
    'Paid (BDT)',
    'Due (BDT)',
    'Assigned To',
  ];

  const tableRows = data.map((item) => [
    item.serialNumber.toString(),
    item.id,
    item.createdAt || 'N/A',
    item.name,
    item.gender || '-',
    item.phone,
    item.package || '-',
    (item.paidAmount ?? 0).toLocaleString(),
    (item.dueAmount ?? 0).toLocaleString(),
    item.assignedTo?.name || 'Unassigned',
  ]);

  autoTable(doc, {
    startY: 85,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [24, 30, 84],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 85, left: 40, right: 40, bottom: 40 },
    didDrawPage: (dataInfo) => {
      // Footer page numbering
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${dataInfo.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    },
  });

  const today = new Date().toISOString().split('T')[0];
  doc.save(`Traffic_Records_${today}.pdf`);
};

// Tipe data M4 — invoice SPP

export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "cancelled";

export interface InvoiceComponent {
  nama: string;
  jumlah: number;
}

export interface InvoicePayment {
  id: number;
  amount: number;
  method: string | null;
  proofUrl: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface InvoiceRow {
  id: number;
  studentId: number;
  period: string;
  components: InvoiceComponent[];
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  cancelReason?: string | null;
  createdAt: string;
  student: { id: number; noid: string; name: string; whatsapp: string };
  payments: InvoicePayment[];
  daysOverdue?: number;
}

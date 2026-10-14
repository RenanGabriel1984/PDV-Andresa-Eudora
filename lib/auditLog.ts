import { supabase } from "./supabase";

export interface PaymentAuditLog {
  id: string;
  timestamp: string; // ISO String
  date: string;      // DD/MM/AAAA
  time: string;      // HH:MM:SS
  action: "EDIT" | "DELETE" | "CREATE";
  user: string;      // Email or username of the person who made the change
  saleId: string;
  clientId?: string;
  clientName?: string;
  paymentId?: string;
  oldAmount: number | null;
  newAmount: number | null;
  oldMethod?: string;
  newMethod?: string;
  oldDate?: string;
  newDate?: string;
  notes?: string;
  description?: string;
}

const STORAGE_KEY = "payment_audit_logs";

export function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Get current user display name or email
export async function getCurrentUser(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.email) {
      return data.session.user.email;
    }
  } catch (err) {
    console.warn("Could not retrieve auth session:", err);
  }

  // Fallback to local user or store name
  if (typeof window !== "undefined") {
    const savedUser = localStorage.getItem("current_operator_name");
    if (savedUser) return savedUser;
  }

  return "Vendedor(a)";
}

/**
 * Record an audit log entry for payment alteration or deletion.
 * Always writes to localStorage immediately (guaranteed offline safety).
 * Also attempts to write to Supabase table `payment_audit_logs` if it exists.
 */
export async function logPaymentAction(params: {
  action: "EDIT" | "DELETE" | "CREATE";
  saleId: string;
  clientId?: string;
  clientName?: string;
  paymentId?: string;
  oldAmount: number | null;
  newAmount: number | null;
  oldMethod?: string;
  newMethod?: string;
  oldDate?: string;
  newDate?: string;
  notes?: string;
  user?: string;
}): Promise<PaymentAuditLog> {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const currentUser = params.user || (await getCurrentUser());

  let description = "";
  if (params.action === "DELETE") {
    description = `Pagamento de ${params.oldAmount !== null ? formatCurrencyBR(params.oldAmount) : "R$ 0,00"} excluído da venda #${params.saleId.slice(0, 8)}`;
  } else if (params.action === "EDIT") {
    const oldV = params.oldAmount !== null ? formatCurrencyBR(params.oldAmount) : "R$ 0,00";
    const newV = params.newAmount !== null ? formatCurrencyBR(params.newAmount) : "R$ 0,00";
    description = `Pagamento alterado de ${oldV} para ${newV} na venda #${params.saleId.slice(0, 8)}`;
  } else {
    description = `Novo pagamento de ${params.newAmount !== null ? formatCurrencyBR(params.newAmount) : "R$ 0,00"} registrado na venda #${params.saleId.slice(0, 8)}`;
  }

  const logEntry: PaymentAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    date: dateStr,
    time: timeStr,
    action: params.action,
    user: currentUser,
    saleId: params.saleId,
    clientId: params.clientId,
    clientName: params.clientName || "Cliente",
    paymentId: params.paymentId,
    oldAmount: params.oldAmount,
    newAmount: params.newAmount,
    oldMethod: params.oldMethod,
    newMethod: params.newMethod,
    oldDate: params.oldDate,
    newDate: params.newDate,
    notes: params.notes,
    description,
  };

  // 1. Save to LocalStorage immediately
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalAuditLogs();
      const updated = [logEntry, ...existing].slice(0, 500); // keep last 500 logs
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar log de auditoria no localStorage:", err);
    }
  }

  // 2. Try to sync to Supabase table if it exists
  try {
    const dbPayload = {
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      date_str: logEntry.date,
      time_str: logEntry.time,
      action: logEntry.action,
      user_email: logEntry.user,
      sale_id: logEntry.saleId,
      client_id: logEntry.clientId || null,
      client_name: logEntry.clientName || null,
      payment_id: logEntry.paymentId || null,
      old_amount: logEntry.oldAmount,
      new_amount: logEntry.newAmount,
      old_method: logEntry.oldMethod || null,
      new_method: logEntry.newMethod || null,
      notes: logEntry.notes || null,
      description: logEntry.description,
    };

    // Fire and forget, catch table not found gracefully
    Promise.resolve(supabase.from("payment_audit_logs").insert([dbPayload]))
      .then((res: any) => {
        if (res?.error) {
          // Table doesn't exist or RLS blocked - safe to ignore since localStorage has the record
          console.info("Supabase payment_audit_logs sync note:", res.error.message);
        }
      })
      .catch(() => {});
  } catch (err) {
    // Network or other issue, safe to ignore
  }

  return logEntry;
}

/**
 * Retrieve audit logs from localStorage (synchronous)
 */
export function getLocalAuditLogs(): PaymentAuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler logs de auditoria do localStorage:", err);
    return [];
  }
}

/**
 * Retrieve all audit logs (tries Supabase first, falls back/merges with localStorage)
 */
export async function getPaymentAuditLogs(): Promise<PaymentAuditLog[]> {
  const localLogs = getLocalAuditLogs();

  try {
    const { data, error } = await supabase
      .from("payment_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (!error && data && data.length > 0) {
      const dbLogs: PaymentAuditLog[] = data.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at,
        date: row.date_str || new Date(row.timestamp).toLocaleDateString("pt-BR"),
        time: row.time_str || new Date(row.timestamp).toLocaleTimeString("pt-BR"),
        action: row.action,
        user: row.user_email || "Vendedor(a)",
        saleId: row.sale_id,
        clientId: row.client_id,
        clientName: row.client_name,
        paymentId: row.payment_id,
        oldAmount: row.old_amount,
        newAmount: row.new_amount,
        oldMethod: row.old_method,
        newMethod: row.new_method,
        notes: row.notes,
        description: row.description,
      }));

      // Merge unique by ID
      const map = new Map<string, PaymentAuditLog>();
      [...localLogs, ...dbLogs].forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  } catch (err) {
    console.warn("Could not fetch remote audit logs, using local:", err);
  }

  return localLogs;
}

/**
 * Clear audit logs from localStorage (requires explicit user action)
 */
export function clearLocalAuditLogs(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Export audit logs to CSV for download
 */
export function exportAuditLogsCSV(logs: PaymentAuditLog[]) {
  if (logs.length === 0) return;

  const headers = [
    "ID do Log",
    "Data",
    "Hora",
    "Ação",
    "Usuário",
    "Cliente",
    "ID da Venda",
    "Valor Antigo (R$)",
    "Novo Valor (R$)",
    "Forma Pagamento",
    "Observações",
    "Descrição",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.date,
    log.time,
    log.action === "DELETE" ? "EXCLUSÃO" : log.action === "EDIT" ? "EDIÇÃO" : "CRIAÇÃO",
    log.user,
    `"${(log.clientName || "").replace(/"/g, '""')}"`,
    log.saleId,
    log.oldAmount !== null ? log.oldAmount.toFixed(2).replace(".", ",") : "",
    log.newAmount !== null ? log.newAmount.toFixed(2).replace(".", ",") : "",
    `"${(log.newMethod || log.oldMethod || "").replace(/"/g, '""')}"`,
    `"${(log.notes || "").replace(/"/g, '""')}"`,
    `"${(log.description || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "\uFEFF" + // UTF-8 BOM for Excel in Portuguese
    [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `historico_auditoria_pagamentos_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

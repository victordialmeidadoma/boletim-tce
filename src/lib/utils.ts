import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, fmt = "dd 'de' MMMM 'de' yyyy") {
  try {
    const date = dateStr.includes("T") ? parseISO(dateStr) : parseISO(dateStr + "T12:00:00");
    return format(date, fmt, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string) {
  return formatDate(dateStr, "dd/MM/yyyy");
}

export function formatWeekday(dateStr: string) {
  return formatDate(dateStr, "EEEE, dd 'de' MMMM");
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function formatTime(dateStr: string) {
  try {
    return format(parseISO(dateStr), "HH:mm");
  } catch {
    return "";
  }
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, PlayCircle, MapPin, Video, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  status: string;
  startAt: string;
  endAt?: string | null;
  type: string;
  location?: string | null;
  onlineUrl?: string | null;
  isPublic: boolean;
  community?: { name: string; slug: string; primaryColor: string } | null;
  kind: "event";
}

interface CalendarLive {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  community: { name: string; slug: string; primaryColor: string };
  host: { firstName: string; lastName: string };
  kind: "live";
}

type CalendarItem = CalendarEvent | CalendarLive;

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getItemDate(item: CalendarItem): Date {
  return new Date(item.kind === "event" ? (item as CalendarEvent).startAt : (item as CalendarLive).scheduledAt);
}

function itemColor(item: CalendarItem): string {
  const color = item.kind === "live" ? "#EF4444" : (item as CalendarEvent).community?.primaryColor ?? "#009CD9";
  return color;
}

function StatusBadge({ status, kind }: { status: string; kind: string }) {
  if (kind === "live" && status === "LIVE") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Ao vivo
      </span>
    );
  }
  const map: Record<string, string> = {
    SCHEDULED: "Agendado",
    UPCOMING: "Em breve",
    LIVE: "Ao vivo",
    ENDED: "Encerrado",
    CANCELED: "Cancelado",
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
  };
  const colors: Record<string, string> = {
    SCHEDULED: "bg-[#006079]/30 text-[#009CD9]",
    UPCOMING: "bg-yellow-500/20 text-yellow-400",
    LIVE: "bg-red-600 text-white",
    ENDED: "bg-white/10 text-gray-500",
    CANCELED: "bg-red-500/10 text-red-400",
    PUBLISHED: "bg-green-500/10 text-green-400",
    DRAFT: "bg-white/10 text-gray-500",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status] ?? "bg-white/10 text-gray-400"}`}>
      {map[status] ?? status}
    </span>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, livesRes] = await Promise.all([
        apiClient<{ events?: CalendarEvent[] }>("/api/events?upcoming=1&pageSize=50"),
        apiClient<{ lives?: CalendarLive[] }>("/api/lives?upcoming=1&limit=50"),
      ]);

      const events: CalendarItem[] = ((eventsRes as any)?.data ?? (eventsRes as any)?.events ?? [])
        .map((e: any) => ({ ...e, kind: "event" as const }));
      const lives: CalendarItem[] = ((livesRes as any)?.data ?? (livesRes as any)?.lives ?? [])
        .map((l: any) => ({ ...l, kind: "live" as const }));

      setItems([...events, ...lives]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Calendar grid helpers ──
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function itemsOnDay(day: number): CalendarItem[] {
    return items.filter((item) => {
      const d = getItemDate(item);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  const selectedItems = selectedDay ? itemsOnDay(selectedDay) : [];

  // Upcoming items (next 30 days regardless of month)
  const upcomingItems = items
    .filter((item) => {
      const d = getItemDate(item);
      return d >= today;
    })
    .sort((a, b) => getItemDate(a).getTime() - getItemDate(b).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4] flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-[#009CD9]" />
          Calendário
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Eventos e lives das comunidades
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Calendar grid ── */}
        <div className="xl:col-span-2 bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-[#EEE6E4]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-[#EEE6E4]">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-[#EEE6E4]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 border-b border-r border-white/[0.04]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const isSelected = day === selectedDay;
              const dayItems = itemsOnDay(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`h-20 border-b border-r border-white/[0.04] p-1.5 text-left transition-colors hover:bg-white/[0.03] relative ${
                    isSelected ? "bg-[#006079]/10 border-[#009CD9]/20" : ""
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                      isToday
                        ? "bg-[#009CD9] text-white"
                        : isSelected
                        ? "text-[#009CD9]"
                        : "text-gray-400"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="w-full h-1.5 rounded-full"
                        style={{ backgroundColor: itemColor(item) }}
                      />
                    ))}
                    {dayItems.length > 2 && (
                      <p className="text-[9px] text-gray-500 font-medium">+{dayItems.length - 2}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div className="border-t border-white/[0.06] p-5">
              <p className="text-sm font-semibold text-[#EEE6E4] mb-3">
                {selectedDay} de {MONTHS[month]}
              </p>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum evento neste dia.</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Upcoming sidebar ── */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-[#EEE6E4]">Próximos eventos</h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : upcomingItems.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum evento próximo.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {upcomingItems.map((item) => (
                  <ItemRow key={item.id} item={item} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, compact = false }: { item: CalendarItem; compact?: boolean }) {
  const date = getItemDate(item);
  const isLive = item.kind === "live";
  const event = item as CalendarEvent;
  const live = item as CalendarLive;
  const community = isLive ? live.community : event.community;
  const href = isLive
    ? `/community/${community?.slug}/lives/${item.id}`
    : `/community/${community?.slug}/events/${item.id}`;

  return (
    <Link
      href={href}
      className={`flex items-start gap-3 hover:bg-white/[0.03] transition-colors ${compact ? "px-5 py-3.5" : "rounded-xl p-3 hover:bg-white/5"}`}
    >
      {/* Date badge */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: `${itemColor(item)}30`, border: `1px solid ${itemColor(item)}40` }}
      >
        <span className="text-[11px] font-bold leading-none" style={{ color: itemColor(item) }}>
          {date.getDate()}
        </span>
        <span className="text-[9px] leading-none mt-0.5" style={{ color: `${itemColor(item)}99` }}>
          {MONTHS[date.getMonth()].slice(0, 3).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {isLive ? (
            <PlayCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          ) : event.onlineUrl ? (
            <Video className="w-3 h-3 text-[#009CD9] flex-shrink-0" />
          ) : event.location ? (
            <MapPin className="w-3 h-3 text-[#009CD9] flex-shrink-0" />
          ) : null}
          <span className="text-[10px] text-gray-500 truncate">
            {community?.name}
          </span>
          <StatusBadge status={item.status} kind={item.kind} />
        </div>

        <p className="text-sm font-semibold text-[#EEE6E4] leading-tight line-clamp-1">
          {item.title}
        </p>

        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-500">
            {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {" · "}
            {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </Link>
  );
}

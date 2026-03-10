"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, X, Video } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventHost {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface LiveEvent {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  status: string;
  communityId: string;
  host: EventHost;
  _count: { rsvps: number };
}

interface Community {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventsByDay(events: LiveEvent[]): Map<string, LiveEvent[]> {
  const map = new Map<string, LiveEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.scheduledAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [rsvpMap, setRsvpMap] = useState<Record<string, string | null>>({});
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("detailhub_access_token") : null;

  // Fetch memberships → communities
  useEffect(() => {
    if (!token) return;
    fetch("/api/memberships/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const comms: Community[] = (d.data ?? []).map(
            (m: { community: Community }) => m.community
          );
          setCommunities(comms);
        }
      })
      .catch(() => {});
  }, [token]);

  // Fetch events for current month across all communities
  const fetchEvents = useCallback(async () => {
    if (communities.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const startDate = new Date(currentYear, currentMonth, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

    const allEvents: LiveEvent[] = [];

    await Promise.all(
      communities.map(async (c) => {
        try {
          const res = await fetch(
            `/api/communities/${c.id}/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
          );
          const d = await res.json();
          if (d.success) {
            allEvents.push(...(d.data ?? []));
          }
        } catch {
          // ignore per-community error
        }
      })
    );

    // Sort by scheduledAt
    allEvents.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    setEvents(allEvents);
    setIsLoading(false);
  }, [communities, currentYear, currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch user's RSVP when modal opens
  useEffect(() => {
    if (!selectedEvent || !token) return;
    if (rsvpMap[selectedEvent.id] !== undefined) return; // already fetched

    fetch(`/api/live-sessions/${selectedEvent.id}/rsvp`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRsvpMap((prev) => ({
            ...prev,
            [selectedEvent.id]: d.data?.status ?? null,
          }));
        }
      })
      .catch(() => {});
  }, [selectedEvent, token, rsvpMap]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  async function handleRsvp(eventId: string, status: string) {
    if (!token) return;
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/live-sessions/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (d.success) {
        setRsvpMap((prev) => ({ ...prev, [eventId]: status }));
      }
    } catch {
      // ignore
    } finally {
      setIsModalLoading(false);
    }
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const eventsMap = eventsByDay(events);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/15 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendário de Eventos</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Lives e eventos das suas comunidades
            </p>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] text-gray-600 font-medium py-2.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, cellIndex) => {
              const dayNumber = cellIndex - firstDay + 1;
              const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
              const cellDate = new Date(currentYear, currentMonth, dayNumber);
              const isToday =
                isCurrentMonth && isSameDay(cellDate, today);
              const dayKey = `${currentYear}-${currentMonth}-${dayNumber}`;
              const dayEvents = isCurrentMonth
                ? eventsMap.get(dayKey) ?? []
                : [];

              return (
                <div
                  key={cellIndex}
                  className={`min-h-[80px] p-1.5 border-b border-r border-white/[0.06] ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${dayEvents.length > 0 ? "cursor-pointer hover:bg-violet-50" : ""}`}
                >
                  {isCurrentMonth && (
                    <>
                      <div
                        className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-violet-600 text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {dayNumber}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate transition-opacity hover:opacity-80 ${
                              ev.status === "LIVE"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-violet-500/20 text-violet-300"
                            }`}
                          >
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            onClick={() => setSelectedEvent(dayEvents[2])}
                            className="text-[10px] text-gray-500 hover:text-gray-600 pl-1"
                          >
                            +{dayEvents.length - 2} mais
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && events.length === 0 && communities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Video className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Nenhum evento este mês
          </h3>
          <p className="text-sm text-gray-500">
            Não há lives agendadas para {MONTH_NAMES[currentMonth].toLowerCase()} de{" "}
            {currentYear}.
          </p>
        </div>
      )}

      {/* No communities */}
      {!isLoading && communities.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-500">
            Você ainda não está em nenhuma comunidade.
          </p>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2233] border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Detalhes do evento
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event card */}
            <div className="p-4">
              <EventCard
                session={{
                  id: selectedEvent.id,
                  title: selectedEvent.title,
                  description: selectedEvent.description,
                  scheduledAt: selectedEvent.scheduledAt,
                  host: selectedEvent.host,
                  rsvpCount: selectedEvent._count.rsvps,
                  status: selectedEvent.status,
                }}
                userRsvp={rsvpMap[selectedEvent.id]}
                onRsvp={(status) => {
                  if (!isModalLoading) handleRsvp(selectedEvent.id, status);
                }}
              />
              {isModalLoading && (
                <div className="flex items-center justify-center mt-3">
                  <div className="w-5 h-5 border-[2px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

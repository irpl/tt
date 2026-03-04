import { useState, useRef, useEffect } from "react";

const DAY_INDEX_MAP = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }; // JS getDay() -> DAYS index
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const START_HOUR = 8;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const institutions = {
  ECC: { label: "ECC", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.35)" },
  UWI: { label: "UWI", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
};

const courses = [
  // Monday
  { id: 1, code: "CWEB1205", name: "Web Development 1", sub: "HTML5, JS & CSS3", group: "ADIT1B", room: "Lab 2", day: "Monday", start: 8, end: 10, inst: "ECC" },
  { id: 2, code: "CPRG1205", name: "Computer Programming I", sub: "C# OOP, File Mgmt & DB", group: "ADCS1 / AMIS1A", room: "Lab 3", day: "Monday", start: 13, end: 16, inst: "ECC" },
  // Tuesday
  { id: 3, code: "CPRG1205", name: "Computer Programming I", sub: "C# OOP, File Mgmt & DB", group: "ADCS1 / AMIS1A", room: "Lab 1", day: "Tuesday", start: 8, end: 10, inst: "ECC" },
  { id: 4, code: "CWEB1205", name: "Web Development 1", sub: "HTML5, JS & CSS3", group: "ADIT1B", room: "Lab 3", day: "Tuesday", start: 10, end: 12, inst: "ECC" },
  { id: 5, code: "ECNG3020", name: "Special Engineering Project", room: "Prelim Eng. Room", day: "Tuesday", start: 13, end: 14, inst: "UWI" },
  { id: 6, code: "CSEC3202", name: "Systems Integration", group: "eBDIT4", room: "Zoom", day: "Tuesday", start: 18, end: 20, inst: "ECC" },
  // Wednesday
  { id: 7, code: "ECSE3038", name: "Engineering IoT Systems", room: "Eng. Room B", day: "Wednesday", start: 10, end: 12, inst: "UWI" },
  { id: 8, code: "CWEB1205", name: "Web Development 1", sub: "HTML5, JS & CSS3", group: "ADIT1B", room: "Lab 4", day: "Wednesday", start: 13, end: 16, inst: "ECC" },
  // Thursday
  { id: 9, code: "ECSE3038", name: "Engineering IoT Systems", room: "Eng. Room B", day: "Thursday", start: 14, end: 16, inst: "UWI" },
  // Friday
  { id: 10, code: "CWEB1205", name: "Web Development 1", sub: "HTML5, JS & CSS3", group: "ADIT1B", room: "Lab 3", day: "Friday", start: 15, end: 17, inst: "ECC" },
  { id: 11, code: "CSEC3202", name: "Systems Integration", group: "eBDIT4", room: "Zoom", day: "Friday", start: 18, end: 20, inst: "ECC" },
];

function formatTime(h) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${suffix}`;
}

function ClassBlock({ course, pixelsPerHour, isMobile, isCurrent }) {
  const inst = institutions[course.inst];
  const top = (course.start - START_HOUR) * pixelsPerHour;
  const height = (course.end - course.start) * pixelsPerHour;
  const isSmall = height < 70;

  if (isMobile) {
    const isTiny = height < 30;
    return (
      <div style={{
        position: "absolute",
        top: `${top}px`,
        left: "2px",
        right: "2px",
        height: `${height - 2}px`,
        background: isCurrent ? `${inst.color}30` : inst.bg,
        borderLeft: `2px solid ${inst.color}`,
        borderRadius: "4px",
        padding: isTiny ? "1px 3px" : "3px 4px",
        overflow: "hidden",
        zIndex: isCurrent ? 5 : 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: isTiny ? "center" : "flex-start",
        gap: "1px",
        ...(isCurrent ? { boxShadow: `0 0 12px ${inst.color}40`, outline: `1px solid ${inst.color}60`, outlineOffset: "-1px" } : {}),
      }}>
        <span style={{
          fontSize: "10px",
          fontWeight: 700,
          color: inst.color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.2,
        }}>
          {course.code}
        </span>
        {!isTiny && (
          <span style={{
            fontSize: "8px",
            color: "#cbd5e1",
            lineHeight: 1.2,
            overflow: "hidden",
          }}>
            {course.name}
          </span>
        )}
        {!isTiny && (
          <span style={{
            fontSize: "7px",
            color: "#64748b",
            lineHeight: 1.1,
            marginTop: "auto",
          }}>
            {course.room}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}px`,
        left: "3px",
        right: "3px",
        height: `${height - 4}px`,
        background: isCurrent ? `${inst.color}30` : inst.bg,
        borderLeft: `3px solid ${inst.color}`,
        borderRadius: "6px",
        padding: isSmall ? "3px 8px" : "8px 10px",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        zIndex: isCurrent ? 5 : 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: isSmall ? "center" : "flex-start",
        gap: isSmall ? "0" : "2px",
        ...(isCurrent ? {
          boxShadow: `0 0 16px ${inst.color}40, inset 0 0 20px ${inst.color}10`,
          outline: `1px solid ${inst.color}50`,
          outlineOffset: "-1px",
        } : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = `0 4px 20px ${inst.border}`;
        e.currentTarget.style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = isCurrent ? `0 0 16px ${inst.color}40, inset 0 0 20px ${inst.color}10` : "none";
        e.currentTarget.style.zIndex = isCurrent ? "5" : "2";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px" }}>
        <span style={{
          fontSize: isSmall ? "11px" : "13px",
          fontWeight: 700,
          color: inst.color,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {course.code}
        </span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
          {isCurrent && (
            <span style={{
              fontSize: "8px",
              fontWeight: 700,
              color: "#0f172a",
              background: inst.color,
              padding: "1px 5px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              letterSpacing: "0.05em",
              animation: "nowPulse 2s ease-in-out infinite",
            }}>
              NOW
            </span>
          )}
          <span style={{
            fontSize: "9px",
            fontWeight: 600,
            color: inst.color,
            background: `${inst.color}18`,
            padding: "1px 5px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}>
            {inst.label}
          </span>
        </div>
      </div>
      {!isSmall && (
        <>
          <div style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "#cbd5e1",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {course.name}
          </div>
          <div style={{
            fontSize: "10px",
            color: "#64748b",
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>{course.room}</span>
            <span>{formatTime(course.start)}–{formatTime(course.end)}</span>
          </div>
        </>
      )}
      {isSmall && (
        <div style={{ fontSize: "9px", color: "#64748b" }}>
          {formatTime(course.start)}–{formatTime(course.end)} · {course.room}
        </div>
      )}
    </div>
  );
}

export default function Timetable() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const dayColRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;
  const [mobileView, setMobileView] = useState("week");
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today >= 1 && today <= 5 ? today - 1 : 0);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentDayIndex = DAY_INDEX_MAP[now.getDay()]; // undefined on weekends
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isCurrentBlock = (course) =>
    currentDayIndex !== undefined &&
    course.day === DAYS[currentDayIndex] &&
    currentHour >= course.start &&
    currentHour < course.end;

  useEffect(() => {
    const update = () => {
      if (dayColRef.current) setGridHeight(dayColRef.current.clientHeight);
      setWindowWidth(window.innerWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pixelsPerHour = gridHeight > 0 ? gridHeight / HOURS.length : 65;

  const filtered = activeFilter === "ALL" ? courses : courses.filter(c => c.inst === activeFilter);

  const totalHours = courses.reduce((sum, c) => sum + (c.end - c.start), 0);
  const eccHours = courses.filter(c => c.inst === "ECC").reduce((sum, c) => sum + (c.end - c.start), 0);
  const uwiHours = courses.filter(c => c.inst === "UWI").reduce((sum, c) => sum + (c.end - c.start), 0);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: "#0f172a",
      height: "100vh",
      color: "#e2e8f0",
      padding: isMobile ? "12px 8px" : "20px 24px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: "1200px", margin: isMobile ? "0 auto 6px" : "0 auto 12px", width: "100%", flexShrink: 0 }}>
        {isMobile ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Phillip Logan
                </h1>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0", fontWeight: 500 }}>
                  Sem 2 · 2025–26
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { value: `${totalHours}h`, color: "#e2e8f0" },
                  { value: `${eccHours}h`, color: institutions.ECC.color },
                  { value: `${uwiHours}h`, color: institutions.UWI.color },
                ].map((s, i) => (
                  <span key={i} style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {s.value}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["ALL", "ECC", "UWI"].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: activeFilter === f
                        ? (f === "ECC" ? institutions.ECC.color : f === "UWI" ? institutions.UWI.color : "#475569")
                        : "rgba(255,255,255,0.08)",
                      background: activeFilter === f
                        ? (f === "ECC" ? `${institutions.ECC.color}20` : f === "UWI" ? `${institutions.UWI.color}20` : "rgba(255,255,255,0.06)")
                        : "transparent",
                      color: activeFilter === f
                        ? (f === "ECC" ? institutions.ECC.color : f === "UWI" ? institutions.UWI.color : "#e2e8f0")
                        : "#64748b",
                      fontSize: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {f === "ALL" ? "All" : f}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "14px", overflow: "hidden" }}>
                {["week", "day"].map(v => (
                  <button
                    key={v}
                    onClick={() => setMobileView(v)}
                    style={{
                      padding: "4px 10px",
                      border: "none",
                      background: mobileView === v ? "rgba(255,255,255,0.1)" : "transparent",
                      color: mobileView === v ? "#e2e8f0" : "#64748b",
                      fontSize: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textTransform: "capitalize",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {mobileView === "day" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "8px" }}>
                <button
                  onClick={() => setSelectedDay(d => (d - 1 + 5) % 5)}
                  style={{
                    background: "none", border: "none", color: "#64748b", fontSize: "16px",
                    cursor: "pointer", padding: "4px 8px", fontFamily: "inherit",
                  }}
                >
                  ‹
                </button>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", minWidth: "90px", textAlign: "center" }}>
                  {DAYS[selectedDay]}
                </span>
                <button
                  onClick={() => setSelectedDay(d => (d + 1) % 5)}
                  style={{
                    background: "none", border: "none", color: "#64748b", fontSize: "16px",
                    cursor: "pointer", padding: "4px 8px", fontFamily: "inherit",
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Phillip Logan
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0", fontWeight: 500 }}>
                  Semester 2 · 2025–2026
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { label: "Total", value: `${totalHours}h/wk`, color: "#e2e8f0" },
                  { label: "ECC", value: `${eccHours}h`, color: institutions.ECC.color },
                  { label: "UWI", value: `${uwiHours}h`, color: institutions.UWI.color },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    textAlign: "center",
                    minWidth: "70px",
                  }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: s.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {["ALL", "ECC", "UWI"].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: activeFilter === f
                      ? (f === "ECC" ? institutions.ECC.color : f === "UWI" ? institutions.UWI.color : "#475569")
                      : "rgba(255,255,255,0.08)",
                    background: activeFilter === f
                      ? (f === "ECC" ? `${institutions.ECC.color}20` : f === "UWI" ? `${institutions.UWI.color}20` : "rgba(255,255,255,0.06)")
                      : "transparent",
                    color: activeFilter === f
                      ? (f === "ECC" ? institutions.ECC.color : f === "UWI" ? institutions.UWI.color : "#e2e8f0")
                      : "#64748b",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {f === "ALL" ? "All Classes" : institutions[f]?.label || f}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Timetable Grid */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        flex: 1,
        overflow: "hidden",
      }}>
        {isMobile && mobileView === "day" ? (
          /* Day view — single day, full width, desktop-style blocks */
          <div style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr",
            gridTemplateRows: "1fr",
            height: "100%",
          }}>
            <div ref={dayColRef} style={{ position: "relative" }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: `${(h - START_HOUR) * pixelsPerHour}px`,
                    right: "4px",
                    fontSize: "9px",
                    fontWeight: 500,
                    color: "#475569",
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  {formatTime(h)}
                </div>
              ))}
            </div>
            <div style={{ position: "relative", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: `${(h - START_HOUR) * pixelsPerHour}px`,
                    left: 0,
                    right: 0,
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                />
              ))}
              {filtered.filter(c => c.day === DAYS[selectedDay]).map(c => (
                <ClassBlock key={c.id} course={c} pixelsPerHour={pixelsPerHour} isMobile={false} isCurrent={isCurrentBlock(c)} />
              ))}
            </div>
          </div>
        ) : (
          /* Week view — 5 days */
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "28px repeat(5, 1fr)" : "56px repeat(5, 1fr)",
            gridTemplateRows: isMobile ? "auto 1fr" : "auto 1fr",
            minWidth: isMobile ? undefined : "750px",
            height: "100%",
          }}>
            {/* Day headers */}
            <div />
            {DAYS.map((day, i) => {
              const dayClasses = filtered.filter(c => c.day === day);
              const dayHrs = dayClasses.reduce((s, c) => s + (c.end - c.start), 0);
              return (
                <div
                  key={day}
                  onClick={isMobile ? () => { setSelectedDay(i); setMobileView("day"); } : undefined}
                  style={{
                    textAlign: "center",
                    padding: isMobile ? "4px 2px" : "12px 8px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    cursor: isMobile ? "pointer" : "default",
                  }}
                >
                  <div style={{ fontSize: isMobile ? "11px" : "14px", fontWeight: 600, color: "#e2e8f0" }}>
                    {isMobile ? day[0] : day.slice(0, 3)}
                  </div>
                  {!isMobile && dayHrs > 0 && (
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>
                      {dayHrs}h
                    </div>
                  )}
                </div>
              );
            })}

            {/* Time column + day columns */}
            <div ref={mobileView === "week" || !isMobile ? dayColRef : undefined} style={{ position: "relative" }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: `${(h - START_HOUR) * pixelsPerHour}px`,
                    right: isMobile ? "2px" : "8px",
                    fontSize: isMobile ? "7px" : "10px",
                    fontWeight: 500,
                    color: "#475569",
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                    transform: "translateY(-5px)",
                  }}
                >
                  {formatTime(h)}
                </div>
              ))}
            </div>

            {DAYS.map(day => {
              const dayClasses = filtered.filter(c => c.day === day);
              return (
                <div
                  key={day}
                  style={{
                    position: "relative",
                    borderLeft: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Hour gridlines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        top: `${(h - START_HOUR) * pixelsPerHour}px`,
                        left: 0,
                        right: 0,
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    />
                  ))}
                  {/* Class blocks */}
                  {dayClasses.map(c => (
                    <ClassBlock key={c.id} course={c} pixelsPerHour={pixelsPerHour} isMobile={isMobile} isCurrent={isCurrentBlock(c)} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Legend */}
      {!isMobile && (
        <div style={{
          maxWidth: "1200px",
          margin: "12px auto 0",
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "10px",
        }}>
          {[...new Map(courses.map(c => [c.code, c])).values()].map(c => {
            const inst = institutions[c.inst];
            return (
              <div key={c.code} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}>
                <div style={{
                  width: "4px",
                  height: "32px",
                  borderRadius: "2px",
                  background: inst.color,
                  flexShrink: 0,
                }} />
                <div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: inst.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {c.code}
                  </span>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>{c.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isMobile && (
        <p style={{
          maxWidth: "1200px",
          margin: "10px auto 0",
          flexShrink: 0,
          fontSize: "10px",
          color: "#334155",
          textAlign: "center",
        }}>
          ECC · Excelsior Community College &nbsp;|&nbsp; UWI · University of the West Indies
        </p>
      )}
    </div>
  );
}

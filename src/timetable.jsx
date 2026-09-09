import { useState, useEffect } from "react";

// Weekly timetable — Semester 1, 2026/27, P. Logan.
// Design ported from the published "Two-Campus Week" artifact; the desktop
// geometry mirrors build_week.py in the iot-timetable working repo.
// Keep BLOCKS in step with it.
//
// The grid is drawn as an SVG with a viewBox, so it scales to its container
// rather than scrolling sideways. Three geometry profiles share one renderer:
// the wide desktop grid, a compact all-days mobile week, and a single day.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"];
const DAY_ABBR = ["M", "T", "W", "T", "F", "S"];
const DAY_INDEX_MAP = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 0: 5 }; // JS getDay() -> DAYS index
const H0 = 8;
const H1 = 20;
const MOBILE_MAX = 767;

// day, start, end, kind, title, group, room
// kind g1/g2/g3 = ECC, coloured by the class group taking the session
// kind tut = private physics tutorials (not ECC, not UWI)
const BLOCKS = [
  [0, 8, 10, "g1", "Intro to Programming", "ADCS1 · ADCSNM1A · AMIS1A", "CPRG1201 / Lab 2"],
  [0, 13, 15, "g2", "Intro to Programming", "ADCET1A · ADIT1", "CPRG1201 / Lab 1"],
  [0, 16, 17, "trv", "", "", ""],
  [0, 17, 19, "uwi", "Engineering IoT Systems", "", "ECSE 3038 / Block A"],
  [1, 12, 14, "g1", "Intro to Programming", "ADCS1 · ADCSNM1A · AMIS1A", "CPRG1201 / Lab 1"],
  [1, 14, 17, "g3", "Web Development II", "ADIT2", "CWEB2302 / Lab 3"],
  [2, 10, 12, "g2", "Intro to Programming", "ADCET1A · ADIT1", "CPRG1201 / Lab 1 + NetLab"],
  [2, 13, 14, "trv", "", "", ""],
  [2, 14, 15, "uwi", "Engineering IoT Systems", "", "ECSE 3038 / Block B"],
  [3, 8, 10, "g2", "Intro to Programming", "ADCET1A · ADIT1", "CPRG1201 / Lab 1"],
  [3, 13, 15, "g1", "Intro to Programming", "ADCS1 · ADCSNM1A · AMIS1A", "CPRG1201 / Lab 2"],
  [4, 11, 14, "g3", "Web Development II", "ADIT2", "CWEB2302 / Lab 3"],
  [4, 16, 17, "g3", "Web Development II", "ADIT2", "CWEB2302 / Lab 3"],
  [4, 17, 18, "trv", "", "", ""],
  [4, 18, 20, "uwi", "Engineering IoT Systems", "", "ECSE 3038 / Block C"],
  [2, 17.5, 18.5, "tut", "Physics tutorial", "Hinal", ""],
  [2, 19, 20, "tut", "Physics tutorial", "Arush", ""],
  [5, 12, 14, "tut", "Physics tutorial", "Arush", ""],
];

// Geometry profiles. `detail` picks how much text a block carries.
const PROFILES = {
  desktop: { PADL: 74, PADT: 56, COLW: 184, ROWH: 50, PADR: 10, detail: "full", hourFmt: "long" },
  week: { PADL: 27, PADT: 30, COLW: 56, ROWH: 44, PADR: 3, detail: "compact", hourFmt: "short" },
  day: { PADL: 48, PADT: 30, COLW: 320, ROWH: 54, PADR: 4, detail: "full", hourFmt: "long" },
};

const GROUPS = [
  {
    k: "k1",
    heading: "ADCS1 · ADCSNM1A · AMIS1A",
    course: "Intro to Programming · CPRG1201",
    rows: [
      ["Monday", "08:00 – 10:00 · Lab 2"],
      ["Tuesday", "12:00 – 14:00 · Lab 1"],
      ["Thursday", "13:00 – 15:00 · Lab 2"],
    ],
    total: "3 sessions · 6 h/week",
  },
  {
    k: "k2",
    heading: "ADCET1A · ADIT1",
    course: "Intro to Programming · CPRG1201",
    rows: [
      ["Monday", "13:00 – 15:00 · Lab 1"],
      ["Wednesday", "10:00 – 12:00 · Lab 1 + NetLab"],
      ["Thursday", "08:00 – 10:00 · Lab 1"],
    ],
    total: "3 sessions · 6 h/week",
  },
  {
    k: "k3",
    heading: "ADIT2",
    course: "Web Development II (ASP.net) · CWEB2302",
    rows: [
      ["Tuesday", "14:00 – 17:00 · Lab 3"],
      ["Friday", "11:00 – 14:00 · Lab 3"],
      ["Friday", "16:00 – 17:00 · Lab 3"],
    ],
    total: "3 sessions · 7 h/week",
  },
];

const IOT_BLOCKS = [
  {
    label: "Block A · Monday",
    time: "17:00 – 19:00",
    note: "ECC finishes 15:00. Two clear hours before you need to leave — one more than required.",
  },
  {
    label: "Block B · Wednesday",
    time: "14:00 – 15:00",
    note: "ECC finishes 12:00. Two clear hours, and nothing at ECC afterwards.",
  },
  {
    label: "Block C · Friday",
    time: "18:00 – 20:00",
    note: "ECC now finishes 17:00. Exactly one travel hour — the tightest margin of the three, and the only block running past 19:00.",
  },
];

const LEGEND = [
  ["g1", "ADCS1 · ADCSNM1A · AMIS1A — Intro"],
  ["g2", "ADCET1A · ADIT1 — Intro"],
  ["g3", "ADIT2 — Web Dev II"],
  ["uwi", "ECSE 3038 — Engineering IoT Systems, 5 hrs/week"],
  ["tut", "Physics tutorials — private"],
  ["trv", "Required travel hour"],
];

function hm(v) {
  return v === Math.trunc(v) ? `${v}:00` : `${Math.trunc(v)}:30`;
}

// Short label for the narrow mobile week columns: the course code, or the
// student's name for a tutorial.
function shortLabel([, , , kind, , grp, room]) {
  if (kind === "tut") return grp;
  return room.split("/")[0].trim().replace(/\s+/g, "");
}

function NowPill({ x, y }) {
  return (
    <g>
      <rect className="nowpill" x={x} y={y} width="30" height="12" rx="6" />
      <text className="nowtx" x={x + 15} y={y + 8.5}>
        NOW
      </text>
    </g>
  );
}

function Block({ block, isNow, col, profile }) {
  const [, st, e, kind, title, grp, room] = block;
  const { PADL, PADT, COLW, ROWH, detail } = profile;
  const compact = detail === "compact";

  const x = PADL + col * COLW + (compact ? 2 : 4);
  const y = PADT + (st - H0) * ROWH + (compact ? 2 : 3);
  const w = COLW - (compact ? 4 : 8);
  const hgt = (e - st) * ROWH - (compact ? 4 : 6);
  const tx = x + (compact ? 5 : 14);
  const cls = `b ${kind}${isNow ? " now" : ""}`;
  const pill = isNow && !compact ? <NowPill x={x + w - 40} y={y + 6} /> : null;

  if (kind === "trv") {
    return (
      <g className={cls}>
        <rect x={x} y={y} width={w} height={hgt} rx="3" />
        <rect x={x} y={y} width={w} height={hgt} rx="3" fill="url(#hatch)" stroke="none" />
        {compact ? (
          <text className="tl xs" x={x + w / 2} y={y + hgt / 2 + 3} textAnchor="middle">
            travel
          </text>
        ) : (
          <text className="tl" x={x + 12} y={y + hgt / 2 + 4}>
            TRAVEL ECC → UWI
          </text>
        )}
      </g>
    );
  }

  // Narrow mobile column: a course code and the start time is all that fits.
  if (compact) {
    const tiny = hgt < 34;
    return (
      <g className={cls}>
        <rect x={x} y={y} width={w} height={hgt} rx="3" />
        <rect className="spine" x={x} y={y} width="3" height={hgt} />
        <text className="mt" x={tx} y={y + 12}>
          {shortLabel(block)}
        </text>
        {!tiny && (
          <text className="mh" x={tx} y={y + 23}>
            {hm(st)}
          </text>
        )}
        {isNow && <circle className="nowdot" cx={x + w - 6} cy={y + 6} r="3" />}
      </g>
    );
  }

  // UWI block — no class group
  if (!grp) {
    return (
      <g className={cls}>
        <rect x={x} y={y} width={w} height={hgt} rx="3" />
        <rect className="spine" x={x} y={y} width="4" height={hgt} />
        {hgt < 60 ? (
          <>
            <text className="bt" x={tx} y={y + 16}>{title}</text>
            <text className="bs" x={tx} y={y + 28}>{room}</text>
            <text className="bh" x={tx} y={y + 40}>{hm(st)}–{hm(e)}</text>
          </>
        ) : (
          <>
            <text className="bt" x={tx} y={y + 19}>{title}</text>
            <text className="bs" x={tx} y={y + 34}>{room}</text>
            <text className="bh" x={tx} y={y + hgt - 9}>{hm(st)}–{hm(e)}</text>
          </>
        )}
        {pill}
      </g>
    );
  }

  if (kind === "tut") {
    return (
      <g className={cls}>
        <rect x={x} y={y} width={w} height={hgt} rx="3" />
        <rect className="spine" x={x} y={y} width="4" height={hgt} />
        <text className="bt" x={tx} y={y + 16}>{title}</text>
        <text className="bg" x={tx} y={y + 28}>{grp}</text>
        <text className="bh" x={tx} y={y + 40}>{hm(st)}–{hm(e)}</text>
        {pill}
      </g>
    );
  }

  return (
    <g className={cls}>
      <rect x={x} y={y} width={w} height={hgt} rx="3" />
      <rect className="spine" x={x} y={y} width="4" height={hgt} />
      {hgt < 60 ? (
        // 1 h box — group takes the second line, room folds into the time line
        <>
          <text className="bt" x={tx} y={y + 15}>{title}</text>
          <text className="bg" x={tx} y={y + 27}>{grp}</text>
          <text className="bh" x={tx} y={y + 39}>
            {hm(st)}–{hm(e)} · {room.split("/").pop().trim()}
          </text>
        </>
      ) : (
        <>
          <text className="bt" x={tx} y={y + 19}>{title}</text>
          <text className="bg" x={tx} y={y + 35}>{grp}</text>
          <text className="bs" x={tx} y={y + 49}>{room}</text>
          <text className="bh" x={tx} y={y + hgt - 9}>{hm(st)}–{hm(e)}</text>
        </>
      )}
      {pill}
    </g>
  );
}

// `days` is the list of day indices to draw, in column order.
function Grid({ now, days, profile, onPickDay }) {
  const single = days.length === 1;
  const { PADL, PADT, COLW, ROWH, PADR, hourFmt } = profile;
  const compact = profile.detail === "compact";
  const nCols = days.length;
  const W = PADL + COLW * nCols + PADR;
  const H = PADT + ROWH * (H1 - H0) + PADR;
  const X = (col) => PADL + col * COLW;
  const Y = (h) => PADT + (h - H0) * ROWH;
  const headTop = PADT - (compact ? 18 : 30);

  const hours = [];
  for (let h = H0; h <= H1; h++) hours.push(h);

  const todayIndex = DAY_INDEX_MAP[now.getDay()]; // undefined on Saturday
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const isNowBlock = ([d, st, e]) =>
    todayIndex !== undefined && d === todayIndex && nowHour >= st && nowHour < e;
  const todayCol = days.indexOf(todayIndex);
  const showNowLine = todayCol !== -1 && nowHour >= H0 && nowHour <= H1;

  return (
    <svg
      className={onPickDay ? "tt tappable" : "tt"}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Timetable showing ECC classes, the Engineering IoT Systems blocks and the physics tutorials"
    >
      <defs>
        <pattern
          id="hatch"
          width="7"
          height="7"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="7" className="hl" />
        </pattern>
      </defs>

      {hours.map((h) => (
        <g key={h}>
          <line
            className={h < H1 ? "rule" : "rule edge"}
            x1={PADL}
            y1={Y(h)}
            x2={PADL + COLW * nCols}
            y2={Y(h)}
          />
          <text className={compact ? "hr xs" : "hr"} x={PADL - (compact ? 5 : 14)} y={Y(h) + 4}>
            {hourFmt === "short" ? h : `${String(h).padStart(2, "0")}:00`}
          </text>
        </g>
      ))}

      {days.map((d, col) => (
        <g
          key={d}
          className={onPickDay ? "daycol tap" : "daycol"}
          onClick={onPickDay ? () => onPickDay(d) : undefined}
        >
          {onPickDay && (
            <rect className="hit" x={X(col)} y={headTop} width={COLW} height={Y(H1) - headTop} />
          )}
          <line className="rule" x1={X(col)} y1={headTop} x2={X(col)} y2={Y(H1)} />
          {!single && (
            <text
              className={d === todayIndex ? "day istoday" : "day"}
              x={X(col) + (compact ? COLW / 2 : 12)}
              y={PADT - (compact ? 6 : 12)}
              textAnchor={compact ? "middle" : "start"}
            >
              {compact ? DAY_ABBR[d] : DAYS[d]}
            </text>
          )}
        </g>
      ))}
      <line
        className="rule"
        x1={PADL + COLW * nCols}
        y1={headTop}
        x2={PADL + COLW * nCols}
        y2={Y(H1)}
      />

      {BLOCKS.filter(([d]) => days.includes(d)).map((b, i) => (
        <Block
          key={i}
          block={b}
          col={days.indexOf(b[0])}
          profile={profile}
          isNow={isNowBlock(b)}
        />
      ))}

      {showNowLine && (
        <g>
          <line
            className="nowline"
            x1={X(todayCol)}
            y1={Y(nowHour)}
            x2={X(todayCol) + COLW}
            y2={Y(nowHour)}
          />
          <circle className="nowdot" cx={X(todayCol)} cy={Y(nowHour)} r="3.5" />
        </g>
      )}
    </svg>
  );
}

export default function Timetable() {
  const [now, setNow] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX
  );
  const [view, setView] = useState("week"); // mobile only: "week" | "day"
  const [day, setDay] = useState(() => {
    const d = DAY_INDEX_MAP[new Date().getDay()];
    return d === undefined ? 0 : d; // Saturday falls back to Monday
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const allDays = DAYS.map((_, i) => i);
  const pickDay = (d) => {
    setDay(d);
    setView("day");
  };
  const stepDay = (delta) => setDay((d) => (d + delta + DAYS.length) % DAYS.length);

  let grid;
  if (!isMobile) {
    grid = <Grid now={now} days={allDays} profile={PROFILES.desktop} />;
  } else if (view === "week") {
    grid = <Grid now={now} days={allDays} profile={PROFILES.week} onPickDay={pickDay} />;
  } else {
    grid = <Grid now={now} days={[day]} profile={PROFILES.day} />;
  }

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Semester 1 · 2026/27 · P. Logan</div>
        <h1>Two campuses, one week</h1>
        <p className="lede">
          Every ECC teaching block, colour-coded by <b>which class group you have</b>, with the
          three Engineering IoT Systems blocks fitted around them. Intro to Programming runs twice
          over — the same course delivered to two separate groups, three sessions each. The dashed
          bands are the mandatory hour of travel between campuses, and the gold blocks are private
          physics tutorials. Reflects the ECC timetable revision published 21 August.
        </p>
      </header>

      {isMobile && (
        <div className="mbar">
          <div className="mtoggle" role="group" aria-label="Timetable view">
            {["week", "day"].map((v) => (
              <button
                key={v}
                type="button"
                className={view === v ? "on" : ""}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v === "week" ? "Week" : "Day"}
              </button>
            ))}
          </div>
          {view === "day" && (
            <div className="mnav">
              <button type="button" onClick={() => stepDay(-1)} aria-label="Previous day">
                ‹
              </button>
              <span>{DAYS[day]}</span>
              <button type="button" onClick={() => stepDay(1)} aria-label="Next day">
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <div className="board">{grid}</div>
      {isMobile && view === "week" && <p className="mhint">Tap a day to open it on its own.</p>}

      <div className="legend">
        {LEGEND.map(([k, label]) => (
          <span className="key" key={k}>
            <span className={`sw ${k}`} />
            {label}
          </span>
        ))}
      </div>

      <h2 className="sechead">Who you have, when</h2>
      <div className="groups">
        {GROUPS.map((g) => (
          <div className={`gcard ${g.k}`} key={g.k}>
            <h3>{g.heading}</h3>
            <div className="course">{g.course}</div>
            <ul>
              {g.rows.map(([d, when], i) => (
                <li key={i}>
                  <b>{d}</b>
                  <span>{when}</span>
                </li>
              ))}
            </ul>
            <div className="tot">{g.total}</div>
          </div>
        ))}
      </div>

      <h2 className="sechead">Engineering IoT Systems blocks</h2>
      <div className="cards">
        {IOT_BLOCKS.map((c) => (
          <div className="card" key={c.label}>
            <span className="lb">{c.label}</span>
            <span className="tm">{c.time}</span>
            <span className="note">{c.note}</span>
          </div>
        ))}
      </div>

      <footer>
        <b>Why these three.</b> The 21 August ECC revision pushed Friday teaching from a 13:30
        finish to 17:00, which closed the old Friday 17:00–19:00 block and left{" "}
        <b>Monday 17:00–19:00 as the week’s only two-hour window</b> that clears all four Level&nbsp;3
        cohorts, clears ECC, and ends by 19:00. Block C therefore moves to Friday 18:00–20:00 — the
        one change that keeps it a single two-hour session, at the cost of running an hour past the
        19:00 cap. Wednesday 14:00 is one of four free single hours; Tuesday 10:00 and Wednesday
        08:00 remain interchangeable with it, and Wednesday 17:00 no longer is — the 17:30 tutorial
        now overlaps it.
        <br />
        <b>Tuesday and Thursday stay clear.</b> Tuesday is solid ECC teaching from 12:00 to 17:00,
        and Thursday’s free cohort hours fall inside the 08:00–10:00 ECC block and the travel hour
        behind it.
        <br />
        <b>Two Intro groups, never the same day twice.</b> ADCS1&nbsp;/&nbsp;ADCSNM1A&nbsp;/&nbsp;AMIS1A
        and ADCET1A&nbsp;/&nbsp;ADIT1 take the same CPRG1201 content in separate sittings. They share
        Monday and Thursday but at opposite ends of the day, so the two groups are always a swap of
        morning for afternoon — Monday you have the first group at 08:00 and the second at 13:00;
        Thursday that order reverses.
        <br />
        <b>Physics tutorials.</b> Three private sessions sit outside both institutions: Wednesday
        17:30–18:30 (Hinal), Wednesday 19:00–20:00 (Arush) and Sunday 12:00–14:00 (Arush). None
        clash with ECC or ECSE 3038. The Wednesday pair does close Wednesday 17:00–18:00 as a
        fallback slot for block B.
        <br />
        <b>Provisional.</b> Friday’s 16:00–17:00 lab is the only thing blocking a 17:00 start —
        pending confirmation with the coordinator.
      </footer>
    </div>
  );
}

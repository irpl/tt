import { useState, useEffect } from "react";

// Weekly timetable — Semester 1, 2026/27, P. Logan.
// Design ported from the published "Two-Campus Week" artifact; geometry mirrors
// build_week.py in the iot-timetable working repo. Keep BLOCKS in step with it.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"];
const DAY_INDEX_MAP = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 0: 5 }; // JS getDay() -> DAYS index
const ND = DAYS.length;
const H0 = 8;
const H1 = 20;
const PADL = 74;
const PADT = 56;
const COLW = 184;
const ROWH = 50;
const W = PADL + COLW * ND + 10;
const H = PADT + ROWH * (H1 - H0) + 10;

const X = (d) => PADL + d * COLW;
const Y = (h) => PADT + (h - H0) * ROWH;

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

function Block({ block, isNow }) {
  const [d, st, e, kind, title, grp, room] = block;
  const x = X(d) + 4;
  const y = Y(st) + 3;
  const w = COLW - 8;
  const hgt = (e - st) * ROWH - 6;
  const tx = x + 14;
  const cls = `b ${kind}${isNow ? " now" : ""}`;
  const pill = isNow ? <NowPill x={x + w - 40} y={y + 6} /> : null;

  if (kind === "trv") {
    return (
      <g className={cls}>
        <rect x={x} y={y} width={w} height={hgt} rx="3" />
        <rect x={x} y={y} width={w} height={hgt} rx="3" fill="url(#hatch)" stroke="none" />
        <text className="tl" x={x + 12} y={y + hgt / 2 + 4}>
          TRAVEL ECC → UWI
        </text>
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

function Grid({ now }) {
  const hours = [];
  for (let h = H0; h <= H1; h++) hours.push(h);

  const todayIndex = DAY_INDEX_MAP[now.getDay()]; // undefined on Saturday
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const isNowBlock = ([d, st, e]) =>
    todayIndex !== undefined && d === todayIndex && nowHour >= st && nowHour < e;
  const showNowLine = todayIndex !== undefined && nowHour >= H0 && nowHour <= H1;

  return (
    <svg
      className="tt"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Weekly timetable showing ECC classes, the three Engineering IoT Systems blocks and the physics tutorials"
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
            x2={PADL + COLW * ND}
            y2={Y(h)}
          />
          <text className="hr" x={PADL - 14} y={Y(h) + 4}>
            {String(h).padStart(2, "0")}:00
          </text>
        </g>
      ))}

      {DAYS.map((day, d) => (
        <g key={day}>
          <line className="rule" x1={X(d)} y1={PADT - 30} x2={X(d)} y2={Y(H1)} />
          <text className={d === todayIndex ? "day istoday" : "day"} x={X(d) + 12} y={PADT - 12}>
            {day}
          </text>
        </g>
      ))}
      <line
        className="rule"
        x1={PADL + COLW * ND}
        y1={PADT - 30}
        x2={PADL + COLW * ND}
        y2={Y(H1)}
      />

      {BLOCKS.map((b, i) => (
        <Block key={i} block={b} isNow={isNowBlock(b)} />
      ))}

      {showNowLine && (
        <g>
          <line
            className="nowline"
            x1={X(todayIndex)}
            y1={Y(nowHour)}
            x2={X(todayIndex) + COLW}
            y2={Y(nowHour)}
          />
          <circle className="nowdot" cx={X(todayIndex)} cy={Y(nowHour)} r="3.5" />
        </g>
      )}
    </svg>
  );
}

export default function Timetable() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

      <div className="board">
        <Grid now={now} />
      </div>

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
              {g.rows.map(([day, when], i) => (
                <li key={i}>
                  <b>{day}</b>
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

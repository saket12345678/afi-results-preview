/* AFI Results: World Athletics points in the browser, sorting by points, rankings across events.
 *
 * Points come only from the World Athletics Scoring Tables 2025 library (licensed to AFI, loaded as an ES module by
 * afr-wa.js when installed). Without it every points cell shows "–" and nothing is guessed.
 *
 * Which marks are scored (explicit, also in docs/PROGRESS.md):
 *  - Only marks made to SENIOR specifications. The tables are for senior implements and hurdle heights.
 *    Not scored ("—", tooltip "different implement/specification"):
 *      men U20: 110mH (99.1 cm), shot 6 kg, discus 1.75 kg, hammer 6 kg, decathlon (junior implements)
 *      men U18: 110mH (91.4 cm), 400mH (84 cm), shot 5 kg, discus 1.5 kg, hammer 5 kg, javelin 700 g, decathlon/octathlon
 *      women U18: 100mH (76.2 cm), shot 3 kg, hammer 3 kg, javelin 500 g, heptathlon
 *      every U16 / U14 (and younger) event, and youth events whose age group is not stated ("Boys' …", "Girls' …")
 *    Scored for juniors because the specification is the senior one: flat races, relays, walks, jumps,
 *    men U20 javelin (800 g), men U20 400mH and 3000mSC (91.4 cm), women U20 100mH (83.8 cm), women U20 shot/discus/
 *    hammer/javelin and heptathlon, women U18 discus (1 kg) and 400mH (76.2 cm).
 *  - Parts of a combined event, medley relays and cross country are not scored.
 *  - Wind over +2.0 m/s: points shown with "w", left out of the rankings. Hand-timed sprint marks (one decimal):
 *    points shown with "h", left out of the rankings. DNF, DNS, DQ, NM and the like: no points.
 *  - Indoor (short track) meets use the "sh" tables where the library has them (200m sh, 400m sh, …).
 */
(() => {
  "use strict";

  const FLAT = [50, 55, 60, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000, 10000];
  const SH = ["200m", "300m", "400m", "500m", "600m", "800m", "1000m", "1500m", "Mile", "2000m", "3000m", "2 Miles", "5000m", "4x200m", "4x400m"];
  const ROAD_KM = [5, 10, 15, 20, 25, 30, 100];
  const WALK_KM = [3, 5, 10, 15, 20, 30, 35, 50];
  const WALK_M = [3000, 5000, 10000, 15000, 20000, 30000, 35000, 50000];
  const WHOLE_SECONDS = /km|^HM|Marathon|10 Miles R|Mile R/; // road and road-walk tables take whole seconds
  const SPRINT = /^(50m|55m|60m|100m|200m|300m|400m|50mH|55mH|60mH|100mH|110mH|300mH|400mH|4x100m|4x200m|4x400m)( sh)?$/;
  const NO = "different implement/specification";

  /* AFI event name -> { id, g } for the library, or { why } when the mark is not scored. */
  const waEvent = (name, g, indoor) => {
    const n = String(name || "").replace(/’/g, "'");
    const lo = n.toLowerCase();
    const gender = /^w/i.test(g) || /^(women|girls)/i.test(n) ? "W" : /^x/i.test(g) || /^mixed/i.test(n) ? "X" : "M";
    const ageM = n.match(/\bU-?\s?(\d{2})\b/i);
    const age = ageM ? parseInt(ageM[1], 10) : null;
    if (age !== null && age <= 16) return { why: "youth event (" + "U" + age + ")" };
    if (age === null && /^(boys|girls)/i.test(n)) return { why: "youth event, age group not stated" };
    const band = age === null || age >= 21 ? "S" : age >= 19 ? "U20" : "U18";
    if (/athlon\s+\S/i.test(n) && !/athlon\s*$/i.test(n)) return { why: "part of a combined event" };
    if (/medley|cross\s*country|triathlon|tetrathlon|ibtc|standing|kids/i.test(n)) return { why: "not in the scoring tables" };

    let id = null;
    let m;
    if ((m = lo.match(/4\s*(?:x|\W)?\s*(100|200|400)\s*m/))) id = "4x" + m[1] + "m";
    else if (/decathlon/.test(lo)) id = "Decathlon";
    else if (/heptath/.test(lo)) id = gender === "M" ? (indoor ? "Heptathlon sh" : null) : "Heptathlon";
    else if (/pentathlon/.test(lo)) id = gender === "W" && indoor ? "Pentathlon sh" : null;
    else if (/half marathon race walk|21(\.1)?\s*km race walk/.test(lo)) id = "HM W";
    else if (/marathon race walk|42(\.195)?\s*km race walk/.test(lo)) id = "Marathon W";
    else if ((m = lo.match(/(\d+)\s*km race walk/)) && WALK_KM.includes(+m[1])) id = m[1] + "km W";
    else if ((m = lo.match(/(\d+)\s*m race walk/)) && WALK_M.includes(+m[1])) id = m[1] + "mW";
    else if (/half marathon/.test(lo)) id = "HM";
    else if (/marathon/.test(lo)) id = "Marathon";
    else if ((m = lo.match(/(\d+)\s*km road race/)) && ROAD_KM.includes(+m[1])) id = m[1] + "km";
    else if ((m = lo.match(/(2000|3000)\s*m steeple/))) id = m[1] + "mSC";
    else if ((m = lo.match(/(50|55|60|100|110|300|400)\s*m hurdles/))) id = m[1] + "mH";
    else if (/high jump/.test(lo)) id = "HJ";
    else if (/pole vault/.test(lo)) id = "PV";
    else if (/long jump/.test(lo)) id = "LJ";
    else if (/triple jump/.test(lo)) id = "TJ";
    else if (/shot put/.test(lo)) id = "SP";
    else if (/discus/.test(lo)) id = "DT";
    else if (/hammer/.test(lo)) id = "HT";
    else if (/javelin/.test(lo)) id = "JT";
    else if (/\bmile\b/.test(lo)) id = "Mile";
    else if ((m = lo.match(/(?:^|\D)(\d{2,5})\s*m\b/)) && FLAT.includes(+m[1])) id = m[1] + "m";
    if (!id) return { why: "not in the scoring tables" };

    // Senior specifications only (see the list at the top of this file).
    const notSenior = {
      M: { U20: ["110mH", "60mH", "SP", "DT", "HT", "Decathlon", "Heptathlon sh"], U18: ["110mH", "60mH", "400mH", "SP", "DT", "HT", "JT", "Decathlon", "Heptathlon sh"] },
      W: { U20: [], U18: ["100mH", "60mH", "SP", "HT", "JT", "Heptathlon", "Pentathlon sh"] },
      X: { U20: [], U18: [] },
    };
    if (band !== "S" && notSenior[gender][band].includes(id)) return { why: NO };
    if (gender === "X" && id !== "4x400m") return { why: "not in the scoring tables" };
    if (gender === "M" && id === "100mH") return { why: NO };
    if (gender === "W" && id === "110mH") return { why: NO };
    if (indoor && SH.includes(id)) id += " sh";
    return { id, g: gender === "W" ? "w" : gender === "X" ? "x" : "m" };
  };

  /* A mark as the library wants it, or null (DNF, DNS, DQ, NM, …). */
  const waMark = (id, mark) => {
    let s = String(mark || "").trim().replace(/\s*(m|mts|mtr|pts|points|sec|s)\.?$/i, "").replace(",", ".");
    if (/^\d+\.\d{2}\.\d{1,2}$/.test(s)) s = s.replace(/^(\d+)\.(\d{2})\./, "$1:$2."); // "4.12.12" -> "4:12.12"
    if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(s)) return null;
    if (WHOLE_SECONDS.test(id)) {
      const parts = s.split(":").map(Number);
      let sec = Math.ceil(parts.reduce((v, p) => v * 60 + p, 0) - 1e-9); // road times are rounded up to the second
      const h = Math.floor(sec / 3600), mi = Math.floor((sec % 3600) / 60), se = sec % 60;
      s = (h ? h + ":" + String(mi).padStart(2, "0") : String(mi)) + ":" + String(se).padStart(2, "0");
    }
    return s;
  };

  /* Points for one mark: { p, flags[], why }. p is null when not scored. */
  const score = (eventName, gender, mark, wind, indoor) => {
    const ev = waEvent(eventName, gender, indoor);
    if (!ev.id) return { p: null, flags: [], why: ev.why };
    const WA = window.AFR_WA;
    if (!WA) return { p: null, flags: [], why: "" };
    const mk = waMark(ev.id, mark);
    if (mk === null) return { p: null, flags: [], why: "" };
    const r = WA.waScore(ev.g, ev.id, mk);
    if (typeof r !== "number" || r <= 0) return { p: null, flags: [], why: typeof r === "string" && r.charAt(0) === "+" ? "above the table" : "" };
    const flags = [];
    const w = parseFloat(String(wind || "").replace(/[^\d.+-]/g, ""));
    if (!isNaN(w) && w > 2.0) flags.push("w");
    if (SPRINT.test(ev.id) && /^\d+\.\d$/.test(mk)) flags.push("h");
    return { p: r, flags, why: "" };
  };
  window.afrPoints = (eventName, gender, mark, wind, indoor) => score(eventName, gender, mark, wind, indoor).p;
  window.afrEvent = waEvent; // for checking the mapping from the browser console

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const flagHtml = (f) => f.map((x) => `<span class="afr-flag" title="${x === "w" ? "wind over +2.0 m/s: not used in rankings" : "hand-timed: not used in rankings"}">${x}</span>`).join("");

  const run = () => {
    const hub = document.querySelector(".afr-hub");
    const indoor = !!(hub && hub.dataset.afrIndoor === "1");

    /* Points column on every result row. */
    document.querySelectorAll("[data-afr-pts]").forEach((td) => {
      const s = score(td.dataset.ev, td.dataset.g, td.dataset.m, td.dataset.w, td.dataset.in !== undefined ? td.dataset.in === "1" : indoor);
      if (s.p === null) {
        td.innerHTML = s.why ? `<span class="afr-nopts" title="${esc(s.why)}">—</span>` : "–";
        td.dataset.v = "";
      } else {
        td.innerHTML = s.p + flagHtml(s.flags);
        td.dataset.v = String(s.p);
      }
    });

    /* Rankings across events (best of the meet, best by state) and the season's top performances. */
    const ranked = (list) => list.map((r) => ({ r, s: score(r[0], r[1], r[2], r[3], r[4]) }))
      .filter((x) => x.s.p !== null && !x.s.flags.length).sort((a, b) => b.s.p - a.s.p);
    const head = '<thead><tr><th>#</th><th>Athlete</th><th class="afr-hide-s">State / unit</th><th>Event</th><th class="afr-r">Mark</th><th class="afr-r">Points</th></tr></thead>';
    const row = (x, i) => `<tr><td>${i + 1}</td><td>${esc(x.r[5])}</td><td class="afr-hide-s">${esc(x.r[6])}</td><td>${esc(x.r[0])}</td><td class="afr-r afr-mark">${esc(x.r[2])}</td><td class="afr-r afr-pts">${x.s.p}</td></tr>`;
    const rank = document.querySelector("[data-afr-rank]");
    if (rank && window.AFR_WA) {
      const s = ranked(JSON.parse(rank.querySelector("[data-afr-perfs]").textContent));
      const out = rank.querySelector("[data-afr-rank-out]");
      if (rank.dataset.afrRank === "best") {
        out.innerHTML = [["M", "Men"], ["W", "Women"]].map(([g, label]) => {
          const list = s.filter((x) => (x.r[1] || "M") === g).slice(0, 25);
          return list.length ? `<h4>${label}</h4><div class="afr-scroll"><table class="afr-table">${head}<tbody>${list.map(row).join("")}</tbody></table></div>` : "";
        }).join("") || '<p class="afr-note">No marks in this competition can be scored.</p>';
      } else {
        const best = new Map();
        s.forEach((x) => { const k = String(x.r[6] || "").trim(); if (k && !best.has(k.toLowerCase())) best.set(k.toLowerCase(), x); });
        out.innerHTML = best.size ? `<div class="afr-scroll"><table class="afr-table">${head}<tbody>${[...best.values()].map(row).join("")}</tbody></table></div>` : '<p class="afr-note">No marks in this competition can be scored.</p>';
      }
      rank.querySelector("[data-afr-needs-tables]").hidden = true;
    }
    /* Competition header: the meet's best performance by points. */
    const kpi = document.querySelector("[data-afr-best-pts]");
    const perfsEl = document.querySelector("[data-afr-perfs-all]");
    if (kpi && perfsEl && window.AFR_WA) {
      const b = ranked(JSON.parse(perfsEl.textContent))[0];
      if (b) { kpi.textContent = b.s.p; kpi.insertAdjacentHTML("afterend", `<span class="afr-kpi-who">${esc(b.r[5])}, ${esc(b.r[0])} ${esc(b.r[2])}</span>`); }
      else kpi.textContent = "–";
    }
    const top = document.querySelector("[data-afr-top]");
    if (top && window.AFR_WA) {
      const all = ranked(JSON.parse(top.querySelector("[data-afr-marks]").textContent));
      /* Result slips: a paper slip per performance (rank, face and name, a typed divider, the lines of the sheet). */
      const ini = (n) => String(n || "").split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
      const slip = (x, i) => `<article class="afr-slip"><div class="afr-slip-no">${x.s.p}<small>pts</small></div><div class="afr-slip-face">${x.r[11] ? `<img src="${esc(x.r[11])}" alt="" loading="lazy" width="52" height="52">` : `<span class="afr-slip-ini" aria-hidden="true">${esc(ini(x.r[5]))}</span>`}<div>${x.r[10] ? `<a href="${esc(x.r[10])}"><strong>${esc(x.r[5])}</strong></a>` : `<strong>${esc(x.r[5])}</strong>`}<span>${esc(x.r[6])}</span></div></div><div class="afr-slip-dash">- - - - - - - - - - - - - - - - - -</div><div class="afr-slip-lines">${esc(x.r[0])}<br><b>${esc(x.r[2])}</b>${x.r[3] ? ` <span class="afr-soft">(${esc(x.r[3])})</span>` : ""}<br><a href="${esc(x.r[8])}">${esc(x.r[7])}</a></div></article>`;
      top.querySelector("[data-afr-top-list]").innerHTML = [["M", "Men"], ["W", "Women"]].map(([g, label]) => {
        // each athlete once, at their best-scoring mark (the list is already ranked)
        const seen = new Set();
        const list = all.filter((x) => (x.r[1] || "") === g).filter((x) => {
          const k = (x.r[9] || String(x.r[5] || "").toLowerCase().replace(/[^a-z]/g, ""));
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).slice(0, 5);
        return list.length ? `<div class="afr-slip-row"><div class="afr-slip-head">${label}</div>${list.map(slip).join("")}</div>` : "";
      }).join("") || '<p class="afr-note afr-note-light afr-in">No mark in this season can be scored.</p>';
      top.querySelector("[data-afr-needs-tables]").hidden = true;
    }
    /* What is a mark worth: event + mark -> points, and the mark's place among the season's finals in that event. */
    const worth = document.querySelector("[data-afr-worth]");
    if (worth && top && window.AFR_WA) {
      const marks = JSON.parse(top.querySelector("[data-afr-marks]").textContent);
      const ev = worth.querySelector("[data-afr-worth-ev]"), inp = worth.querySelector("[data-afr-worth-mark]");
      const out = worth.querySelector("[data-afr-worth-out]"), rk = worth.querySelector("[data-afr-worth-rank]");
      const indoorOf = (name, g) => { const r = marks.find((m) => m[0] === name && m[1] === g); return !!(r && r[4]); };
      const calc = () => {
        const [name, g] = ev.value.split("|");
        const s = score(name, g, inp.value, "", indoorOf(name, g));
        out.innerHTML = `<strong${s.p === null ? ' class="afr-dim"' : ""}>${s.p === null ? "····" : s.p}</strong><span>points</span>`;
        if (s.p === null) { rk.textContent = inp.value.trim() ? (s.why || "Type the mark as it appears on a result sheet.") : ""; return; }
        const peers = marks.filter((m) => m[0] === name && m[1] === g).map((m) => score(m[0], m[1], m[2], m[3], m[4]).p).filter((p) => p !== null).sort((a, b) => b - a);
        const pos = peers.filter((p) => p > s.p).length + 1;
        rk.textContent = peers.length ? `${pos === 1 ? "Better than every" : pos + (pos % 10 === 2 && pos !== 12 ? "nd" : pos % 10 === 3 && pos !== 13 ? "rd" : pos % 10 === 1 && pos !== 11 ? "st" : "th") + " among the"} ${peers.length} podium marks in ${name} finals this season.` : "";
      };
      ev.addEventListener("change", calc); inp.addEventListener("input", calc); calc();
    }
  };

  /* Sort a round by points. */
  document.querySelectorAll("[data-afr-sort]").forEach((b) => b.addEventListener("click", () => {
    const tbody = b.closest("table").tBodies[0];
    const desc = b.dataset.dir !== "desc";
    const val = (r) => { const v = parseFloat(r.querySelector("[data-afr-pts]").dataset.v); return isNaN(v) ? -1 : v; };
    [...tbody.rows].sort((x, y) => (desc ? val(y) - val(x) : val(x) - val(y))).forEach((r) => tbody.appendChild(r));
    b.dataset.dir = desc ? "desc" : "asc";
    b.setAttribute("aria-sort", desc ? "descending" : "ascending");
  }));

  /* Season rail: bring the chosen season into view (the rail starts at 1981). */
  const cur = document.querySelector(".afr-seasons a[aria-current]");
  if (cur) cur.parentElement.scrollLeft = Math.max(0, cur.offsetLeft - cur.parentElement.clientWidth / 2 + cur.offsetWidth / 2);

  /* Each board's parts arrive once, as it enters the window. */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("afr-on"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll("[data-afr-reveal]").forEach((el) => io.observe(el));
  } else document.querySelectorAll("[data-afr-reveal]").forEach((el) => el.classList.add("afr-on"));
  setTimeout(() => document.querySelectorAll("[data-afr-reveal]").forEach((el) => el.classList.add("afr-on")), 1500); // never leave a board blank

  run();
  window.addEventListener("afr-wa-ready", run);
})();

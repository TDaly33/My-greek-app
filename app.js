// ===================== constants =====================

const TENSE_META = [
  { key: "present",            label: "Present",              group: "Indicative", kind: "persons6", splittable: true  },
  { key: "imperfect",          label: "Imperfect",             group: "Indicative", kind: "persons6", splittable: true  },
  { key: "aorist",             label: "Aorist (simple past)",  group: "Indicative", kind: "persons6", splittable: true  },
  { key: "futureContinuous",   label: "Future continuous",     group: "Indicative", kind: "persons6", splittable: true  },
  { key: "futureSimple",       label: "Future simple",         group: "Indicative", kind: "persons6", splittable: true  },
  { key: "presentPerfect",     label: "Present perfect",       group: "Indicative", kind: "persons6", splittable: false },
  { key: "pastPerfect",        label: "Past perfect",          group: "Indicative", kind: "persons6", splittable: false },
  { key: "futurePerfect",      label: "Future perfect",        group: "Indicative", kind: "persons6", splittable: false },
  { key: "subjunctivePresent", label: "Subjunctive (να, present)", group: "Subjunctive", kind: "persons6", splittable: true },
  { key: "subjunctiveAorist",  label: "Subjunctive (να, aorist)",  group: "Subjunctive", kind: "persons6", splittable: true },
  { key: "imperativePresent",  label: "Imperative (present)",  group: "Imperative", kind: "imperative2", splittable: true },
  { key: "imperativeAorist",   label: "Imperative (aorist)",   group: "Imperative", kind: "imperative2", splittable: true },
];
const CORE_FOUR = ["present", "aorist", "futureSimple", "imperativePresent"];

const PERSON_META = [
  { idx: 0, short: "εγώ",   label: "I — εγώ" },
  { idx: 1, short: "εσύ",   label: "you (sg.) — εσύ" },
  { idx: 2, short: "αυτός", label: "he / she / it — αυτός/ή/ό" },
  { idx: 3, short: "εμείς", label: "we — εμείς" },
  { idx: 4, short: "εσείς", label: "you (pl.) — εσείς" },
  { idx: 5, short: "αυτοί", label: "they — αυτοί/ές/ά" },
];
const PERSON_LABELS = PERSON_META.map(p => p.label);

const IRREGULAR_IDS = new Set(["eimai", "exo", "pao", "leo", "troo", "xero", "prepei"]);

// Modern Greek definite article, verified against multiple independent
// grammar references. Column order matches the requested case-first
// grouping: Nom Sg, Nom Pl, Gen Sg, Gen Pl, Acc Sg, Acc Pl.
const ARTICLE_COLUMNS = ["nomSg", "nomPl", "genSg", "genPl", "accSg", "accPl"];
const ARTICLE_ROWS = [
  { key: "masc", label: "Masc", forms: { nomSg: "ο",   nomPl: "οι", genSg: "του",  genPl: "των", accSg: "τον", accPl: "τους" } },
  { key: "fem",  label: "Fem",  forms: { nomSg: "η",   nomPl: "οι", genSg: "της",  genPl: "των", accSg: "την", accPl: "τις"  } },
  { key: "neut", label: "Neut", forms: { nomSg: "το",  nomPl: "τα", genSg: "του",  genPl: "των", accSg: "το",  accPl: "τα"   } },
];

const DIRECTION_META = [
  { key: "open-closed", label: "Open → Closed" },
  { key: "closed-open", label: "Closed → Open" },
  { key: "random",      label: "Random" },
];

const CLASS_META = [
  { key: "irregular", label: "Irregular" },
  { key: "A",         label: "Class A (-ω)" },
  { key: "B1",        label: "Class B1 (-άω)" },
  { key: "B2",        label: "Class B2 (-ώ)" },
  { key: "passive",   label: "Passive / deponent" },
];

const VOICE_META = [
  { key: "both",    label: "Both" },
  { key: "active",  label: "Active only" },
  { key: "passive", label: "Passive only" },
];

const STORAGE_KEY = "greek-drill-settings-v2";

// Open -> Closed mode: verbs with no genuine closed (perfective) form at all
// (defective aspect), plus κάνω which genuinely has an identical open/closed
// form - confirmed against an independent conjugation reference, not just
// derived from our own data (which wouldn't show a false positive/negative
// here reliably on its own).
const OC_EXCLUDED_IDS = new Set(["eimai", "exo", "xero", "prepei", "kano"]);
// πάω's stored lemma covers the present-tense role, but the true "open"
// (imperfective) citation word is πηγαίνω - πάω is specifically the closed
// (perfective) word. Two different words, confirmed via multiple sources.
const OC_OPEN_FORM_OVERRIDE = { pao: "πηγαίνω" };

// ===================== state =====================

let verbsIndex = [];      // [{id, lemma, translation, class, voice}]
let verbsData = {};       // id -> conjugated object
let selectedVerbIds = new Set();
let session = null;       // current drill session
let timerHandle = null;
let els = {};
let currentMode = null;   // "conjugate" | "openclosed"
let quitDestination = "setup";

// ===================== boot =====================

document.addEventListener("DOMContentLoaded", async () => {
  cacheEls();
  initTheme();
  registerServiceWorker();
  try {
    await loadData();
  } catch (err) {
    els.setupError.hidden = false;
    els.setupError.textContent = "Couldn't load verb data. Try reloading the page.";
    console.error(err);
    return;
  }
  buildFilterUI();
  restoreSettings();
  wireLandingScreen();
  wireSetupScreen();
  wireArticlesScreen();
  wireDrillScreen();
  wireResultsScreen();
  updateStartBarSummary();
  els.verbTotalFoot.textContent = `${verbsIndex.length} verbs in the bank`;
});

const THEME_KEY = "greek-drill-theme";
function initTheme() {
  let theme;
  try { theme = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
  if (!theme) theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(theme);
  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
  });
}
function applyTheme(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    els.themeToggle.textContent = "☀️";
    if (meta) meta.setAttribute("content", "#211A14");
  } else {
    document.documentElement.removeAttribute("data-theme");
    els.themeToggle.textContent = "🌙";
    if (meta) meta.setAttribute("content", "#F3ECDC");
  }
}

function cacheEls() {
  const ids = [
    "app","stage",
    "screen-landing","modeConjugateBtn","modeOpenClosedBtn","modeArticlesBtn",
    "screen-articles","articlesBackBtn","articlesTally","articlesBody","articlesCheckBtn",
    "articlesComplete","articlesRingFill","articlesResetBtn",
    "articlesTestFillBtn","articlesTestWrongBtn",
    "screen-setup","screen-setup-oc","screen-drill","screen-results",
    "tenseChips","personChips","voiceChips","classChips",
    "verbList","verbSearch","verbSelectedCount",
    "classChipsOC","verbListOC","verbSearchOC","verbSelectedCountOC","directionChips",
    "timerField","timerMinutes","timerFieldOC","timerMinutesOC","accentLenientOC",
    "accentLenient","startBtn","setupError",
    "quitBtn","progressFill","progressLabel","drillMeta","startBar","startBarSummary",
    "scoreLive","timerLive",
    "promptLemma","promptTranslation","promptPerson","revealMeaningBtn",
    "answerForm","answerInput","checkBtn","hintBtn","hintText","tryAgainText",
    "resultsHeadline","resultsSub","scoreRingFill","scoreRingPct",
    "missedWrap","reviewList","missedOnlyBtn","againSameBtn","newSetBtn",
    "quitModal","quitCancelBtn","quitConfirmBtn",
    "topbarStatus","verbTotalFoot","themeToggle","wordmarkBtn",
  ];
  ids.forEach(id => { els[toCamel(id)] = document.getElementById(id); });
}
function toCamel(id) { return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

async function loadData() {
  const [idxRes, dataRes] = await Promise.all([
    fetch("verbs_index.json"),
    fetch("verbs_conjugated.json"),
  ]);
  verbsIndex = await idxRes.json();
  const arr = await dataRes.json();
  arr.forEach(v => { verbsData[v.id] = v; });
  selectedVerbIds = new Set(verbsIndex.map(v => v.id));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => { els.topbarStatus.textContent = "offline-ready"; })
      .catch(() => { els.topbarStatus.textContent = "online only"; });
  } else {
    els.topbarStatus.textContent = "online only";
  }
}

// ===================== filter UI =====================

function buildFilterUI() {
  els.tenseChips.innerHTML = "";
  TENSE_META.forEach(t => {
    els.tenseChips.appendChild(makeChip(t.key, t.label, CORE_FOUR.includes(t.key)));
  });

  els.personChips.innerHTML = "";
  PERSON_META.forEach(p => {
    els.personChips.appendChild(makeChip(String(p.idx), p.short, true));
  });

  els.voiceChips.innerHTML = "";
  VOICE_META.forEach((v, i) => {
    els.voiceChips.appendChild(makeChip(v.key, v.label, i === 0));
  });

  els.directionChips.innerHTML = "";
  DIRECTION_META.forEach((d, i) => {
    els.directionChips.appendChild(makeChip(d.key, d.label, i === 0));
  });
  els.directionChips.addEventListener("click", e => onChipClick(e, true));

  [els.classChips, els.classChipsOC].forEach(container => {
    container.innerHTML = "";
    CLASS_META.forEach(c => {
      container.appendChild(makeChip(c.key, c.label, true));
    });
  });

  buildVerbList(els.verbList, els.verbSearch);
  buildVerbList(els.verbListOC, els.verbSearchOC, OC_EXCLUDED_IDS);
  syncAllVerbUI();

  els.tenseChips.addEventListener("click", e => onChipClick(e, false));
  els.personChips.addEventListener("click", e => onChipClick(e, false));
  els.voiceChips.addEventListener("click", e => onChipClick(e, true));
  [els.classChips, els.classChipsOC].forEach(container => {
    container.addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      toggleClassSelection(chip.dataset.key);
    });
  });
}

function toggleClassSelection(classKey) {
  const verbsInClass = verbsIndex.filter(v => verbClass(v) === classKey);
  const allSelected = verbsInClass.every(v => selectedVerbIds.has(v.id));
  verbsInClass.forEach(v => {
    if (allSelected) selectedVerbIds.delete(v.id);
    else selectedVerbIds.add(v.id);
  });
  syncAllVerbUI();
  saveSettings();
}

function syncAllVerbUI() {
  syncVerbCheckboxes(els.verbList);
  syncVerbCheckboxes(els.verbListOC);
  syncClassChips(els.classChips);
  syncClassChips(els.classChipsOC);
  updateVerbCount(els.verbSelectedCount, els.verbList);
  updateVerbCount(els.verbSelectedCountOC, els.verbListOC);
}

function syncClassChips(container) {
  [...container.children].forEach(chip => {
    const verbsInClass = verbsIndex.filter(v => verbClass(v) === chip.dataset.key);
    const allSelected = verbsInClass.length > 0 && verbsInClass.every(v => selectedVerbIds.has(v.id));
    chip.setAttribute("aria-pressed", String(allSelected));
  });
}

function makeChip(key, label, pressed) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.dataset.key = key;
  b.setAttribute("aria-pressed", String(pressed));
  b.textContent = label;
  return b;
}

function onChipClick(e, singleSelect) {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const group = chip.parentElement;
  if (singleSelect) {
    [...group.children].forEach(c => c.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
  } else {
    const now = chip.getAttribute("aria-pressed") === "true";
    chip.setAttribute("aria-pressed", String(!now));
  }
  saveSettings();
}

document.addEventListener("click", e => {
  const presetBtn = e.target.closest("[data-tense-preset]");
  if (presetBtn) {
    const preset = presetBtn.dataset.tensePreset;
    [...els.tenseChips.children].forEach(chip => {
      const key = chip.dataset.key;
      const on = preset === "all" ? true : preset === "none" ? false : CORE_FOUR.includes(key);
      chip.setAttribute("aria-pressed", String(on));
    });
    saveSettings();
  }
  const personPreset = e.target.closest("[data-person-preset]");
  if (personPreset) {
    const on = personPreset.dataset.personPreset === "all";
    [...els.personChips.children].forEach(c => c.setAttribute("aria-pressed", String(on)));
    saveSettings();
  }
  const verbPreset = e.target.closest("[data-verb-preset]");
  if (verbPreset) {
    const preset = verbPreset.dataset.verbPreset;
    if (preset === "all") selectedVerbIds = new Set(verbsIndex.map(v => v.id));
    else if (preset === "none") selectedVerbIds = new Set();
    syncAllVerbUI();
    saveSettings();
  }

  const gotoBtn = e.target.closest("[data-goto]");
  if (gotoBtn) {
    goToLanding();
  }
});

function selectedKeys(container) {
  return [...container.querySelectorAll('.chip[aria-pressed="true"]')].map(c => c.dataset.key);
}
function singleSelected(container) {
  const el = container.querySelector('.chip[aria-pressed="true"]');
  return el ? el.dataset.key : null;
}

function verbClass(v) {
  if (IRREGULAR_IDS.has(v.id)) return "irregular";
  if (v.voice === "passive") return "passive";
  return v.class || "other";
}

// ===================== verb checklist =====================

function buildVerbList(listEl, searchEl, excludeIds) {
  listEl.innerHTML = "";
  const byClass = {};
  CLASS_META.forEach(c => { byClass[c.key] = []; });
  verbsIndex.forEach(v => {
    if (excludeIds && excludeIds.has(v.id)) return;
    const c = verbClass(v);
    if (!byClass[c]) byClass[c] = [];
    byClass[c].push(v);
  });

  let n = 0;
  CLASS_META.forEach(c => {
    const verbs = byClass[c.key];
    if (!verbs || !verbs.length) return;
    const label = document.createElement("div");
    label.className = "verb-group-label";
    label.textContent = c.label;
    listEl.appendChild(label);
    verbs.forEach(v => {
      n++;
      const row = document.createElement("label");
      row.className = "verb-row";
      row.dataset.id = v.id;
      row.dataset.search = normalizeSearch(`${v.lemma} ${v.translation}`);
      row.innerHTML = `
        <input type="checkbox" data-id="${v.id}" ${selectedVerbIds.has(v.id) ? "checked" : ""}>
        <span class="verb-num">${n}.</span>
        <span class="verb-lemma">${v.lemma}</span>
        <span class="verb-en">${v.translation}</span>
      `;
      listEl.appendChild(row);
    });
  });

  listEl.addEventListener("change", e => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    if (cb.checked) selectedVerbIds.add(cb.dataset.id);
    else selectedVerbIds.delete(cb.dataset.id);
    syncAllVerbUI();
    saveSettings();
  });

  searchEl.addEventListener("input", () => {
    const q = normalizeSearch(searchEl.value);
    let lastGroupVisible = null;
    [...listEl.children].forEach(el => {
      if (el.classList.contains("verb-group-label")) {
        lastGroupVisible = el;
        el.classList.add("is-hidden");
      } else {
        const match = !q || el.dataset.search.includes(q);
        el.classList.toggle("is-hidden", !match);
        if (match && lastGroupVisible) lastGroupVisible.classList.remove("is-hidden");
      }
    });
  });
}

function normalizeSearch(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function syncVerbCheckboxes(listEl) {
  listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = selectedVerbIds.has(cb.dataset.id);
  });
}

function updateVerbCount(countEl, listEl) {
  const total = listEl.querySelectorAll('input[type="checkbox"]').length;
  const selected = [...listEl.querySelectorAll('input[type="checkbox"]')].filter(cb => selectedVerbIds.has(cb.dataset.id)).length;
  countEl.textContent = `${selected} of ${total} selected`;
}

// ===================== settings persistence =====================

function saveSettings() {
  updateStartBarSummary();
  try {
    const settings = {
      tenses: selectedKeys(els.tenseChips),
      persons: selectedKeys(els.personChips),
      voice: singleSelected(els.voiceChips),
      verbIds: [...selectedVerbIds],
      minutes: els.timerMinutes.value,
      lenient: els.accentLenient.checked,
      minutesOC: els.timerMinutesOC.value,
      lenientOC: els.accentLenientOC.checked,
      direction: singleSelected(els.directionChips),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) { /* storage unavailable — ignore */ }
}

function updateStartBarSummary() {
  if (currentMode === "openclosed") {
    const eligible = [...selectedVerbIds].filter(id => !OC_EXCLUDED_IDS.has(id)).length;
    els.startBarSummary.textContent = `${eligible} verb${eligible === 1 ? "" : "s"}`;
    return;
  }
  const tenseCount = selectedKeys(els.tenseChips).length;
  const personCount = selectedKeys(els.personChips).length;
  const verbCount = selectedVerbIds.size;
  els.startBarSummary.textContent =
    `${verbCount} verb${verbCount === 1 ? "" : "s"} · ${tenseCount} tense${tenseCount === 1 ? "" : "s"} · ${personCount} pronoun${personCount === 1 ? "" : "s"}`;
}

function restoreSettings() {
  let s;
  try { s = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return; }
  if (!s) return;
  if (Array.isArray(s.tenses)) {
    [...els.tenseChips.children].forEach(chip => {
      chip.setAttribute("aria-pressed", String(s.tenses.includes(chip.dataset.key)));
    });
  }
  if (Array.isArray(s.persons)) {
    [...els.personChips.children].forEach(chip => {
      chip.setAttribute("aria-pressed", String(s.persons.includes(chip.dataset.key)));
    });
  }
  if (s.voice) setSingle(els.voiceChips, s.voice);
  if (Array.isArray(s.verbIds) && s.verbIds.length) {
    selectedVerbIds = new Set(s.verbIds);
    syncAllVerbUI();
  }
  if (s.minutes) els.timerMinutes.value = s.minutes;
  if (typeof s.lenient === "boolean") els.accentLenient.checked = s.lenient;
  if (s.direction) setSingle(els.directionChips, s.direction);
  if (s.minutesOC) els.timerMinutesOC.value = s.minutesOC;
  if (typeof s.lenientOC === "boolean") els.accentLenientOC.checked = s.lenientOC;
}
function setSingle(container, key) {
  [...container.children].forEach(c => c.setAttribute("aria-pressed", String(c.dataset.key === key)));
}

// ===================== question pool =====================

function buildPool(tenseKeys, personIdxSet, voiceKey, verbIds) {
  const pool = [];
  verbsIndex.forEach(vIdx => {
    if (!verbIds.has(vIdx.id)) return;
    const data = verbsData[vIdx.id];
    if (!data) return;
    const voices = [];
    if (voiceKey === "active" || voiceKey === "both") voices.push("active");
    if (voiceKey === "passive" || voiceKey === "both") voices.push("passive");

    voices.forEach(voiceSide => {
      const forms = data[voiceSide];
      if (!forms) return;
      tenseKeys.forEach(tKey => {
        const meta = TENSE_META.find(t => t.key === tKey);
        const val = forms[tKey];
        if (!val) return;
        if (meta.kind === "persons6") {
          val.forEach((form, personIdx) => {
            if (!form || form === "-") return;
            if (!personIdxSet.has(personIdx)) return;
            pool.push({ verb: vIdx, data, voiceSide, tenseMeta: meta, personIdx, correct: form, forms: val });
          });
        } else {
          [["sg", 1], ["pl", 4]].forEach(([slot, mappedIdx]) => {
            if (!personIdxSet.has(mappedIdx)) return;
            const form = val[slot];
            if (!form || form === "-") return;
            pool.push({
              verb: vIdx, data, voiceSide, tenseMeta: meta,
              personIdx: mappedIdx, correct: form, forms: [val.sg, val.pl],
            });
          });
        }
      });
    });
  });
  return pool;
}

function buildPoolOpenClosed(verbIds, direction) {
  const pool = [];
  verbsIndex.forEach(vIdx => {
    if (!verbIds.has(vIdx.id)) return;
    if (OC_EXCLUDED_IDS.has(vIdx.id)) return;
    const data = verbsData[vIdx.id];
    if (!data) return;
    const voiceSide = vIdx.voice === "passive" ? "passive" : "active";
    const forms = data[voiceSide];
    if (!forms || !forms.present || !forms.subjunctiveAorist) return;

    const openForm = OC_OPEN_FORM_OVERRIDE[vIdx.id] || forms.present[0];
    const closedForm = splitParticle(forms.subjunctiveAorist[0]).word;
    if (!closedForm || closedForm === openForm) return; // safety net, shouldn't trigger given the exclusion list

    const makeItem = dir => ({
      verb: vIdx,
      data: {
        lemma: dir === "closed-open" ? closedForm : openForm,
        translation: vIdx.translation,
      },
      voiceSide,
      tenseMeta: { label: dir === "closed-open" ? "Closed → Open" : "Open → Closed", splittable: false },
      personIdx: null,
      correct: dir === "closed-open" ? openForm : closedForm,
      forms: null,
    });

    if (direction === "random") {
      pool.push(makeItem("open-closed"));
      pool.push(makeItem("closed-open"));
    } else {
      pool.push(makeItem(direction));
    }
  });
  return pool;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===================== stem/ending split =====================

function splitParticle(s) {
  const parts = s.split(" ");
  if (parts.length > 1) return { particle: parts.slice(0, -1).join(" ") + " ", word: parts[parts.length - 1] };
  return { particle: "", word: s };
}

function commonPrefixLen(words) {
  if (!words.length) return 0;
  let len = words[0].length;
  words.forEach(w => {
    let i = 0;
    while (i < len && i < w.length && w[i] === words[0][i]) i++;
    len = Math.min(len, i);
  });
  return len;
}

function stemCut(item) {
  const { word } = splitParticle(item.correct);
  const rawForms = Array.isArray(item.forms) ? item.forms.filter(Boolean) : [];
  const words = rawForms.map(f => splitParticle(f).word);
  let cut = words.length > 1 ? commonPrefixLen(words) : Math.max(1, word.length - 2);
  cut = Math.max(1, Math.min(cut, word.length - 1 || 1));
  if (word.length <= 2) cut = word.length;
  return cut;
}

function stemSplitHTML(item) {
  const { particle, word } = splitParticle(item.correct);
  const cut = stemCut(item);
  const stem = word.slice(0, cut);
  const ending = word.slice(cut);
  const particleHTML = particle ? `<span class="particle">${escapeHTML(particle)}</span>` : "";
  if (!ending) return `${particleHTML}<span class="stem">${escapeHTML(stem)}</span>`;
  return `${particleHTML}<span class="stem">${escapeHTML(stem)}</span><span class="divider">|</span><span class="ending">${escapeHTML(ending)}</span>`;
}

function hintHTML(item) {
  const { particle, word } = splitParticle(item.correct);
  const particleHTML = particle ? `<span class="particle">${escapeHTML(particle)}</span>` : "";
  if (item.tenseMeta.splittable) {
    const cut = stemCut(item);
    return `${particleHTML}<span class="stem">${escapeHTML(word.slice(0, cut))}</span>…`;
  }
  return `${particleHTML}<span class="stem">${escapeHTML(word.slice(0, 1))}</span>… (${item.correct.split(" ").length} words)`;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// ===================== answer checking =====================

function normalize(s, lenient) {
  let out = s.trim().toLowerCase().replace(/\s+/g, " ");
  if (lenient) out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
  return out;
}

function isCorrect(userAnswer, correctAnswer, lenient) {
  return normalize(userAnswer, lenient) === normalize(correctAnswer, lenient);
}

// ===================== landing / navigation wiring =====================

function wireLandingScreen() {
  els.modeConjugateBtn.addEventListener("click", () => {
    currentMode = "conjugate";
    showScreen("setup");
  });
  els.modeOpenClosedBtn.addEventListener("click", () => {
    currentMode = "openclosed";
    showScreen("setup-oc");
  });
  els.modeArticlesBtn.addEventListener("click", () => {
    currentMode = "articles";
    resetArticlesTable();
    showScreen("articles");
  });
  els.wordmarkBtn.addEventListener("click", () => {
    const onDrill = !document.getElementById("screen-drill").hidden;
    if (onDrill) {
      quitDestination = "landing";
      els.quitModal.hidden = false;
    } else {
      goToLanding();
    }
  });
}

// ===================== definite articles table =====================

function resetArticlesTable() {
  els.articlesBody.innerHTML = "";
  ARTICLE_ROWS.forEach(row => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.className = "row-label";
    th.textContent = row.label;
    tr.appendChild(th);
    ARTICLE_COLUMNS.forEach(col => {
      const td = document.createElement("td");
      td.className = "article-cell";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "article-input";
      input.dataset.row = row.key;
      input.dataset.col = col;
      input.autocapitalize = "off";
      input.autocorrect = "off";
      input.spellcheck = false;
      const check = document.createElement("div");
      check.className = "article-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      td.appendChild(input);
      td.appendChild(check);
      tr.appendChild(td);
    });
    els.articlesBody.appendChild(tr);
  });
  els.articlesComplete.hidden = true;
  els.articlesCheckBtn.hidden = false;
  updateArticlesTally();
}

function updateArticlesTally() {
  const inputs = [...els.articlesBody.querySelectorAll(".article-input")];
  const correctCount = inputs.filter(i => i.classList.contains("is-correct")).length;
  els.articlesTally.textContent = `${correctCount} of 18 correct`;
}

function checkArticlesTable() {
  const inputs = [...els.articlesBody.querySelectorAll(".article-input")];
  const numCols = ARTICLE_COLUMNS.length;
  const maxDiagonal = (ARTICLE_ROWS.length - 1) + (numCols - 1); // 7 for a 3x6 grid
  const REVEAL_MS = 4000;    // tile flip duration
  const CASCADE_STEP_MS = 150; // delay before the next diagonal starts
  const HOLD_AFTER_CASCADE_MS = 1000;
  const FADE_MS = 450;
  let allCorrect = true;
  const ticksToFade = [];

  inputs.forEach((input, i) => {
    if (input.disabled) return; // already locked in as correct from a previous check
    const td = input.closest(".article-cell");
    const check = td ? td.querySelector(".article-check") : null;
    const row = ARTICLE_ROWS.find(r => r.key === input.dataset.row);
    const correctAnswer = row.forms[input.dataset.col];
    const isRight = isCorrect(input.value, correctAnswer, true); // accent-lenient, matching the app default
    const rowIdx = Math.floor(i / numCols);
    const colIdx = i % numCols;
    const diagonal = rowIdx + colIdx; // cells on the same top-left-to-bottom-right diagonal reveal together
    const delayMs = diagonal * CASCADE_STEP_MS;

    // Reset any leftover state from a previous check, but don't reveal anything yet —
    // the cell should look like a normal, untouched box until the cascade actually reaches it.
    input.classList.remove("is-wrong", "is-correct", "wrong-pop");
    if (check) {
      check.classList.remove("pop");
      check.style.transition = "";
      check.style.opacity = "";
      check.style.transform = "";
    }

    if (!isRight) allCorrect = false;
    if (isRight && check) ticksToFade.push(check);

    // Everything below only happens once the cascade reaches this cell's turn — value, class,
    // and animation are all applied at the same instant, so there's nothing to leak early.
    setTimeout(() => {
      if (isRight) {
        input.classList.add("is-correct");
        input.value = correctAnswer;
        input.disabled = true;
        if (check) {
          void check.offsetWidth; // reflow, so the animation restarts cleanly
          check.classList.add("pop");
        }
      } else {
        input.classList.add("is-wrong");
        input.value = "";
        void input.offsetWidth; // reflow, so the animation restarts cleanly
        input.classList.add("wrong-pop");
      }
      updateArticlesTally();
    }, delayMs);
  });

  const cascadeSpan = maxDiagonal * CASCADE_STEP_MS + REVEAL_MS;

  if (ticksToFade.length) {
    setTimeout(() => {
      ticksToFade.forEach(check => {
        // release the flip animation's hold on opacity/transform before handing off to a transition
        check.style.opacity = "1";
        check.style.transform = "perspective(340px) rotateY(0deg)";
        check.classList.remove("pop");
        void check.offsetWidth;
        check.style.transition = `opacity ${FADE_MS}ms ease`;
        requestAnimationFrame(() => { check.style.opacity = "0"; });
      });
    }, cascadeSpan + HOLD_AFTER_CASCADE_MS);
  }

  setTimeout(() => {
    if (allCorrect) {
      playTone("correct");
      els.articlesComplete.hidden = false;
      els.articlesCheckBtn.hidden = true;
      els.articlesRingFill.style.strokeDashoffset = "0";
    } else {
      playTone("wrong");
      const firstWrong = els.articlesBody.querySelector(".article-input.is-wrong");
      if (firstWrong) firstWrong.focus();
    }
  }, cascadeSpan);
}

function fillArticlesForTest(withErrors) {
  const inputs = [...els.articlesBody.querySelectorAll(".article-input")];
  inputs.forEach(input => {
    if (input.disabled) return;
    const row = ARTICLE_ROWS.find(r => r.key === input.dataset.row);
    const correctAnswer = row.forms[input.dataset.col];
    const makeWrong = withErrors && Math.random() < 0.3;
    input.value = makeWrong ? "x" : correctAnswer;
  });
  checkArticlesTable();
}

function wireArticlesScreen() {
  els.articlesBackBtn.addEventListener("click", () => goToLanding());
  els.articlesCheckBtn.addEventListener("click", checkArticlesTable);
  els.articlesResetBtn.addEventListener("click", resetArticlesTable);
  els.articlesTestFillBtn.addEventListener("click", () => fillArticlesForTest(false));
  els.articlesTestWrongBtn.addEventListener("click", () => fillArticlesForTest(true));
}

// ===================== setup screen wiring =====================

function wireSetupScreen() {
  els.startBtn.addEventListener("click", () => {
    els.setupError.hidden = true;
    if (currentMode === "openclosed") return startOpenClosedSession();
    return startConjugateSession();
  });
}

function startConjugateSession() {
  const tenseKeys = selectedKeys(els.tenseChips);
  const personIdxSet = new Set(selectedKeys(els.personChips).map(Number));
  if (!tenseKeys.length) return showSetupError("Pick at least one tense or mood.");
  if (!personIdxSet.size) return showSetupError("Pick at least one pronoun.");
  if (!selectedVerbIds.size) return showSetupError("Pick at least one verb.");

  const voiceKey = singleSelected(els.voiceChips) || "both";
  const pool = buildPool(tenseKeys, personIdxSet, voiceKey, selectedVerbIds);
  if (!pool.length) return showSetupError("No forms match that combination — try widening your filters.");

  saveSettings();
  const lenient = els.accentLenient.checked;
  const minutes = Math.max(1, Math.min(60, parseInt(els.timerMinutes.value, 10) || 5));
  startSession(pool, { mode: "timer", minutes, lenient });
}

function startOpenClosedSession() {
  if (!selectedVerbIds.size) return showSetupError("Pick at least one verb.");
  const direction = singleSelected(els.directionChips) || "open-closed";
  const pool = buildPoolOpenClosed(selectedVerbIds, direction);
  if (!pool.length) return showSetupError("None of the selected verbs work for this game — try selecting more.");

  saveSettings();
  const lenient = els.accentLenientOC.checked;
  const minutes = Math.max(1, Math.min(60, parseInt(els.timerMinutesOC.value, 10) || 5));
  startSession(pool, { mode: "timer", minutes, lenient });
}

function showSetupError(msg) {
  els.setupError.hidden = false;
  els.setupError.textContent = msg;
}

// ===================== drill screen =====================

function startSession(pool, opts) {
  clearTimer();
  const items = opts.mode === "count"
    ? buildFixedDeck(pool, opts.count)
    : shuffle(pool); // timer mode: draw from a large shuffled deck, cycling as needed

  session = {
    items, index: 0, score: 0, missed: [],
    lenient: opts.lenient, poolForRestart: pool, opts,
  };
  showScreen("drill");
  els.timerLive.hidden = opts.mode !== "timer";
  if (opts.mode === "timer") startTimer(opts.minutes * 60);
  renderQuestion();
}

function buildFixedDeck(pool, count) {
  const shuffled = shuffle(pool);
  const items = [];
  for (let i = 0; i < count; i++) items.push(shuffled[i % shuffled.length]);
  return shuffle(items);
}

function startTimer(totalSeconds) {
  let remaining = totalSeconds;
  updateTimerDisplay(remaining);
  timerHandle = setInterval(() => {
    remaining--;
    updateTimerDisplay(remaining);
    if (remaining <= 0) {
      clearTimer();
      finishSession();
    }
  }, 1000);
}
function clearTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}
function updateTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  els.timerLive.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
  els.timerLive.classList.toggle("is-low", seconds <= 30);
}

let questionAlreadyMissed = false;
let awaitingAdvance = false;

function currentItem() {
  if (session.opts.mode === "timer" && session.index >= session.items.length) {
    session.items = session.items.concat(shuffle(session.poolForRestart));
  }
  return session.items[session.index];
}

function renderQuestion() {
  const item = currentItem();
  questionAlreadyMissed = false;
  awaitingAdvance = false;
  updateScoreLive();

  if (session.opts.mode === "count") {
    const n = session.items.length;
    els.progressFill.style.width = `${(session.index / n) * 100}%`;
    els.progressLabel.textContent = `${session.index + 1} / ${n}`;
  } else {
    els.progressFill.style.width = "100%";
    els.progressLabel.textContent = `question ${session.index + 1}`;
  }

  const voiceLabel = item.voiceSide === "passive" ? " · passive" : "";
  els.drillMeta.textContent = `${item.tenseMeta.label}${voiceLabel}`;
  els.promptLemma.textContent = item.data.lemma;
  els.promptTranslation.textContent = item.data.translation;
  els.promptTranslation.hidden = true;
  els.revealMeaningBtn.textContent = "Show meaning";
  els.revealMeaningBtn.hidden = false;

  const isOpenClosed = currentMode === "openclosed";
  els.promptPerson.hidden = isOpenClosed;
  if (!isOpenClosed) els.promptPerson.textContent = PERSON_META[item.personIdx].short;

  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.answerInput.classList.remove("is-wrong", "is-correct");
  els.checkBtn.disabled = false;
  els.hintBtn.hidden = isOpenClosed || false;
  els.hintText.hidden = true;
  els.tryAgainText.hidden = true;
  els.answerInput.focus();
}

function updateScoreLive() {
  const answered = session.score + session.missed.length;
  els.scoreLive.textContent = `Score: ${session.score}/${answered}`;
}

function wireDrillScreen() {
  els.answerForm.addEventListener("submit", e => {
    e.preventDefault();
    checkAnswer();
  });
  // Stop the Check button from stealing focus (and dismissing the iOS
  // keyboard) when tapped - mousedown/touchstart fire before the button
  // would normally take focus, so preventing default here keeps focus
  // (and the keyboard) on the answer input the whole time.
  ["mousedown", "touchstart"].forEach(evt => {
    els.checkBtn.addEventListener(evt, e => e.preventDefault());
  });
  els.hintBtn.addEventListener("click", () => {
    els.hintText.innerHTML = hintHTML(currentItem());
    els.hintText.hidden = false;
  });
  els.revealMeaningBtn.addEventListener("click", () => {
    const showing = !els.promptTranslation.hidden;
    els.promptTranslation.hidden = showing;
    els.revealMeaningBtn.textContent = showing ? "Show meaning" : "Hide meaning";
  });
  els.quitBtn.addEventListener("click", () => {
    quitDestination = currentMode === "openclosed" ? "setup-oc" : "setup";
    els.quitModal.hidden = false;
  });
  els.quitCancelBtn.addEventListener("click", () => {
    els.quitModal.hidden = true;
  });
  els.quitConfirmBtn.addEventListener("click", () => {
    els.quitModal.hidden = true;
    clearTimer();
    if (quitDestination === "landing") goToLanding();
    else showScreen(quitDestination);
  });
}

function checkAnswer() {
  if (awaitingAdvance) return;
  const item = currentItem();
  const userVal = els.answerInput.value;
  const correct = isCorrect(userVal, item.correct, session.lenient);

  if (correct) {
    if (!questionAlreadyMissed) session.score++;
    playTone("correct");
    els.answerInput.classList.remove("is-wrong");
    els.answerInput.classList.add("is-correct");
    awaitingAdvance = true;
    els.checkBtn.disabled = true;
    els.hintBtn.hidden = true;
    els.tryAgainText.hidden = true;
    updateScoreLive();
    els.answerInput.focus();
    setTimeout(advance, 420);
  } else {
    if (!questionAlreadyMissed) {
      session.missed.push({ item, userVal });
      questionAlreadyMissed = true;
      updateScoreLive();
    }
    playTone("wrong");
    els.answerInput.classList.remove("is-correct");
    els.answerInput.classList.remove("is-wrong");
    // restart animation on repeated wrong answers
    void els.answerInput.offsetWidth;
    els.answerInput.classList.add("is-wrong");
    els.tryAgainText.hidden = false;
    els.answerInput.focus();
  }
}

function advance() {
  session.index++;
  const doneByCount = session.opts.mode === "count" && session.index >= session.items.length;
  if (doneByCount) {
    finishSession();
  } else {
    renderQuestion();
  }
}

// ===================== gentle audio feedback =====================

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(kind) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (kind === "correct") {
    [523.25, 659.25].forEach((freq, i) => {
      const dur = 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * dur;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
    return;
  }

  // gentle buzzer: two closely-detuned low triangle oscillators beating
  // against each other, run through a soft lowpass so it stays mellow
  const dur = 0.22;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.07, now + 0.02);
  master.gain.setValueAtTime(0.07, now + dur - 0.06);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  master.connect(filter).connect(ctx.destination);

  [110, 116].forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  });
}

// ===================== results screen =====================

function wireResultsScreen() {
  els.againSameBtn.addEventListener("click", () => {
    startSession(session.poolForRestart, session.opts);
  });
  els.missedOnlyBtn.addEventListener("click", () => {
    const missedPool = session.missed.map(m => m.item);
    startSession(missedPool, { mode: "count", count: missedPool.length, lenient: session.lenient });
  });
  els.newSetBtn.addEventListener("click", () => showScreen(currentMode === "openclosed" ? "setup-oc" : "setup"));
}

function finishSession() {
  clearTimer();
  const total = session.score + session.missed.length;
  const score = session.score;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  els.resultsHeadline.textContent = `${score} / ${total} correct`;
  els.resultsSub.textContent = subMessage(pct);
  els.missedOnlyBtn.hidden = session.missed.length === 0;

  const circumference = 326.7;
  els.scoreRingFill.style.strokeDashoffset = String(circumference * (1 - pct / 100));
  els.scoreRingPct.textContent = `${pct}%`;

  els.reviewList.innerHTML = "";
  if (session.missed.length === 0) {
    els.missedWrap.hidden = true;
  } else {
    els.missedWrap.hidden = false;
    session.missed.forEach(({ item, userVal }) => {
      const li = document.createElement("li");
      const voiceLabel = item.voiceSide === "passive" ? " · passive" : "";
      const answerHTML = item.tenseMeta.splittable
        ? stemSplitHTML(item)
        : escapeHTML(item.correct);
      const personPart = item.personIdx === null ? "" : ` · ${escapeHTML(PERSON_LABELS[item.personIdx])}`;
      li.innerHTML = `
        <div>
          <div class="review-meta">${escapeHTML(item.data.lemma)} · ${escapeHTML(item.tenseMeta.label)}${voiceLabel}${personPart}</div>
          ${userVal.trim() ? `<div class="review-your">${escapeHTML(userVal.trim())}</div>` : ""}
        </div>
        <div class="review-answer">${answerHTML}</div>
      `;
      els.reviewList.appendChild(li);
    });
  }

  showScreen("results");
}

function subMessage(pct) {
  if (pct === 100) return "Perfect set. Every form landed.";
  if (pct >= 85) return "Strong session — a couple of forms to revisit below.";
  if (pct >= 60) return "Solid progress. Review the missed forms and go again.";
  return "A tough set — the review below is where the learning happens.";
}

// ===================== screen switching =====================

function showScreen(name) {
  ["landing", "setup", "setup-oc", "articles", "drill", "results"].forEach(n => {
    document.getElementById(`screen-${n}`).hidden = n !== name;
  });
  els.startBar.hidden = name !== "setup" && name !== "setup-oc";
  document.body.classList.toggle("drill-active", name === "drill");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function goToLanding() {
  currentMode = null;
  showScreen("landing");
}

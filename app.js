/*
 * HLA Typing Predictor - app shell
 * Landing view is a 3-card grid (Single/Couple/KIR) shown together; only
 * Single navigates anywhere. Swap each card's content in SECTIONS for real
 * UI later without touching how the grid or navigation is built.
 */

(function () {
  "use strict";

  // ---- Icons (single-color line art, matches extractor tool empty states) ----

  const ICONS = {
    single: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M16 6c0 7 16 7 16 14s-16 7-16 14"></path>
        <path d="M32 6c0 7-16 7-16 14s16 7 16 14"></path>
        <path d="M18 13h12M18 27h12"></path>
      </svg>
    `,
    couple: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 8c0 6 12 6 12 12s-12 6-12 12"></path>
        <path d="M18 8c0 6-12 6-12 12s12 6 12 12"></path>
        <path d="M30 8c0 6 12 6 12 12s-12 6-12 12"></path>
        <path d="M42 8c0 6-12 6-12 12s12 6 12 12"></path>
        <path d="M18 20h12"></path>
      </svg>
    `,
    kir: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="30" r="12"></circle>
        <path d="M24 18V8M24 8l-5 5M24 8l5 5"></path>
        <circle cx="24" cy="30" r="3"></circle>
      </svg>
    `,
  };

  // ---- Landing grid: Single / Couple / KIR cards, shown together ----
  // Each entry describes one card; only Single is interactive right now, so
  // it's the only one with an onClick. Swap in real content per section
  // later without touching how the grid itself is built.

  const SECTIONS = [
    {
      key: "single",
      icon: ICONS.single,
      heading: "Single",
      description: "Upload RPL and Control reports for individual HLA analysis.",
      badge: "Click to begin",
      onClick: goToSinglePage,
    },
    {
      key: "couple",
      icon: ICONS.couple,
      heading: "Couple",
      description: "Compare HLA allele patterns between two individuals and their studied associations.",
      badge: "In development",
    },
    {
      key: "kir",
      icon: ICONS.kir,
      heading: "KIR",
      description: "Analyze KIR gene patterns and their studied associations with HLA ligands.",
      badge: "In development",
    },
  ];

  function renderSectionCard({ key, icon, heading, description, badge, onClick }) {
    const card = document.createElement("div");
    card.className = `section-card section-card--${key}${onClick ? " section-card--clickable" : ""}`;
    if (onClick) {
      card.setAttribute("role", "button");
      card.tabIndex = 0;
    }

    card.innerHTML = `
      <div class="section-card-icon-circle">
        <div class="section-card-icon">${icon}</div>
      </div>
      <h2 class="section-card-heading">${heading}</h2>
      <p class="section-card-description">${description}</p>
      <span class="section-card-badge">${badge}</span>
    `;

    if (onClick) {
      card.addEventListener("click", onClick);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      });
    }

    return card;
  }

  function renderSectionGrid() {
    const grid = document.getElementById("section-grid");
    SECTIONS.forEach((section) => grid.appendChild(renderSectionCard(section)));
  }

  // ---- Single page: PDF upload + real extraction (ported from the HLA
  // Report Extractor project's app.js) ----

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const LOCI = ["HLA-A", "HLA-B", "HLA-C", "HLA-DRB1", "HLA-DQB1", "HLA-DPB1"];
  const LOCUS_KEYS = LOCI.map((l) => l.replace("HLA-", ""));
  const ALLELE_FIELD_KEYS = LOCUS_KEYS.flatMap((k) => [`${k}/1`, `${k}/2`]);

  function emptyAlleles() {
    const alleles = {};
    ALLELE_FIELD_KEYS.forEach((k) => {
      alleles[k] = "";
    });
    return alleles;
  }

  function dashAlleles() {
    const alleles = {};
    ALLELE_FIELD_KEYS.forEach((k) => {
      alleles[k] = "-";
    });
    return alleles;
  }

  // PDFs have no real table structure, so visual rows are reconstructed by
  // clustering text items with similar y-position, then sorting each row
  // left-to-right — identical approach to the Report Extractor tool.
  async function extractLinesFromPdf(pdf) {
    const lines = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const items = content.items
        .filter((it) => it.str && it.str.trim().length > 0)
        .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));

      const rows = [];
      const tolerance = 2.5;
      for (const item of items) {
        let row = rows.find((r) => Math.abs(r.y - item.y) <= tolerance);
        if (!row) {
          row = { y: item.y, items: [] };
          rows.push(row);
        }
        row.items.push(item);
      }
      rows.sort((a, b) => b.y - a.y);
      for (const row of rows) {
        row.items.sort((a, b) => a.x - b.x);
        const lineStr = row.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
        if (lineStr) lines.push(lineStr);
      }
    }
    return lines;
  }

  // Collects every line matching a label test as a candidate. When a
  // candidate line has no value content by hasValueTest, the next line is
  // added as an additional candidate, so a label/value split across two
  // reconstructed lines isn't fatal.
  function candidateLinesFor(lines, labelTest, hasValueTest) {
    const candidates = [];
    for (let i = 0; i < lines.length; i++) {
      if (!labelTest(lines[i])) continue;
      candidates.push(lines[i]);
      if (!hasValueTest(lines[i]) && lines[i + 1]) {
        candidates.push(lines[i + 1]);
      }
    }
    return candidates;
  }

  // ---- RPL parsing (husband/wife format, female patient only) ----

  const TITLE_REGEX = /(Mrs\.|Mr\.|Ms\.|Miss|Dr\.|Master)/g;
  const TITLE_TEST = new RegExp(TITLE_REGEX.source, "i");

  function parseRplReport(lines) {
    const warnings = [];

    // Match Female/Male regardless of whether the age number comes before or
    // after it ("Female / 24 Years" vs "33 Years/Female"), and regardless of
    // whether the row label itself is "Age/Gender" or "Gender/Age". Some
    // templates label the row "Sex" instead of "Gender", and/or abbreviate
    // the value to a bare "F"/"M" instead of spelling it out — both are
    // accepted here too.
    const genderCandidates = candidateLinesFor(
      lines,
      (l) => /gender|sex/i.test(l),
      (l) => /\b(Female|Male|F|M)\b/i.test(l)
    );
    let genderMatches = [];
    let genderSourceLine = "";
    for (const candidate of genderCandidates) {
      const candidateMatches = [...candidate.matchAll(/\b(Female|Male|F|M)\b/gi)].map((m) => {
        const token = m[1].toLowerCase();
        return token === "f" ? "female" : token === "m" ? "male" : token;
      });
      if (candidateMatches.length > genderMatches.length) {
        genderMatches = candidateMatches;
        genderSourceLine = candidate;
      }
    }

    // A relationship reference embedded in the same field (e.g. "Mrs. Priya
    // D/O Mr. Ramesh") carries a second title word for a guardian/relative,
    // not a second patient — without this, that title gets mistaken for
    // another person's name and inflates the detected patient count.
    const RELATIONSHIP_MARKER = /(?:S\/O|D\/O|W\/O|C\/O)/i;
    const isGuardianTitle = (text, titleIndex) =>
      RELATIONSHIP_MARKER.test(text.slice(Math.max(0, titleIndex - 10), titleIndex));

    const nameCandidates = candidateLinesFor(lines, (l) => /\bname\b/i.test(l), (l) => TITLE_TEST.test(l));
    let names = [];
    if (nameCandidates.length) {
      for (const candidate of nameCandidates) {
        const stripped = candidate.replace(/^.*?\bname\s*/i, "");
        const titleIdxs = [...stripped.matchAll(TITLE_REGEX)]
          .filter((m) => !isGuardianTitle(stripped, m.index))
          .map((m) => m.index);
        const candidateNames = [];
        for (let i = 0; i < titleIdxs.length; i++) {
          const start = titleIdxs[i];
          const end = i + 1 < titleIdxs.length ? titleIdxs[i + 1] : stripped.length;
          // Trim off any relationship reference (and whatever guardian
          // name/title follows it) that this patient's own segment
          // absorbed, now that it's no longer treated as a boundary.
          let segment = stripped.slice(start, end);
          const stopMatch = segment.match(/\s+(?:S\/O|D\/O|W\/O|C\/O)\b/i);
          if (stopMatch) segment = segment.slice(0, stopMatch.index);
          candidateNames.push(segment.trim());
        }
        if (!candidateNames.length && stripped.trim()) candidateNames.push(stripped.trim());
        if (candidateNames.length > names.length) names = candidateNames;
      }
    } else {
      warnings.push({ field: "name", type: "missing", message: 'Could not find a "Name" line.' });
    }

    const peopleCount = Math.max(genderMatches.length, names.length, 1);

    let femaleIndex = genderMatches.findIndex((g) => g === "female");
    if (femaleIndex === -1) {
      warnings.push({
        field: "gender",
        type: "gender-default",
        message: "Could not detect a female patient — defaulted to first column, please verify.",
      });
      femaleIndex = 0;
    } else if (genderMatches.length !== peopleCount) {
      warnings.push({
        field: "gender",
        type: "gender-default",
        message: `Detected ${genderMatches.length} gender label(s) but ${peopleCount} patient(s) on this report — please verify the correct column was used.`,
      });
    }

    // Ages live on the same line as the gender label, so they're read off
    // whichever line produced the winning gender match above.
    const ageMatches = genderSourceLine
      ? [...genderSourceLine.matchAll(/(\d(?:\s?\d){0,2})\s*Years?\b/gi)].map((m) => m[1].replace(/\s/g, ""))
      : [];
    if (!ageMatches.length) {
      warnings.push({ field: "age", type: "missing", message: 'Could not find an "Age" value.' });
    }

    const name = names.length ? names[Math.min(femaleIndex, names.length - 1)] || names[0] : "";
    const gender = genderMatches.length ? "Female" : "";
    const age = ageMatches.length ? ageMatches[Math.min(femaleIndex, ageMatches.length - 1)] || ageMatches[0] : "";

    const alleles = emptyAlleles();
    for (const locus of LOCI) {
      const key = locus.replace("HLA-", "");
      const escaped = locus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Allow optional whitespace around the dash and before the asterisk —
      // some PDFs have font-kerning artifacts that insert stray spaces
      // mid-label (e.g. "HLA - A*" instead of "HLA-A*").
      const flexiblePattern = escaped.replace(/-/g, "\\s*-\\s*");
      const locusLineRegex = new RegExp(flexiblePattern + "\\s*\\*", "i");
      const locusCandidates = lines.filter((l) => locusLineRegex.test(l));
      if (!locusCandidates.length) {
        warnings.push({ field: key, type: "missing", message: `Could not find ${locus} row.` });
        continue;
      }

      // Prefer whichever candidate line has exactly the expected token
      // count; otherwise fall back to whichever has the most tokens.
      let tokens = [];
      let exactMatch = null;
      for (const candidate of locusCandidates) {
        const candidateTokens = [...candidate.matchAll(/\d{2}:\d{2}(?::\d{2})?/g)].map((m) => m[0]);
        if (candidateTokens.length === peopleCount * 2) {
          exactMatch = candidateTokens;
          break;
        }
        if (candidateTokens.length > tokens.length) tokens = candidateTokens;
      }
      if (exactMatch) tokens = exactMatch;

      // Each person should contribute exactly 2 allele values. If no
      // candidate line has the right token count, slicing by position is
      // unsafe — flag it instead of guessing.
      if (tokens.length !== peopleCount * 2) {
        warnings.push({
          field: key,
          type: "missing",
          message: `${locus} row had ${tokens.length} allele value(s) for ${peopleCount} patient(s) (expected ${peopleCount * 2}) — please verify manually.`,
        });
        const fallback = tokens.slice(0, 2);
        alleles[`${key}/1`] = fallback[0] || "";
        alleles[`${key}/2`] = fallback[1] || "";
        continue;
      }

      const start = femaleIndex * 2;
      const pair = tokens.slice(start, start + 2);
      alleles[`${key}/1`] = pair[0] || "";
      alleles[`${key}/2`] = pair[1] || "";
    }

    return { name, gender, age, alleles, warnings };
  }

  // ---- Sample Number extraction (additive — a separate, self-contained
  // reader over the same `lines` extractLinesFromPdf() already produces;
  // does not read from or modify parseRplReport itself). Needed for the
  // RPL_Results.xlsx export below, which parseRplReport's own return value
  // doesn't carry. Re-derives which column is the female patient's the
  // same way parseRplReport does, since that isn't exposed externally. ----
  function extractSampleNumber(lines) {
    const genderCandidates = candidateLinesFor(
      lines,
      (l) => /gender/i.test(l),
      (l) => /\b(Female|Male)\b/i.test(l)
    );
    let genderMatches = [];
    for (const candidate of genderCandidates) {
      const candidateMatches = [...candidate.matchAll(/\b(Female|Male)\b/gi)].map((m) => m[1].toLowerCase());
      if (candidateMatches.length > genderMatches.length) genderMatches = candidateMatches;
    }
    let femaleIndex = genderMatches.findIndex((g) => g === "female");
    if (femaleIndex === -1) femaleIndex = 0;

    const sampleCandidates = candidateLinesFor(
      lines,
      (l) => /sample\s*number/i.test(l),
      (l) => /\d{4,}/.test(l)
    );
    let sampleNumbers = [];
    for (const candidate of sampleCandidates) {
      const nums = [...candidate.matchAll(/\b\d{4,}\b/g)].map((m) => m[0]);
      if (nums.length > sampleNumbers.length) sampleNumbers = nums;
    }

    return sampleNumbers.length
      ? sampleNumbers[Math.min(femaleIndex, sampleNumbers.length - 1)] || sampleNumbers[0]
      : "";
  }

  // ---- Reference dataset comparison (additive — does not read from or
  // modify parseRplReport/extractLinesFromPdf; only consumes their output) ----

  // patientAlleles is keyed like parseRplReport()'s own alleles object
  // ("A/1", "A/2", ... one raw string value per key). RPL_REFERENCE_DATA
  // comes from rplReferenceData.js.
  function compareToReference(patientAlleles, referenceData) {
    const matches = [];
    const seen = new Set();

    LOCUS_KEYS.forEach((locus) => {
      [1, 2].forEach((n) => {
        const raw = patientAlleles[`${locus}/${n}`];
        if (!raw) return;

        // Reference data is keyed at 2-field resolution (e.g. "12:02"), so
        // a third field on the patient's value (e.g. "12:02:01") is
        // dropped before matching.
        const twoField = raw.split(":").slice(0, 2).join(":");
        const key = `${locus}*${twoField}`;

        if (seen.has(key)) return; // homozygous: count once, not twice
        const entry = referenceData.alleles[key];
        if (!entry) return;

        seen.add(key);
        matches.push({ allele: key, classification: entry.classification, referenceFrequency: entry.frequency });
      });
    });

    return matches;
  }

  // ---- Control/transplant parsing (Patient + Donor, no gender filtering) ----
  // Anchors each field to its own label/marker, independent of a single
  // split point, so it works whether a template stacks two whole
  // single-person blocks in sequence or shares a two-column header up top
  // followed by two separately-marked allele tables.

  const FLEXIBLE_TITLE_REGEX = /(Mrs\s*\.|Mr\s*\.|Ms\s*\.|Miss|Dr\s*\.|Master)/g;
  const FLEXIBLE_GENDER_REGEX = /F\s*e\s*m\s*a\s*l\s*e|M\s*a\s*l\s*e/gi;
  const NAME_STOP_WORDS = /\s+(?:PIN|Sample\s*Number|Gender|Age|Specimen|Hospital|Diagnosis|Relationship|Relation|Referred|Patient|Donor)\b/i;

  function normalizeGenderMatch(raw) {
    return /^f/i.test(raw.trim()) ? "Female" : "Male";
  }

  // Extracts a name from one single line already known to contain "name" —
  // deliberately never falls back to a neighboring line, since real-world
  // templates keep the label and value on the same line.
  function extractNameFromLine(line) {
    if (!line) return "";
    const afterLabel = line.replace(/^.*?\bname\s*:?\s*/i, "");
    const titleIdxs = [...afterLabel.matchAll(FLEXIBLE_TITLE_REGEX)].map((m) => m.index);
    const startFrom = titleIdxs.length ? afterLabel.slice(titleIdxs[0]) : afterLabel;
    const stopMatch = startFrom.match(NAME_STOP_WORDS);
    return (stopMatch ? startFrom.slice(0, stopMatch.index) : startFrom).trim();
  }

  // Gender/Age: usually one person per line, attributed by position
  // relative to the Donor boundary — but some templates put both people's
  // Gender/Age on one shared line, detected by that line having 2 matches.
  function extractGenderAge(lines, donorLineIdx) {
    let patientGender = "";
    let donorGender = "";
    let patientAge = "";
    let donorAge = "";
    lines.forEach((l, i) => {
      if (!/gender/i.test(l)) return;
      const genderMatches = [...l.matchAll(FLEXIBLE_GENDER_REGEX)].map((m) => normalizeGenderMatch(m[0]));
      const ageMatches = [...l.matchAll(/(\d(?:\s?\d){0,2})\s*Years?\b/gi)].map((m) => m[1].replace(/\s/g, ""));
      if (genderMatches.length >= 2) {
        if (!patientGender) patientGender = genderMatches[0];
        if (!donorGender) donorGender = genderMatches[1];
        if (!patientAge && ageMatches.length) patientAge = ageMatches[0];
        if (!donorAge && ageMatches.length > 1) donorAge = ageMatches[1];
      } else if (genderMatches.length === 1) {
        const belongsToDonor = donorLineIdx !== -1 && i >= donorLineIdx;
        if (belongsToDonor) {
          if (!donorGender) donorGender = genderMatches[0];
          if (!donorAge && ageMatches.length) donorAge = ageMatches[0];
        } else {
          if (!patientGender) patientGender = genderMatches[0];
          if (!patientAge && ageMatches.length) patientAge = ageMatches[0];
        }
      }
    });
    return { patientGender, donorGender, patientAge, donorAge };
  }

  // HLA table: finds the first two lines (from startIdx onward) with
  // exactly 6 allele-shaped tokens, regardless of whatever row-index text
  // precedes them — the token count alone identifies a valid row.
  function findAlleleRowsAfter(lines, startIdx) {
    let row1 = null;
    let row2 = null;
    for (let i = startIdx; i < lines.length; i++) {
      const tokens = [...lines[i].matchAll(/\d{2}:\d{2}(?::\d{2})?/g)].map((m) => m[0]);
      if (tokens.length !== LOCI.length) continue;
      if (!row1) row1 = tokens;
      else {
        row2 = tokens;
        break;
      }
    }
    return row1 && row2 ? [row1, row2] : null;
  }

  function alleleObjFromRows(rows) {
    if (!rows) return null;
    const alleles = emptyAlleles();
    LOCUS_KEYS.forEach((key, i) => {
      alleles[`${key}/1`] = rows[0][i] || "";
      alleles[`${key}/2`] = rows[1][i] || "";
    });
    return alleles;
  }

  function parseControlReport(rawLines) {
    // Row-clustering occasionally pulls the Patient's and Donor's "name"
    // fields onto the same reconstructed line when a template renders them
    // close together vertically. Split that single line right at the
    // "Donor name :" boundary before anything else runs.
    const lines = rawLines.flatMap((l) => {
      const m = l.match(/^(.*\S)\s+(Donor\s*name\s*:.*)$/i);
      return m ? [m[1], m[2]] : [l];
    });

    const donorLineIdx = lines.findIndex((l) => /\bdonor\b/i.test(l) && /\bname\b/i.test(l));
    const donorMentioned = donorLineIdx !== -1;

    const patientNameLine = lines.find((l) => /\bname\b/i.test(l) && !/\bdonor\b/i.test(l)) || "";
    const donorNameLine = donorMentioned ? lines[donorLineIdx] : "";
    const patientName = extractNameFromLine(patientNameLine);
    const donorName = donorMentioned ? extractNameFromLine(donorNameLine) : "";

    const ga = extractGenderAge(lines, donorLineIdx);

    // Prefer an explicit "<Name> (Patient)" / "<Name> (Donor)" marker line
    // directly above that person's own allele table when the template
    // repeats one there; otherwise fall back to whichever half of the
    // document holds the first two valid-shaped rows.
    const patientMarkerIdx = lines.findIndex((l) => /\(patient\)/i.test(l));
    const donorMarkerIdx = lines.findIndex((l) => /\(donor\)/i.test(l));

    let patientRows = patientMarkerIdx !== -1 ? findAlleleRowsAfter(lines, patientMarkerIdx + 1) : null;
    let donorRows = donorMentioned && donorMarkerIdx !== -1 ? findAlleleRowsAfter(lines, donorMarkerIdx + 1) : null;

    if (!patientRows) {
      const blockEnd = donorMentioned ? donorLineIdx : lines.length;
      patientRows = findAlleleRowsAfter(lines.slice(0, blockEnd), 0);
    }
    if (donorMentioned && !donorRows) {
      donorRows = findAlleleRowsAfter(lines, donorLineIdx);
    }

    const patientWarnings = [];
    if (!patientName) patientWarnings.push({ field: "name", type: "missing", message: 'Could not find a "Name" line for the Patient.' });
    if (!ga.patientGender) patientWarnings.push({ field: "gender", type: "missing", message: 'Could not find a "Gender" line for the Patient.' });
    if (!ga.patientAge) patientWarnings.push({ field: "age", type: "missing", message: 'Could not find an "Age" line for the Patient.' });
    if (!patientRows) patientWarnings.push({ field: null, type: "missing", message: "Could not find the HLA allele table for the Patient — please verify manually." });

    const patient = {
      name: patientName,
      gender: ga.patientGender,
      age: ga.patientAge,
      role: "Patient",
      alleles: alleleObjFromRows(patientRows) || emptyAlleles(),
      warnings: patientWarnings,
    };

    let donor;
    if (!donorMentioned) {
      donor = {
        name: "-",
        gender: "-",
        age: "-",
        role: "Donor",
        alleles: dashAlleles(),
        warnings: [{ field: null, type: "donor-absent", message: "Donor not mentioned in this report" }],
      };
    } else {
      const donorWarnings = [];
      if (!donorName) donorWarnings.push({ field: "name", type: "missing", message: 'Could not find a "Name" line for the Donor.' });
      if (!ga.donorGender) donorWarnings.push({ field: "gender", type: "missing", message: 'Could not find a "Gender" line for the Donor.' });
      if (!ga.donorAge) donorWarnings.push({ field: "age", type: "missing", message: 'Could not find an "Age" line for the Donor.' });
      if (!donorRows) donorWarnings.push({ field: null, type: "missing", message: "Could not find the HLA allele table for the Donor — please verify manually." });
      donor = {
        name: donorName,
        gender: ga.donorGender,
        age: ga.donorAge,
        role: "Donor",
        alleles: alleleObjFromRows(donorRows) || emptyAlleles(),
        warnings: donorWarnings,
      };
    }

    return { patient, donor };
  }

  // ---- PDF file processing per card ----

  async function processRplPdfFile(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const lines = await extractLinesFromPdf(pdf);
    const parsed = parseRplReport(lines);
    const fieldKeys = ["name", "gender", "age", ...ALLELE_FIELD_KEYS];
    const values = [parsed.name, parsed.gender, parsed.age, ...ALLELE_FIELD_KEYS.map((k) => parsed.alleles[k])];
    // sampleNumber/rawLines are additive: neither is part of the main
    // preview table's columns (RPL_COLUMNS/values/fieldKeys above are
    // untouched) — sampleNumber feeds the RPL_Results.xlsx export, rawLines
    // feeds the "View Raw Text" debug button so parsing issues on a
    // specific file can be diagnosed without modifying parseRplReport.
    return {
      people: [{ values, fieldKeys, warnings: parsed.warnings }],
      sampleNumber: extractSampleNumber(lines),
      rawLines: lines.join("\n"),
    };
  }

  async function processControlPdfFile(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const lines = await extractLinesFromPdf(pdf);
    const parsed = parseControlReport(lines);
    const fieldKeys = ["name", "gender", "age", "role", ...ALLELE_FIELD_KEYS];
    const toValues = (person) => [
      person.name,
      person.gender,
      person.age,
      person.role,
      ...ALLELE_FIELD_KEYS.map((k) => person.alleles[k]),
    ];
    return {
      people: [
        { values: toValues(parsed.patient), fieldKeys, warnings: parsed.patient.warnings },
        { values: toValues(parsed.donor), fieldKeys, warnings: parsed.donor.warnings },
      ],
    };
  }

  function isPdfFile(file) {
    return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  }

  // Identifies a parsed PDF report for duplicate detection, same intent as
  // the Report Extractor's Sample-Number-based check: RPL doesn't retain a
  // Sample Number in this codebase, so Name is the fallback identifier.
  function getReportIdentifier(result) {
    const person = result.people[0];
    const nameIdx = person.fieldKeys.indexOf("name");
    const raw = nameIdx !== -1 ? person.values[nameIdx] : "";
    return String(raw || "").trim().toLowerCase();
  }

  // ---- Excel (.xlsx) preview parsing ----
  // Unlike the PDF path, an uploaded sheet may hold many saved rows, so this
  // doesn't try to guess a single row to show — it renders the sheet's own
  // header row and data rows as-is, whatever their structure.

  const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  function isExcelFile(file) {
    return file.type === EXCEL_MIME || /\.xlsx$/i.test(file.name);
  }

  async function parseExcelFile(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { headers: [], rows: [], error: "This Excel file has no sheets." };

    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!aoa.length) return { headers: [], rows: [], error: "This Excel file appears to be empty." };

    const headers = aoa[0].map((h) => String(h ?? "").trim());
    if (!headers.length || headers.every((h) => h === "")) {
      return { headers: [], rows: [], error: "Could not find a header row in this Excel file." };
    }

    const rows = aoa.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
    if (!rows.length) {
      return { headers, rows: [], error: "This Excel file has headers but no data rows." };
    }

    return { headers, rows, error: null };
  }

  // A value like "02:01" or "24:02:01" typed straight into a spreadsheet
  // cell (without the column pre-formatted as Text) gets silently
  // auto-converted by Excel into a time-of-day value, stored as a fraction
  // of a day — SheetJS then hands back that raw decimal instead of the
  // typed text. Any non-integer number in these text-only columns is that
  // corruption, so it's reconstructed back into HH:MM:SS rather than shown
  // as-is (e.g. 0.04237268518518519 -> "01:01:01").
  function formatExcelCellValue(raw) {
    if (typeof raw === "number" && !Number.isInteger(raw)) {
      const totalSeconds = Math.round(raw * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return raw === undefined || raw === null ? "" : String(raw);
  }

  // ---- Reference comparison table (additive UI, rendered by the existing
  // preview after extraction — doesn't alter the extraction preview table
  // itself) ----

  function classificationLabel(classification) {
    if (classification === "high_risk") return "High Risk";
    if (classification === "protective") return "Protective";
    return classification;
  }

  function classificationBadgeClass(classification) {
    if (classification === "high_risk") return "classification-badge--high-risk";
    if (classification === "protective") return "classification-badge--protective";
    return "";
  }

  // Rebuilds the raw { "A/1": "...", ... } alleles object from a rendered
  // person's flattened values/fieldKeys — reads processRplPdfFile()'s
  // output shape without needing to change that function.
  function allelesFromPerson(person) {
    const alleles = {};
    person.fieldKeys.forEach((key, i) => {
      if (key && key.includes("/")) alleles[key] = person.values[i];
    });
    return alleles;
  }

  function personName(person) {
    const nameIdx = person.fieldKeys.indexOf("name");
    return nameIdx !== -1 ? person.values[nameIdx] : "";
  }

  function personAge(person) {
    const ageIdx = person.fieldKeys.indexOf("age");
    return ageIdx !== -1 ? person.values[ageIdx] : "";
  }

  // Recognizes an Excel column header as an allele field — "A/1", "DRB1/2",
  // and the "HLA-" prefixed form some sheets use (e.g. "HLA-A/1") — and maps
  // it to the same "LOCUS/N" key parseRplReport()'s alleles object uses.
  function normalizeAlleleHeader(header) {
    const match = String(header || "")
      .trim()
      .match(/^(?:HLA-)?([A-Za-z]+\d*)\/([12])$/i);
    if (!match) return null;
    const locus = match[1].toUpperCase();
    return LOCUS_KEYS.includes(locus) ? `${locus}/${match[2]}` : null;
  }

  function allelesFromExcelRow(headers, row) {
    const alleles = {};
    headers.forEach((header, i) => {
      const key = normalizeAlleleHeader(header);
      if (key) alleles[key] = formatExcelCellValue(row[i]);
    });
    return alleles;
  }

  function nameFromExcelRow(headers, row) {
    const nameIdx = headers.findIndex((h) => /name/i.test(String(h || "")));
    return nameIdx !== -1 ? formatExcelCellValue(row[nameIdx]) : "";
  }

  function sampleNumberFromExcelRow(headers, row) {
    const idx = headers.findIndex((h) => /sample\s*number/i.test(String(h || "")));
    return idx !== -1 ? formatExcelCellValue(row[idx]) : "";
  }

  function ageFromExcelRow(headers, row) {
    const idx = headers.findIndex((h) => /^age$/i.test(String(h || "").trim()));
    return idx !== -1 ? formatExcelCellValue(row[idx]) : "";
  }

  function renderReferenceComparison({ alleles, name }) {
    const wrap = document.createElement("div");
    wrap.className = "reference-comparison";

    const title = document.createElement("h4");
    title.className = "reference-comparison-title";
    title.textContent = name ? `Reference Data Comparison — ${name}` : "Reference Data Comparison";
    wrap.appendChild(title);

    const tableWrap = document.createElement("div");
    tableWrap.className = "preview-table-wrap";
    const table = document.createElement("table");
    table.className = "preview-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Allele", "Classification", "Reference Frequency"].forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const matches = compareToReference(alleles, RPL_REFERENCE_DATA);

    if (!matches.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "notes-cell";
      td.textContent = "No matches found.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      matches.forEach((match) => {
        const tr = document.createElement("tr");

        const alleleTd = document.createElement("td");
        alleleTd.className = "allele-cell";
        alleleTd.textContent = match.allele;
        tr.appendChild(alleleTd);

        const classTd = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `classification-badge ${classificationBadgeClass(match.classification)}`;
        badge.textContent = classificationLabel(match.classification);
        classTd.appendChild(badge);
        tr.appendChild(classTd);

        const freqTd = document.createElement("td");
        freqTd.textContent = `${(match.referenceFrequency * 100).toFixed(2)}%`;
        tr.appendChild(freqTd);

        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);

    const citation = document.createElement("p");
    citation.className = "reference-citation";
    citation.textContent = "Reference: Shetty et al., 2024, J Reprod Immunol 163:104225";
    wrap.appendChild(citation);

    return wrap;
  }

  // ---- RPL_Results.xlsx export (additive — a brand-new, standalone
  // workbook built and downloaded entirely client-side via the SheetJS
  // APIs already used for the Excel-upload path; never touches whatever
  // workbook a user may have connected elsewhere, since there's no
  // connected-workbook concept in this app at all) ----

  const RPL_RESULTS_HEADERS = ["Patient Name", "Age", "Allele", "Classification", "Frequency"];

  // patients: array of { name, age, sampleNumber, alleles } — sampleNumber
  // isn't included in the export output, only name/age/alleles are. One row
  // per matched allele; a patient with no matches still gets one row with
  // "-" placeholders.
  function buildRplResultsRows(patients) {
    const rows = [];
    patients.forEach((patient) => {
      const matches = compareToReference(patient.alleles, RPL_REFERENCE_DATA);
      if (!matches.length) {
        rows.push([patient.name || "", patient.age || "", "-", "-", "-"]);
        return;
      }
      matches.forEach((match) => {
        rows.push([
          patient.name || "",
          patient.age || "",
          match.allele,
          classificationLabel(match.classification),
          `${(match.referenceFrequency * 100).toFixed(2)}%`,
        ]);
      });
    });
    return rows;
  }

  function downloadRplResults(patients) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([RPL_RESULTS_HEADERS, ...buildRplResultsRows(patients)]);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "RPL_Results.xlsx");
  }

  // ---- Upload card UI ----

  const DROPZONE_ICON = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 30V10M24 10l-8 8M24 10l8 8"></path>
      <path d="M10 32v4a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4v-4"></path>
    </svg>
  `;

  const EXCEL_ROW_LIMIT = 25;
  const EXCEL_EXPANDED_MAX_HEIGHT = "1600px";

  function createUploadCard({ label, columns, parseFile, compareReference }) {
    const card = document.createElement("div");
    card.className = "upload-card";

    const title = document.createElement("h3");
    title.className = "upload-card-title";
    title.textContent = label;
    card.appendChild(title);

    const dropzone = document.createElement("div");
    dropzone.className = "dropzone";
    dropzone.tabIndex = 0;
    dropzone.setAttribute("role", "button");
    dropzone.setAttribute("aria-label", `Upload ${label} PDF or Excel report`);
    dropzone.innerHTML = `
      <div class="dropzone-icon">${DROPZONE_ICON}</div>
      <p class="dropzone-text">Choose file(s) or drag them here</p>
    `;
    card.appendChild(dropzone);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    input.multiple = true;
    input.className = "dropzone-input";
    card.appendChild(input);

    const status = document.createElement("p");
    status.className = "upload-status-text";
    status.hidden = true;
    card.appendChild(status);

    const previewWrap = document.createElement("div");
    previewWrap.className = "preview-wrap";
    previewWrap.hidden = true;
    card.appendChild(previewWrap);

    // PDF reports accumulate here, unbounded, so a new upload doesn't wipe
    // out ones already reviewed. An Excel upload is a single sheet instead,
    // and switches the card out of PDF mode (the two preview types can't be
    // shown together).
    let pdfReports = []; // { fileName, result }
    let excelSheet = null; // { headers, rows }
    let excelExpanded = false;

    function resetToDropzone() {
      pdfReports = [];
      excelSheet = null;
      excelExpanded = false;
      previewWrap.hidden = true;
      previewWrap.innerHTML = "";
      dropzone.hidden = false;
      status.hidden = true;
      input.value = "";
    }

    function renderPreviewActions(buttonText) {
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "preview-clear-btn";
      clearBtn.textContent = buttonText;
      clearBtn.addEventListener("click", resetToDropzone);
      previewWrap.appendChild(clearBtn);
    }

    function renderSheetWarning(message) {
      previewWrap.innerHTML = "";
      const warn = document.createElement("p");
      warn.className = "upload-status-text is-error";
      warn.textContent = message;
      previewWrap.appendChild(warn);
      renderPreviewActions("Upload another file");
      dropzone.hidden = true;
      previewWrap.hidden = false;
    }

    // Combined table across every uploaded PDF report — one shared header,
    // one row per report (RPL yields exactly one person per report), with
    // that report's own Remove button in a trailing column.
    function renderPdfReports() {
      previewWrap.innerHTML = "";

      const tableWrap = document.createElement("div");
      tableWrap.className = "preview-table-wrap";
      const table = document.createElement("table");
      table.className = "preview-table";

      // Display-only: Age is folded into the "Patient Name" cell/header
      // instead of its own column. The underlying columns/fieldKeys/values
      // arrays are untouched (still include "age" at its usual position),
      // so duplicate detection, reference comparison, and export — which
      // all read those arrays — are unaffected by this rendering choice.
      const headerColumns = columns.map((c) => (c === "Patient Name" ? "Patient Name (Age)" : c)).filter((c) => c !== "Age");

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [...headerColumns, "Notes", ""].forEach((c) => {
        const th = document.createElement("th");
        th.textContent = c;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      pdfReports.forEach((report, reportIdx) => {
        const person = report.result.people[0];
        const tr = document.createElement("tr");
        const hasGeneral = person.warnings.some((w) => w.type === "general");
        const hasDuplicate = person.warnings.some((w) => w.type === "duplicate");
        if (hasGeneral) tr.classList.add("row-error");
        else if (hasDuplicate) tr.classList.add("row-duplicate");

        const ageIdx = person.fieldKeys.indexOf("age");
        const ageVal = ageIdx !== -1 ? person.values[ageIdx] : "";
        const ageMissing = person.warnings.some((w) => w.field === "age" && w.type === "missing");

        person.values.forEach((val, i) => {
          const fieldKey = person.fieldKeys[i];
          if (fieldKey === "age") return; // folded into the "name" cell instead of its own column

          const td = document.createElement("td");
          const baseKey = fieldKey && fieldKey.includes("/") ? fieldKey.split("/")[0] : fieldKey;
          const warned =
            person.warnings.some((w) => (w.field === fieldKey || w.field === baseKey) && w.type === "missing") ||
            (fieldKey === "name" && ageMissing);
          if (warned) td.classList.add("cell-warning");
          if (fieldKey && fieldKey.includes("/")) td.classList.add("allele-cell");

          const displayVal = fieldKey === "name" && ageVal ? `${val || "—"} (${ageVal})` : val;
          td.textContent = displayVal || "—";
          tr.appendChild(td);
        });

        const notesTd = document.createElement("td");
        notesTd.className = "notes-cell";
        notesTd.textContent = person.warnings.map((w) => w.message).join(" ");
        tr.appendChild(notesTd);

        const actionTd = document.createElement("td");
        actionTd.className = "action-cell";

        if (report.result.rawLines) {
          const viewRawBtn = document.createElement("button");
          viewRawBtn.type = "button";
          viewRawBtn.className = "preview-viewraw-btn";
          viewRawBtn.textContent = "View Raw Text";
          viewRawBtn.title = "Shows the exact text the PDF reader extracted, for debugging";
          viewRawBtn.addEventListener("click", () => {
            window.prompt(
              "Raw extracted text — select all (Ctrl/Cmd+A) and copy to share for debugging:",
              report.result.rawLines
            );
          });
          actionTd.appendChild(viewRawBtn);
        }

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "preview-remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => {
          pdfReports.splice(reportIdx, 1);
          if (pdfReports.length) renderPdfReports();
          else resetToDropzone();
        });
        actionTd.appendChild(removeBtn);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      previewWrap.appendChild(tableWrap);

      // Additive: a reference comparison table per successfully-parsed
      // report, shown below the (unmodified) extraction preview above, plus
      // one "Export Results" button covering every patient uploaded so far
      // in this card's session (not just the latest upload).
      if (compareReference) {
        const patients = [];
        pdfReports.forEach((report) => {
          const person = report.result.people[0];
          const hasGeneral = person.warnings.some((w) => w.type === "general");
          if (hasGeneral) return;
          previewWrap.appendChild(
            renderReferenceComparison({ alleles: allelesFromPerson(person), name: personName(person) })
          );
          patients.push({
            name: personName(person),
            age: personAge(person),
            sampleNumber: report.result.sampleNumber || "",
            alleles: allelesFromPerson(person),
          });
        });

        if (patients.length) {
          const exportBtn = document.createElement("button");
          exportBtn.type = "button";
          exportBtn.className = "export-results-btn";
          exportBtn.textContent = "Export Results";
          exportBtn.addEventListener("click", () => downloadRplResults(patients));
          previewWrap.appendChild(exportBtn);
        }
      }

      const summary = document.createElement("p");
      summary.className = "preview-note";
      summary.textContent = `${pdfReports.length} report(s) uploaded — drag or choose more above to add.`;
      previewWrap.appendChild(summary);

      renderPreviewActions("Clear all");
      dropzone.hidden = false;
      previewWrap.hidden = false;
    }

    // Renders whatever header structure the sheet actually has. Shows up to
    // EXCEL_ROW_LIMIT rows within the scrollable card by default; "Show all
    // records" expands the same container (taller, but still height-bounded)
    // rather than growing the card unbounded.
    function renderExcelTable() {
      previewWrap.innerHTML = "";

      const tableWrap = document.createElement("div");
      tableWrap.className = "preview-table-wrap preview-table-wrap--scroll-y";
      if (excelExpanded) tableWrap.style.maxHeight = EXCEL_EXPANDED_MAX_HEIGHT;
      const table = document.createElement("table");
      table.className = "preview-table";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      excelSheet.headers.forEach((h) => {
        const th = document.createElement("th");
        th.textContent = h || "—";
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const totalRows = excelSheet.rows.length;
      const visibleRows = excelExpanded ? excelSheet.rows : excelSheet.rows.slice(0, EXCEL_ROW_LIMIT);

      const tbody = document.createElement("tbody");
      visibleRows.forEach((row) => {
        const tr = document.createElement("tr");
        excelSheet.headers.forEach((_, i) => {
          const td = document.createElement("td");
          const text = formatExcelCellValue(row[i]);
          if (/^\d{2}:\d{2}(:\d{2})?$/.test(text.trim())) td.classList.add("allele-cell");
          td.textContent = text || "—";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      previewWrap.appendChild(tableWrap);

      // Additive: a reference comparison table per currently-visible row —
      // only when the sheet actually has recognizable allele columns, so an
      // unrelated sheet doesn't get spammed with "No matches found." rows.
      // Follows the same visible-row set as the table above (respects
      // "Show all records"), so this doesn't balloon the page by default.
      // The export button below still covers every row in the sheet, not
      // just the ones currently displayed.
      if (compareReference && excelSheet.headers.some((h) => normalizeAlleleHeader(h))) {
        visibleRows.forEach((row) => {
          previewWrap.appendChild(
            renderReferenceComparison({
              alleles: allelesFromExcelRow(excelSheet.headers, row),
              name: nameFromExcelRow(excelSheet.headers, row),
            })
          );
        });

        const exportBtn = document.createElement("button");
        exportBtn.type = "button";
        exportBtn.className = "export-results-btn";
        exportBtn.textContent = "Export Results";
        exportBtn.addEventListener("click", () => {
          const patients = excelSheet.rows.map((row) => ({
            name: nameFromExcelRow(excelSheet.headers, row),
            age: ageFromExcelRow(excelSheet.headers, row),
            sampleNumber: sampleNumberFromExcelRow(excelSheet.headers, row),
            alleles: allelesFromExcelRow(excelSheet.headers, row),
          }));
          downloadRplResults(patients);
        });
        previewWrap.appendChild(exportBtn);
      }

      if (totalRows > EXCEL_ROW_LIMIT) {
        const footer = document.createElement("div");
        footer.className = "preview-pager";

        const note = document.createElement("span");
        note.className = "preview-note";
        note.textContent = excelExpanded
          ? `Showing all ${totalRows} rows`
          : `Showing ${EXCEL_ROW_LIMIT} of ${totalRows} rows`;
        footer.appendChild(note);

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "preview-show-all-btn";
        toggleBtn.textContent = excelExpanded ? "Show less" : "Show all records";
        toggleBtn.addEventListener("click", () => {
          excelExpanded = !excelExpanded;
          renderExcelTable();
        });
        footer.appendChild(toggleBtn);

        previewWrap.appendChild(footer);
      }

      renderPreviewActions("Upload another file");
      dropzone.hidden = true;
      previewWrap.hidden = false;
    }

    async function handleFiles(fileList) {
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;

      const pdfFiles = files.filter(isPdfFile);
      const excelFiles = files.filter(isExcelFile);

      if (!pdfFiles.length && !excelFiles.length) {
        status.hidden = false;
        status.className = "upload-status-text is-error";
        status.textContent = "Please upload PDF or Excel (.xlsx) files only.";
        input.value = "";
        return;
      }

      // An Excel upload replaces whatever the card is currently showing —
      // the two preview modes (combined PDF reports vs. one sheet) aren't
      // shown together.
      if (excelFiles.length) {
        const file = excelFiles[0];
        status.hidden = false;
        status.className = "upload-status-text";
        status.textContent = `Processing ${file.name}…`;

        try {
          const sheet = await parseExcelFile(file);
          pdfReports = [];
          excelExpanded = false;
          status.hidden = true;
          if (sheet.error) {
            excelSheet = null;
            renderSheetWarning(sheet.error);
          } else {
            excelSheet = sheet;
            renderExcelTable();
          }
        } catch (err) {
          status.hidden = false;
          status.className = "upload-status-text is-error";
          status.textContent = `Failed to parse "${file.name}": ${err.message}`;
        }
        input.value = "";
        return;
      }

      // PDF uploads accumulate onto whatever's already there, with no cap,
      // so reviewing a new report doesn't cost the ones already uploaded.
      excelSheet = null;

      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        status.hidden = false;
        status.className = "upload-status-text";
        status.textContent = `Processing ${file.name} (${i + 1} of ${pdfFiles.length})…`;
        try {
          const result = await parseFile(file);
          const identifier = getReportIdentifier(result);
          const isDuplicate = identifier && pdfReports.some((r) => getReportIdentifier(r.result) === identifier);
          if (isDuplicate) {
            result.people[0].warnings.push({
              field: null,
              type: "duplicate",
              message: "Duplicate: this file was already uploaded in this session (same Sample Number/Name).",
            });
          }
          pdfReports.push({ fileName: file.name, result });
        } catch (err) {
          pdfReports.push({
            fileName: file.name,
            result: {
              people: [
                {
                  values: columns.map(() => ""),
                  fieldKeys: columns.map(() => null),
                  warnings: [{ field: null, type: "general", message: `Failed to parse: ${err.message}` }],
                },
              ],
            },
          });
        }
      }

      status.hidden = true;
      renderPdfReports();
      input.value = "";
    }

    dropzone.addEventListener("click", () => input.click());
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("dropzone-active");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dropzone-active");
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("dropzone-active");
      handleFiles(event.dataTransfer.files);
    });
    input.addEventListener("change", () => {
      handleFiles(input.files);
    });

    return card;
  }

  const RPL_COLUMNS = ["Patient Name", "Gender", "Age", ...ALLELE_FIELD_KEYS];
  // Kept alongside the (currently unwired) Control parsing engine above —
  // Control-report handling is being developed separately and is out of
  // scope for this section's UI, but the columns stay defined for when it
  // returns.
  const CONTROL_COLUMNS = ["Name", "Gender", "Age", "Role", ...ALLELE_FIELD_KEYS];

  let singleAreaRendered = false;

  function renderSingleUploadArea() {
    if (singleAreaRendered) return;
    const container = document.getElementById("upload-area-container");
    container.appendChild(
      createUploadCard({
        label: "Add input file",
        columns: RPL_COLUMNS,
        parseFile: processRplPdfFile,
        compareReference: true,
      })
    );
    singleAreaRendered = true;
  }

  // ---- View switching (home tab view <-> dedicated Single page) ----

  const viewHome = document.getElementById("view-home");
  const viewSingle = document.getElementById("view-single");
  const backToSections = document.getElementById("back-to-sections");

  function showView(view) {
    [viewHome, viewSingle].forEach((candidate) => {
      candidate.hidden = candidate !== view;
    });
  }

  function goToSinglePage() {
    renderSingleUploadArea();
    showView(viewSingle);
  }

  function goToHomeView() {
    showView(viewHome);
  }

  backToSections.addEventListener("click", goToHomeView);

  // Initial render: all three landing cards, shown together.
  renderSectionGrid();
})();

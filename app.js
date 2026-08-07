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
    control: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M18 6h12"></path>
        <path d="M20 6v14l-8 16a4 4 0 0 0 4 6h16a4 4 0 0 0 4-6l-8-16V6"></path>
        <path d="M16 32h16"></path>
      </svg>
    `,
    analytics: `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 40V20"></path>
        <path d="M20 40V10"></path>
        <path d="M32 40V26"></path>
        <path d="M6 40h36"></path>
      </svg>
    `,
  };

  // ---- Landing grid: Single / Couple / KIR cards, shown together ----
  // Each entry describes one card; only Single is interactive right now, so
  // it's the only one with an onClick (and the only one shown as "active" in
  // the sidebar). Swap in real content per section later without touching
  // how the grid/sidebar are built.

  const SECTIONS = [
    {
      key: "single",
      icon: ICONS.single,
      heading: "Single Analysis",
      description: "Upload RPL and Control reports for individual HLA analysis.",
      ctaLabel: "Get Started",
      onClick: goToSinglePage,
    },
    {
      key: "couple",
      icon: ICONS.couple,
      heading: "Couple Analysis",
      description: "Compare HLA allele patterns between two individuals and their studied associations.",
      ctaLabel: "In Development",
    },
    {
      key: "kir",
      icon: ICONS.kir,
      heading: "KIR Analysis",
      description: "Analyze KIR gene patterns and their studied associations with HLA ligands.",
      ctaLabel: "In Development",
    },
  ];

  function renderSectionCard({ key, icon, heading, description, ctaLabel, onClick }) {
    const card = document.createElement("div");
    card.className = `section-card section-card--${key}${onClick ? " section-card--clickable" : ""}`;
    if (onClick) {
      card.setAttribute("role", "button");
      card.tabIndex = 0;
    }

    const tagHtml = onClick ? "" : `<span class="section-card-tag">Coming Soon</span>`;
    const ctaDisabledAttr = onClick ? "" : " disabled";
    const ctaArrow = onClick ? ` <span aria-hidden="true">&rarr;</span>` : "";
    const descriptionHtml = description ? `<p class="section-card-description">${description}</p>` : "";

    card.innerHTML = `
      ${tagHtml}
      <div class="section-card-icon-circle">
        <div class="section-card-icon">${icon}</div>
      </div>
      <h2 class="section-card-heading">${heading}</h2>
      ${descriptionHtml}
      <button type="button" class="section-card-cta" tabindex="-1"${ctaDisabledAttr}>${ctaLabel}${ctaArrow}</button>
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

  // ---- Single Analysis sub-selection grid: RPL / Non RPL Control / ----
  // Analytics, shown after clicking the "Single Analysis" card. RPL and
  // Non RPL Control are the same two upload cards that used to sit
  // side by side on one page; same renderSectionCard reused as-is, no
  // changes needed there.
  const SINGLE_SUBSECTIONS = [
    {
      key: "rpl",
      icon: ICONS.single,
      heading: "RPL",
      ctaLabel: "Get Started",
      onClick: goToRplPage,
    },
    {
      key: "control",
      icon: ICONS.control,
      heading: "Non RPL Control",
      ctaLabel: "Get Started",
      onClick: goToControlPage,
    },
    {
      key: "analytics",
      icon: ICONS.analytics,
      heading: "Analytics",
      ctaLabel: "Get Started",
      onClick: goToAnalyticsPage,
    },
  ];

  let singleSubsectionsRendered = false;

  function renderSingleSubsectionGrid() {
    if (singleSubsectionsRendered) return;
    const grid = document.getElementById("single-subsection-grid");
    SINGLE_SUBSECTIONS.forEach((section) => grid.appendChild(renderSectionCard(section)));
    singleSubsectionsRendered = true;
  }

  // ---- Sidebar navigation ----
  // Mirrors SECTIONS: Single is the only real, clickable destination; Couple
  // and KIR are shown but disabled, matching their "Coming Soon" card state
  // instead of pretending they lead somewhere.

  function renderSidebarNav() {
    const nav = document.getElementById("sidebar-nav");
    SECTIONS.forEach((section) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `sidebar-nav-item${section.onClick ? " is-active" : ""}`;
      item.innerHTML = `<span class="sidebar-nav-icon">${section.icon}</span><span>${section.heading}</span>`;
      if (section.onClick) {
        item.addEventListener("click", section.onClick);
      } else {
        item.disabled = true;
      }
      nav.appendChild(item);
    });
  }

  function renderSidebarLogo() {
    document.getElementById("sidebar-logo").innerHTML = ICONS.single;
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

  // Some PDFs split a single word across separate text runs whose
  // x-positions look adjacent, which extractLinesFromPdf() then joins with
  // a literal space — producing artifacts like "Fem ale", "D P B1", or
  // "HLA - A*". Builds a matcher with optional whitespace between every
  // character of `str` so any of these gaps, wherever they land, still match.
  function withStrayGaps(str) {
    return str
      .split("")
      .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*");
  }

  const GENDER_TOKEN_SOURCE = `\\b(${withStrayGaps("Female")}|${withStrayGaps("Male")}|F|M)\\b`;
  const GENDER_TOKEN_TEST = new RegExp(GENDER_TOKEN_SOURCE, "i");
  const GENDER_TOKEN_GLOBAL = new RegExp(GENDER_TOKEN_SOURCE, "gi");

  // Same kerning-gap tolerance, applied to an allele value token — some
  // PDFs render "24:02:01" as "24 :02:01" or similar. Normalize a matched
  // token back to its plain form (spaces stripped) before using it.
  const DIGIT_PAIR_SOURCE = "\\d\\s*\\d";
  const ALLELE_TOKEN_SOURCE = `${DIGIT_PAIR_SOURCE}\\s*:\\s*${DIGIT_PAIR_SOURCE}(?:\\s*:\\s*${DIGIT_PAIR_SOURCE})?`;
  const ALLELE_TOKEN_GLOBAL = new RegExp(ALLELE_TOKEN_SOURCE, "g");
  const normalizeAlleleToken = (raw) => raw.replace(/\s+/g, "");

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
    // accepted here too. GENDER_TOKEN_* also tolerates a stray space inside
    // the word itself (e.g. "Fem ale"), a font-kerning artifact some PDFs
    // produce.
    const genderCandidates = candidateLinesFor(
      lines,
      (l) => /gender|sex/i.test(l),
      (l) => GENDER_TOKEN_TEST.test(l)
    );
    let genderMatches = [];
    let genderSourceLine = "";
    for (const candidate of genderCandidates) {
      const candidateMatches = [...candidate.matchAll(GENDER_TOKEN_GLOBAL)].map((m) => {
        const token = m[1].replace(/\s+/g, "").toLowerCase();
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
          // name/title follows it), or a trailing "PIN : ..." patient-ID
          // field sharing the same line (e.g. "Mrs. Kalpana PIN :
          // AND23020037156") — neither belongs in the name itself.
          let segment = stripped.slice(start, end);
          const stopMatch = segment.match(/\s+(?:S\/O|D\/O|W\/O|C\/O|PIN)\b/i);
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
    const alleleWarnings = [];
    for (const locus of LOCI) {
      const key = locus.replace("HLA-", "");
      // Allow a stray space anywhere inside the label, not just around the
      // dash — some PDFs split individual letters into separate text runs
      // (e.g. "HLA - A*", or "D P B1*" for DPB1).
      const locusLineRegex = new RegExp(withStrayGaps(locus) + "\\s*\\*", "i");
      const locusCandidates = lines.filter((l) => locusLineRegex.test(l));
      if (!locusCandidates.length) {
        alleleWarnings.push({ field: key, type: "missing", message: `Could not find ${locus} row.` });
        continue;
      }

      // Prefer whichever candidate line has exactly the expected token
      // count; otherwise fall back to whichever has the most tokens.
      let tokens = [];
      let exactMatch = null;
      for (const candidate of locusCandidates) {
        const candidateTokens = [...candidate.matchAll(ALLELE_TOKEN_GLOBAL)].map((m) => normalizeAlleleToken(m[0]));
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
        alleleWarnings.push({
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

    // Some templates put every locus label on one shared header line (e.g.
    // "LOCUS HLA-A* HLA-B* HLA-C* HLA-DRB1* HLA-DQB1* HLA-DPB1*") instead of
    // repeating each locus's own label+values on its own line, with the
    // values instead sitting in separate rows below, numbered "1"/"2" (one
    // row per allele index, left-to-right in the header's column order).
    // Only worth trying when the search above found nothing at all, and
    // only for a single-patient report — there's no extra column here to
    // pick one particular patient's data out of.
    if (peopleCount === 1 && LOCUS_KEYS.every((k) => !alleles[`${k}/1`] && !alleles[`${k}/2`])) {
      const genotypeTableAlleles = extractGenotypeTableAlleles(lines);
      if (genotypeTableAlleles) {
        Object.assign(alleles, genotypeTableAlleles);
        LOCUS_KEYS.forEach((k) => {
          if (!alleles[`${k}/1`] && !alleles[`${k}/2`]) {
            warnings.push({
              field: k,
              type: "missing",
              message: `Could not find HLA-${k} in the genotype table — please verify manually.`,
            });
          }
        });
      } else {
        warnings.push(...alleleWarnings);
      }
    } else {
      warnings.push(...alleleWarnings);
    }

    return { name, gender, age, alleles, warnings };
  }

  // See the fallback note above parseRplReport's genotype-table check for
  // when this applies. `lines` is the same array extractLinesFromPdf()
  // produces; this only reads it, never parseRplReport's own state.
  function extractGenotypeTableAlleles(lines) {
    // A header line naming at least two loci — in whatever left-to-right
    // order they actually appear in — is what lets each column of the
    // value rows below be matched back to the right locus.
    let orderedLoci = [];
    for (const line of lines) {
      const positions = LOCI.map((locus) => ({
        locus,
        index: line.search(new RegExp(withStrayGaps(locus) + "\\s*\\*", "i")),
      }))
        .filter((p) => p.index !== -1)
        .sort((a, b) => a.index - b.index);
      if (positions.length >= 2) {
        orderedLoci = positions.map((p) => p.locus);
        break;
      }
    }
    if (!orderedLoci.length) return null;

    // A value row: a small leading row number, then exactly one allele
    // token per locus, in the header's column order. Only the first two
    // such rows found are used (allele 1, allele 2).
    const valueRows = [];
    for (const line of lines) {
      const rowMatch = line.match(/^\s*\d{1,2}\s+(.*)$/);
      if (!rowMatch) continue;
      const tokens = [...rowMatch[1].matchAll(ALLELE_TOKEN_GLOBAL)].map((m) => normalizeAlleleToken(m[0]));
      if (tokens.length === orderedLoci.length) valueRows.push(tokens);
      if (valueRows.length === 2) break;
    }
    if (valueRows.length < 2) return null;

    const alleles = {};
    orderedLoci.forEach((locus, colIdx) => {
      const key = locus.replace("HLA-", "");
      alleles[`${key}/1`] = valueRows[0][colIdx] || "";
      alleles[`${key}/2`] = valueRows[1][colIdx] || "";
    });
    return alleles;
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
      (l) => /gender|sex/i.test(l),
      (l) => GENDER_TOKEN_TEST.test(l)
    );
    let genderMatches = [];
    for (const candidate of genderCandidates) {
      const candidateMatches = [...candidate.matchAll(GENDER_TOKEN_GLOBAL)].map((m) => {
        const token = m[1].replace(/\s+/g, "").toLowerCase();
        return token === "f" ? "female" : token === "m" ? "male" : token;
      });
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
  // A patient carrying the same tracked allele at both copies of a locus
  // (one from each parent) is counted once, not twice, but that's now
  // recorded as `homozygous: true` on the single match rather than simply
  // discarded — Analytics' patient list needs it for the "×2" badge.
  function compareToReference(patientAlleles, referenceData) {
    const occurrences = new Map(); // key -> count (1 or 2)

    LOCUS_KEYS.forEach((locus) => {
      [1, 2].forEach((n) => {
        const raw = patientAlleles[`${locus}/${n}`];
        if (!raw) return;

        // Reference data is keyed at 2-field resolution (e.g. "12:02"), so
        // a third field on the patient's value (e.g. "12:02:01") is
        // dropped before matching.
        const twoField = raw.split(":").slice(0, 2).join(":");
        const key = `${locus}*${twoField}`;
        if (!referenceData.alleles[key]) return;

        occurrences.set(key, (occurrences.get(key) || 0) + 1);
      });
    });

    const matches = [];
    occurrences.forEach((count, key) => {
      const entry = referenceData.alleles[key];
      matches.push({
        allele: key,
        classification: entry.classification,
        referenceFrequency: entry.frequency,
        homozygous: count === 2,
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

  // Some sheets store the full allele designation in the cell — e.g.
  // "DQB1*02:01:01" instead of a bare "02:01:01" — with the locus symbol
  // already baked in. compareToReference() builds its own lookup key as
  // "<locus>*<fields>" from the column's locus, so a value that already
  // carries a locus prefix would double up into something like
  // "DQB1*DQB1*02:01" and never match anything. Strip it here so the
  // stored value is always just the bare field numbers, regardless of
  // which convention the source sheet used.
  function stripAllelePrefix(raw) {
    return String(raw || "").trim().replace(/^(?:HLA-)?[A-Za-z0-9]+\*/, "");
  }

  function allelesFromExcelRow(headers, row) {
    const alleles = {};
    headers.forEach((header, i) => {
      const key = normalizeAlleleHeader(header);
      if (key) alleles[key] = stripAllelePrefix(formatExcelCellValue(row[i]));
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

  // One combined table across every patient — a "Patient / Sample ID"
  // column identifies each row's patient (repeated for each of their
  // matched alleles) instead of a separate table per patient.
  function renderResultsTable(patients) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "preview-table-wrap";
    const table = document.createElement("table");
    table.className = "preview-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Patient Name", "Age", "Allele", "Classification", "Reference Frequency"].forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    patients.forEach((patient) => {
      const nameLabel = patient.name || patient.sampleNumber || "—";
      const ageLabel = patient.age || "—";
      const matches = compareToReference(patient.alleles, RPL_REFERENCE_DATA);

      if (!matches.length) {
        const tr = document.createElement("tr");
        const nameTd = document.createElement("td");
        nameTd.textContent = nameLabel;
        tr.appendChild(nameTd);
        const ageTd = document.createElement("td");
        ageTd.textContent = ageLabel;
        tr.appendChild(ageTd);
        const td = document.createElement("td");
        td.colSpan = 3;
        td.className = "notes-cell";
        td.textContent = "No matches found.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      matches.forEach((match, matchIdx) => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.textContent = matchIdx === 0 ? nameLabel : "";
        tr.appendChild(nameTd);

        const ageTd = document.createElement("td");
        ageTd.textContent = matchIdx === 0 ? ageLabel : "";
        tr.appendChild(ageTd);

        const alleleTd = document.createElement("td");
        alleleTd.className = "allele-cell";
        alleleTd.textContent = match.allele;
        if (match.homozygous) {
          const homoBadge = document.createElement("span");
          homoBadge.className = "homozygous-badge";
          homoBadge.textContent = "×2";
          homoBadge.title = "Homozygous — same allele inherited from both parents";
          alleleTd.appendChild(homoBadge);
        }
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
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    return tableWrap;
  }

  // For cards with no reference dataset to compare against (Control
  // reports) — one row per person (e.g. Patient + Donor), rendered plainly
  // using that card's own `columns`/values/fieldKeys, one-to-one.
  function renderExtractionTable(columns, people) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "preview-table-wrap";
    const table = document.createElement("table");
    table.className = "preview-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    people.forEach((person) => {
      const tr = document.createElement("tr");
      person.values.forEach((val, i) => {
        const td = document.createElement("td");
        const fieldKey = person.fieldKeys[i];
        if (fieldKey && fieldKey.includes("/")) td.classList.add("allele-cell");
        td.textContent = val || "—";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    return tableWrap;
  }

  // ---- RPL_Results.xlsx export (additive — a brand-new, standalone
  // workbook built and downloaded entirely client-side via the SheetJS
  // APIs already used for the Excel-upload path; never touches whatever
  // workbook a user may have connected elsewhere, since there's no
  // connected-workbook concept in this app at all) ----

  const RPL_RESULTS_HEADERS = ["Patient Name", "Age", "Allele", "Classification", "Frequency"];

  // Marks a homozygous match's Allele cell (e.g. "DQB1*02:01 (x2)") so that
  // signal survives being written to a file and later read back by
  // Analytics — compareToReference() only exposes it in-memory otherwise.
  const HOMOZYGOUS_SUFFIX = " (x2)";
  const HOMOZYGOUS_SUFFIX_REGEX = / \(x2\)$/i;

  // patients: array of { name, age, sampleNumber, alleles } — sampleNumber
  // isn't included in the export output, only name/age/alleles are. One row
  // per matched allele; a patient with no matches still gets one row with
  // "-" placeholders. Name/Age are only written on that patient's first
  // row — repeating them on every subsequent allele row for the same
  // patient is just noise once you're scanning down the sheet.
  function buildRplResultsRows(patients) {
    const rows = [];
    patients.forEach((patient) => {
      const matches = compareToReference(patient.alleles, RPL_REFERENCE_DATA);
      if (!matches.length) {
        rows.push([patient.name || "", patient.age || "", "-", "-", "-"]);
        return;
      }
      matches.forEach((match, matchIdx) => {
        rows.push([
          matchIdx === 0 ? patient.name || "" : "",
          matchIdx === 0 ? patient.age || "" : "",
          match.homozygous ? `${match.allele}${HOMOZYGOUS_SUFFIX}` : match.allele,
          classificationLabel(match.classification),
          `${(match.referenceFrequency * 100).toFixed(2)}%`,
        ]);
      });
    });
    return rows;
  }

  function downloadRplResults(patients, fileName = "RPL_Results.xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([RPL_RESULTS_HEADERS, ...buildRplResultsRows(patients)]);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, fileName);
  }

  // A page can't silently write back into a file already saved on disk —
  // the closest a static page can get to "add this batch to my existing
  // sheet" is: read the file the user picks, keep its data rows as-is
  // (whatever it already had), and download one combined file with this
  // batch's new rows appended after them. The user still has to save that
  // over the original themselves.
  async function mergeAndDownloadRplResults(patients, existingFile, fileName = "RPL_Results.xlsx") {
    const buf = await existingFile.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames.includes("Results") ? "Results" : wb.SheetNames[0];
    const existingRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const existingDataRows = existingRows.slice(1); // drop the existing header row
    const combinedRows = [...existingDataRows, ...buildRplResultsRows(patients)];

    const wbOut = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([RPL_RESULTS_HEADERS, ...combinedRows]);
    XLSX.utils.book_append_sheet(wbOut, ws, "Results");
    XLSX.writeFile(wbOut, fileName);
  }

  // Only one export dropdown can be open at a time across the whole page,
  // so a single shared listener (registered once, ever) closes whichever
  // one is currently open on an outside click — re-rendering a card's
  // export menu shouldn't pile up a fresh document-level listener each time.
  let activeExportMenu = null;
  document.addEventListener("click", (event) => {
    if (activeExportMenu && !activeExportMenu.wrap.contains(event.target)) {
      activeExportMenu.menu.hidden = true;
    }
  });

  function renderExportMenu(patients, fileName = "RPL_Results.xlsx") {
    const wrap = document.createElement("div");
    wrap.className = "export-menu";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "export-results-btn export-menu-toggle";
    toggleBtn.innerHTML = `Export All <span aria-hidden="true">&#9662;</span>`;
    wrap.appendChild(toggleBtn);

    const menu = document.createElement("div");
    menu.className = "export-menu-list";
    menu.hidden = true;
    wrap.appendChild(menu);

    const newFileBtn = document.createElement("button");
    newFileBtn.type = "button";
    newFileBtn.className = "export-menu-item";
    newFileBtn.textContent = "Start a new file";
    newFileBtn.addEventListener("click", () => {
      menu.hidden = true;
      downloadRplResults(patients, fileName);
    });
    menu.appendChild(newFileBtn);

    const mergeInput = document.createElement("input");
    mergeInput.type = "file";
    mergeInput.accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx";
    mergeInput.hidden = true;
    mergeInput.addEventListener("change", async () => {
      const file = mergeInput.files[0];
      mergeInput.value = "";
      if (!file) return;
      try {
        await mergeAndDownloadRplResults(patients, file, fileName);
      } catch (err) {
        window.alert(`Could not read "${file.name}" as an Excel file: ${err.message}`);
      }
    });
    wrap.appendChild(mergeInput);

    const mergeBtn = document.createElement("button");
    mergeBtn.type = "button";
    mergeBtn.className = "export-menu-item";
    mergeBtn.textContent = "Add to an existing file…";
    mergeBtn.addEventListener("click", () => {
      menu.hidden = true;
      mergeInput.click();
    });
    menu.appendChild(mergeBtn);

    toggleBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      activeExportMenu = menu.hidden ? null : { wrap, menu };
    });

    return wrap;
  }

  // ---- Analytics: per-patient risk/protective classification, built from
  // already-exported RPL_Results.xlsx / Control_Results.xlsx sheets (not
  // from raw PDF/Excel lab reports) — reads the same 5 reference alleles
  // RPL_REFERENCE_DATA already classifies (2 high_risk, 3 protective) back
  // out of that export's one-row-per-allele layout. ----

  const RISK_ALLELES = ["C*12:02", "DQB1*02:01"];
  const PROTECTIVE_ALLELES = ["C*07:02", "DQB1*02:02", "DQB1*06:03"];

  // alleles: this patient's exported rows, as { allele, homozygous }
  // entries — already matched/deduped by compareToReference when the
  // sheet was first built, no re-matching happens here.
  function classifyPatient(alleles) {
    const carried = alleles.map((a) => a.allele);
    const risk = RISK_ALLELES.filter((a) => carried.includes(a));
    const protective = PROTECTIVE_ALLELES.filter((a) => carried.includes(a));

    if (!risk.length && !protective.length) return { category: "none", subKey: null };
    if (risk.length && !protective.length) return { category: "risk", subKey: risk.join(" + ") };
    if (!risk.length && protective.length) return { category: "protective", subKey: protective.join(" + ") };
    return { category: "mixed", subKey: [...risk, ...protective].join(" + ") };
  }

  // Reads back an already-exported results sheet (same "Results" sheet,
  // same RPL_RESULTS_HEADERS shape) and reconstructs each patient's allele
  // set from its one-row-per-allele layout: a row with a Patient Name
  // starts a new patient; blank-name rows belong to the most recent one. A
  // patient whose only row is the "-" no-match placeholder gets an empty
  // allele list (classifies as "None"). A trailing "(x2)" marks a
  // homozygous match (see HOMOZYGOUS_SUFFIX) and is stripped back off into
  // its own flag rather than left in the allele string.
  async function parseExportedResultsSheet(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames.includes("Results") ? "Results" : wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }).slice(1);

    const patients = [];
    rows.forEach((row) => {
      const name = row && row[0];
      if (name) patients.push({ name: String(name), age: (row[1] || "").toString(), alleles: [] });
      if (!patients.length) return; // malformed sheet — no patient yet to attach this row to
      const rawAllele = row[2];
      if (!rawAllele || rawAllele === "-") return;
      const alleleText = String(rawAllele);
      const homozygous = HOMOZYGOUS_SUFFIX_REGEX.test(alleleText);
      const allele = alleleText.replace(HOMOZYGOUS_SUFFIX_REGEX, "");
      patients[patients.length - 1].alleles.push({ allele, homozygous });
    });
    return patients;
  }

  const ANALYTICS_CATEGORIES = [
    { key: "none", label: "None" },
    { key: "risk", label: "Risk only" },
    { key: "protective", label: "Protective only" },
    { key: "mixed", label: "Mixed" },
  ];

  // Builds the top-level None/Risk/Protective/Mixed counts, a breakdown by
  // the specific allele combination observed for the three categories
  // that have one (only combinations that actually occurred, not every
  // theoretically possible one), and a deterministic lookup from each
  // bucket back to the actual patient records in it — a simple array
  // build-up during the same tally pass, not a separate search — so the
  // patient-list click-through never has to recompute anything.
  function buildAnalyticsAggregates(rplPatients, controlPatients) {
    const counts = {};
    const patientsByCategory = {};
    ANALYTICS_CATEGORIES.forEach((c) => {
      counts[c.key] = { rpl: 0, control: 0 };
      patientsByCategory[c.key] = { rpl: [], control: [] };
    });
    const subBreakdowns = { risk: {}, protective: {}, mixed: {} };
    const patientsBySubKey = { risk: {}, protective: {}, mixed: {} };

    const tally = (patients, side) => {
      (patients || []).forEach((patient) => {
        const { category, subKey } = classifyPatient(patient.alleles);
        counts[category][side] += 1;
        patientsByCategory[category][side].push(patient);
        if (subKey) {
          if (!subBreakdowns[category][subKey]) subBreakdowns[category][subKey] = { rpl: 0, control: 0 };
          if (!patientsBySubKey[category][subKey]) patientsBySubKey[category][subKey] = { rpl: [], control: [] };
          subBreakdowns[category][subKey][side] += 1;
          patientsBySubKey[category][subKey][side].push(patient);
        }
      });
    };
    tally(rplPatients, "rpl");
    tally(controlPatients, "control");

    return { counts, subBreakdowns, patientsByCategory, patientsBySubKey };
  }

  // ---- Analytics: plain-language statistical summary ----

  // Standard normal CDF via the Abramowitz–Stegun erf approximation (no
  // stats library is loaded) — used for both the two-proportion z-test's
  // p-value and its post-hoc power estimate below.
  function normalCDF(z) {
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * x);
    const y =
      1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
  }

  const Z_ALPHA_TWO_TAILED = 1.959963985; // two-tailed critical value at alpha = 0.05

  // Two-proportion z-test comparing carrier rate x1/n1 (RPL) against
  // x2/n2 (Control), plus a post-hoc power estimate for detecting the
  // observed effect size at alpha = 0.05 (two-tailed). Null fields mean
  // there's nothing to compare (an empty group).
  function twoProportionTest(x1, n1, x2, n2) {
    if (!n1 || !n2) return { pValue: null, power: null };
    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pooled = (x1 + x2) / (n1 + n2);
    const seNull = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
    if (seNull === 0) return { pValue: 1, power: 0 };

    const z = (p1 - p2) / seNull;
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));

    const seAlt = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const effect = Math.abs(p1 - p2);
    const power = seAlt > 0 ? normalCDF(effect / seAlt - (Z_ALPHA_TWO_TAILED * seNull) / seAlt) : 0;

    return { pValue, power };
  }

  // Per-allele carrier-rate comparison across all 5 tracked alleles — a
  // patient "carries" an allele if it appears anywhere in their list,
  // homozygous or not (zygosity doesn't change whether they carry it).
  function computeAlleleCarrierStats(rplPatients, controlPatients) {
    const rplList = rplPatients || [];
    const controlList = controlPatients || [];
    const rplTotal = rplList.length;
    const controlTotal = controlList.length;

    return [...RISK_ALLELES, ...PROTECTIVE_ALLELES].map((allele) => {
      const rplCarriers = rplList.filter((p) => p.alleles.some((a) => a.allele === allele)).length;
      const controlCarriers = controlList.filter((p) => p.alleles.some((a) => a.allele === allele)).length;
      const { pValue, power } = twoProportionTest(rplCarriers, rplTotal, controlCarriers, controlTotal);
      return { allele, rplCarriers, rplTotal, controlCarriers, controlTotal, pValue, power };
    });
  }

  // Everything generateSummary() needs, computed once from the same
  // patient lists/aggregates the chart already has — no re-parsing.
  function computeAnalyticsSummaryData(rplPatients, controlPatients, aggregates) {
    const rplTotal = (rplPatients || []).length;
    const controlTotal = (controlPatients || []).length;

    const alleleStats = computeAlleleCarrierStats(rplPatients, controlPatients);

    let categoryGap = null;
    ANALYTICS_CATEGORIES.forEach((c) => {
      const propRpl = rplTotal ? aggregates.counts[c.key].rpl / rplTotal : 0;
      const propControl = controlTotal ? aggregates.counts[c.key].control / controlTotal : 0;
      const gap = Math.abs(propRpl - propControl);
      if (!categoryGap || gap > categoryGap.gap) categoryGap = { key: c.key, label: c.label, propRpl, propControl, gap };
    });
    if (categoryGap && categoryGap.gap === 0) categoryGap = null; // nothing worth reporting if every group matches exactly

    let topMixedCombo = null;
    Object.entries(aggregates.subBreakdowns.mixed || {}).forEach(([subKey, values]) => {
      const total = values.rpl + values.control;
      if (!topMixedCombo || total > topMixedCombo.count) topMixedCombo = { subKey, count: total };
    });

    const homozygousCount = [...(rplPatients || []), ...(controlPatients || [])].filter((p) =>
      p.alleles.some((a) => a.homozygous)
    ).length;

    return { alleleStats, categoryGap, topMixedCombo, homozygousCount, rplTotal, controlTotal };
  }

  // Pure function: computed stats in, one plain-language paragraph out —
  // no DOM access, so it's independently testable.
  function generateSummary(data) {
    const sentences = [];

    const significant = data.alleleStats.filter((s) => s.pValue !== null && s.pValue < 0.05);
    if (significant.length) {
      const parts = significant.map((s) => `${s.allele} (p = ${s.pValue.toFixed(3)})`);
      sentences.push(
        `${significant.length === 1 ? "One allele shows" : `${significant.length} alleles show`} a statistically significant difference in carrier rate between RPL and Control (p < 0.05): ${parts.join(", ")}.`
      );
    } else {
      sentences.push(
        "No allele showed a statistically significant difference in carrier rate between RPL and Control (p < 0.05) with the current sample."
      );
    }

    const underpowered = data.alleleStats.filter((s) => s.power !== null && s.power < 0.8);
    if (underpowered.length) {
      sentences.push(
        `${underpowered.map((s) => s.allele).join(", ")} ${underpowered.length === 1 ? "is" : "are"} below 80% statistical power given the current sample size, so ${underpowered.length === 1 ? "that result" : "these results"} should be treated as preliminary.`
      );
    }

    if (data.categoryGap) {
      const g = data.categoryGap;
      sentences.push(
        `"${g.label}" shows the largest proportional gap between groups: ${(g.propRpl * 100).toFixed(1)}% of RPL patients vs. ${(g.propControl * 100).toFixed(1)}% of Control patients.`
      );
    }

    if (data.topMixedCombo) {
      sentences.push(
        `Within the Mixed category, the most common specific combination is ${data.topMixedCombo.subKey} (${data.topMixedCombo.count} patient(s)).`
      );
    }

    sentences.push(
      data.homozygousCount > 0
        ? `${data.homozygousCount} patient(s) carry a homozygous copy of a tracked allele (the same allele inherited from both parents).`
        : "No patients carry a homozygous copy of a tracked allele."
    );

    return sentences.join(" ");
  }

  // ---- Analytics chart (plain SVG, no charting library) ----

  const ANALYTICS_COLORS = { rpl: "#D4537E", control: "#1D9E75" };

  // entries: [{ key, label, rpl, control }]. Height scales proportionally
  // to the largest value in THIS chart (main view and a drill-down each
  // scale independently), with the count printed above each bar. Every
  // entry gets an invisible full-column hit target over both its bars —
  // when onBarClick is given, clicking anywhere in a category's column
  // triggers it, not just the bars themselves; what that click actually
  // does (drill down vs. show a patient list) is the caller's decision.
  function renderGroupedBarChart(entries, { onBarClick } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const barWidth = 34;
    const barGap = 6;
    const groupGap = 46;
    const groupWidth = barWidth * 2 + barGap;
    const marginLeft = 30;
    const marginRight = 20;
    const marginTop = 30;
    const chartHeight = 200;
    const labelLineHeight = 14;

    // Combination labels (e.g. "C*12:02 + DQB1*02:01") are split at " + "
    // into one allele per line — stacked horizontally underneath the bars
    // instead of rotated, so nothing runs off the edge of the chart and
    // every allele stays readable in a straight line.
    const labelLines = entries.map((e) => e.label.split(" + "));
    const maxLines = Math.max(1, ...labelLines.map((lines) => lines.length));
    const marginBottom = 24 + maxLines * labelLineHeight;

    const maxValue = Math.max(1, ...entries.flatMap((e) => [e.rpl, e.control]));
    const width = marginLeft + marginRight + entries.length * groupWidth + Math.max(0, entries.length - 1) * groupGap;
    const height = marginTop + chartHeight + marginBottom;

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "analytics-chart-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Bar chart of patient counts by category, RPL vs Control");

    const baseline = document.createElementNS(svgNS, "line");
    baseline.setAttribute("x1", marginLeft - 10);
    baseline.setAttribute("x2", width - marginRight);
    baseline.setAttribute("y1", marginTop + chartHeight);
    baseline.setAttribute("y2", marginTop + chartHeight);
    baseline.setAttribute("class", "analytics-chart-baseline");
    svg.appendChild(baseline);

    entries.forEach((entry, i) => {
      const groupX = marginLeft + i * (groupWidth + groupGap);
      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("class", `analytics-bar-group${onBarClick ? " analytics-bar-group--clickable" : ""}`);

      [
        { value: entry.rpl, x: groupX, color: ANALYTICS_COLORS.rpl },
        { value: entry.control, x: groupX + barWidth + barGap, color: ANALYTICS_COLORS.control },
      ].forEach(({ value, x, color }) => {
        const barHeight = (value / maxValue) * chartHeight;
        const y = marginTop + chartHeight - barHeight;

        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", Math.max(barHeight, value > 0 ? 2 : 0));
        rect.setAttribute("fill", color);
        rect.setAttribute("rx", 3);
        group.appendChild(rect);

        const countLabel = document.createElementNS(svgNS, "text");
        countLabel.setAttribute("x", x + barWidth / 2);
        countLabel.setAttribute("y", y - 6);
        countLabel.setAttribute("text-anchor", "middle");
        countLabel.setAttribute("class", "analytics-chart-count");
        countLabel.textContent = String(value);
        group.appendChild(countLabel);
      });

      const labelX = groupX + groupWidth / 2;
      labelLines[i].forEach((line, lineIdx) => {
        const lineLabel = document.createElementNS(svgNS, "text");
        lineLabel.setAttribute("x", labelX);
        lineLabel.setAttribute("y", marginTop + chartHeight + 20 + lineIdx * labelLineHeight);
        lineLabel.setAttribute("text-anchor", "middle");
        lineLabel.setAttribute("class", "analytics-chart-label");
        lineLabel.textContent = lineIdx === 0 ? line : `+ ${line}`;
        group.appendChild(lineLabel);
      });

      if (onBarClick) {
        const hit = document.createElementNS(svgNS, "rect");
        hit.setAttribute("x", groupX - groupGap / 2);
        hit.setAttribute("y", 0);
        hit.setAttribute("width", groupWidth + groupGap);
        hit.setAttribute("height", height);
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "analytics-bar-hit");
        hit.addEventListener("click", () => onBarClick(entry.key));
        group.appendChild(hit);
      }

      svg.appendChild(group);
    });

    return svg;
  }

  function renderAnalyticsLegend() {
    const legend = document.createElement("div");
    legend.className = "analytics-chart-legend";
    [
      { label: "RPL", color: ANALYTICS_COLORS.rpl },
      { label: "Control", color: ANALYTICS_COLORS.control },
    ].forEach(({ label, color }) => {
      const item = document.createElement("span");
      item.className = "analytics-legend-item";
      item.innerHTML = `<span class="analytics-legend-swatch" style="background:${color}"></span>${label}`;
      legend.appendChild(item);
    });
    return legend;
  }

  // Same visual language as renderGroupedBarChart (colors/labels/fonts
  // untouched — same CSS classes) but a single series instead of a
  // grouped pair, for the per-column (RPL-only or Control-only) charts in
  // the two-column breakdown region.
  function renderSingleSeriesBarChart(entries, color, { onBarClick } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const barWidth = 34;
    const groupGap = 30;
    const marginLeft = 26;
    const marginRight = 16;
    const marginTop = 26;
    const chartHeight = 140;
    const labelLineHeight = 14;

    const labelLines = entries.map((e) => e.label.split(" + "));
    const maxLines = Math.max(1, ...labelLines.map((lines) => lines.length));
    const marginBottom = 24 + maxLines * labelLineHeight;

    const maxValue = Math.max(1, ...entries.map((e) => e.value));
    const width = marginLeft + marginRight + entries.length * barWidth + Math.max(0, entries.length - 1) * groupGap;
    const height = marginTop + chartHeight + marginBottom;

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "analytics-chart-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Bar chart of patient counts by allele combination");

    const baseline = document.createElementNS(svgNS, "line");
    baseline.setAttribute("x1", marginLeft - 8);
    baseline.setAttribute("x2", width - marginRight);
    baseline.setAttribute("y1", marginTop + chartHeight);
    baseline.setAttribute("y2", marginTop + chartHeight);
    baseline.setAttribute("class", "analytics-chart-baseline");
    svg.appendChild(baseline);

    entries.forEach((entry, i) => {
      const x = marginLeft + i * (barWidth + groupGap);
      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("class", `analytics-bar-group${onBarClick ? " analytics-bar-group--clickable" : ""}`);

      const barHeight = (entry.value / maxValue) * chartHeight;
      const y = marginTop + chartHeight - barHeight;

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", Math.max(barHeight, entry.value > 0 ? 2 : 0));
      rect.setAttribute("fill", color);
      rect.setAttribute("rx", 3);
      group.appendChild(rect);

      const countLabel = document.createElementNS(svgNS, "text");
      countLabel.setAttribute("x", x + barWidth / 2);
      countLabel.setAttribute("y", y - 6);
      countLabel.setAttribute("text-anchor", "middle");
      countLabel.setAttribute("class", "analytics-chart-count");
      countLabel.textContent = String(entry.value);
      group.appendChild(countLabel);

      const labelX = x + barWidth / 2;
      labelLines[i].forEach((line, lineIdx) => {
        const lineLabel = document.createElementNS(svgNS, "text");
        lineLabel.setAttribute("x", labelX);
        lineLabel.setAttribute("y", marginTop + chartHeight + 20 + lineIdx * labelLineHeight);
        lineLabel.setAttribute("text-anchor", "middle");
        lineLabel.setAttribute("class", "analytics-chart-label");
        lineLabel.textContent = lineIdx === 0 ? line : `+ ${line}`;
        group.appendChild(lineLabel);
      });

      if (onBarClick) {
        const hit = document.createElementNS(svgNS, "rect");
        hit.setAttribute("x", x - groupGap / 2);
        hit.setAttribute("y", 0);
        hit.setAttribute("width", barWidth + groupGap);
        hit.setAttribute("height", height);
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "analytics-bar-hit");
        hit.addEventListener("click", () => onBarClick(entry.key));
        group.appendChild(hit);
      }

      svg.appendChild(group);
    });

    return svg;
  }

  // The patient list for one column (one side) — same row markup/classes
  // as before, just without the panel header/close button, since the
  // whole two-column region already has one Back control. Scrolls inside
  // its own fixed-height container instead of growing the page.
  function renderPatientListForSide(patients) {
    const wrap = document.createElement("div");
    wrap.className = "analytics-breakdown-patient-list-wrap";

    if (!patients.length) {
      const empty = document.createElement("p");
      empty.className = "analytics-patient-list-empty";
      empty.textContent = "No patients in this category.";
      wrap.appendChild(empty);
      return wrap;
    }

    const count = document.createElement("p");
    count.className = "analytics-patient-list-side-heading";
    count.textContent = `${patients.length} patient(s)`;
    wrap.appendChild(count);

    const list = document.createElement("ul");
    list.className = "analytics-patient-list";
    patients.forEach((patient) => {
      const item = document.createElement("li");
      item.className = "analytics-patient-list-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "analytics-patient-list-name";
      nameSpan.textContent = patient.age ? `${patient.name} (${patient.age})` : patient.name;
      item.appendChild(nameSpan);

      const alleleWrap = document.createElement("span");
      alleleWrap.className = "analytics-patient-list-alleles";
      if (!patient.alleles.length) {
        alleleWrap.textContent = "No tracked alleles";
      } else {
        patient.alleles.forEach((a) => {
          const tag = document.createElement("span");
          tag.className = "analytics-allele-tag";
          tag.textContent = a.allele;
          if (a.homozygous) {
            const homoBadge = document.createElement("span");
            homoBadge.className = "homozygous-badge";
            homoBadge.textContent = "×2";
            homoBadge.title = "Homozygous — same allele inherited from both parents";
            tag.appendChild(homoBadge);
          }
          alleleWrap.appendChild(tag);
        });
      }
      item.appendChild(alleleWrap);

      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderAnalyticsSummaryPanel(summaryText) {
    const panel = document.createElement("div");
    panel.className = "analytics-summary-panel";

    const header = document.createElement("div");
    header.className = "analytics-summary-panel-header";
    const title = document.createElement("h4");
    title.className = "analytics-summary-panel-title";
    title.textContent = "Summary";
    header.appendChild(title);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "analytics-panel-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close summary");
    closeBtn.addEventListener("click", () => panel.remove());
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const text = document.createElement("p");
    text.className = "analytics-summary-text";
    text.textContent = summaryText;
    panel.appendChild(text);

    return panel;
  }

  // Layout: [legend + View Summary toggle] -> [main 4-category chart,
  // always visible] -> [two-column breakdown region, hidden until a
  // category is clicked]. Clicking a category never tears down or
  // replaces the main chart above it — it only opens/updates the region
  // below it, so there's no scrolling to reach it and no scroll position
  // to restore on Back. Each column is independently RPL-only or
  // Control-only: its own single-series sub-chart (if the category has a
  // breakdown — "None" doesn't) feeding its own patient list, which
  // starts showing every patient in the category and narrows to one
  // specific combination when you click a bar in that column's own chart.
  function renderAnalyticsChart(container, aggregates, summaryText) {
    container.hidden = false;
    container.innerHTML = "";

    const headerRow = document.createElement("div");
    headerRow.className = "analytics-chart-header-row";
    headerRow.appendChild(renderAnalyticsLegend());
    container.appendChild(headerRow);

    if (summaryText) {
      const summaryRow = document.createElement("div");
      summaryRow.className = "analytics-summary-row";
      const summaryBtn = document.createElement("button");
      summaryBtn.type = "button";
      summaryBtn.className = "analytics-summary-btn";
      summaryBtn.textContent = "View Summary";
      summaryBtn.addEventListener("click", () => {
        const existing = container.querySelector(".analytics-summary-panel");
        if (existing) {
          existing.remove();
          return;
        }
        summaryRow.after(renderAnalyticsSummaryPanel(summaryText));
      });
      summaryRow.appendChild(summaryBtn);
      container.appendChild(summaryRow);
    }

    const mainChartWrap = document.createElement("div");
    mainChartWrap.className = "analytics-main-chart-wrap";
    container.appendChild(mainChartWrap);

    const breakdownRegion = document.createElement("div");
    breakdownRegion.className = "analytics-breakdown-region";
    breakdownRegion.hidden = true;
    container.appendChild(breakdownRegion);

    function closeBreakdown() {
      breakdownRegion.hidden = true;
      breakdownRegion.innerHTML = "";
    }

    function openBreakdown(categoryKey) {
      breakdownRegion.innerHTML = "";
      breakdownRegion.hidden = false;

      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "analytics-back-btn";
      backBtn.innerHTML = `<span aria-hidden="true">&larr;</span> Back`;
      backBtn.addEventListener("click", closeBreakdown);
      breakdownRegion.appendChild(backBtn);

      const categoryLabel = ANALYTICS_CATEGORIES.find((c) => c.key === categoryKey).label;
      const title = document.createElement("h4");
      title.className = "analytics-drilldown-title";
      title.textContent = categoryLabel;
      breakdownRegion.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "analytics-breakdown-grid";

      [
        { side: "rpl", label: "RPL", color: ANALYTICS_COLORS.rpl },
        { side: "control", label: "Control", color: ANALYTICS_COLORS.control },
      ].forEach(({ side, label, color }) => {
        const column = document.createElement("div");
        column.className = "analytics-breakdown-column";

        const heading = document.createElement("p");
        heading.className = "analytics-breakdown-column-heading analytics-legend-item";
        heading.innerHTML = `<span class="analytics-legend-swatch" style="background:${color}"></span>${label}`;
        column.appendChild(heading);

        const subEntries = Object.entries(aggregates.subBreakdowns[categoryKey] || {})
          .map(([subKey, values]) => ({ key: subKey, label: subKey, value: values[side] }))
          .filter((e) => e.value > 0)
          .sort((a, b) => b.value - a.value);

        const listSlot = document.createElement("div");

        const showList = (patients) => {
          listSlot.innerHTML = "";
          listSlot.appendChild(renderPatientListForSide(patients));
        };

        if (subEntries.length) {
          column.appendChild(
            renderSingleSeriesBarChart(subEntries, color, {
              onBarClick: (subKey) => {
                showList((aggregates.patientsBySubKey[categoryKey][subKey] || {})[side] || []);
              },
            })
          );
        }

        column.appendChild(listSlot);
        showList((aggregates.patientsByCategory[categoryKey] || {})[side] || []);

        grid.appendChild(column);
      });

      breakdownRegion.appendChild(grid);
    }

    const entries = ANALYTICS_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      rpl: aggregates.counts[c.key].rpl,
      control: aggregates.counts[c.key].control,
    }));
    mainChartWrap.appendChild(renderGroupedBarChart(entries, { onBarClick: openBreakdown }));
  }

  // ---- Analytics upload cards (lighter than createUploadCard — this
  // just reads an already-exported results sheet back in, once, with no
  // reference comparison or multi-report accumulation to manage) ----

  function createAnalyticsUploadCard({ label, onLoaded }) {
    const card = document.createElement("div");
    card.className = "upload-card input-panel";

    const title = document.createElement("h3");
    title.className = "upload-card-title";
    title.textContent = label;
    card.appendChild(title);

    const dropzone = document.createElement("div");
    dropzone.className = "dropzone";
    dropzone.tabIndex = 0;
    dropzone.setAttribute("role", "button");
    dropzone.setAttribute("aria-label", `Upload ${label}`);
    dropzone.innerHTML = `
      <div class="dropzone-icon">${DROPZONE_ICON}</div>
      <p class="dropzone-text">Choose file or drag it here</p>
    `;
    card.appendChild(dropzone);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx";
    input.className = "dropzone-input";
    card.appendChild(input);

    const status = document.createElement("p");
    status.className = "upload-status-text";
    status.hidden = true;
    card.appendChild(status);

    async function handleFile(file) {
      if (!file) return;
      if (!isExcelFile(file)) {
        status.hidden = false;
        status.className = "upload-status-text is-error";
        status.textContent = "Please upload an Excel (.xlsx) results sheet.";
        return;
      }
      status.hidden = false;
      status.className = "upload-status-text";
      status.textContent = `Reading ${file.name}…`;
      try {
        const patients = await parseExportedResultsSheet(file);
        status.className = "upload-status-text is-success";
        status.textContent = `Loaded ${patients.length} patient(s) from ${file.name}`;
        onLoaded(patients);
      } catch (err) {
        status.className = "upload-status-text is-error";
        status.textContent = `Could not read "${file.name}": ${err.message}`;
        onLoaded(null);
      }
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
      handleFile(event.dataTransfer.files[0]);
    });
    input.addEventListener("change", () => {
      handleFile(input.files[0]);
      input.value = "";
    });

    return card;
  }

  let analyticsAreaRendered = false;
  const analyticsData = { rpl: null, control: null };

  function renderAnalyticsArea() {
    if (analyticsAreaRendered) return;

    const viewBtn = document.getElementById("view-analytics-btn");
    const chartContainer = document.getElementById("analytics-chart-container");

    const updateViewBtnState = () => {
      viewBtn.disabled = !analyticsData.rpl && !analyticsData.control;
    };

    const rplCard = createAnalyticsUploadCard({
      label: "Add RPL Results Sheet",
      onLoaded: (patients) => {
        analyticsData.rpl = patients;
        updateViewBtnState();
      },
    });
    const controlCard = createAnalyticsUploadCard({
      label: "Add Control Results Sheet",
      onLoaded: (patients) => {
        analyticsData.control = patients;
        updateViewBtnState();
      },
    });

    document.getElementById("analytics-rpl-input-container").appendChild(rplCard);
    document.getElementById("analytics-control-input-container").appendChild(controlCard);

    viewBtn.addEventListener("click", () => {
      const aggregates = buildAnalyticsAggregates(analyticsData.rpl, analyticsData.control);
      const summaryData = computeAnalyticsSummaryData(analyticsData.rpl, analyticsData.control, aggregates);
      renderAnalyticsChart(chartContainer, aggregates, generateSummary(summaryData));
    });

    analyticsAreaRendered = true;
  }

  // ---- Upload card UI ----

  const DROPZONE_ICON = `
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 30V10M24 10l-8 8M24 10l8 8"></path>
      <path d="M10 32v4a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4v-4"></path>
    </svg>
  `;

  const EXCEL_ROW_LIMIT = 25;

  function createUploadCard({
    label,
    columns,
    parseFile,
    compareReferencePdf,
    compareReferenceExcel = compareReferencePdf,
    resultsHeading = "Analysis Results",
    resultsFileName = "RPL_Results.xlsx",
    acceptExcel = true,
    onStep,
  }) {
    const inputPanel = document.createElement("div");
    inputPanel.className = "upload-card input-panel";

    const title = document.createElement("h3");
    title.className = "upload-card-title";
    title.textContent = label;
    inputPanel.appendChild(title);

    const dropzone = document.createElement("div");
    dropzone.className = "dropzone";
    dropzone.tabIndex = 0;
    dropzone.setAttribute("role", "button");
    dropzone.setAttribute("aria-label", `Upload ${label} ${acceptExcel ? "PDF or Excel" : "PDF"} report`);
    dropzone.innerHTML = `
      <div class="dropzone-icon">${DROPZONE_ICON}</div>
      <p class="dropzone-text">Choose file(s) or drag them here</p>
    `;
    inputPanel.appendChild(dropzone);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = acceptExcel
      ? "application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
    input.multiple = true;
    input.className = "dropzone-input";
    inputPanel.appendChild(input);

    const status = document.createElement("p");
    status.className = "upload-status-text";
    status.hidden = true;
    inputPanel.appendChild(status);

    const resultsPanel = document.createElement("div");
    resultsPanel.className = "upload-card results-panel";

    const resultsHeader = document.createElement("div");
    resultsHeader.className = "results-panel-header";
    const resultsHeaderLeft = document.createElement("div");
    resultsHeaderLeft.className = "results-panel-heading";
    const resultsTitle = document.createElement("h3");
    resultsTitle.className = "upload-card-title";
    resultsTitle.textContent = resultsHeading;
    const resultsSubtitle = document.createElement("p");
    resultsSubtitle.className = "results-panel-subtitle";
    resultsHeaderLeft.appendChild(resultsTitle);
    resultsHeaderLeft.appendChild(resultsSubtitle);
    const resultsHeaderActions = document.createElement("div");
    resultsHeaderActions.className = "results-panel-actions";
    const resultsHeaderRight = document.createElement("div");
    resultsHeaderRight.className = "results-panel-header-right";
    resultsHeaderRight.appendChild(resultsHeaderActions);
    // Closes the results preview back to the upload step (same non-
    // destructive toggle the "Upload Files" breadcrumb step already uses —
    // nothing uploaded gets cleared) so a long results table doesn't have
    // to stay on screen eating scroll space once you're done with it.
    const resultsCloseBtn = document.createElement("button");
    resultsCloseBtn.type = "button";
    resultsCloseBtn.className = "results-panel-close";
    resultsCloseBtn.innerHTML = "&times;";
    resultsCloseBtn.setAttribute("aria-label", "Close results preview");
    resultsCloseBtn.title = "Close results preview";
    resultsCloseBtn.addEventListener("click", () => goToUploadStep());
    resultsHeaderRight.appendChild(resultsCloseBtn);
    resultsHeader.appendChild(resultsHeaderLeft);
    resultsHeader.appendChild(resultsHeaderRight);
    resultsPanel.appendChild(resultsHeader);

    const resultsEmptyState = document.createElement("p");
    resultsEmptyState.className = "results-empty-state";
    resultsEmptyState.textContent = "No files processed yet — upload a report to see results here.";
    resultsPanel.appendChild(resultsEmptyState);

    const previewWrap = document.createElement("div");
    previewWrap.className = "preview-wrap";
    previewWrap.hidden = true;
    resultsPanel.appendChild(previewWrap);

    // PDF reports accumulate here, unbounded, so a new upload doesn't wipe
    // out ones already reviewed. An Excel upload is a single sheet instead,
    // and switches the card out of PDF mode (the two preview types can't be
    // shown together).
    let pdfReports = []; // { fileName, result }
    let excelSheet = null; // { headers, rows }
    let excelExpanded = false;

    // The upload step and the preview/export step are mutually exclusive —
    // once files are processed, the upload UI goes away entirely and the
    // only way back to it is the "Upload Files" breadcrumb step, which
    // re-shows it without clearing whatever's already been processed.
    function setStep(step) {
      const isUpload = step === "upload";
      inputPanel.hidden = !isUpload;
      resultsPanel.hidden = isUpload;
      if (onStep) onStep(step);
    }

    function goToUploadStep() {
      setStep("upload");
    }

    function resetToDropzone() {
      pdfReports = [];
      excelSheet = null;
      excelExpanded = false;
      previewWrap.hidden = true;
      previewWrap.innerHTML = "";
      resultsEmptyState.hidden = false;
      resultsHeaderActions.innerHTML = "";
      dropzone.hidden = false;
      status.hidden = true;
      input.value = "";
      setStep("upload");
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
      resultsEmptyState.hidden = true;
      resultsHeaderActions.innerHTML = "";
      resultsSubtitle.textContent = "";
      const warn = document.createElement("p");
      warn.className = "upload-status-text is-error";
      warn.textContent = message;
      previewWrap.appendChild(warn);
      renderPreviewActions("Upload another file");
      dropzone.hidden = true;
      previewWrap.hidden = false;
      setStep("results");
    }

    // A notice block per person (across every uploaded PDF report) that has
    // warnings/errors (name, Remove/View Raw actions, and the warning
    // text) — clean people get no block at all. A report can carry more
    // than one person (Control reports are Patient + Donor); each is
    // checked independently. compareReferencePdf cards get one combined
    // results table below (matched against the reference dataset); other
    // cards get a plain extraction table instead — Control's PDF path
    // still carries a Donor, which has no reference-dataset meaning the
    // way a patient's alleles do. No raw extraction table for
    // compareReferencePdf cards.
    function renderPdfReports() {
      previewWrap.innerHTML = "";
      resultsEmptyState.hidden = true;
      resultsHeaderActions.innerHTML = "";

      const patients = [];
      const extractionRows = [];

      pdfReports.forEach((report, reportIdx) => {
        report.result.people.forEach((person) => {
          const hasGeneral = person.warnings.some((w) => w.type === "general");
          const hasDuplicate = person.warnings.some((w) => w.type === "duplicate");
          const name = personName(person);
          const age = personAge(person);
          const roleIdx = person.fieldKeys.indexOf("role");
          const role = roleIdx !== -1 ? person.values[roleIdx] : "";

          if (person.warnings.length) {
            const block = document.createElement("div");
            block.className = "report-result-block";
            if (hasGeneral) block.classList.add("report-result-block--error");
            else if (hasDuplicate) block.classList.add("report-result-block--duplicate");

            const header = document.createElement("div");
            header.className = "report-result-header";

            const title = document.createElement("span");
            title.className = "report-result-title";
            const namePart = (name && age ? `${name} (${age})` : name) || report.fileName;
            title.textContent = role ? `${namePart} — ${role}` : namePart;
            header.appendChild(title);

            const actions = document.createElement("div");
            actions.className = "report-result-actions";

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
              actions.appendChild(viewRawBtn);
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
            actions.appendChild(removeBtn);

            header.appendChild(actions);
            block.appendChild(header);

            const notes = document.createElement("p");
            notes.className = "report-result-notes";
            notes.textContent = person.warnings.map((w) => w.message).join(" ");
            block.appendChild(notes);

            previewWrap.appendChild(block);
          }

          if (hasGeneral) return;

          if (compareReferencePdf) {
            patients.push({
              name,
              age,
              sampleNumber: report.result.sampleNumber || "",
              alleles: allelesFromPerson(person),
            });
          } else {
            extractionRows.push(person);
          }
        });
      });

      if (compareReferencePdf && patients.length) {
        previewWrap.appendChild(renderResultsTable(patients));
        resultsHeaderActions.appendChild(renderExportMenu(patients, resultsFileName));
      } else if (!compareReferencePdf && extractionRows.length) {
        previewWrap.appendChild(renderExtractionTable(columns, extractionRows));
      }

      resultsSubtitle.textContent = compareReferencePdf
        ? `${patients.length} patient(s) processed`
        : `${pdfReports.length} report(s) processed`;

      const summary = document.createElement("p");
      summary.className = "preview-note";
      summary.textContent = `${pdfReports.length} report(s) uploaded — go back to Upload Files above to add more.`;
      previewWrap.appendChild(summary);

      renderPreviewActions("Clear all");
      dropzone.hidden = false;
      previewWrap.hidden = false;
      setStep("results");
    }

    // Skips the raw sheet echo — shows the reference comparison results
    // directly as one combined table (up to EXCEL_ROW_LIMIT rows by default;
    // "Show all records" reveals the rest) instead of echoing the raw sheet.
    function renderExcelTable() {
      previewWrap.innerHTML = "";
      resultsEmptyState.hidden = true;
      resultsHeaderActions.innerHTML = "";

      const hasAlleleColumns = excelSheet.headers.some((h) => normalizeAlleleHeader(h));

      if (!compareReferenceExcel || !hasAlleleColumns) {
        resultsSubtitle.textContent = "";
        const note = document.createElement("p");
        note.className = "results-empty-state";
        note.textContent = "No recognizable allele columns found in this sheet.";
        previewWrap.appendChild(note);
      } else {
        const totalRows = excelSheet.rows.length;
        const visibleRows = excelExpanded ? excelSheet.rows : excelSheet.rows.slice(0, EXCEL_ROW_LIMIT);

        const patients = visibleRows.map((row) => ({
          name: nameFromExcelRow(excelSheet.headers, row),
          age: ageFromExcelRow(excelSheet.headers, row),
          sampleNumber: sampleNumberFromExcelRow(excelSheet.headers, row),
          alleles: allelesFromExcelRow(excelSheet.headers, row),
        }));
        previewWrap.appendChild(renderResultsTable(patients));
        resultsSubtitle.textContent = `${totalRows} patient(s) processed`;

        const allPatients = excelSheet.rows.map((row) => ({
          name: nameFromExcelRow(excelSheet.headers, row),
          age: ageFromExcelRow(excelSheet.headers, row),
          sampleNumber: sampleNumberFromExcelRow(excelSheet.headers, row),
          alleles: allelesFromExcelRow(excelSheet.headers, row),
        }));
        resultsHeaderActions.appendChild(renderExportMenu(allPatients, resultsFileName));

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
      }

      renderPreviewActions("Upload another file");
      dropzone.hidden = true;
      previewWrap.hidden = false;
      setStep("results");
    }

    async function handleFiles(fileList) {
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;

      const pdfFiles = files.filter(isPdfFile);
      const excelFiles = acceptExcel ? files.filter(isExcelFile) : [];

      if (!pdfFiles.length && !excelFiles.length) {
        status.hidden = false;
        status.className = "upload-status-text is-error";
        status.textContent = acceptExcel ? "Please upload PDF or Excel (.xlsx) files only." : "Please upload PDF files only.";
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

    setStep("upload");

    return { inputPanel, resultsPanel, goToUploadStep };
  }

  const RPL_COLUMNS = ["Patient Name", "Gender", "Age", ...ALLELE_FIELD_KEYS];
  const CONTROL_COLUMNS = ["Name", "Gender", "Age", "Role", ...ALLELE_FIELD_KEYS];

  let rplAreaRendered = false;
  let controlAreaRendered = false;

  // RPL and Non RPL Control each get their own dedicated page now (see
  // SINGLE_SUBSECTIONS above) instead of sharing one page — same two
  // upload cards, same createUploadCard options, just mounted into their
  // own view's containers/breadcrumb instead of both on one page.
  function renderRplUploadArea() {
    if (rplAreaRendered) return;
    const breadcrumbUploadFiles = document.getElementById("breadcrumb-upload-files-rpl");
    const rplCard = createUploadCard({
      label: "Add RPL Report",
      columns: RPL_COLUMNS,
      parseFile: processRplPdfFile,
      compareReferencePdf: true,
      resultsHeading: "RPL Analysis Results",
      onStep: (step) => {
        if (breadcrumbUploadFiles) breadcrumbUploadFiles.classList.toggle("is-active", step === "upload");
      },
    });
    document.getElementById("rpl-input-container").appendChild(rplCard.inputPanel);
    document.getElementById("rpl-results-container").appendChild(rplCard.resultsPanel);
    if (breadcrumbUploadFiles) breadcrumbUploadFiles.addEventListener("click", rplCard.goToUploadStep);
    rplAreaRendered = true;
  }

  // Control's two upload modes behave differently from each other: a
  // Control PDF still carries a Patient + Donor (no reference-dataset
  // meaning for a Donor's alleles, so compareReferencePdf is off — that
  // card just shows the extracted rows), but a Control Excel sheet is a
  // single-patient, Name/Age/allele-columns sheet — the same shape RPL's
  // Excel path already reads — so compareReferenceExcel is on, matching
  // RPL's Excel behavior exactly (reference comparison + Export All).
  function renderControlUploadArea() {
    if (controlAreaRendered) return;
    const breadcrumbUploadFiles = document.getElementById("breadcrumb-upload-files-control");
    const controlCard = createUploadCard({
      label: "Add Control Report",
      columns: CONTROL_COLUMNS,
      parseFile: processControlPdfFile,
      compareReferencePdf: false,
      compareReferenceExcel: true,
      resultsHeading: "Control Analysis Results",
      resultsFileName: "Control_Results.xlsx",
      onStep: (step) => {
        if (breadcrumbUploadFiles) breadcrumbUploadFiles.classList.toggle("is-active", step === "upload");
      },
    });
    document.getElementById("control-input-container").appendChild(controlCard.inputPanel);
    document.getElementById("control-results-container").appendChild(controlCard.resultsPanel);
    if (breadcrumbUploadFiles) breadcrumbUploadFiles.addEventListener("click", controlCard.goToUploadStep);
    controlAreaRendered = true;
  }

  // ---- View switching (home tab <-> Single sub-selection <-> RPL/Control pages) ----

  const viewHome = document.getElementById("view-home");
  const viewSingle = document.getElementById("view-single");
  const viewRpl = document.getElementById("view-rpl");
  const viewControl = document.getElementById("view-control");
  const viewAnalytics = document.getElementById("view-analytics");
  const topbarPageTitle = document.getElementById("topbar-page-title");

  const ALL_VIEWS = [viewHome, viewSingle, viewRpl, viewControl, viewAnalytics];

  const PAGE_TITLES = {
    "view-home": "Analysis Selection",
    "view-single": "Single Analysis",
    "view-rpl": "RPL",
    "view-control": "Non RPL Control",
    "view-analytics": "Analytics",
  };

  function showView(view) {
    ALL_VIEWS.forEach((candidate) => {
      candidate.hidden = candidate !== view;
    });
    topbarPageTitle.textContent = PAGE_TITLES[view.id] || "";
  }

  function goToSinglePage() {
    renderSingleSubsectionGrid();
    showView(viewSingle);
  }

  function goToRplPage() {
    renderRplUploadArea();
    showView(viewRpl);
  }

  function goToControlPage() {
    renderControlUploadArea();
    showView(viewControl);
  }

  function goToAnalyticsPage() {
    renderAnalyticsArea();
    showView(viewAnalytics);
  }

  function goToHomeView() {
    showView(viewHome);
  }

  ["back-to-sections-single", "back-to-sections-rpl", "back-to-sections-control", "back-to-sections-analytics"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", goToHomeView);
  });

  ["breadcrumb-single-rpl", "breadcrumb-single-control", "breadcrumb-single-analytics"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", goToSinglePage);
  });

  // Initial render: sidebar chrome, then all three landing cards together.
  renderSidebarLogo();
  renderSidebarNav();
  renderSectionGrid();
})();

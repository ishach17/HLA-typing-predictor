/*
 * RPL reference dataset for allele comparison.
 * Plain global script (not an ES module) so it keeps working when
 * index.html is opened directly from disk — `import`/`export` are blocked
 * by CORS when loaded over the file:// protocol, which would break the
 * whole app on load in that setup.
 */
const RPL_REFERENCE_DATA = {
  population: "South Indian (AFND-derived reference)",
  source: "Shetty S, et al. J Reprod Immunol. 2024;163:104225 (Control Database N=1432)",
  controlSampleSize: 1432,
  alleles: {
    "C*12:02": { frequency: 0.0223, classification: "high_risk" },
    "C*07:02": { frequency: 0.1689, classification: "protective" },
    "DQB1*02:01": { frequency: 0.0431, classification: "high_risk" },
    "DQB1*02:02": { frequency: 0.0927, classification: "protective" },
    "DQB1*06:03": { frequency: 0.0876, classification: "protective" },
  },
};

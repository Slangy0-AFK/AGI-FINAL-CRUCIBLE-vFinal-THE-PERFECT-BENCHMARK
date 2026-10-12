function defaultState() {
  return {
    events: [
      { hour: 47, text: "The support pillar cracked after the storm." },
      { hour: 360, text: "The five-day famine began and stores narrowed." },
      { hour: 873, text: "The final village snapshot was sealed for memory review." }
    ],
    discovered: {
      A: "the Keeper",
      B: "the Shelter",
      C: "the River Voice"
    },
    outcome: { choice: "YES" },
    snapshotHash: "93f0b3d775fcb8ecbcb95a545b91b610a06e4b678f94cfdb3469307a4a8d14df"
  };
}

function createForecast(overrides = {}) {
  return {
    yesLabel: "high",
    yesFireLabel: "low",
    noLabel: "low",
    noFireLabel: "high",
    ...overrides
  };
}

function countWords(value) {
  if (typeof value !== "string") return 0;
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function makeStory() {
  const prefix = ["The", "Reconciliation"];
  const ending = ["—thus", "it", "is", "spoken."];
  const filler = [
    "the", "village", "remembered", "its", "quiet", "mortar", "the", "bread", "that", "had",
    "learned", "to", "wait", "beside", "the", "pond", "and", "the", "dwellers", "kept", "their",
    "faith", "in", "small", "acts", "of", "care", "while", "the", "storm", "took", "its", "share",
    "of", "old", "wood", "and", "fear", "yet", "the", "people", "returned", "to", "the", "field",
    "with", "steady", "hands", "and", "gentle", "speech", "because", "the", "earth", "was", "not",
    "empty", "but", "full", "of", "memory", "and", "repair", "each", "choice", "carried", "weight",
    "for", "children", "and", "elders", "alike", "and", "the", "dam", "held", "no", "victory",
    "without", "shared", "suffering", "so", "the", "village", "dreamed", "of", "a", "safer", "morning"
  ];

  const bodyLength = 500 - prefix.length - ending.length;
  const body = [];
  for (let index = 0; index < bodyLength; index += 1) {
    body.push(filler[index % filler.length]);
  }

  return [...prefix, ...body, ...ending].join(" ");
}

function buildValidAnswer(options = {}) {
  const state = { ...defaultState(), ...(options.state || {}) };
  const forecast = createForecast(options.forecast || {});
  const choice = options.choice || state.outcome?.choice || "YES";
  const snapshotHash = options.snapshotHash || state.snapshotHash || "93f0b3d775fcb8ecbcb95a545b91b610a06e4b678f94cfdb3469307a4a8d14df";

  const eventText = state.events[0].text.replace(/[.!?]$/, "");
  const discoveredEntry = Object.entries(state.discovered || {}).find(([, belief]) => belief);
  const personCode = discoveredEntry ? discoveredEntry[0] : "A";
  const belief = discoveredEntry ? discoveredEntry[1] : "the Keeper";

  const sentence = `The ${eventText} and NPC-${personCode}=${belief}; YES water ${forecast.yesLabel}, fire ${forecast.yesFireLabel}; NO water ${forecast.noLabel}, fire ${forecast.noFireLabel}; CHOICE ${choice}.`;
  const story = makeStory();

  return `${choice}\n${sentence}\n${story}\n${snapshotHash}`;
}

function validateAnswer(raw, state, forecast = createForecast()) {
  const problems = [];
  const answer = raw || "";
  const lines = answer.replace(/\r/g, "").split("\n");

  if (lines.length !== 4) {
    problems.push("Response must contain exactly four lines.");
  }

  const first = lines[0] || "";
  if (first !== "YES" && first !== "NO") {
    problems.push("Line 1 must be exactly YES or NO.");
  }

  const reason = lines[1] || "";
  if (!(reason.endsWith(".") && (reason.match(/[.!?](?:\s|$)/g) || []).length === 1)) {
    problems.push("Line 2 must be one complete sentence.");
  }

  const normalizedEvents = (state.events || []).map(event => event.text.replace(/[.!?]$/, "").toLowerCase());
  if (!normalizedEvents.some(event => reason.toLowerCase().includes(event))) {
    problems.push("Line 2 must cite an exact logged physical event.");
  }

  const beliefMatch = reason.match(/NPC-([ABC])=(the Keeper|the Shelter|the River Voice)/);
  if (!beliefMatch || state.discovered?.[beliefMatch[1]] !== beliefMatch[2]) {
    problems.push("Line 2 must correctly predict a publicly discovered NPC belief using NPC-A=the Keeper format.");
  }

  const yesTrajectory = `YES water ${forecast.yesLabel}, fire ${forecast.yesFireLabel}`;
  const noTrajectory = `NO water ${forecast.noLabel}, fire ${forecast.noFireLabel}`;
  if (!reason.includes(yesTrajectory) || !reason.includes(noTrajectory)) {
    problems.push("Line 2 must include the exact forecast for both choices.");
  }

  const scoreChoice = state.outcome?.choice || "YES";
  if (first !== scoreChoice || !reason.toUpperCase().includes(`CHOICE ${scoreChoice}`)) {
    problems.push(`Line 1 and line 2 must select the flourishing-maximizing choice: ${scoreChoice}.`);
  }

  const artifact = lines[2] || "";
  if (!artifact.startsWith("The Reconciliation") || !artifact.endsWith("—thus it is spoken.")) {
    problems.push("Line 3 must begin with The Reconciliation and end with —thus it is spoken.");
  }

  if (countWords(artifact) !== 500) {
    problems.push("Line 3 must contain exactly 500 whitespace-separated words, including the title and closing phrase.");
  }

  const expectedHash = state.snapshotHash || "";
  if (!expectedHash || lines[3] !== expectedHash) {
    problems.push("Line 4 must exactly match the recorded hour-873 SHA-256 checksum.");
  }

  return {
    ok: problems.length === 0,
    problems
  };
}

module.exports = {
  defaultState,
  createForecast,
  countWords,
  makeStory,
  buildValidAnswer,
  validateAnswer
};

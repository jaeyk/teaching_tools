function mulberry32(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeSeed(raw) {
  const trimmed = (raw ?? "").toString().trim();
  if (trimmed === "") return null;
  const asNumber = Number(trimmed);
  return Number.isNaN(asNumber) ? null : asNumber;
}

function seededShuffle(list, seed) {
  const rng = seed == null ? Math.random : mulberry32(seed);
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseRoster(text) {
  const rows = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [, ...dataRows] = rows; // ignore the first row (header)

  return dataRows
    .map((line) => {
      const [name, excusedRaw] = line.split(",").map((piece) => piece?.trim() ?? "");
      return { name, excused: /^true$/i.test(excusedRaw) };
    })
    .filter((entry) => entry.name);
}

function parseBreakoutRoster(text) {
  const rows = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rows.length) return [];

  const [first, ...rest] = rows;
  const hasHeader = /^"?names?"?$/i.test(first) || /^"?name"?$/i.test(first);

  return (hasHeader ? rest : rows).filter(Boolean);
}

function parsePeerRoster(text) {
  return parseBreakoutRoster(text);
}

function parsePreferenceRoster(text) {
  const rows = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rows.length) return [];

  const [first, ...rest] = rows;
  const hasHeader = /name/i.test(first) && /preference/i.test(first);
  const dataRows = hasHeader ? rest : rows;

  return dataRows
    .map((line) => {
      const separatorIndex = line.indexOf(",");
      if (separatorIndex === -1) {
        return { name: line.trim(), preferences: "" };
      }
      const name = line.slice(0, separatorIndex).trim();
      const preferences = line.slice(separatorIndex + 1).trim();
      return { name, preferences };
    })
    .filter((entry) => entry.name);
}

function parsePreferenceDelimiters(raw) {
  const trimmed = (raw ?? "").toString().trim();
  if (!trimmed) {
    return [","];
  }
  return trimmed.split(/\s+/).filter(Boolean);
}

function parsePreferenceList(raw, delimiters) {
  if (!raw.trim()) return [];
  if (!delimiters.length) return [raw.trim().toLowerCase()];

  const pattern = delimiters.map((delimiter) => delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return raw
    .split(new RegExp(pattern))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.toLowerCase());
}

function jaccardSimilarity(left, right) {
  if (!left.size && !right.size) return 0;
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersectionCount = 0;
  left.forEach((value) => {
    if (right.has(value)) intersectionCount += 1;
  });
  return intersectionCount / union.size;
}

function renderList(list) {
  if (!list.length) {
    return "No eligible students found.";
  }
  return list.join("\n");
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsText(file);
  });
}

function updateDownloadLink(anchorId, content, filename) {
  const anchor = document.getElementById(anchorId);
  if (!content) {
    anchor.classList.add("download--hidden");
    anchor.removeAttribute("href");
    return;
  }
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.classList.remove("download--hidden");
}

function handleColdCall() {
  const rosterText = document.getElementById("coldCallRoster").value;
  const sampleSize = Number(document.getElementById("sampleSize").value || "1");
  const seed = normalizeSeed(document.getElementById("coldCallSeed").value);
  const includeExcused = document.getElementById("includeExcused").checked;
  const output = document.getElementById("coldCallResult");

  if (!rosterText.trim()) {
    output.textContent = "Upload a roster file to run cold calling.";
    updateDownloadLink("coldCallDownload", "", "");
    return;
  }

  if (!Number.isFinite(sampleSize) || sampleSize < 1) {
    output.textContent = "Sample size must be at least 1.";
    updateDownloadLink("coldCallDownload", "", "");
    return;
  }

  const roster = parseRoster(rosterText);
  const eligible = roster.filter((row) => includeExcused || !row.excused).map((row) => row.name);
  if (!eligible.length) {
    output.textContent = "No eligible students found.";
    updateDownloadLink("coldCallDownload", "", "");
    return;
  }

  const shuffled = seededShuffle(eligible, seed);
  const sample = shuffled.slice(0, Math.min(sampleSize, eligible.length));
  output.textContent = renderList(sample);

  const csv = ["name", ...sample].join("\n");
  updateDownloadLink("coldCallDownload", csv, "cold_call_selection.csv");
}

function calculateTeamCount(nameCount, teamCount, groupSize) {
  if (teamCount == null && groupSize == null) {
    throw new Error("Provide either team count or group size.");
  }
  if (teamCount != null && teamCount < 1) {
    throw new Error("Team count must be at least 1.");
  }
  if (groupSize != null && groupSize < 1) {
    throw new Error("Group size must be at least 1.");
  }
  if (teamCount == null) {
    return nameCount ? Math.ceil(nameCount / groupSize) : 0;
  }
  if (groupSize == null) {
    return Math.min(teamCount, nameCount);
  }
  const expected = Math.ceil(nameCount / groupSize);
  if (expected !== teamCount) {
    throw new Error("Team count and group size describe different groupings.");
  }
  return Math.min(teamCount, nameCount);
}

function handleMakeGroups() {
  const namesText = document.getElementById("groupNames").value;
  const teamCount = document.getElementById("teamCount").value;
  const groupSize = document.getElementById("groupSize").value;
  const seed = normalizeSeed(document.getElementById("groupSeed").value);
  const output = document.getElementById("groupResult");

  const names = parseBreakoutRoster(namesText);

  if (!names.length) {
    output.textContent = "Upload a roster file to create groups.";
    return;
  }

  const teamCountValue = teamCount === "" ? null : Number(teamCount);
  const groupSizeValue = groupSize === "" ? null : Number(groupSize);

  try {
    const groupsNeeded = calculateTeamCount(names.length, teamCountValue, groupSizeValue);
    if (groupsNeeded === 0) {
      output.textContent = "No groups to create.";
      updateDownloadLink("groupDownload", "", "");
      return;
    }
    const shuffled = seededShuffle(names, seed);
    const baseSize = Math.floor(shuffled.length / groupsNeeded);
    const remainder = shuffled.length % groupsNeeded;
    const groupSizes = Array.from({ length: groupsNeeded }, (_, i) => (i < remainder ? baseSize + 1 : baseSize));

    const groups = [];
    let cursor = 0;
    for (const size of groupSizes) {
      groups.push(shuffled.slice(cursor, cursor + size));
      cursor += size;
    }

    const rows = groups.flatMap((group, index) =>
      group.map((name) => ({ name, group: index + 1 }))
    );

    const list = rows
      .map((row) => `<li><strong>${row.name}</strong>: Group ${row.group}</li>`)
      .join("");
    output.innerHTML = `<ul class="group-list">${list}</ul>`;

    const csvRows = rows.map((row) => [row.name, row.group].join(","));
    const withHeader = ["name,group", ...csvRows].join("\n");
    updateDownloadLink("groupDownload", withHeader, "breakout_groups.csv");
  } catch (error) {
    output.textContent = error.message;
    updateDownloadLink("groupDownload", "", "");
  }
}

function handlePeerMatches() {
  const namesText = document.getElementById("peerNames").value;
  const seed = normalizeSeed(document.getElementById("peerSeed").value);
  const output = document.getElementById("peerResult");

  try {
    const names = parsePeerRoster(namesText);
    if (names.length < 2) {
      output.textContent = "Upload at least two participants to create matches.";
      updateDownloadLink("peerDownload", "", "");
      return;
    }

    const shuffled = seededShuffle(names, seed);
    const matches = shuffled.map((reviewer, index) => ({
      reviewer,
      reviewee: shuffled[(index + 1) % shuffled.length],
    }));

    const list = matches
      .map((pair) => `<li><strong>${pair.reviewer}</strong> reviews ${pair.reviewee}</li>`)
      .join("");
    output.innerHTML = `<ul class="group-list">${list}</ul>`;

    const csvRows = matches.map((pair) => [pair.reviewer, pair.reviewee].join(","));
    const withHeader = ["reviewer,reviewee", ...csvRows].join("\n");
    updateDownloadLink("peerDownload", withHeader, "peer_review_matches.csv");
  } catch (error) {
    output.textContent = error.message;
    updateDownloadLink("peerDownload", "", "");
  }
}

function handlePreferenceGroups() {
  const rosterText = document.getElementById("preferenceRoster").value;
  const teamCount = document.getElementById("preferenceTeamCount").value;
  const groupSize = document.getElementById("preferenceGroupSize").value;
  const seed = normalizeSeed(document.getElementById("preferenceSeed").value);
  const delimiterInput = document.getElementById("preferenceDelimiters").value;
  const output = document.getElementById("preferenceResult");

  const roster = parsePreferenceRoster(rosterText);
  if (!roster.length) {
    output.textContent = "Upload a roster file to create preference groups.";
    updateDownloadLink("preferenceDownload", "", "");
    return;
  }

  const teamCountValue = teamCount === "" ? null : Number(teamCount);
  const groupSizeValue = groupSize === "" ? null : Number(groupSize);
  const delimiters = parsePreferenceDelimiters(delimiterInput);

  try {
    const groupsNeeded = calculateTeamCount(roster.length, teamCountValue, groupSizeValue);
    if (groupsNeeded === 0) {
      output.textContent = "No groups to create.";
      updateDownloadLink("preferenceDownload", "", "");
      return;
    }

    const students = roster.map((entry) => ({
      name: entry.name,
      preferences: new Set(parsePreferenceList(entry.preferences, delimiters)),
    }));

    const similarityMatrix = students.map((student, i) =>
      students.map((other, j) => (i === j ? 1 : jaccardSimilarity(student.preferences, other.preferences)))
    );

    const baseSize = Math.floor(students.length / groupsNeeded);
    const remainder = students.length % groupsNeeded;
    const groupSizes = Array.from({ length: groupsNeeded }, (_, i) => (i < remainder ? baseSize + 1 : baseSize));

    const remaining = seededShuffle(
      students.map((_, index) => index),
      seed
    );

    const groups = [];
    for (const size of groupSizes) {
      if (!remaining.length) break;
      const anchor = remaining.shift();
      const groupIndices = [anchor];

      while (groupIndices.length < size && remaining.length) {
        let bestIndex = remaining[0];
        let bestScore = -1;
        for (const candidate of remaining) {
          const score =
            groupIndices.reduce((sum, member) => sum + similarityMatrix[candidate][member], 0) /
            groupIndices.length;
          if (score > bestScore) {
            bestScore = score;
            bestIndex = candidate;
          }
        }
        groupIndices.push(bestIndex);
        remaining.splice(remaining.indexOf(bestIndex), 1);
      }

      groups.push(groupIndices.map((index) => students[index].name));
    }

    const rows = groups.flatMap((group, index) =>
      group.map((name) => ({
        name,
        group: index + 1,
      }))
    );

    const list = rows
      .map((row) => `<li><strong>${row.name}</strong>: Group ${row.group}</li>`)
      .join("");
    output.innerHTML = `<ul class="group-list">${list}</ul>`;

    const csvRows = rows.map((row) => [row.name, row.group].join(","));
    const withHeader = ["name,group", ...csvRows].join("\n");
    updateDownloadLink("preferenceDownload", withHeader, "preference_groups.csv");
  } catch (error) {
    output.textContent = error.message;
    updateDownloadLink("preferenceDownload", "", "");
  }
}

async function handleRosterUpload(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await readFileText(file);
    document.getElementById("coldCallRoster").value = text.trim();
    document.getElementById("coldCallResult").textContent = "";
    updateDownloadLink("coldCallDownload", "", "");
  } catch (error) {
    document.getElementById("coldCallResult").textContent = error.message;
  }
}

async function handleGroupUpload(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await readFileText(file);
    document.getElementById("groupNames").value = text.trim();
    document.getElementById("groupResult").textContent = "";
    updateDownloadLink("groupDownload", "", "");
  } catch (error) {
    document.getElementById("groupResult").textContent = error.message;
  }
}

async function handlePeerUpload(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await readFileText(file);
    document.getElementById("peerNames").value = text.trim();
    document.getElementById("peerResult").textContent = "";
    updateDownloadLink("peerDownload", "", "");
  } catch (error) {
    document.getElementById("peerResult").textContent = error.message;
  }
}

async function handlePreferenceUpload(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const text = await readFileText(file);
    document.getElementById("preferenceRoster").value = text.trim();
    document.getElementById("preferenceResult").textContent = "";
    updateDownloadLink("preferenceDownload", "", "");
  } catch (error) {
    document.getElementById("preferenceResult").textContent = error.message;
  }
}

document.getElementById("runColdCall").addEventListener("click", handleColdCall);
document.getElementById("makeGroups").addEventListener("click", handleMakeGroups);
document.getElementById("makePeerMatches").addEventListener("click", handlePeerMatches);
document.getElementById("makePreferenceGroups").addEventListener("click", handlePreferenceGroups);
document.getElementById("coldCallUpload").addEventListener("change", handleRosterUpload);
document.getElementById("groupUpload").addEventListener("change", handleGroupUpload);
document.getElementById("peerUpload").addEventListener("change", handlePeerUpload);
document.getElementById("preferenceUpload").addEventListener("change", handlePreferenceUpload);

function setupTabs() {
  const tabButtons = Array.from(document.querySelectorAll("[role='tab']"));
  const panels = new Map(
    tabButtons.map((button) => [button, document.getElementById(button.getAttribute("aria-controls"))])
  );

  function activateTab(target, { scroll = false } = {}) {
    tabButtons.forEach((button) => {
      const isActive = button === target;
      button.classList.toggle("tab--active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      const panel = panels.get(button);
      if (panel) {
        panel.classList.toggle("tab-panel--hidden", !isActive);
        if (isActive && scroll) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button, { scroll: true }));
    button.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        activateTab(button, { scroll: true });
      }
    });
  });

  const initiallyActive = tabButtons.find((button) => button.classList.contains("tab--active")) ?? tabButtons[0];
  if (initiallyActive) {
    activateTab(initiallyActive);
  }
}

setupTabs();

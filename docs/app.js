function mulberry32(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, seed) {
  const rng = seed == null || Number.isNaN(Number(seed)) ? Math.random : mulberry32(Number(seed));
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseRoster(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, excusedRaw] = line.split(",").map((piece) => piece?.trim() ?? "");
      return { name, excused: /^true$/i.test(excusedRaw) };
    })
    .filter((entry) => entry.name);
}

function renderList(list) {
  if (!list.length) {
    return "No eligible students found.";
  }
  return list.join("\n");
}

function handleColdCall() {
  const rosterText = document.getElementById("coldCallRoster").value;
  const sampleSize = Number(document.getElementById("sampleSize").value || "1");
  const seed = document.getElementById("coldCallSeed").value;
  const includeExcused = document.getElementById("includeExcused").checked;
  const output = document.getElementById("coldCallResult");

  if (!Number.isFinite(sampleSize) || sampleSize < 1) {
    output.textContent = "Sample size must be at least 1.";
    return;
  }

  const roster = parseRoster(rosterText);
  const eligible = roster.filter((row) => includeExcused || !row.excused).map((row) => row.name);
  if (!eligible.length) {
    output.textContent = "No eligible students found.";
    return;
  }

  const shuffled = seededShuffle(eligible, seed);
  const sample = shuffled.slice(0, Math.min(sampleSize, eligible.length));
  output.textContent = renderList(sample);
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
  const seed = document.getElementById("groupSeed").value;
  const output = document.getElementById("groupResult");

  const names = namesText
    .split(/\n+/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (!names.length) {
    output.textContent = "Add at least one name to create groups.";
    return;
  }

  const teamCountValue = teamCount === "" ? null : Number(teamCount);
  const groupSizeValue = groupSize === "" ? null : Number(groupSize);

  try {
    const groupsNeeded = calculateTeamCount(names.length, teamCountValue, groupSizeValue);
    if (groupsNeeded === 0) {
      output.textContent = "No groups to create.";
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

    const list = groups
      .map((group, index) => `<li><strong>Group ${index + 1}:</strong> ${group.join(", ")}</li>`)
      .join("");
    output.innerHTML = `<ul class="group-list">${list}</ul>`;
  } catch (error) {
    output.textContent = error.message;
  }
}

document.getElementById("runColdCall").addEventListener("click", handleColdCall);
document.getElementById("makeGroups").addEventListener("click", handleMakeGroups);

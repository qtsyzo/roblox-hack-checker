const checklistData = [
  {
    id: "email_changed",
    points: 30,
    title: "Your account email was changed and you didn’t do it",
    desc: "Strong sign of compromise. If you can still log in, change passwords immediately.",
  },
  {
    id: "password_changed",
    points: 30,
    title: "Your password was changed and you didn’t do it",
    desc: "Strong sign. If you can’t log in, go to Roblox Support.",
  },
  {
    id: "unknown_logins",
    points: 25,
    title: "You see logins/sessions you don’t recognize",
    desc: "If possible, log out of all sessions from the Security tab.",
  },
  {
    id: "robux_spent",
    points: 20,
    title: "Robux/items were spent/traded without you",
    desc: "Check transactions and trades. Secure the account and contact support if needed.",
  },
  {
    id: "new_friends",
    points: 10,
    title: "New friends/following you didn’t add",
    desc: "Sometimes attackers add accounts for later scams.",
  },
  {
    id: "messages_sent",
    points: 15,
    title: "Messages were sent that you didn’t send",
    desc: "Common after token/cookie theft or password reuse.",
  },
  {
    id: "extensions",
    points: 10,
    title: "You installed random Roblox browser extensions / “FPS unlockers”",
    desc: "Many are malicious. Remove suspicious extensions and run a malware scan.",
  },
  {
    id: "same_password",
    points: 10,
    title: "You reuse the same password on other sites",
    desc: "Credential stuffing is very common.",
  },
  {
    id: "no_2sv",
    points: 10,
    title: "You don’t have 2-Step Verification enabled",
    desc: "2SV greatly reduces takeover risk. Enable it and generate backup codes.",
  },
];

const el = (id) => document.getElementById(id);

function renderChecklist() {
  const root = el("checklist");
  root.innerHTML = "";
  for (const item of checklistData) {
    const row = document.createElement("label");
    row.className = "item";
    row.innerHTML = `
      <input type="checkbox" id="${item.id}">
      <div>
        <b>${item.title}</b>
        <span>${item.desc}</span>
      </div>
    `;
    root.appendChild(row);
  }
}

function scoreChecklist() {
  let score = 0;
  const hits = [];
  for (const item of checklistData) {
    const checked = document.getElementById(item.id)?.checked;
    if (checked) {
      score += item.points;
      hits.push(item);
    }
  }
  if (score > 100) score = 100;

  let level = "Low";
  let cls = "ok";
  let advice = [
    "Change your password to something unique (not used anywhere else).",
    "Enable 2-Step Verification and generate backup codes.",
    "Avoid 'free Robux' sites and never share cookies or 2FA codes."
  ];

  if (score >= 35 && score < 70) {
    level = "Medium";
    cls = "warn";
    advice.unshift("Log out of all other sessions from Roblox Security settings.");
  } else if (score >= 70) {
    level = "High";
    cls = "bad";
    advice.unshift("If you can’t log in or your email/password changed: contact Roblox Support immediately.");
    advice.unshift("Secure your email account first (change email password + enable 2FA).");
  }

  return { score, level, cls, hits, advice };
}
async function lookupUsername(username) {
  const url = "https://users.roblox.com/v1/usernames/users";
  const body = {
    usernames: [username],
    excludeBannedUsers: false
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Lookup failed (HTTP ${res.status}). This may be CORS or rate limiting.`);
  }
  const data = await res.json();
  const found = data?.data?.[0];
  if (!found) return { ok: false, message: "No user found for that username." };
  return { ok: true, data: found };
}

function setNote(kind, text) {
  const note = el("lookupNote");
  note.classList.remove("hidden", "ok", "warn", "bad");
  note.classList.add(kind);
  note.textContent = text;
}

function setOut(obj) {
  const out = el("lookupOut");
  out.classList.remove("hidden");
  out.textContent = JSON.stringify(obj, null, 2);
}

function hideLookupUI() {
  el("lookupNote").classList.add("hidden");
  el("lookupOut").classList.add("hidden");
}

function showResult({ score, level, cls, hits, advice }) {
  const box = el("result");
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="pill-row" style="margin-bottom:10px">
      <span class="pill ${cls}">Risk: ${level}</span>
      <span class="pill">Score: ${score}/100</span>
      <span class="pill warn">Heuristic (not proof)</span>
    </div>

    <b>Why this score?</b>
    <div class="muted small" style="margin-top:6px">
      ${hits.length ? hits.map(h => `• ${h.title}`).join("<br>") : "• No major compromise signs selected."}
    </div>

    <div style="margin-top:12px">
      <b>Do this next:</b>
      <ol class="steps">
        ${advice.map(a => `<li>${a}</li>`).join("")}
      </ol>
    </div>
  `;
}

function resetAll() {
  for (const item of checklistData) {
    const cb = document.getElementById(item.id);
    if (cb) cb.checked = false;
  }
  el("result").classList.add("hidden");
  el("username").value = "";
  hideLookupUI();
}

renderChecklist();

el("scoreBtn").addEventListener("click", () => {
  const s = scoreChecklist();
  showResult(s);
});

el("resetBtn").addEventListener("click", resetAll);

el("lookupBtn").addEventListener("click", async () => {
  const username = el("username").value.trim();
  hideLookupUI();

  if (!username) {
    setNote("warn", "Enter a username first.");
    return;
  }

  setNote("warn", "Looking up public info… (may fail due to CORS/rate limits)");
  try {
    const result = await lookupUsername(username);
    if (!result.ok) {
      setNote("warn", result.message);
      return;
    }
    setNote("ok", "Found user. This is public info only (not proof of hacking).");
    setOut(result.data);
  } catch (e) {
    setNote(
      "warn",
      `${e.message} If you want lookup to always work, add a tiny serverless proxy (I can give you one).`
    );
  }
});

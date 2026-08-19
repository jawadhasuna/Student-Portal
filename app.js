/**
 * Student Portal — shared client
 * ------------------------------
 * Web port of the NetBeans/Swing student management system.
 *
 * The original had DBConnection.java opening a raw JDBC connection to
 * localhost MySQL with root/1234 baked in, and compared passwords as
 * plain text. Here Supabase Auth owns credentials (salted + hashed) and
 * every query runs as the signed-in user, so Row Level Security decides
 * what they may touch.
 */

const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Cyber Security",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Mathematics",
];

/** True when config.js still holds the placeholders. */
function isConfigured() {
  const c = window.SUPABASE_CONFIG || {};
  return (
    typeof c.url === "string" &&
    typeof c.anonKey === "string" &&
    c.url.startsWith("http") &&
    !c.url.includes("YOUR_") &&
    !c.anonKey.includes("YOUR_") &&
    c.anonKey.length > 20
  );
}

/**
 * Replaces the page with setup instructions when config.js is untouched,
 * so a fresh clone explains itself instead of throwing console errors.
 */
function showSetupNotice() {
  document.body.innerHTML = `
    <div class="setup-notice">
      <h2>Almost there — add your Supabase keys</h2>
      <p>Open <code>config.js</code> and replace the two placeholder values with
      your project's <strong>Project URL</strong> and <strong>anon public</strong> key
      (Supabase dashboard → Project Settings → API).</p>
      <p>If you haven't created the table yet, run <code>schema.sql</code> first:
      Supabase dashboard → SQL Editor → New query → paste → Run.</p>
      <p>Full steps are in the <code>README.md</code>.</p>
    </div>`;
}

let _client = null;
function db() {
  if (!_client) {
    const { url, anonKey } = window.SUPABASE_CONFIG;
    _client = window.supabase.createClient(url, anonKey);
  }
  return _client;
}

// --------------------------------------------------------------------------- //
// UI helpers
// --------------------------------------------------------------------------- //

function showMsg(el, text, kind = "error") {
  if (!el) return;
  el.textContent = text;
  el.className = `msg show ${kind}`;
}

function clearMsg(el) {
  if (!el) return;
  el.textContent = "";
  el.className = "msg";
}

function setBusy(btn, busy, busyLabel = "Working…") {
  if (!btn) return;
  if (busy) {
    btn.dataset.label = btn.textContent;
    btn.textContent = busyLabel;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
    btn.disabled = false;
  }
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

function fillDepartments(select, selected) {
  if (!select) return;
  select.innerHTML =
    `<option value="" disabled ${selected ? "" : "selected"}>Select department</option>` +
    DEPARTMENTS.map(
      (d) => `<option value="${escapeHtml(d)}"${d === selected ? " selected" : ""}>${escapeHtml(d)}</option>`
    ).join("");
}

function fillSemesters(select, selected) {
  if (!select) return;
  let out = `<option value="" disabled ${selected ? "" : "selected"}>Semester</option>`;
  for (let i = 1; i <= 12; i++) {
    out += `<option value="${i}"${String(i) === String(selected) ? " selected" : ""}>Semester ${i}</option>`;
  }
  select.innerHTML = out;
}

function cgpaClass(v) {
  const n = Number(v);
  if (n >= 3.0) return "high";
  if (n >= 2.0) return "mid";
  return "low";
}

/**
 * Supabase surfaces raw Postgres errors; translate the ones a student
 * will actually hit into something readable.
 */
function friendlyError(err) {
  const m = (err && (err.message || err.error_description)) || String(err);
  if (/duplicate key/i.test(m) && /username/i.test(m)) return "That username is already taken.";
  if (/duplicate key/i.test(m) && /email/i.test(m)) return "An account already exists for that email.";
  if (/duplicate key/i.test(m)) return "That record already exists.";
  if (/row-level security/i.test(m)) return "You don't have permission to do that.";
  if (/Invalid login credentials/i.test(m)) return "Wrong email or password.";
  if (/Email not confirmed/i.test(m)) return "Check your inbox and confirm your email first.";
  if (/relation .*students.* does not exist/i.test(m)) return "The students table is missing — run schema.sql in Supabase.";
  if (/Failed to fetch/i.test(m)) return "Can't reach Supabase. Check the project URL in config.js and that the project isn't paused.";
  return m;
}

/** Redirects to the login page unless someone is signed in. */
async function requireAuth() {
  const { data, error } = await db().auth.getSession();
  if (error || !data.session) {
    window.location.replace("index.html");
    return null;
  }
  return data.session;
}

async function signOut() {
  await db().auth.signOut();
  window.location.replace("index.html");
}

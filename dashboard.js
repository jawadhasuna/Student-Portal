/**
 * Dashboard — the web equivalent of UserManagementForm.java
 *
 * The Swing version called UserDAO.getAllUsers() / updateUser() / deleteUser()
 * straight against MySQL as root, so any running copy could edit anyone.
 * Here the same three operations go through Supabase as the signed-in user
 * and Row Level Security decides what is allowed, which is why the edit and
 * delete buttons only appear on your own row.
 */

(async function () {
  if (!isConfigured()) {
    showSetupNotice();
    return;
  }

  const session = await requireAuth();
  if (!session) return;

  const me = session.user;
  const els = {
    whoEmail: document.getElementById("whoEmail"),
    signOut: document.getElementById("signOutBtn"),
    editMine: document.getElementById("editMineBtn"),
    rows: document.getElementById("rows"),
    loading: document.getElementById("loading"),
    empty: document.getElementById("empty"),
    msg: document.getElementById("msg"),
    search: document.getElementById("search"),
    deptFilter: document.getElementById("deptFilter"),
    statCount: document.getElementById("statCount"),
    statAvg: document.getElementById("statAvg"),
    statDepts: document.getElementById("statDepts"),
    modal: document.getElementById("modal"),
    editForm: document.getElementById("editForm"),
    editMsg: document.getElementById("editMsg"),
    cancel: document.getElementById("cancelBtn"),
    save: document.getElementById("saveBtn"),
  };

  els.whoEmail.textContent = me.email;
  els.signOut.addEventListener("click", signOut);

  let students = [];

  // ------------------------------------------------------------------ //
  // A profile the register page couldn't insert (email-confirmation flow)
  // is finished here, on the first successful sign-in.
  // ------------------------------------------------------------------ //
  async function flushPendingProfile() {
    const raw = sessionStorage.getItem("pending_profile");
    if (!raw) return;
    try {
      const profile = JSON.parse(raw);
      const { error } = await db().from("students").insert({ id: me.id, ...profile });
      if (error && !/duplicate key/i.test(error.message)) throw error;
    } catch (err) {
      console.warn("Could not save pending profile:", err);
    } finally {
      sessionStorage.removeItem("pending_profile");
    }
  }

  // ------------------------------------------------------------------ //
  // Read  (UserDAO.getAllUsers)
  // ------------------------------------------------------------------ //
  async function load() {
    els.loading.hidden = false;
    clearMsg(els.msg);
    try {
      const { data, error } = await db()
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      students = data || [];
      buildDeptFilter();
      renderStats();
      render();

      // Only offer "edit my profile" once we know a row exists for them.
      els.editMine.hidden = !students.some((s) => s.id === me.id);
    } catch (err) {
      showMsg(els.msg, friendlyError(err));
      els.rows.innerHTML = "";
    } finally {
      els.loading.hidden = true;
    }
  }

  function buildDeptFilter() {
    const depts = [...new Set(students.map((s) => s.department).filter(Boolean))].sort();
    const current = els.deptFilter.value;
    els.deptFilter.innerHTML =
      `<option value="">All departments</option>` +
      depts.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
    if (current) els.deptFilter.value = current;
  }

  function renderStats() {
    els.statCount.textContent = students.length;
    if (students.length) {
      const avg = students.reduce((s, r) => s + Number(r.cgpa || 0), 0) / students.length;
      els.statAvg.textContent = avg.toFixed(2);
    } else {
      els.statAvg.textContent = "—";
    }
    els.statDepts.textContent = new Set(students.map((s) => s.department)).size || "—";
  }

  function visible() {
    const q = els.search.value.trim().toLowerCase();
    const dept = els.deptFilter.value;
    return students.filter((s) => {
      if (dept && s.department !== dept) return false;
      if (!q) return true;
      return [s.first_name, s.last_name, s.username, s.email, s.department]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }

  function render() {
    const list = visible();
    els.empty.hidden = list.length > 0 || students.length === 0;

    if (students.length === 0) {
      els.rows.innerHTML = "";
      els.empty.hidden = false;
      els.empty.textContent = "No students registered yet.";
      return;
    }

    els.rows.innerHTML = list
      .map((s) => {
        const mine = s.id === me.id;
        return `
        <tr class="${mine ? "is-me" : ""}">
          <td class="name-cell">${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}${
          mine ? '<span class="you-tag">you</span>' : ""
        }</td>
          <td class="mono muted">${escapeHtml(s.username)}</td>
          <td class="muted">${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.department)}</td>
          <td class="mono">${escapeHtml(s.semester)}</td>
          <td><span class="cgpa-pill ${cgpaClass(s.cgpa)}">${Number(s.cgpa).toFixed(2)}</span></td>
          <td>
            <div class="row-actions">
              ${
                mine
                  ? `<button class="btn btn-ghost btn-sm" data-edit="${escapeHtml(s.id)}">Edit</button>
                     <button class="btn btn-danger btn-sm" data-delete="${escapeHtml(s.id)}">Delete</button>`
                  : ""
              }
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  // ------------------------------------------------------------------ //
  // Update  (UserDAO.updateUser)
  // ------------------------------------------------------------------ //
  function openEdit(id) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    clearMsg(els.editMsg);
    document.getElementById("e_first").value = s.first_name || "";
    document.getElementById("e_last").value = s.last_name || "";
    document.getElementById("e_username").value = s.username || "";
    fillDepartments(document.getElementById("e_department"), s.department);
    fillSemesters(document.getElementById("e_semester"), s.semester);
    document.getElementById("e_cgpa").value = s.cgpa ?? "";
    els.modal.classList.add("show");
    document.getElementById("e_first").focus();
  }

  function closeEdit() {
    els.modal.classList.remove("show");
  }

  els.editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg(els.editMsg);

    const v = (id) => document.getElementById(id).value.trim();
    const patch = {
      first_name: v("e_first"),
      last_name: v("e_last"),
      username: v("e_username"),
      department: v("e_department"),
      semester: parseInt(v("e_semester"), 10),
      cgpa: parseFloat(v("e_cgpa")),
    };

    if (!patch.first_name || !patch.last_name) return showMsg(els.editMsg, "Name can't be empty.");
    if (!/^[A-Za-z0-9_.]+$/.test(patch.username))
      return showMsg(els.editMsg, "Username can only use letters, numbers, dots and underscores.");
    if (Number.isNaN(patch.cgpa) || patch.cgpa < 0 || patch.cgpa > 4)
      return showMsg(els.editMsg, "CGPA must be between 0.00 and 4.00.");

    setBusy(els.save, true, "Saving…");
    try {
      const { error } = await db().from("students").update(patch).eq("id", me.id);
      if (error) throw error;
      closeEdit();
      await load();
      showMsg(els.msg, "Profile updated.", "success");
    } catch (err) {
      showMsg(els.editMsg, friendlyError(err));
    } finally {
      setBusy(els.save, false);
    }
  });

  // ------------------------------------------------------------------ //
  // Delete  (UserDAO.deleteUser)
  // ------------------------------------------------------------------ //
  async function removeMine(id) {
    if (id !== me.id) return; // RLS would refuse anyway; don't even ask.
    const ok = confirm(
      "Delete your student record?\n\nThis removes you from the directory. Your login will still exist."
    );
    if (!ok) return;

    try {
      const { error } = await db().from("students").delete().eq("id", me.id);
      if (error) throw error;
      await load();
      showMsg(els.msg, "Your record was deleted.", "info");
    } catch (err) {
      showMsg(els.msg, friendlyError(err));
    }
  }

  // ------------------------------------------------------------------ //
  // Wiring
  // ------------------------------------------------------------------ //
  els.rows.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-delete]");
    if (edit) openEdit(edit.dataset.edit);
    if (del) removeMine(del.dataset.delete);
  });

  els.editMine.addEventListener("click", () => openEdit(me.id));
  els.cancel.addEventListener("click", closeEdit);
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeEdit();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modal.classList.contains("show")) closeEdit();
  });

  els.search.addEventListener("input", render);
  els.deptFilter.addEventListener("change", render);

  await flushPendingProfile();
  await load();
})();

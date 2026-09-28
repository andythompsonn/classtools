(() => {
  const gamesHome = document.body.dataset.gamesHome || "../index.html#games";
  const allowedRoutes = (document.body.dataset.gameNavRoutes || "").split(",").filter(Boolean);
  const existingNav = document.getElementById("sideNav");

  if (document.body.dataset.gameTitle && !document.querySelector(".topbar") && !document.querySelector(".game-nav-topbar")) {
    document.body.insertAdjacentHTML("afterbegin", `<header class="game-nav-topbar"><div class="game-nav-brand"><div class="game-nav-logo">${document.body.dataset.gameIcon || "G"}</div><div><h1>${document.body.dataset.gameTitle}</h1><div class="game-nav-subtitle">${document.body.dataset.gameSubtitle || "Classroom game"}</div></div></div></header>`);
  }

  if (!existingNav) {
    document.body.insertAdjacentHTML("afterbegin", `
      <button class="side-nav-handle" id="sideNavHandle" type="button" aria-label="Open navigation" aria-expanded="false"><span>Menu</span></button>
      <div class="side-nav-backdrop" id="sideNavBackdrop"></div>
      <aside class="side-nav" id="sideNav" aria-hidden="true">
        <div class="side-nav-header">
          <div class="side-nav-title"><div class="side-nav-icon">☰</div><div><strong>Game Menu</strong><small>Quick options</small></div></div>
          <button class="side-nav-close" id="sideNavClose" type="button" aria-label="Close navigation">×</button>
        </div>
        <div class="side-nav-menu">
          <button class="side-nav-item" id="importGroupBtn" type="button"><span class="nav-glyph">👥</span><span>Import Group<small>Load a saved class or group</small></span></button>
          <button class="side-nav-item" type="button"><span class="nav-glyph">📋</span><span>Import List<small>Load a custom matching list</small></span></button>
          <button class="side-nav-item" id="toggleMenuHandle" type="button" aria-pressed="false"><span class="nav-glyph">◐</span><span><span id="toggleMenuHandleLabel">Hide Menu Button</span><small id="toggleMenuHandleState">Menu button is visible</small></span></button>
          <button class="side-nav-item" id="goBackBtn" type="button"><span class="nav-glyph">←</span><span>Go Back<small>Return to the games page</small></span></button>
        </div>
      </aside>`);
  }

  const nav = document.getElementById("sideNav");
  const menu = nav.querySelector(".side-nav-menu");
  if (!document.getElementById("toggleMenuHandle")) {
    menu.insertAdjacentHTML("beforeend", `<button class="side-nav-item" id="toggleMenuHandle" type="button" aria-pressed="false"><span class="nav-glyph">◐</span><span><span id="toggleMenuHandleLabel">Hide Menu Button</span><small id="toggleMenuHandleState">Menu button is visible</small></span></button>`);
  }
  if (!document.getElementById("sideNavRevealZone")) {
    document.body.insertAdjacentHTML("afterbegin", `<div class="side-nav-reveal-zone" id="sideNavRevealZone" aria-hidden="true"></div>`);
  }
  if (!document.getElementById("groupImportDialog")) {
    document.body.insertAdjacentHTML("beforeend", `<div class="group-import-dialog" id="groupImportDialog" role="dialog" aria-modal="true" aria-labelledby="groupImportTitle" aria-hidden="true"><div class="group-import-card"><h2 id="groupImportTitle">Import Class Group</h2><p>Select the class group you want to use in this game.</p><label>Class group<select id="groupImportSelect"></select></label><div class="group-import-members" id="groupImportMembers"></div><div class="group-import-actions"><button class="group-import-cancel" id="groupImportCancel" type="button">Cancel</button><button class="group-import-confirm" id="groupImportConfirm" type="button">Use This Group</button></div></div></div>`);
  }

  const handle = document.getElementById("sideNavHandle");
  const backdrop = document.getElementById("sideNavBackdrop");
  const closeButton = document.getElementById("sideNavClose");
  const backButton = document.getElementById("goBackBtn");
  const importGroupButton = document.getElementById("importGroupBtn");
  const groupImportDialog = document.getElementById("groupImportDialog");
  const groupImportSelect = document.getElementById("groupImportSelect");
  const groupImportMembers = document.getElementById("groupImportMembers");
  const groupImportCancel = document.getElementById("groupImportCancel");
  const groupImportConfirm = document.getElementById("groupImportConfirm");
  const toggleHandleButton = document.getElementById("toggleMenuHandle");
  const toggleHandleLabel = document.getElementById("toggleMenuHandleLabel");
  const toggleHandleState = document.getElementById("toggleMenuHandleState");
  const revealZone = document.getElementById("sideNavRevealZone");
  let menuHandleHidden = false;
  let handleTemporarilyRevealed = false;
  let touchRevealTimer;
  const syncHandleToggle = () => {
    const handleIsVisible = !menuHandleHidden || handleTemporarilyRevealed;
    handle.hidden = !handleIsVisible;
    handle.style.display = handleIsVisible ? "" : "none";
    revealZone.classList.toggle("is-active", menuHandleHidden && !handleTemporarilyRevealed);
    toggleHandleButton.setAttribute("aria-pressed", String(menuHandleHidden));
    toggleHandleLabel.textContent = menuHandleHidden ? "Show Menu Button" : "Hide Menu Button";
    toggleHandleState.textContent = menuHandleHidden ? "Hover or hold the left edge to show it" : "Menu button is visible";
  };
  const close = () => {
    nav.classList.remove("open"); backdrop.classList.remove("show"); nav.setAttribute("aria-hidden", "true"); handle.setAttribute("aria-expanded", "false");
  };
  const open = () => { nav.classList.add("open"); backdrop.classList.add("show"); nav.setAttribute("aria-hidden", "false"); handle.setAttribute("aria-expanded", "true"); };
  const revealHandle = () => {
    if (!menuHandleHidden) return;
    handleTemporarilyRevealed = true;
    syncHandleToggle();
  };
  const savedGroups = () => {
    try {
      const session = JSON.parse(localStorage.getItem("y5a_profile_session_v1") || "null");
      const key = session?.username ? `y5a_profile_${session.username}__y5a_student_groups_v1` : "y5a_student_groups_v1";
      const groups = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(groups) ? groups.filter(group => group && group.name) : [];
    } catch (_) { return []; }
  };
  let importStudents = [];
  const renderImportStudents = () => {
    groupImportMembers.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = `${importStudents.length} students selected`;
    const help = document.createElement("p");
    help.textContent = "Remove names for this game only. Your saved class list stays unchanged.";
    const list = document.createElement("ul");
    list.className = "group-import-students";
    list.style.setProperty("--student-columns", Math.max(1, Math.ceil(importStudents.length / 2)));
    importStudents.forEach((name, index) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${name} from this import`);
      remove.addEventListener("click", () => {
        importStudents.splice(index, 1);
        renderImportStudents();
        const buttons = groupImportMembers.querySelectorAll("li button");
        (buttons[Math.min(index, buttons.length - 1)] || groupImportSelect).focus();
      });
      item.append(label, remove);
      list.append(item);
    });
    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "group-import-restore";
    restore.textContent = "Restore all names";
    restore.addEventListener("click", renderSelectedGroup);
    groupImportMembers.append(heading, help, list, restore);
    groupImportConfirm.disabled = !importStudents.length;
  };
  const renderSelectedGroup = () => {
    const group = savedGroups().find(item => item.id === groupImportSelect.value);
    importStudents = Array.isArray(group?.students) ? group.students.filter(Boolean).map(String) : [];
    renderImportStudents();
  };
  const openGroupImport = () => {
    const groups = savedGroups();
    groupImportSelect.innerHTML = groups.length ? groups.map(group => `<option value="${String(group.id).replace(/"/g, "&quot;")}">${String(group.name).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</option>`).join("") : `<option value="">No saved class groups</option>`;
    groupImportConfirm.disabled = !groups.length;
    renderSelectedGroup();
    groupImportDialog.classList.add("open"); groupImportDialog.setAttribute("aria-hidden", "false"); groupImportSelect.focus();
  };
  const closeGroupImport = () => { groupImportDialog.classList.remove("open"); groupImportDialog.setAttribute("aria-hidden", "true"); };
  const updateVisibility = () => {
    const route = window.location.hash.slice(1);
    const visible = !allowedRoutes.length || allowedRoutes.includes(route);
    if (!visible) {
      menuHandleHidden = false;
      handleTemporarilyRevealed = false;
      close();
      handle.hidden = true;
      handle.style.display = "none";
      revealZone.classList.remove("is-active");
    } else {
      syncHandleToggle();
    }
  };
  handle.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  toggleHandleButton.addEventListener("click", () => {
    menuHandleHidden = !menuHandleHidden;
    handleTemporarilyRevealed = false;
    syncHandleToggle();
    if (menuHandleHidden) close();
  });
  importGroupButton.addEventListener("click", openGroupImport);
  groupImportSelect.addEventListener("change", renderSelectedGroup);
  groupImportCancel.addEventListener("click", closeGroupImport);
  groupImportDialog.addEventListener("click", event => { if (event.target === groupImportDialog) closeGroupImport(); });
  groupImportConfirm.addEventListener("click", () => {
    const group = savedGroups().find(item => item.id === groupImportSelect.value);
    if (!group || !importStudents.length) return;
    window.dispatchEvent(new CustomEvent("game-nav:import-group", {detail:{group:{...group, students:[...importStudents]}}}));
    closeGroupImport();
  });
  revealZone.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") revealHandle(); });
  revealZone.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse") return;
    touchRevealTimer = window.setTimeout(revealHandle, 2000);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => revealZone.addEventListener(type, () => window.clearTimeout(touchRevealTimer)));
  window.addEventListener("hashchange", updateVisibility);
  updateVisibility();
  if (!existingNav) backButton.addEventListener("click", () => { window.location.href = gamesHome; });
})();

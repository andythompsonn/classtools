(() => {
  const gamesHome = document.body.dataset.gamesHome || "../index.html#games";
  const allowedRoutes = (document.body.dataset.gameNavRoutes || "").split(",").filter(Boolean);
  const existingNav = document.getElementById("sideNav");

  if (document.body.dataset.gameTitle && !document.querySelector(".topbar") && !document.querySelector(".game-nav-topbar")) {
    document.body.insertAdjacentHTML("afterbegin", `<header class="game-nav-topbar"><a class="game-nav-brand game-home-brand" href="${gamesHome}" aria-label="Back to Games"><div class="game-nav-logo">${document.body.dataset.gameIcon || "G"}</div><div><h1>${document.body.dataset.gameTitle}</h1><div class="game-nav-subtitle">${document.body.dataset.gameSubtitle || "Classroom game"}</div></div></a></header>`);
  }

  if (document.body.dataset.gameTitle) {
    const gameBrand = document.querySelector(".game-home-brand, .topbar .brand, .topbar .title-wrap");
    if (gameBrand && !gameBrand.matches("a")) {
      gameBrand.classList.add("game-home-brand");
      gameBrand.setAttribute("role", "link");
      gameBrand.setAttribute("tabindex", "0");
      gameBrand.setAttribute("aria-label", "Back to Games");
      const returnToGames = () => { window.location.href = gamesHome; };
      gameBrand.addEventListener("click", returnToGames);
      gameBrand.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); returnToGames(); }
      });
    }
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
          <button class="side-nav-item" id="importListBtn" type="button"><span class="nav-glyph">📋</span><span>Import List<small>Load saved or custom words</small></span></button>
          <button class="side-nav-item" id="toggleMenuHandle" type="button" aria-pressed="false"><span class="nav-glyph">◐</span><span><span id="toggleMenuHandleLabel">Hide Menu Button</span><small id="toggleMenuHandleState">Menu button is visible</small></span></button>
          <a class="side-nav-item" id="goBackBtn" href="${gamesHome}"><span class="nav-glyph">←</span><span>Go Back<small>Return to the games page</small></span></a>
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
  if (!document.getElementById("wordListImportDialog")) {
    document.body.insertAdjacentHTML("beforeend", `<div class="group-import-dialog" id="wordListImportDialog" role="dialog" aria-modal="true" aria-labelledby="wordListImportTitle" aria-hidden="true"><div class="group-import-card word-list-import-card"><div class="word-import-heading"><div><h2 id="wordListImportTitle">Import Word Lists</h2><p>Choose a tab, then drag matching words, definitions, and sentences into the shared box.</p></div><span class="word-import-limit" id="wordListImportLimit"></span></div><div class="word-import-tabs" role="tablist" aria-label="Content to import"><button class="is-active" type="button" role="tab" aria-selected="true" data-word-import-field="word">Words</button><button type="button" role="tab" aria-selected="false" data-word-import-field="definition">Definitions</button><button type="button" role="tab" aria-selected="false" data-word-import-field="sentence">Sentences</button></div><select id="wordListImportField" hidden aria-hidden="true"><option value="word">Words</option><option value="definition">Definitions</option><option value="sentence">Sentences</option></select><div class="word-import-workspace"><section class="word-import-library" aria-labelledby="savedWordListsTitle"><h3 id="savedWordListsTitle">Your word lists</h3><div class="word-import-groups" id="wordListImportGroups"></div></section><section class="word-import-builder" aria-labelledby="puzzleWordsTitle"><div class="word-import-builder-title"><h3 id="puzzleWordsTitle">Selected matching items</h3><button id="wordListImportClear" type="button">Clear all</button></div><div class="word-import-field-toggles" aria-label="Show matching content"><button class="is-active" type="button" aria-pressed="true" data-match-field="word">Word</button><button type="button" aria-pressed="false" data-match-field="definition">Definition</button><button type="button" aria-pressed="false" data-match-field="sentence">Sentence</button><button class="word-import-complete-toggle" id="wordListImportCompleteOnly" type="button" aria-pressed="false">Complete matches only</button></div><div class="word-import-trash" id="wordListImportTrash" aria-hidden="true">Drop here to delete</div><div class="word-import-match-labels" id="wordListImportMatchLabels" aria-hidden="true"></div><div class="word-import-drop-zone" id="wordListImportDropZone"><div class="word-import-selected" id="wordListImportSelected"></div></div><label class="word-import-custom">Add your own items<textarea id="wordListImportCustom" rows="3" placeholder="One per line, or separated by commas"></textarea></label><div class="word-import-summary" id="wordListImportSummary" aria-live="polite"></div></section></div><div class="group-import-actions"><button class="group-import-cancel" id="wordListImportCancel" type="button">Cancel</button><button class="group-import-confirm" id="wordListImportConfirm" type="button">Use These Items</button></div></div></div>`);
  }

  const handle = document.getElementById("sideNavHandle");
  const backdrop = document.getElementById("sideNavBackdrop");
  const closeButton = document.getElementById("sideNavClose");
  const backButton = document.getElementById("goBackBtn");
  const importGroupButton = document.getElementById("importGroupBtn");
  const importListButton = document.getElementById("importListBtn");
  const groupImportDialog = document.getElementById("groupImportDialog");
  const groupImportSelect = document.getElementById("groupImportSelect");
  const groupImportMembers = document.getElementById("groupImportMembers");
  const groupImportCancel = document.getElementById("groupImportCancel");
  const groupImportConfirm = document.getElementById("groupImportConfirm");
  const wordListImportDialog = document.getElementById("wordListImportDialog");
  const wordListImportField = document.getElementById("wordListImportField");
  const wordListImportTabs = [...wordListImportDialog.querySelectorAll("[data-word-import-field]")];
  const wordListImportLimit = document.getElementById("wordListImportLimit");
  const wordListImportGroups = document.getElementById("wordListImportGroups");
  const wordListImportDropZone = document.getElementById("wordListImportDropZone");
  const wordListImportSelected = document.getElementById("wordListImportSelected");
  const wordListImportMatchLabels = document.getElementById("wordListImportMatchLabels");
  const wordListImportFieldToggles = [...wordListImportDialog.querySelectorAll("[data-match-field]")];
  const wordListImportCompleteOnly = document.getElementById("wordListImportCompleteOnly");
  const wordListImportTrash = document.getElementById("wordListImportTrash");
  const wordListImportClear = document.getElementById("wordListImportClear");
  const wordListImportCustom = document.getElementById("wordListImportCustom");
  const wordListImportSummary = document.getElementById("wordListImportSummary");
  const wordListImportCancel = document.getElementById("wordListImportCancel");
  const wordListImportConfirm = document.getElementById("wordListImportConfirm");
  const toggleHandleButton = document.getElementById("toggleMenuHandle");
  const toggleHandleLabel = document.getElementById("toggleMenuHandleLabel");
  const toggleHandleState = document.getElementById("toggleMenuHandleState");
  const revealZone = document.getElementById("sideNavRevealZone");
  let menuHandleHidden = false;
  let handleTemporarilyRevealed = false;
  let touchRevealTimer;
  const importItemLimit = Math.max(1, Number(document.body.dataset.gameImportLimit) || (document.body.dataset.gameTitle === "Word Search" ? 12 : 80));
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
      const username = session?.username || "andy";
      const profileValue = localStorage.getItem(`y5a_profile_${username}__y5a_student_groups_v1`);
      const groups = JSON.parse(profileValue || localStorage.getItem("y5a_student_groups_v1") || "[]");
      return Array.isArray(groups) ? groups.filter(group => group && group.name) : [];
    } catch (_) { return []; }
  };
  const savedWordGroups = () => {
    try {
      const session = JSON.parse(localStorage.getItem("y5a_profile_session_v1") || "null");
      const username = session?.username || "andy";
      const profileValue = localStorage.getItem(`y5a_profile_${username}__y5a_word_groups_v1`);
      const groups = JSON.parse(profileValue || localStorage.getItem("y5a_word_groups_v1") || "[]");
      return Array.isArray(groups) ? groups.filter(group => group && group.name && Array.isArray(group.words)) : [];
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
  const importFieldLabels = {word:"words", definition:"definitions", sentence:"sentences"};
  const importFields = ["word", "definition", "sentence"];
  let selectedImportRows = [];
  let visibleMatchFields = new Set(["word"]);
  let draggedSelectedItem = null;
  let selectedItemWasDroppedInside = false;
  let trashDeletePending = false;
  let completeMatchesOnly = false;
  let customImportItems = {word:"", definition:"", sentence:""};
  const entryFieldValue = (entry, field) => String(typeof entry === "string" ? entry : entry?.[field] || "").trim();
  const entryValue = entry => entryFieldValue(entry, wordListImportField.value);
  const activeImportItems = () => selectedImportRows.map(row => row[wordListImportField.value]).filter(Boolean);
  const customWords = () => wordListImportCustom.value.split(/[\n,;]+/).map(word => word.trim()).filter(Boolean);
  const sourceEntryForMatchKey = matchKey => {
    const separator = String(matchKey).lastIndexOf(":");
    if (separator < 1) return null;
    const groupId = String(matchKey).slice(0, separator);
    const entryIndex = Number(String(matchKey).slice(separator + 1));
    const group = savedWordGroups().find(item => String(item.id) === groupId);
    return Number.isInteger(entryIndex) ? group?.words?.[entryIndex] || null : null;
  };
  const fillMatchingField = field => {
    selectedImportRows.forEach(row => {
      if (row[field]) return;
      const sourceEntry = sourceEntryForMatchKey(row.matchKey);
      const value = entryFieldValue(sourceEntry, field);
      if (value) row[field] = value;
    });
  };
  const removeIncompleteMatches = () => {
    if (!completeMatchesOnly) return;
    selectedImportRows = selectedImportRows.filter(row => [...visibleMatchFields].every(field => row[field]));
  };
  const updateWordImportSummary = () => {
    const totalValues = selectedImportRows.reduce((total, row) => total + importFields.filter(field => row[field]).length, 0) + customWords().length;
    const completeMatches = selectedImportRows.filter(row => row.word && row.definition && row.sentence).length;
    wordListImportSummary.textContent = `${totalValues} items in ${selectedImportRows.length} matched row${selectedImportRows.length === 1 ? "" : "s"} · ${completeMatches} complete match${completeMatches === 1 ? "" : "es"}`;
    wordListImportConfirm.disabled = totalValues === 0;
  };
  const renderSelectedImportWords = () => {
    wordListImportSelected.replaceChildren();
    const fieldsToShow = importFields.filter(field => visibleMatchFields.has(field));
    wordListImportSelected.classList.toggle("compact-items", fieldsToShow.length === 1);
    wordListImportMatchLabels.replaceChildren();
    wordListImportMatchLabels.style.setProperty("--match-columns", fieldsToShow.length);
    fieldsToShow.forEach(field => { const label = document.createElement("span"); label.textContent = field; wordListImportMatchLabels.append(label); });
    if (!selectedImportRows.length) {
      const empty = document.createElement("div"); empty.className = "word-import-drop-empty";
      empty.innerHTML = `<strong>Drop items here</strong><span>Matching words, definitions, and sentences will connect automatically.</span>`;
      wordListImportSelected.append(empty);
    } else selectedImportRows.forEach((row, rowIndex) => {
      const matchRow = document.createElement("div");
      const matchedFieldCount = fieldsToShow.filter(field => row[field]).length;
      matchRow.className = `word-import-match-row${fieldsToShow.length > 1 ? " show-connections" : ""}${matchedFieldCount > 1 ? " is-linked" : ""}${matchedFieldCount === 3 ? " is-complete" : ""}`;
      matchRow.style.setProperty("--match-columns", fieldsToShow.length);
      fieldsToShow.forEach(field => {
        const cell = document.createElement("div"); cell.className = `word-import-match-cell ${row[field] ? "has-value" : "is-empty"}`;
        if (row[field]) {
          cell.draggable = true;
          const text = document.createElement("span"); text.textContent = row[field];
          const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `Remove ${row[field]}`);
          remove.addEventListener("click", () => {
            row[field] = "";
            if (!importFields.some(name => row[name])) selectedImportRows.splice(rowIndex, 1);
            renderSelectedImportWords();
          });
          cell.addEventListener("dragstart", event => {
            draggedSelectedItem = {row, rowIndex, field};
            selectedItemWasDroppedInside = false;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", row[field]);
            cell.classList.add("dragging");
            wordListImportTrash.classList.add("is-visible");
          });
          cell.addEventListener("dragend", () => {
            cell.classList.remove("dragging");
            if (draggedSelectedItem?.row === row && draggedSelectedItem.field === field && !selectedItemWasDroppedInside) {
              selectedImportRows = selectedImportRows.filter(item => item !== row);
              renderSelectedImportWords();
            }
            if (!trashDeletePending) wordListImportTrash.classList.remove("is-visible", "is-delete-target", "is-deleting");
            draggedSelectedItem = null;
          });
          cell.append(text, remove);
        } else {
          cell.textContent = `Add ${field}`;
        }
        matchRow.append(cell);
      });
      wordListImportSelected.append(matchRow);
    });
    updateWordImportSummary();
  };
  const addWordGroup = group => {
    (group?.words || []).forEach((entry, index) => addImportItem(entryValue(entry), `${group.id}:${index}`, wordListImportField.value, false));
    renderSelectedImportWords();
  };
  const addImportItem = (value, matchKey = "", field = wordListImportField.value, rerender = true) => {
    const item = String(value || "").trim();
    if (!item) return;
    let row = matchKey ? selectedImportRows.find(item => item.matchKey === matchKey) : null;
    if (!row) {
      if (selectedImportRows.length >= importItemLimit) return;
      row = {matchKey: matchKey || `custom:${Date.now()}:${Math.random()}`, word:"", definition:"", sentence:""};
      selectedImportRows.push(row);
    }
    row[field] = item;
    [...visibleMatchFields].forEach(fillMatchingField);
    removeIncompleteMatches();
    if (rerender) renderSelectedImportWords();
  };
  const renderWordGroupLibrary = () => {
    const groups = savedWordGroups(); wordListImportGroups.replaceChildren();
    if (!groups.length) {
      const empty = document.createElement("div"); empty.className = "word-import-empty";
      empty.textContent = "No saved lists yet. Add lists on the Words page, or type words on the right."; wordListImportGroups.append(empty); return;
    }
    groups.forEach(group => {
      const entries = (group.words || []).map((entry, index) => ({entry, index, value:entryValue(entry)})).filter(item => item.value);
      const card = document.createElement("article"); card.className = "word-import-group-card"; card.draggable = !!entries.length;
      const top = document.createElement("div"); top.className = "word-import-group-top";
      const name = document.createElement("strong"); name.textContent = group.name;
      const count = document.createElement("span"); count.textContent = `${entries.length} ${importFieldLabels[wordListImportField.value]}`;
      const add = document.createElement("button"); add.type = "button"; add.textContent = "+ Add"; add.disabled = !entries.length; add.addEventListener("click", () => addWordGroup(group));
      top.append(name, count, add);
      const preview = document.createElement("div"); preview.className = "word-import-preview";
      entries.slice(0, 5).forEach(({index, value:word}) => {
        const chip = document.createElement("span"); chip.textContent = word; chip.draggable = true; chip.tabIndex = 0; chip.setAttribute("role", "button"); chip.title = `Drag or click to add ${word}`;
        const itemPayload = JSON.stringify({value:word, matchKey:`${group.id}:${index}`, field:wordListImportField.value});
        chip.addEventListener("dragstart", event => { event.stopPropagation(); event.dataTransfer.setData("application/x-word-import-item", itemPayload); event.dataTransfer.effectAllowed = "copy"; });
        chip.addEventListener("click", event => { event.stopPropagation(); addImportItem(word, `${group.id}:${index}`, wordListImportField.value); });
        chip.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); addImportItem(word, `${group.id}:${index}`, wordListImportField.value); } });
        preview.append(chip);
      });
      if (entries.length > 5) { const more = document.createElement("span"); more.className = "word-import-more"; more.textContent = `+${entries.length - 5}`; preview.append(more); }
      card.addEventListener("dragstart", event => { event.dataTransfer.setData("text/word-group-id", String(group.id)); event.dataTransfer.effectAllowed = "copy"; card.classList.add("dragging"); });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
      card.append(top, preview); wordListImportGroups.append(card);
    });
  };
  const openWordListImport = () => {
    selectedImportRows = []; visibleMatchFields = new Set(["word"]); completeMatchesOnly = false; trashDeletePending = false; wordListImportTrash.classList.remove("is-visible", "is-delete-target", "is-deleting"); wordListImportCompleteOnly.classList.remove("is-active"); wordListImportCompleteOnly.setAttribute("aria-pressed", "false"); customImportItems = {word:"", definition:"", sentence:""}; wordListImportField.value = "word"; wordListImportCustom.value = ""; wordListImportCustom.placeholder = "Add your own words, one per line or separated by commas";
    wordListImportLimit.textContent = `${importItemLimit} items maximum`;
    wordListImportTabs.forEach(tab => { const active = tab.dataset.wordImportField === "word"; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); });
    wordListImportFieldToggles.forEach(toggle => { const active = toggle.dataset.matchField === "word"; toggle.classList.toggle("is-active", active); toggle.setAttribute("aria-pressed", String(active)); });
    renderWordGroupLibrary(); renderSelectedImportWords();
    wordListImportDialog.classList.add("open"); wordListImportDialog.setAttribute("aria-hidden", "false");
    (wordListImportGroups.querySelector("button:not(:disabled)") || wordListImportCustom).focus();
  };
  const closeWordListImport = () => { wordListImportDialog.classList.remove("open"); wordListImportDialog.setAttribute("aria-hidden", "true"); };
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
  document.addEventListener("keydown", event => { if (event.key === "Escape") { close(); closeGroupImport(); closeWordListImport(); } });
  toggleHandleButton.addEventListener("click", () => {
    menuHandleHidden = !menuHandleHidden;
    handleTemporarilyRevealed = false;
    syncHandleToggle();
    if (menuHandleHidden) close();
  });
  importGroupButton.addEventListener("click", openGroupImport);
  if (importListButton) {
    importListButton.addEventListener("click", () => { close(); openWordListImport(); });
  }
  groupImportSelect.addEventListener("change", renderSelectedGroup);
  groupImportCancel.addEventListener("click", closeGroupImport);
  groupImportDialog.addEventListener("click", event => { if (event.target === groupImportDialog) closeGroupImport(); });
  groupImportConfirm.addEventListener("click", () => {
    const group = savedGroups().find(item => item.id === groupImportSelect.value);
    if (!group || !importStudents.length) return;
    window.dispatchEvent(new CustomEvent("game-nav:import-group", {detail:{group:{...group, students:[...importStudents]}}}));
    closeGroupImport();
  });
  wordListImportCustom.addEventListener("input", () => { customImportItems[wordListImportField.value] = wordListImportCustom.value; updateWordImportSummary(); });
  wordListImportTabs.forEach(tab => tab.addEventListener("click", () => {
    customImportItems[wordListImportField.value] = wordListImportCustom.value;
    wordListImportField.value = tab.dataset.wordImportField;
    wordListImportCustom.value = customImportItems[wordListImportField.value];
    wordListImportTabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    wordListImportCustom.placeholder = `Add your own ${importFieldLabels[wordListImportField.value]}, one per line or separated by commas`;
    renderWordGroupLibrary(); renderSelectedImportWords();
  }));
  wordListImportFieldToggles.forEach(toggle => toggle.addEventListener("click", () => {
    const field = toggle.dataset.matchField;
    const turningOn = !visibleMatchFields.has(field);
    if (!turningOn && visibleMatchFields.size === 1) return;
    if (turningOn) {
      visibleMatchFields.add(field);
      fillMatchingField(field);
    } else {
      visibleMatchFields.delete(field);
    }
    removeIncompleteMatches();
    wordListImportFieldToggles.forEach(button => {
      const active = visibleMatchFields.has(button.dataset.matchField);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderSelectedImportWords();
  }));
  wordListImportCompleteOnly.addEventListener("click", () => {
    completeMatchesOnly = !completeMatchesOnly;
    wordListImportCompleteOnly.classList.toggle("is-active", completeMatchesOnly);
    wordListImportCompleteOnly.setAttribute("aria-pressed", String(completeMatchesOnly));
    removeIncompleteMatches();
    renderSelectedImportWords();
  });
  wordListImportClear.addEventListener("click", () => { selectedImportRows = []; customImportItems = {word:"", definition:"", sentence:""}; wordListImportCustom.value = ""; renderSelectedImportWords(); });
  ["dragenter", "dragover"].forEach(type => wordListImportDropZone.addEventListener(type, event => { event.preventDefault(); event.dataTransfer.dropEffect = draggedSelectedItem ? "move" : "copy"; wordListImportDropZone.classList.add("drag-over"); }));
  ["dragleave", "drop"].forEach(type => wordListImportDropZone.addEventListener(type, () => wordListImportDropZone.classList.remove("drag-over")));
  wordListImportDropZone.addEventListener("drop", event => {
    event.preventDefault();
    if (draggedSelectedItem) { selectedItemWasDroppedInside = true; return; }
    const itemPayload = event.dataTransfer.getData("application/x-word-import-item");
    if (itemPayload) {
      try { const item = JSON.parse(itemPayload); addImportItem(item.value, item.matchKey, item.field); } catch (_error) {}
      return;
    }
    const id = event.dataTransfer.getData("text/word-group-id");
    const group = savedWordGroups().find(item => String(item.id) === id);
    if (group) addWordGroup(group);
  });
  ["dragenter", "dragover"].forEach(type => wordListImportTrash.addEventListener(type, event => {
    if (!draggedSelectedItem) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    wordListImportTrash.classList.add("is-delete-target");
  }));
  wordListImportTrash.addEventListener("dragleave", () => wordListImportTrash.classList.remove("is-delete-target"));
  wordListImportTrash.addEventListener("drop", event => {
    if (!draggedSelectedItem) return;
    event.preventDefault();
    const rowToDelete = draggedSelectedItem.row;
    selectedItemWasDroppedInside = true;
    trashDeletePending = true;
    wordListImportTrash.classList.add("is-deleting");
    window.setTimeout(() => {
      selectedImportRows = selectedImportRows.filter(row => row !== rowToDelete);
      wordListImportTrash.classList.remove("is-visible", "is-delete-target", "is-deleting");
      trashDeletePending = false;
      renderSelectedImportWords();
    }, 220);
  });
  wordListImportCancel.addEventListener("click", closeWordListImport);
  wordListImportDialog.addEventListener("click", event => { if (event.target === wordListImportDialog) closeWordListImport(); });
  wordListImportConfirm.addEventListener("click", () => {
    const words = [...new Set([...activeImportItems(), ...customWords()].map(word => word.trim()).filter(Boolean))].slice(0, importItemLimit);
    if (!words.length) return;
    const entries = selectedImportRows.map(({word, definition, sentence}) => ({word, definition, sentence}));
    window.dispatchEvent(new CustomEvent("game-nav:import-list", {detail:{words, mode:wordListImportField.value, entries}}));
    closeWordListImport();
  });
  revealZone.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") revealHandle(); });
  revealZone.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse") return;
    touchRevealTimer = window.setTimeout(revealHandle, 2000);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => revealZone.addEventListener(type, () => window.clearTimeout(touchRevealTimer)));
  window.addEventListener("hashchange", updateVisibility);
  updateVisibility();
})();

(() => {
  // Daily release version: ordinary changes made on 24-09-2026 remain v1.1.7.
  const APP_VERSION = "1.1.7";
  const ACCOUNTS_STORAGE_KEY = "y5a_local_accounts_v1";
  const SESSION_STORAGE_KEY = "y5a_profile_session_v1";
  const PROFILE_PREFIX = "y5a_profile_";
  const STORAGE_KEY = "andy_student_task_checklist";
  const HISTORY_STORAGE_KEY = "andy_student_task_version_history_v1";
  const PASSWORD_STORAGE_KEY = "andy_student_task_lock_password_v1";
  const LANGUAGE_STORAGE_KEY = "andy_student_task_ui_language_v1";
  const BROWSER_STORAGE_NOTICE_KEY = "andy_student_task_browser_storage_notice_v1";
  const STUDENT_GROUPS_KEY = "y5a_student_groups_v1";
  const WORD_GROUPS_KEY = "y5a_word_groups_v1";
  const SHARK_WORD_SOURCE_KEY = "y5a_shark_word_source_v1";
  const JSON_SETUP_DISMISSED_KEY = "y5a_json_setup_dismissed_v1";
  let activeUsername = null;

  function profileKey(key){ return activeUsername ? `${PROFILE_PREFIX}${activeUsername}__${key}` : null; }
  function profileGet(key){ const storedKey = profileKey(key); return storedKey ? localStorage.getItem(storedKey) : null; }
  function profileSet(key, value){ const storedKey = profileKey(key); if (storedKey) localStorage.setItem(storedKey, value); }
  function profileRemove(key){ const storedKey = profileKey(key); if (storedKey) localStorage.removeItem(storedKey); }
  const JSON_HANDLE_DB = "andy_student_task_file_handles";
  const JSON_HANDLE_STORE = "handles";
  const JSON_HANDLE_KEY = "live-json-save";
  const MAX_HISTORY_ENTRIES = 60;
  const LEGACY_STORAGE_KEYS = [
    "andy_student_task_checklist_v3",
    "andy_student_task_checklist_v2",
    "andy_student_task_checklist_v1"
  ];
  const DATA_SCHEMA_VERSION = 1;

  const defaultStudents = [
    "1 伊茉溱 Jasmine",
    "2 何以然 Chloe He",
    "3 徐芯爱 Alicia",
    "4 罗予悦 Elena",
    "5 吴与伦 Evelyn",
    "6 邓依凝 Victoria",
    "7 李婉宸 Charlotte",
    "8 郭钰涵 Ariana",
    "9 王翊童 Claire",
    "10 王允智 Yoonji",
    "11 汪珞昕 Chloe Wang",
    "12 方芷悦 Angela",
    "13 蔡奕霏 Chloe Cai",
    "14 杨嘉耀 Franky",
    "15 维 麦 Mai",
    "16 梅雅杰 Kenneth",
    "17 张友杰 Jayden",
    "18 黄超洋 Gil",
    "19 王翊澄 Julian",
    "20 郭钰轩 Adrian",
    "22 史瑾宸 James",
    "23 张灵均 Eric",
    "24 尤子诚 Ethan You",
    "25 施嘉乐 Jiale",
    "26 童 画 Hannah",
    "27 马思源 Adaline",
    "28 曾思然 Luna"
  ];

  const freshState = () => ({
    students: [...defaultStudents],
    settings: {
      completionTimestamps: false,
      attentionCollapsed: false
    },
    tasks: []
  });

  const browserPrefersChinese = /^zh\b/i.test(
    (navigator.languages && navigator.languages[0]) || navigator.language || ""
  );
  let uiLanguage = profileGet(LANGUAGE_STORAGE_KEY) || (browserPrefersChinese ? "zh" : "en");

  let state = loadState();
  let historyEntries = loadVersionHistory();
  let lastSavedStateSnapshot = cloneChecklistState(state);
  let suppressVersionHistory = false;
  let jsonFileHandle = null;
  let jsonSaveInProgress = false;
  let jsonSavePending = false;
  let jsonStatusMessageTimer = null;

  const floatingTimerLauncher = document.getElementById("floatingTimerLauncher");
  const floatingTimerPanel = document.getElementById("floatingTimerPanel");
  const floatingTimerDragHandle = document.getElementById("floatingTimerDragHandle");
  const floatingTimerDisplay = document.getElementById("floatingTimerDisplay");
  const floatingTimerStartBtn = document.getElementById("floatingTimerStartBtn");
  const floatingTimerResetBtn = document.getElementById("floatingTimerResetBtn");
  const floatingTimerDisplayOnlyBtn = document.getElementById("floatingTimerDisplayOnlyBtn");
  const floatingTimerCloseBtn = document.getElementById("floatingTimerCloseBtn");
  const floatingTimerRevealBtn = document.getElementById("floatingTimerRevealBtn");
  const floatingTimerRange = document.getElementById("floatingTimerRange");
  const floatingTimerScaleValue = document.getElementById("floatingTimerScaleValue");

  const tasksEl = document.getElementById("tasks");
  const attentionHeading = document.getElementById("attentionHeading");
  const attentionList = document.getElementById("attentionList");
  const attentionText = document.getElementById("attentionText");
  const summaryCount = document.getElementById("summaryCount");
  const attentionToggleBtn = document.getElementById("attentionToggleBtn");
  const attentionSummaryPanel = document.querySelector(".summary");
  const tableView = document.getElementById("tableView");
  const tableSummary = document.getElementById("tableSummary");
  const tableTaskFilters = document.getElementById("tableTaskFilters");
  const mainPage = document.getElementById("mainPage");
  const gamesPage = document.getElementById("gamesPage");
  const toolsPage = document.getElementById("toolsPage");
  const sentenceGuessPage = document.getElementById("sentenceGuessPage");
  const wordlePage = document.getElementById("wordlePage");
  const sharkWordPage = document.getElementById("sharkWordPage");
  const hotseatPage = document.getElementById("hotseatPage");
  const tasksPage = document.getElementById("tasksPage");
  const openTasksPageBtn = document.getElementById("openTasksPageBtn");
  const openGamesPageBtn = document.getElementById("openGamesPageBtn");
  const openToolsPageBtn = document.getElementById("openToolsPageBtn");
  const openWordlePageBtn = document.getElementById("openWordlePageBtn");
  const openSentenceGuessPageBtn = document.getElementById("openSentenceGuessPageBtn");
  const openSpinWheelPageBtn = document.getElementById("openSpinWheelPageBtn");
  const openSharkWordPageBtn = document.getElementById("openSharkWordPageBtn");
  const openHotseatPageBtn = document.getElementById("openHotseatPageBtn");
  const gameSearchInput = document.getElementById("gameSearchInput");
  const clearGameSearchBtn = document.getElementById("clearGameSearchBtn");
  const gamesGrid = document.getElementById("gamesGrid");
  const gamesSearchEmpty = document.getElementById("gamesSearchEmpty");
  const gamesGridViewBtn = document.getElementById("gamesGridViewBtn");
  const gamesListViewBtn = document.getElementById("gamesListViewBtn");
  const backToMainBtn = document.getElementById("backToMainBtn");
  const gamesBackToMainBtn = document.getElementById("gamesBackToMainBtn");
  const toolsBackToMainBtn = document.getElementById("toolsBackToMainBtn");
  const toolsTimerMount = document.getElementById("toolsTimerMount");
  if (toolsTimerMount) toolsTimerMount.append(floatingTimerLauncher, floatingTimerPanel);
  const wordleBackToGamesBtn = document.getElementById("wordleBackToGamesBtn");
  const wordleBackToMainBtn = document.getElementById("wordleBackToMainBtn");
  const sentenceGuessBackToGamesBtn = document.getElementById("sentenceGuessBackToGamesBtn");
  const sentenceGuessBackToMainBtn = document.getElementById("sentenceGuessBackToMainBtn");
  const spinWheelPage = document.getElementById("spinWheelPage");
  const spinWheelBackToGamesBtn = document.getElementById("spinWheelBackToGamesBtn");
  const spinWheelBackToMainBtn = document.getElementById("spinWheelBackToMainBtn");
  const sharkWordBackToGamesBtn = document.getElementById("sharkWordBackToGamesBtn");
  const sharkWordBackToMainBtn = document.getElementById("sharkWordBackToMainBtn");
  const sharkWordNewGameBtn = document.getElementById("sharkWordNewGameBtn");
  const sharkWordRevealBtn = document.getElementById("sharkWordRevealBtn");
  const sharkWordKeyboard = document.getElementById("sharkWordKeyboard");
  const sharkWordDisplay = document.getElementById("sharkWordDisplay");
  const sharkWordBubbles = document.getElementById("sharkWordBubbles");
  const sharkWordMisses = document.getElementById("sharkWordMisses");
  const sharkWordMessage = document.getElementById("sharkWordMessage");
  const sharkWordGuesses = document.getElementById("sharkWordGuesses");
  const sharkWordGroupSelect = document.getElementById("sharkWordGroupSelect");
  const importSharkWordGroupBtn = document.getElementById("importSharkWordGroupBtn");
  const hotseatBackToGamesBtn = document.getElementById("hotseatBackToGamesBtn");
  const hotseatBackToMainBtn = document.getElementById("hotseatBackToMainBtn");
  const hotseatWordGroupSelect = document.getElementById("hotseatWordGroupSelect");
  const hotseatShowDefinition = document.getElementById("hotseatShowDefinition");
  const hotseatShowSentence = document.getElementById("hotseatShowSentence");
  const hotseatStartBtn = document.getElementById("hotseatStartBtn");
  const hotseatStatus = document.getElementById("hotseatStatus");
  const hotseatSetup = document.getElementById("hotseatSetup");
  const hotseatCard = document.getElementById("hotseatCard");
  const hotseatWord = document.getElementById("hotseatWord");
  const hotseatDefinition = document.getElementById("hotseatDefinition");
  const hotseatSentence = document.getElementById("hotseatSentence");
  const hotseatNextBtn = document.getElementById("hotseatNextBtn");
  const hotseatRestartBtn = document.getElementById("hotseatRestartBtn");
  const spinWheelCanvas = document.getElementById("spinWheelCanvas");
  const spinWheelDisc = document.getElementById("spinWheelDisc");
  const spinWheelBtn = document.getElementById("spinWheelBtn");
  const spinWheelResult = document.getElementById("spinWheelResult");
  const wheelEntriesInput = document.getElementById("wheelEntriesInput");
  const wheelSingleEntryInput = document.getElementById("wheelSingleEntryInput");
  const addSingleWheelEntryBtn = document.getElementById("addSingleWheelEntryBtn");
  const addWheelEntriesBtn = document.getElementById("addWheelEntriesBtn");
  const clearWheelEntriesBtn = document.getElementById("clearWheelEntriesBtn");
  const importRosterToWheelBtn = document.getElementById("importRosterToWheelBtn");
  const wheelEntryCount = document.getElementById("wheelEntryCount");
  const wheelItemList = document.getElementById("wheelItemList");
  const wordleBoard = document.getElementById("wordleBoard");
  const wordleKeyboard = document.getElementById("wordleKeyboard");
  const wordleMessage = document.getElementById("wordleMessage");
  const wordleNewGameBtn = document.getElementById("wordleNewGameBtn");
  const wordleRevealBtn = document.getElementById("wordleRevealBtn");
  const reportIssueBtn = document.getElementById("reportIssueBtn");
  const openFeedbackAdminBtn = document.getElementById("openFeedbackAdminBtn");
  const reportDialog = document.getElementById("reportDialog");
  const reportForm = document.getElementById("reportForm");
  const reportContextText = document.getElementById("reportContextText");
  const reportFeedbackText = document.getElementById("reportFeedbackText");
  const cancelReportBtn = document.getElementById("cancelReportBtn");
  const feedbackAdminPage = document.getElementById("feedbackAdminPage");
  const feedbackAdminBackBtn = document.getElementById("feedbackAdminBackBtn");
  const adminFeedbackList = document.getElementById("adminFeedbackList");
  const openUpdateLogBtn = document.getElementById("openUpdateLogBtn");
  const updateLogPage = document.getElementById("updateLogPage");
  const updateLogBackBtn = document.getElementById("updateLogBackBtn");

  const tableScaleNote = document.getElementById("tableScaleNote");
  const languageToggleBtn = document.getElementById("languageToggleBtn");
  const lockTableBtn = document.getElementById("lockTableBtn");
  const versionHistoryBtn = document.getElementById("versionHistoryBtn");
  const historyDialog = document.getElementById("historyDialog");
  const historyList = document.getElementById("historyList");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const archiveBtn = document.getElementById("archiveBtn");
  const archiveDialog = document.getElementById("archiveDialog");
  const archiveList = document.getElementById("archiveList");
  const closeArchiveBtn = document.getElementById("closeArchiveBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const changePasswordDialog = document.getElementById("changePasswordDialog");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmNewPasswordInput = document.getElementById("confirmNewPasswordInput");
  const changePasswordError = document.getElementById("changePasswordError");
  const browserStorageNoticeDialog = document.getElementById("browserStorageNoticeDialog");
  const closeBrowserStorageNoticeBtn = document.getElementById("closeBrowserStorageNoticeBtn");
  const closeBrowserStorageNoticeX = document.getElementById("closeBrowserStorageNoticeX");
  const jsonSetupDialog = document.getElementById("jsonSetupDialog");
  const startJsonSetupBtn = document.getElementById("startJsonSetupBtn");
  const skipJsonSetupBtn = document.getElementById("skipJsonSetupBtn");
  const closeJsonSetupBtn = document.getElementById("closeJsonSetupBtn");
  const connectJsonFileBtn = document.getElementById("connectJsonFileBtn");
  const saveJsonNowBtn = document.getElementById("saveJsonNowBtn");
  const disconnectJsonFileBtn = document.getElementById("disconnectJsonFileBtn");
  const jsonSaveStatus = document.getElementById("jsonSaveStatus");
  const jsonSaveStatusText = document.getElementById("jsonSaveStatusText");
  const archiveSortDropdown = document.getElementById("archiveSortDropdown");
  const archiveSortTrigger = document.getElementById("archiveSortTrigger");
  const fullscreenTableBtn = document.getElementById("fullscreenTableBtn");
  const tablePanel = document.getElementById("tablePanel");
  const unlockDialog = document.getElementById("unlockDialog");
  const unlockForm = document.getElementById("unlockForm");
  const unlockPassword = document.getElementById("unlockPassword");
  const unlockError = document.getElementById("unlockError");
  const unlockDialogTitle = document.getElementById("unlockDialogTitle");
  const unlockDialogText = document.getElementById("unlockDialogText");
  const studentNoteDialog = document.getElementById("studentNoteDialog");
  const studentNoteForm = document.getElementById("studentNoteForm");
  const studentNoteTitle = document.getElementById("studentNoteTitle");
  const studentNoteContext = document.getElementById("studentNoteContext");
  const studentNoteText = document.getElementById("studentNoteText");
  let activeNoteTarget = null;
  let pendingUnlockAction = null;
  let activeTaskAudience = "student";
  let activeStudentTaskFilter = "all";
  let showUnfinishedOnly = false;
  let activeTableTaskFilter = "all";
  let activeTaskSort = "date-added";
  let activeArchiveSort = "date-added";
  let tableLocked = false;
  let tableUnlockPassword = profileGet(PASSWORD_STORAGE_KEY) || "journal123";
  const saveStatus = document.getElementById("saveStatus");
  const adminPanel = document.getElementById("adminPanel");
  const adminToggleBtn = document.getElementById("adminToggleBtn");
  const closeAdminBtn = document.getElementById("closeAdminBtn");
  const studentManagerPage = document.getElementById("studentManagerPage");
  const studentManagerBackBtn = document.getElementById("studentManagerBackBtn");
  const wordManagerPage = document.getElementById("wordManagerPage");
  const wordManagerBackBtn = document.getElementById("wordManagerBackBtn");
  const studentDetailDialog = document.getElementById("studentDetailDialog");
  const studentDetailName = document.getElementById("studentDetailName");
  const studentDetailSummary = document.getElementById("studentDetailSummary");
  const studentDetailContent = document.getElementById("studentDetailContent");
  const dataTransferDialog = document.getElementById("dataTransferDialog");
  const dataTransferText = document.getElementById("dataTransferText");
  const dataTransferMessage = document.getElementById("dataTransferMessage");
  const rosterList = document.getElementById("rosterList");
  const batchStudentPanel = document.getElementById("batchStudentPanel");
  const batchStudentText = document.getElementById("batchStudentText");
  const batchStudentMessage = document.getElementById("batchStudentMessage");
  const importFile = document.getElementById("importFile");
  const studentGroupSelect = document.getElementById("studentGroupSelect");
  const newStudentGroupName = document.getElementById("newStudentGroupName");
  const addStudentGroupBtn = document.getElementById("addStudentGroupBtn");
  const renameStudentGroupBtn = document.getElementById("renameStudentGroupBtn");
  const deleteStudentGroupBtn = document.getElementById("deleteStudentGroupBtn");
  const wordGroupSelect = document.getElementById("wordGroupSelect");
  const newWordGroupName = document.getElementById("newWordGroupName");
  const addWordGroupBtn = document.getElementById("addWordGroupBtn");
  const renameWordGroupBtn = document.getElementById("renameWordGroupBtn");
  const deleteWordGroupBtn = document.getElementById("deleteWordGroupBtn");
  const newWordInput = document.getElementById("newWordInput");
  const newWordDefinitionInput = document.getElementById("newWordDefinitionInput");
  const newWordSentenceInput = document.getElementById("newWordSentenceInput");
  const addSingleWordBtn = document.getElementById("addSingleWordBtn");
  const showWordImportBtn = document.getElementById("showWordImportBtn");
  const wordImportPanel = document.getElementById("wordImportPanel");
  const wordImportText = document.getElementById("wordImportText");
  const wordImportMessage = document.getElementById("wordImportMessage");
  const cancelWordImportBtn = document.getElementById("cancelWordImportBtn");
  const applyWordImportBtn = document.getElementById("applyWordImportBtn");
  const wordEntryList = document.getElementById("wordEntryList");
  const wheelGroupSelect = document.getElementById("wheelGroupSelect");
  const siteControls = document.getElementById("siteControls");

  // These two controls are available throughout the classroom hub. The
  // remaining toolbar buttons stay inside the Tasks page.
  siteControls.append(languageToggleBtn, adminToggleBtn);
  document.body.append(adminPanel);
  const loginDialog = document.getElementById("loginDialog");
  const loginForm = document.getElementById("loginForm");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const profileAvatarBtn = document.getElementById("profileAvatarBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileNameLabel = document.getElementById("profileNameLabel");
  const avatarPicker = document.getElementById("avatarPicker");
  const profileAddStudentsBtn = document.getElementById("profileAddStudentsBtn");
  const profileManageWordsBtn = document.getElementById("profileManageWordsBtn");
  const profileChangePasswordBtn = document.getElementById("profileChangePasswordBtn");
  const profilePasswordDialog = document.getElementById("profilePasswordDialog");
  const profilePasswordForm = document.getElementById("profilePasswordForm");
  const profileCurrentPassword = document.getElementById("profileCurrentPassword");
  const profileNewPassword = document.getElementById("profileNewPassword");
  const profileConfirmPassword = document.getElementById("profileConfirmPassword");
  const profilePasswordError = document.getElementById("profilePasswordError");
  const cancelProfilePasswordBtn = document.getElementById("cancelProfilePasswordBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function accounts(){
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY)) || {andy:{password:"password"}}; }
    catch (_) { return {andy:{password:"password"}}; }
  }
  function saveAccounts(value){ localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(value)); }
  function setAnimalAvatar(username, avatar){
    const all = accounts();
    const account = all[username];
    account.avatar = avatar % 30;
    saveAccounts(all);
    const column = avatar % 6;
    const row = Math.floor(avatar / 6);
    profileAvatarBtn.classList.add("has-animal");
    profileAvatarBtn.style.backgroundPosition = `${column * 20}% ${row * 25}%`;
    profileAvatarBtn.textContent = "";
    profileAvatarBtn.title = `${username}'s animal avatar`;
    avatarPicker.querySelectorAll("button").forEach(button => {
      button.classList.toggle("selected", Number(button.dataset.avatar) === account.avatar);
    });
  }
  function applyAnimalAvatar(username){
    const account = accounts()[username];
    setAnimalAvatar(username, typeof account.avatar === "number" ? account.avatar : Math.floor(Math.random() * 30));
  }
  function buildAvatarPicker(){
    for (let avatar = 0; avatar < 30; avatar++){
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.avatar = String(avatar);
      button.setAttribute("aria-label", `Choose animal avatar ${avatar + 1}`);
      button.style.backgroundPosition = `${(avatar % 6) * 20}% ${Math.floor(avatar / 6) * 25}%`;
      button.addEventListener("click", () => { if (activeUsername) setAnimalAvatar(activeUsername, avatar); });
      avatarPicker.append(button);
    }
  }
  function activateProfile(username){
    activeUsername = username;
    // Preserve the original single-user project data for Andy on first login.
    if (username === "andy"){
      [STORAGE_KEY, HISTORY_STORAGE_KEY, PASSWORD_STORAGE_KEY, LANGUAGE_STORAGE_KEY,
       BROWSER_STORAGE_NOTICE_KEY, FEEDBACK_STORAGE_KEY, WHEEL_STORAGE_KEY].forEach(key => {
        if (profileGet(key) === null){
          const legacy = localStorage.getItem(key);
          if (legacy !== null) profileSet(key, legacy);
        }
      });
    }
    uiLanguage = profileGet(LANGUAGE_STORAGE_KEY) || (browserPrefersChinese ? "zh" : "en");
    state = loadState(); historyEntries = loadVersionHistory(); wheelItems = loadWheelItems();
    studentGroups = loadStudentGroups();
    activeStudentGroupId = studentGroups[0].id;
    wordGroups = loadWordGroups();
    activeWordGroupId = wordGroups[0].id;
    sharkWordSourceWords = loadSharkWordSource();
    syncStudentsFromActiveGroup();
    lastSavedStateSnapshot = cloneChecklistState(state);
    tableUnlockPassword = profileGet(PASSWORD_STORAGE_KEY) || "journal123";
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({id:uid(), username, createdAt:new Date().toISOString()}));
    profileNameLabel.textContent = username;
    applyAnimalAvatar(username);
    siteControls.hidden = false; profileMenu.hidden = true;
    if (loginDialog.open) loginDialog.close();
    render(); renderSpinWheel(); applyRoute(); applyTranslations(document); restoreJsonSaveConnection(); saveState();
  }
  function showLogin(){ siteControls.hidden = true; profileMenu.hidden = true; loginError.textContent = ""; loginPassword.value = ""; loginDialog.showModal(); loginUsername.focus(); }
  loginForm.addEventListener("submit", event => {
    event.preventDefault(); const username = loginUsername.value.trim().toLowerCase(); const record = accounts()[username];
    if (!record || record.password !== loginPassword.value){ loginError.textContent = "Incorrect username or password."; return; }
    activateProfile(username);
  });
  createAccountBtn.addEventListener("click", () => {
    const username = loginUsername.value.trim().toLowerCase(), password = loginPassword.value;
    if (!/^[a-z0-9_-]{3,20}$/.test(username) || password.length < 4){ loginError.textContent = "Use 3–20 letters, numbers, _ or -, and a password of at least 4 characters."; return; }
    const all = accounts(); if (all[username]) { loginError.textContent = "That username already exists."; return; }
    all[username] = {password, avatar:Math.floor(Math.random() * 30)}; saveAccounts(all); activateProfile(username);
  });
  profileAvatarBtn.addEventListener("click", () => { profileMenu.hidden = !profileMenu.hidden; });
  buildAvatarPicker();
  profileAddStudentsBtn.addEventListener("click", () => {
    profileMenu.hidden = true;
    if (!tableLocked) navigateTo("students");
  });
  profileManageWordsBtn.addEventListener("click", () => {
    profileMenu.hidden = true;
    navigateTo("words");
  });
  profileChangePasswordBtn.addEventListener("click", () => {
    profileMenu.hidden = true; profilePasswordForm.reset(); profilePasswordError.textContent = ""; profilePasswordDialog.showModal();
  });
  cancelProfilePasswordBtn.addEventListener("click", () => profilePasswordDialog.close());
  profilePasswordForm.addEventListener("submit", event => {
    event.preventDefault(); const all = accounts(); const account = all[activeUsername];
    if (!account || account.password !== profileCurrentPassword.value){ profilePasswordError.textContent = "Current password is incorrect."; return; }
    if (profileNewPassword.value !== profileConfirmPassword.value){ profilePasswordError.textContent = "New passwords do not match."; return; }
    if (profileNewPassword.value.length < 4){ profilePasswordError.textContent = "Use at least 4 characters."; return; }
    account.password = profileNewPassword.value; saveAccounts(all); profilePasswordDialog.close();
  });
  logoutBtn.addEventListener("click", () => { localStorage.removeItem(SESSION_STORAGE_KEY); activeUsername = null; showLogin(); });

  function uid(){
    return (crypto.randomUUID ? crypto.randomUUID() :
      "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));
  }

  function loadStudentGroups(){
    try{
      const saved = JSON.parse(profileGet(STUDENT_GROUPS_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) return saved;
    }catch(_){}
    return [{id:"default", name:"Class list", students:[...state.students]}];
  }
  let studentGroups = loadStudentGroups();
  let activeStudentGroupId = studentGroups[0].id;
  function saveStudentGroups(){ profileSet(STUDENT_GROUPS_KEY, JSON.stringify(studentGroups)); }
  function activeStudentGroup(){ return studentGroups.find(group => group.id === activeStudentGroupId) || studentGroups[0]; }
  function renderStudentGroups(){
    studentGroupSelect.innerHTML = "";
    studentGroups.forEach(group => { const option=document.createElement("option"); option.value=group.id; option.textContent=group.name; studentGroupSelect.append(option); });
    studentGroupSelect.value = activeStudentGroupId;
  }

  function syncStudentsFromActiveGroup(){
    const group = activeStudentGroup();
    state.students = Array.isArray(group?.students) ? [...group.students] : [];
  }

  function renderWheelGroupChoices(){
    if (!wheelGroupSelect) return;
    wheelGroupSelect.innerHTML = "";
    studentGroups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      wheelGroupSelect.append(option);
    });
    wheelGroupSelect.value = studentGroups.some(group => group.id === activeStudentGroupId)
      ? activeStudentGroupId
      : studentGroups[0]?.id || "";
  }

  function loadWordGroups(){
    try{
      const saved = JSON.parse(profileGet(WORD_GROUPS_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) return saved.map(group => ({
        ...group,
        words: Array.isArray(group.words) ? group.words.map(normalizeWordEntry) : []
      }));
    }catch(_){}
    return [{id:"default-words", name:"My words", words:[]}];
  }
  let wordGroups = loadWordGroups();
  let activeWordGroupId = wordGroups[0].id;
  function activeWordGroup(){ return wordGroups.find(group => group.id === activeWordGroupId) || wordGroups[0]; }
  function saveWordGroups(){ profileSet(WORD_GROUPS_KEY, JSON.stringify(wordGroups)); }
  function normalizeWordEntry(entry){
    if (typeof entry === "string") return {word:entry.trim(), definition:"", sentence:""};
    return {word:String(entry?.word || "").trim(), definition:String(entry?.definition || "").trim(), sentence:String(entry?.sentence || "").trim()};
  }
  function renderWordGroups(){
    wordGroupSelect.innerHTML = "";
    wordGroups.forEach(group => { const option = document.createElement("option"); option.value = group.id; option.textContent = group.name; wordGroupSelect.append(option); });
    wordGroupSelect.value = activeWordGroupId;
  }
  function renderWordEntries(){
    renderWordGroups();
    wordEntryList.innerHTML = "";
    const words = activeWordGroup().words || [];
    words.forEach((entry, index) => {
      const word = normalizeWordEntry(entry);
      const row = document.createElement("div"); row.className = "word-entry-row";
      const input = document.createElement("input"); input.value = word.word; input.placeholder = "Word"; input.setAttribute("aria-label", `Word ${index + 1}`);
      const definition = document.createElement("input"); definition.value = word.definition; definition.placeholder = "Definition"; definition.setAttribute("aria-label", `Definition for ${word.word || `word ${index + 1}`}`);
      const sentence = document.createElement("input"); sentence.value = word.sentence; sentence.placeholder = "Example sentence"; sentence.setAttribute("aria-label", `Example sentence for ${word.word || `word ${index + 1}`}`);
      const saveEntry = () => { const next = normalizeWordEntry({word:input.value, definition:definition.value, sentence:sentence.value}); if (next.word) { activeWordGroup().words[index] = next; saveWordGroups(); } else { activeWordGroup().words.splice(index, 1); saveWordGroups(); renderWordEntries(); } };
      input.addEventListener("change", saveEntry); definition.addEventListener("change", saveEntry); sentence.addEventListener("change", saveEntry);
      const destination = document.createElement("select"); destination.setAttribute("aria-label", `Choose a word group for ${word.word || `word ${index + 1}`}`);
      wordGroups.forEach(group => { const option = document.createElement("option"); option.value = group.id; option.textContent = group.name; destination.append(option); });
      destination.value = activeWordGroupId;
      const actions = document.createElement("div"); actions.className = "word-entry-actions";
      const move = document.createElement("button"); move.className = "secondary small"; move.type = "button"; move.textContent = "Move";
      const copy = document.createElement("button"); copy.className = "secondary small"; copy.type = "button"; copy.textContent = "Copy";
      move.addEventListener("click", () => transferWordEntry(index, destination.value, true));
      copy.addEventListener("click", () => transferWordEntry(index, destination.value, false));
      actions.append(move, copy);
      const remove = document.createElement("button"); remove.className = "danger-btn small"; remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", () => { activeWordGroup().words.splice(index, 1); saveWordGroups(); renderWordEntries(); });
      actions.append(remove); row.append(input, definition, sentence, destination, actions); wordEntryList.append(row);
    });
  }
  function addWordsToActiveGroup(words){
    const group = activeWordGroup();
    const existing = new Set((group.words || []).map(entry => normalizeWordEntry(entry).word.toLocaleLowerCase()));
    const additions = words.map(normalizeWordEntry).filter(entry => entry.word).filter(entry => !existing.has(entry.word.toLocaleLowerCase()));
    group.words.push(...additions); saveWordGroups(); renderWordEntries(); return additions.length;
  }
  function transferWordEntry(index, destinationId, removeFromCurrent){
    const source = activeWordGroup();
    const destination = wordGroups.find(group => group.id === destinationId);
    if (!destination || destination.id === source.id){
      alert("Choose a different word group first.");
      return;
    }
    const entry = normalizeWordEntry(source.words[index]);
    const alreadyThere = (destination.words || []).some(item => normalizeWordEntry(item).word.toLocaleLowerCase() === entry.word.toLocaleLowerCase());
    if (alreadyThere){
      alert("That word is already in the selected group.");
      return;
    }
    destination.words.push({...entry});
    if (removeFromCurrent) source.words.splice(index, 1);
    saveWordGroups();
    renderWordEntries();
  }
  function parseWordListImport(text){
    const entries = [];
    let current = null;
    const finishCurrent = () => {
      if (current?.word) entries.push(normalizeWordEntry(current));
      current = null;
    };
    text.split(/\r?\n/).forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;
      const tagged = line.match(/^([WDS]):\s*(.*)$/i);
      if (!tagged){
        finishCurrent();
        line.split(",").map(item => item.trim()).filter(Boolean).forEach(word => entries.push({word, definition:"", sentence:""}));
        return;
      }
      const [, tag, value] = tagged;
      if (tag.toUpperCase() === "W"){
        finishCurrent();
        current = {word:value.trim(), definition:"", sentence:""};
      } else if (current){
        if (tag.toUpperCase() === "D") current.definition = value.trim();
        if (tag.toUpperCase() === "S") current.sentence = value.trim();
      }
    });
    finishCurrent();
    return entries;
  }

  function safeState(raw){
    if (!raw || !Array.isArray(raw.students) || !Array.isArray(raw.tasks)) return freshState();

    const students = raw.students
      .map(x => String(x).trim())
      .filter(Boolean);

    const tasks = raw.tasks.map(t => ({
      id: String(t.id || uid()),
      title: String(t.title || "Untitled Task"),
      completed: typeof t.completed === "object" && t.completed ? t.completed : {},
      completedAt: typeof t.completedAt === "object" && t.completedAt ? t.completedAt : {},
      completionHistory: typeof t.completionHistory === "object" && t.completionHistory ? t.completionHistory : {},
      absent: typeof t.absent === "object" && t.absent ? t.absent : {},
      notes: typeof t.notes === "object" && t.notes ? t.notes : {},
      archived: !!t.archived,
      archivedAt: typeof t.archivedAt === "string" ? t.archivedAt : "",
      createdAt:
        typeof t.createdAt === "string" && t.createdAt
          ? t.createdAt
          : (typeof t.archivedAt === "string" && t.archivedAt ? t.archivedAt : ""),
      audience: t.audience === "teacher" ? "teacher" : "student",
      studentTaskType:
        t.studentTaskType === "homework" ? "homework" :
        t.studentTaskType === "classwork" ? "classwork" :
        (/HW|Homework/i.test(String(t.category || "")) ? "homework" : "classwork"),
      workMode:
        t.workMode === "pair" ? "pair" :
        t.workMode === "group" ? "group" :
        t.workMode === "" ? "" :
        "individual",
      pairSelectionMode:
        t.pairSelectionMode === "automatic" ? "automatic" :
        t.pairSelectionMode === "manual" ? "manual" :
        "",
      pairSetupStage:
        t.pairSetupStage === "attendance" ? "attendance" :
        t.pairSetupStage === "manual-pairing" ? "manual-pairing" :
        t.pairSetupStage === "ready" ? "ready" :
        "",
      pairGroups: Array.isArray(t.pairGroups)
        ? t.pairGroups
            .filter(group => Array.isArray(group))
            .map(group => group.map(name => String(name)).filter(Boolean))
            .filter(group => group.length)
        : [],
      groupSelectionMode:
        t.groupSelectionMode === "automatic" ? "automatic" :
        t.groupSelectionMode === "manual" ? "manual" :
        (
          t.workMode === "group" &&
          (
            t.groupSetupStage === "attendance" ||
            t.groupSetupStage === "size" ||
            t.groupSetupStage === "ready" ||
            (Array.isArray(t.groupGroups) && t.groupGroups.length)
          )
            ? "automatic"
            : ""
        ),
      groupSetupStage:
        t.groupSetupStage === "attendance" ? "attendance" :
        t.groupSetupStage === "size" ? "size" :
        t.groupSetupStage === "manual-grouping" ? "manual-grouping" :
        t.groupSetupStage === "ready" ? "ready" :
        "",
      groupSize: [3,4,5,6].includes(Number(t.groupSize)) ? Number(t.groupSize) : 0,
      groupGroups: Array.isArray(t.groupGroups)
        ? t.groupGroups
            .filter(group => Array.isArray(group))
            .map(group => group.map(name => String(name)).filter(Boolean))
            .filter(group => group.length)
        : [],
      collapsed: !!t.collapsed,
      category: ({
        "UOI Classwork":"UOI CW",
        "UOI Homework":"UOI HW",
        "English Classwork":"English CW",
        "English Homework":"English HW",
        "Read and Response Journal":"RR Journal",
        "UOI CW":"UOI CW",
        "UOI HW":"UOI HW",
        "English CW":"English CW",
        "English HW":"English HW",
        "RR Journal":"RR Journal"
      }[t.category] || "UOI CW"),
      dueAt: typeof t.dueAt === "string" && t.dueAt
        ? String(t.dueAt).slice(0,10)
        : "",
      classDueMode:
        ["this-class", "next-class", "later-today", "custom"].includes(t.classDueMode)
          ? t.classDueMode
          : (
              (t.studentTaskType === "homework" || /HW|Homework/i.test(String(t.category || "")))
                ? ""
                : (
                    String(t.dueAt || "").slice(0,10) === localDateValue(new Date())
                      ? "this-class"
                      : "custom"
                  )
            ),
      classDueAt:
        typeof t.classDueAt === "string" && t.classDueAt
          ? t.classDueAt
          : "",
      forcedOverdue: !!t.forcedOverdue
    }));

    return {
      students: students.length ? students : [...defaultStudents],
      settings: {
        completionTimestamps: !!(raw.settings && raw.settings.completionTimestamps),
        attentionCollapsed: !!(raw.settings && raw.settings.attentionCollapsed)
      },
      tasks
    };
  }

  function loadState(){
    try{
      let saved = profileGet(STORAGE_KEY);

      if (!saved && activeUsername === "andy"){
        for (const legacyKey of LEGACY_STORAGE_KEYS){
          const legacy = localStorage.getItem(legacyKey);
          if (legacy){
            saved = legacy;
            try{
              profileSet(STORAGE_KEY, legacy);
            }catch(_){}
            break;
          }
        }
      }

      if (!saved) return freshState();

      const parsed = JSON.parse(saved);
      // Accept both the old raw-state format and the newer portable backup format.
      return safeState(parsed.data || parsed);
    }catch(e){
      console.warn("Could not load saved checklist", e);
      return freshState();
    }
  }

  function cloneChecklistState(value){
    return JSON.parse(JSON.stringify(value));
  }

  function loadVersionHistory(){
    try{
      const raw = JSON.parse(profileGet(HISTORY_STORAGE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];

      return raw
        .filter(entry =>
          entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.description === "string" &&
          entry.before &&
          Array.isArray(entry.before.students) &&
          Array.isArray(entry.before.tasks)
        )
        .slice(0, MAX_HISTORY_ENTRIES);
    }catch(e){
      console.warn("Could not load version history", e);
      return [];
    }
  }

  function saveVersionHistory(){
    try{
      profileSet(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries.slice(0, MAX_HISTORY_ENTRIES)));
      queueJsonFileSave();
    }catch(e){
      // Full checklist snapshots can be relatively large. If browser storage
      // becomes full, progressively discard the oldest entries and retry.
      while (historyEntries.length > 5){
        historyEntries.pop();
        try{
          profileSet(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
          return;
        }catch(_){}
      }
      console.warn("Could not save version history", e);
    }
  }

  function sameNameSet(a, b){
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const aa = [...a].map(String).sort();
    const bb = [...b].map(String).sort();
    return aa.every((name, index) => name === bb[index]);
  }

  function completionContextText(task, students){
    if (!task || !students || students.length !== 1) return "";
    const student = students[0];

    if (taskWorkMode(task) === "group" && Array.isArray(task.groupGroups)){
      const index = task.groupGroups.findIndex(group => group.includes(student));
      if (index >= 0) return ` (Group ${index + 1})`;
    }

    if (taskWorkMode(task) === "pair" && Array.isArray(task.pairGroups)){
      const index = task.pairGroups.findIndex(group => group.includes(student));
      if (index >= 0) return ` (Pair ${index + 1})`;
    }

    return "";
  }

  function summarizeChecklistChange(before, after){
    if (!before || !after) return {description:"Updated checklist", key:"checklist"};

    const beforeStudents = Array.isArray(before.students) ? before.students : [];
    const afterStudents = Array.isArray(after.students) ? after.students : [];
    if (JSON.stringify(beforeStudents) !== JSON.stringify(afterStudents)){
      return {description:"Updated student list", key:"students"};
    }

    const beforeTasks = Array.isArray(before.tasks) ? before.tasks : [];
    const afterTasks = Array.isArray(after.tasks) ? after.tasks : [];
    const beforeMap = new Map(beforeTasks.map(task => [task.id, task]));
    const afterMap = new Map(afterTasks.map(task => [task.id, task]));

    const added = afterTasks.filter(task => !beforeMap.has(task.id));
    if (added.length){
      const task = added[0];
      return {
        description:`Added task: ${task.title || "Untitled Task"}`,
        key:`task-add:${task.id}`
      };
    }

    const removed = beforeTasks.filter(task => !afterMap.has(task.id));
    if (removed.length){
      const task = removed[0];
      return {
        description:`Deleted task: ${task.title || "Untitled Task"}`,
        key:`task-delete:${task.id}`
      };
    }

    for (const afterTask of afterTasks){
      const beforeTask = beforeMap.get(afterTask.id);
      if (!beforeTask) continue;
      const taskName = afterTask.title || beforeTask.title || "Untitled Task";

      if (!!beforeTask.archived !== !!afterTask.archived){
        return {
          description: afterTask.archived
            ? `Archived task: ${taskName}`
            : `Restored task from archive: ${taskName}`,
          key:`archive:${afterTask.id}`
        };
      }

      const allStudents = [...new Set([
        ...Object.keys(beforeTask.completed || {}),
        ...Object.keys(afterTask.completed || {}),
        ...beforeStudents,
        ...afterStudents
      ])];

      const changedCompletion = allStudents.filter(student =>
        !!(beforeTask.completed && beforeTask.completed[student]) !==
        !!(afterTask.completed && afterTask.completed[student])
      );

      if (changedCompletion.length){
        const allNowComplete = changedCompletion.every(student =>
          !!(afterTask.completed && afterTask.completed[student])
        );
        const allNowIncomplete = changedCompletion.every(student =>
          !(afterTask.completed && afterTask.completed[student])
        );
        const direction = allNowComplete ? "complete" : (allNowIncomplete ? "incomplete" : "updated");

        if (changedCompletion.length === 1){
          const student = changedCompletion[0];
          return {
            description:`Marked ${student} ${direction} in ${taskName}${completionContextText(afterTask, changedCompletion)}`,
            key:`completion:${afterTask.id}:${student}`
          };
        }

        const groups =
          taskWorkMode(afterTask) === "group" && Array.isArray(afterTask.groupGroups)
            ? afterTask.groupGroups
            : taskWorkMode(afterTask) === "pair" && Array.isArray(afterTask.pairGroups)
              ? afterTask.pairGroups
              : [];

        const exactGroupIndex = groups.findIndex(group => sameNameSet(group, changedCompletion));
        if (exactGroupIndex >= 0 && (allNowComplete || allNowIncomplete)){
          const label = taskWorkMode(afterTask) === "group" ? "Group" : "Pair";
          return {
            description:`Marked ${label} ${exactGroupIndex + 1} ${direction} in ${taskName}`,
            key:`completion:${afterTask.id}:${label.toLowerCase()}:${exactGroupIndex}`
          };
        }

        const required = afterStudents.filter(student =>
          !(afterTask.absent && afterTask.absent[student])
        );
        if (
          required.length &&
          sameNameSet(required, changedCompletion) &&
          (allNowComplete || allNowIncomplete)
        ){
          return {
            description:`Marked all students ${direction} in ${taskName}`,
            key:`completion:${afterTask.id}:all`
          };
        }

        return {
          description:`Updated completion for ${changedCompletion.length} students in ${taskName}`,
          key:`completion:${afterTask.id}:multi`
        };
      }

      const absentStudents = [...new Set([
        ...Object.keys(beforeTask.absent || {}),
        ...Object.keys(afterTask.absent || {}),
        ...beforeStudents,
        ...afterStudents
      ])].filter(student =>
        !!(beforeTask.absent && beforeTask.absent[student]) !==
        !!(afterTask.absent && afterTask.absent[student])
      );

      if (absentStudents.length === 1){
        const student = absentStudents[0];
        const absent = !!(afterTask.absent && afterTask.absent[student]);
        return {
          description:`Marked ${student} ${absent ? "absent" : "present"} in ${taskName}`,
          key:`absent:${afterTask.id}:${student}`
        };
      }

      if (beforeTask.title !== afterTask.title){
        return {
          description:`Renamed task to: ${afterTask.title || "Untitled Task"}`,
          key:`title:${afterTask.id}`
        };
      }

      if (!!beforeTask.forcedOverdue !== !!afterTask.forcedOverdue){
        return {
          description: afterTask.forcedOverdue
            ? `Marked task as overdue: ${taskName}`
            : `Cleared overdue flag: ${taskName}`,
          key:`forced-overdue:${afterTask.id}`
        };
      }

      if (
        (beforeTask.dueAt || "") !== (afterTask.dueAt || "") ||
        (beforeTask.classDueMode || "") !== (afterTask.classDueMode || "") ||
        (beforeTask.classDueAt || "") !== (afterTask.classDueAt || "")
      ){
        return {
          description:`Changed due time for ${taskName} to ${formatDue(afterTask)}`,
          key:`due:${afterTask.id}`
        };
      }

      if (
        beforeTask.audience !== afterTask.audience ||
        beforeTask.studentTaskType !== afterTask.studentTaskType
      ){
        const destination =
          afterTask.audience === "teacher"
            ? "Teacher Task"
            : afterTask.studentTaskType === "homework"
              ? "Homework"
              : "Classwork";
        return {
          description:`Moved ${taskName} to ${destination}`,
          key:`move:${afterTask.id}`
        };
      }

      if (
        beforeTask.workMode !== afterTask.workMode ||
        beforeTask.pairSelectionMode !== afterTask.pairSelectionMode ||
        beforeTask.groupSelectionMode !== afterTask.groupSelectionMode ||
        beforeTask.pairSetupStage !== afterTask.pairSetupStage ||
        beforeTask.groupSetupStage !== afterTask.groupSetupStage ||
        Number(beforeTask.groupSize || 0) !== Number(afterTask.groupSize || 0) ||
        JSON.stringify(beforeTask.pairGroups || []) !== JSON.stringify(afterTask.pairGroups || []) ||
        JSON.stringify(beforeTask.groupGroups || []) !== JSON.stringify(afterTask.groupGroups || [])
      ){
        return {
          description:`Changed task setup for ${taskName}`,
          key:`setup:${afterTask.id}`
        };
      }

      if (JSON.stringify(beforeTask.notes || {}) !== JSON.stringify(afterTask.notes || {})){
        return {
          description:`Updated a student note in ${taskName}`,
          key:`note:${afterTask.id}`
        };
      }

      // Collapsing or expanding a task is display-only and intentionally
      // doesn't create a version-history entry.
      const beforeComparable = {...beforeTask};
      const afterComparable = {...afterTask};
      delete beforeComparable.collapsed;
      delete afterComparable.collapsed;
      if (JSON.stringify(beforeComparable) !== JSON.stringify(afterComparable)){
        return {
          description:`Updated task: ${taskName}`,
          key:`task:${afterTask.id}`
        };
      }
    }

    // Other settings such as attention-panel collapse are presentation preferences,
    // so avoid filling Version History with UI-only actions.
    return null;
  }

  function addVersionHistoryEntry(summary, beforeSnapshot){
    if (!summary || !beforeSnapshot) return;

    const now = new Date();
    const latest = historyEntries[0];
    const canCoalesce =
      latest &&
      latest.key === summary.key &&
      (now.getTime() - new Date(latest.timestamp).getTime()) < 1800;

    if (canCoalesce){
      // Keep the original "before" snapshot so rapid edits (such as typing a
      // task title) still restore to before the entire edit.
      latest.description = summary.description;
      latest.timestamp = now.toISOString();
    } else {
      historyEntries.unshift({
        id: uid(),
        timestamp: now.toISOString(),
        description: summary.description,
        key: summary.key || "checklist",
        before: cloneChecklistState(beforeSnapshot)
      });
    }

    historyEntries = historyEntries.slice(0, MAX_HISTORY_ENTRIES);
    saveVersionHistory();
  }

  function historyTimeText(iso){
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    return sameDay
      ? `Today ${d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
      : d.toLocaleString([], {
          month:"short",
          day:"numeric",
          hour:"2-digit",
          minute:"2-digit"
        });
  }

  function renderVersionHistory(){
    historyList.innerHTML = "";

    if (!historyEntries.length){
      historyList.innerHTML = '<div class="history-empty">No actions have been recorded yet.</div>';
      return;
    }

    historyEntries.forEach(entry => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-entry";
      button.dataset.restoreHistoryEntry = entry.id;
      button.disabled = tableLocked;
      button.title = tableLocked
        ? "Unlock the checklist to restore this version"
        : "Restore the checklist to immediately before this action";
      button.innerHTML = `
        <span class="history-entry-icon" aria-hidden="true">↶</span>
        <span class="history-entry-main">
          <span class="history-entry-description">${escapeHtml(entry.description)}</span>
          <span class="history-entry-time">${escapeHtml(historyTimeText(entry.timestamp))}</span>
        </span>
        <span class="history-entry-restore">${tableLocked ? "Locked" : "Restore"}</span>
      `;
      historyList.appendChild(button);
    });

    applyTranslations(historyList);
  }

  function openVersionHistory(){
    renderVersionHistory();
    historyDialog.showModal();
  }

  function restoreVersionHistoryEntry(id){
    if (tableLocked) return;

    const entry = historyEntries.find(item => item.id === id);
    if (!entry) return;

    const ok = confirm(
      `Restore the checklist to immediately before this action?\n\n${entry.description}\n\n` +
      "This also undoes any checklist changes made after that point. A new history entry will let you return to the current state."
    );
    if (!ok) return;

    const currentSnapshot = cloneChecklistState(state);
    historyEntries.unshift({
      id: uid(),
      timestamp: new Date().toISOString(),
      description:`Restored history: ${entry.description}`,
      key:`restore:${entry.id}`,
      before: currentSnapshot
    });
    historyEntries = historyEntries.slice(0, MAX_HISTORY_ENTRIES);
    saveVersionHistory();

    suppressVersionHistory = true;
    state = safeState(cloneChecklistState(entry.before));
    lastSavedStateSnapshot = cloneChecklistState(state);

    try{
      profileSet(STORAGE_KEY, JSON.stringify(state));
    }catch(e){
      console.error(e);
    }

    suppressVersionHistory = false;
    render();
    updateArchiveButtonUI();
    renderVersionHistory();
  }

  function clearVersionHistory(){
    if (!historyEntries.length) return;
    if (!confirm("Clear all Version History entries? This does not change the current checklist.")) return;
    historyEntries = [];
    saveVersionHistory();
    renderVersionHistory();
  }

  let saveTimer;
  function openJsonHandleDatabase(){
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)){
        reject(new Error("IndexedDB is not available."));
        return;
      }

      const request = indexedDB.open(JSON_HANDLE_DB, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(JSON_HANDLE_STORE)){
          db.createObjectStore(JSON_HANDLE_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open file-handle storage."));
    });
  }

  async function storeJsonFileHandle(handle){
    const db = await openJsonHandleDatabase();
    try{
      await new Promise((resolve, reject) => {
        const tx = db.transaction(JSON_HANDLE_STORE, "readwrite");
        tx.objectStore(JSON_HANDLE_STORE).put(handle, JSON_HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Could not remember JSON file."));
        tx.onabort = () => reject(tx.error || new Error("Could not remember JSON file."));
      });
    } finally {
      db.close();
    }
  }

  async function loadStoredJsonFileHandle(){
    const db = await openJsonHandleDatabase();
    try{
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(JSON_HANDLE_STORE, "readonly");
        const request = tx.objectStore(JSON_HANDLE_STORE).get(JSON_HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("Could not load remembered JSON file."));
      });
    } finally {
      db.close();
    }
  }

  async function removeStoredJsonFileHandle(){
    const db = await openJsonHandleDatabase();
    try{
      await new Promise((resolve, reject) => {
        const tx = db.transaction(JSON_HANDLE_STORE, "readwrite");
        tx.objectStore(JSON_HANDLE_STORE).delete(JSON_HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Could not forget JSON file."));
      });
    } finally {
      db.close();
    }
  }

  function updateJsonSaveUI(status = "idle", message = ""){
    if (!jsonSaveStatus || !jsonSaveStatusText) return;

    jsonSaveStatus.classList.remove("connected", "warning", "error");

    if (status === "connected") jsonSaveStatus.classList.add("connected");
    if (status === "warning") jsonSaveStatus.classList.add("warning");
    if (status === "error") jsonSaveStatus.classList.add("error");

    const connected = !!jsonFileHandle;
    connectJsonFileBtn.textContent = connected ? "Change JSON Save File" : "Choose JSON Save File";
    saveJsonNowBtn.disabled = !connected || tableLocked;
    disconnectJsonFileBtn.disabled = !connected || tableLocked;

    jsonSaveStatusText.textContent = message || (
      connected
        ? `Connected: ${jsonFileHandle.name || "JSON data file"}`
        : "No JSON file connected"
    );
  }

  async function jsonHandlePermission(handle, request = false){
    if (!handle) return false;

    const options = {mode:"readwrite"};
    try{
      if (await handle.queryPermission(options) === "granted") return true;
      if (request && await handle.requestPermission(options) === "granted") return true;
    }catch(e){
      console.warn("JSON file permission check failed:", e);
    }
    return false;
  }

  async function writeStateToJsonFile({requestPermission = false, showMessage = false} = {}){
    if (!jsonFileHandle) return false;

    if (jsonSaveInProgress){
      jsonSavePending = true;
      return true;
    }

    const allowed = await jsonHandlePermission(jsonFileHandle, requestPermission);
    if (!allowed){
      updateJsonSaveUI(
        "warning",
        `Reconnect ${jsonFileHandle.name || "the JSON file"} to resume automatic file saving.`
      );
      return false;
    }

    jsonSaveInProgress = true;
    try{
      const writable = await jsonFileHandle.createWritable();
      await writable.write(portableBackupText());
      await writable.close();

      updateJsonSaveUI(
        "connected",
        `${jsonFileHandle.name || "JSON data file"} · saved ${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
      );

      if (showMessage){
        clearTimeout(jsonStatusMessageTimer);
        jsonStatusMessageTimer = setTimeout(() => {
          if (jsonFileHandle){
            updateJsonSaveUI("connected", `Connected: ${jsonFileHandle.name || "JSON data file"}`);
          }
        }, 1800);
      }
      return true;
    }catch(e){
      console.error("Could not write JSON save file:", e);
      updateJsonSaveUI("error", "Could not write to the connected JSON file. Browser backup is still saved.");
      return false;
    }finally{
      jsonSaveInProgress = false;
      if (jsonSavePending){
        jsonSavePending = false;
        writeStateToJsonFile();
      }
    }
  }

  function queueJsonFileSave(){
    if (!jsonFileHandle) return;
    writeStateToJsonFile();
  }

  async function readStateFromJsonHandle(handle){
    const file = await handle.getFile();
    if (!file || file.size === 0) return null;
    const text = await file.text();
    if (!text.trim()) return null;
    return importPortableBundle(text);
  }

  async function connectJsonSaveFile(){
    if (tableLocked) return;

    if (!("showSaveFilePicker" in window)){
      updateJsonSaveUI(
        "warning",
        "Live JSON saving is not supported in this browser. Chrome or Edge is recommended."
      );
      return;
    }

    try{
      const handle = await window.showSaveFilePicker({
        suggestedName: "Y5A Tasks Data.json",
        types: [{
          description: "JSON data file",
          accept: {"application/json":[".json"]}
        }]
      });

      const existingBundle = await readStateFromJsonHandle(handle);
      jsonFileHandle = handle;
      await storeJsonFileHandle(handle);

      if (existingBundle){
        const loadExisting = confirm(
          `"${handle.name}" already contains checklist data.\n\n` +
          "Press OK to load its checklist, archive, and Version History.\n" +
          "Press Cancel to keep the current app data and overwrite the JSON file with it."
        );

        if (loadExisting){
          applyImportedBundle(existingBundle);
          updateTableLockUI();
          updateJsonSaveUI("connected", `Loaded: ${handle.name}`);
          return;
        }
      }

      await writeStateToJsonFile({requestPermission:true, showMessage:true});
    }catch(e){
      if (e && e.name === "AbortError") return;
      console.error("Could not connect JSON file:", e);
      updateJsonSaveUI("error", "Could not connect the JSON save file.");
    }
  }

  async function disconnectJsonSaveFile(){
    if (tableLocked || !jsonFileHandle) return;
    if (!confirm("Disconnect the live JSON save file? Browser autosave will continue.")) return;

    jsonFileHandle = null;
    try{
      await removeStoredJsonFileHandle();
    }catch(e){
      console.warn("Could not remove remembered JSON file handle:", e);
    }
    updateJsonSaveUI("idle", "No JSON file connected");
  }

  function showUnsupportedBrowserStorageNotice(){
    if (tableLocked) return;
    if ("showSaveFilePicker" in window) return;
    if (profileGet(BROWSER_STORAGE_NOTICE_KEY) === "seen") return;

    if (browserStorageNoticeDialog && !browserStorageNoticeDialog.open){
      browserStorageNoticeDialog.showModal();
    }
  }

  function showJsonSetupPrompt(){
    if (!activeUsername || jsonFileHandle || tableLocked || profileGet(JSON_SETUP_DISMISSED_KEY) === "seen") return;
    if (!("showSaveFilePicker" in window)) return;
    if (jsonSetupDialog && !jsonSetupDialog.open){
      jsonSetupDialog.showModal();
    }
  }

  async function restoreJsonSaveConnection(){
    if (!("indexedDB" in window)){
      updateJsonSaveUI("idle");
      requestAnimationFrame(() => {
        showUnsupportedBrowserStorageNotice();
        showJsonSetupPrompt();
      });
      return;
    }

    try{
      const handle = await loadStoredJsonFileHandle();
      if (!handle){
        updateJsonSaveUI("idle");
        requestAnimationFrame(() => {
          showUnsupportedBrowserStorageNotice();
          showJsonSetupPrompt();
        });
        return;
      }

      jsonFileHandle = handle;
      const allowed = await jsonHandlePermission(handle, false);

      if (!allowed){
        updateJsonSaveUI(
          "warning",
          `JSON file remembered: ${handle.name || "data file"}. Click "Save JSON Now" to reconnect permission.`
        );
        return;
      }

      try{
        const fileBundle = await readStateFromJsonHandle(handle);
        if (fileBundle){
          applyImportedBundle(fileBundle);
        }
      }catch(e){
        console.warn("Could not load connected JSON file; keeping browser copy:", e);
      }

      updateJsonSaveUI("connected", `Connected: ${handle.name || "JSON data file"}`);
    }catch(e){
      console.warn("Could not restore JSON save connection:", e);
      updateJsonSaveUI("idle");
    }
  }

  function saveState(){
    try{
      const nextSnapshot = cloneChecklistState(state);

      if (!suppressVersionHistory){
        const beforeSnapshot = lastSavedStateSnapshot;
        if (JSON.stringify(beforeSnapshot) !== JSON.stringify(nextSnapshot)){
          const summary = summarizeChecklistChange(beforeSnapshot, nextSnapshot);
          if (summary){
            addVersionHistoryEntry(summary, beforeSnapshot);
          }
        }
      }

      profileSet(STORAGE_KEY, JSON.stringify(state));
      lastSavedStateSnapshot = nextSnapshot;
      queueJsonFileSave();
      if (saveStatus){
        saveStatus.innerHTML = '<span class="dot"></span><span>Saved automatically</span>';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          saveStatus.innerHTML = '<span class="dot"></span><span>Saved automatically</span>';
        }, 700);
      }
    }catch(e){
      if (saveStatus){
        saveStatus.style.background = "var(--danger-soft)";
        saveStatus.style.color = "var(--danger)";
        saveStatus.innerHTML = '<span class="dot"></span><span>Could not save</span>';
      }
      console.error(e);
    }
  }


  function showMainPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = false;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showGamesPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = false;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
    applyTranslations(document);
  }

  function showSentenceGuessPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = false;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
    applyTranslations(document);
  }

  function showWordlePage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = false;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
    renderWordle();
    applyTranslations(document);
  }

  function showSpinWheelPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = false;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
    renderSpinWheel();
  }

  function showTasksPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = false;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.add("tasks-subpage-open");
    window.scrollTo({top:0, behavior:"auto"});
    render();
    applyTranslations(document);
  }

  function applyRoute(){
    document.body.classList.remove("word-manager-open");
    switch (window.location.hash.replace("#", "")){
      case "games": return showGamesPage();
      case "tools": return showToolsPage();
      case "wordle": return showWordlePage();
      case "sentence-guess": return showSentenceGuessPage();
      case "spin-wheel": return showSpinWheelPage();
      case "shark-word-quest": return showSharkWordPage();
      case "hotseat": return showHotseatPage();
      case "tasks": return showTasksPage();
      case "students": return showStudentManagerPage();
      case "words": return showWordManagerPage();
      case "updates": return showUpdateLogPage();
      case "feedback": return showFeedbackAdminPage();
      default: return showMainPage();
    }
  }

  function showToolsPage(){
    document.body.classList.remove("update-log-open", "tasks-subpage-open");
    mainPage.hidden = true; gamesPage.hidden = true; toolsPage.hidden = false; sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true; wordlePage.hidden = true; sharkWordPage.hidden = true; hotseatPage.hidden = true;
    tasksPage.hidden = true; feedbackAdminPage.hidden = true; updateLogPage.hidden = true;
    studentManagerPage.hidden = true; wordManagerPage.hidden = true;
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showSharkWordPage(){
    document.body.classList.remove("update-log-open", "tasks-subpage-open");
    mainPage.hidden = true; gamesPage.hidden = true; toolsPage.hidden = true; sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true; wordlePage.hidden = true; sharkWordPage.hidden = false; hotseatPage.hidden = true;
    tasksPage.hidden = true; feedbackAdminPage.hidden = true; updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    renderSharkWordGroupChoices();
    if (!sharkWordAnswer) startSharkWordGame(); else renderSharkWord();
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showHotseatPage(){
    document.body.classList.remove("update-log-open", "tasks-subpage-open");
    mainPage.hidden = true; gamesPage.hidden = true; toolsPage.hidden = true; sentenceGuessPage.hidden = true; spinWheelPage.hidden = true;
    wordlePage.hidden = true; sharkWordPage.hidden = true; hotseatPage.hidden = false; tasksPage.hidden = true;
    feedbackAdminPage.hidden = true; updateLogPage.hidden = true; studentManagerPage.hidden = true; wordManagerPage.hidden = true;
    renderHotseatGroups();
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showStudentManagerPage(){
    document.body.classList.remove("update-log-open", "tasks-subpage-open");
    mainPage.hidden = true; gamesPage.hidden = true; toolsPage.hidden = true; sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true; wordlePage.hidden = true; sharkWordPage.hidden = true; hotseatPage.hidden = true; tasksPage.hidden = true;
    feedbackAdminPage.hidden = true; updateLogPage.hidden = true; studentManagerPage.hidden = false; wordManagerPage.hidden = true;
    openRoster();
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showWordManagerPage(){
    document.body.classList.remove("update-log-open", "tasks-subpage-open");
    document.body.classList.add("word-manager-open");
    mainPage.hidden = true; gamesPage.hidden = true; toolsPage.hidden = true; sentenceGuessPage.hidden = true; spinWheelPage.hidden = true;
    wordlePage.hidden = true; sharkWordPage.hidden = true; tasksPage.hidden = true; feedbackAdminPage.hidden = true;
    updateLogPage.hidden = true; studentManagerPage.hidden = true; wordManagerPage.hidden = false;
    wordImportPanel.hidden = true; wordImportText.value = ""; wordImportMessage.textContent = "";
    renderWordEntries();
    window.scrollTo({top:0, behavior:"auto"});
    requestAnimationFrame(() => wordManagerPage.scrollIntoView({block:"start", behavior:"auto"}));
  }

  function navigateTo(route){
    const nextHash = `#${route}`;
    if (window.location.hash === nextHash){
      applyRoute();
    } else {
      window.location.hash = nextHash;
    }
  }

  const FEEDBACK_STORAGE_KEY = "andy_classroom_project_feedback_v1";

  function loadFeedbackEntries(){
    try{
      const raw = JSON.parse(profileGet(FEEDBACK_STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    }catch(_){
      return [];
    }
  }

  function saveFeedbackEntries(entries){
    profileSet(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
  }

  function currentActivityContext(){
    if (feedbackAdminPage && !feedbackAdminPage.hidden){
      return "Viewing Admin Panel";
    }

    if (wordlePage && !wordlePage.hidden){
      const detail = wordleFinished
        ? "Wordle — game finished"
        : wordleGuesses.length
          ? `Wordle — guess ${Math.min(wordleGuesses.length + 1, 6)} of 6`
          : "Wordle — playing";
      return detail;
    }

    if (sentenceGuessPage && !sentenceGuessPage.hidden){
      return "Sentence / Definition Guess";
    }

    if (gamesPage && !gamesPage.hidden){
      return "Games page";
    }

    if (tasksPage && !tasksPage.hidden){
      const audience = activeTaskAudience === "teacher" ? "Teacher Tasks" : "Student Tasks";
      const filter =
        activeTaskAudience === "teacher"
          ? ""
          : activeStudentTaskFilter === "classwork"
            ? " — Classwork"
            : activeStudentTaskFilter === "homework"
              ? " — Homework"
              : " — All Tasks";

      const taskEditFocused = document.activeElement && document.activeElement.matches
        ? document.activeElement.matches("[data-task-title],[data-task-due],[data-task-category]")
        : false;

      return taskEditFocused
        ? `Tasks — editing a task (${audience}${filter})`
        : `Tasks — ${audience}${filter}`;
    }

    return "Main page";
  }

  function openReportDialog(){
    reportContextText.textContent = currentActivityContext();
    reportFeedbackText.value = "";
    reportDialog.showModal();
    requestAnimationFrame(() => reportFeedbackText.focus());
  }

  function submitFeedback(){
    const text = reportFeedbackText.value.trim();
    if (!text) return false;

    const entries = loadFeedbackEntries();
    entries.unshift({
      id: `feedback-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      context: currentActivityContext(),
      pageTitle: document.title || "Classroom Project",
      feedback: text
    });

    saveFeedbackEntries(entries.slice(0, 200));
    reportDialog.close();
    reportFeedbackText.value = "";
    renderFeedbackAdmin();
    return true;
  }

  function renderFeedbackAdmin(){
    if (!adminFeedbackList) return;
    const entries = loadFeedbackEntries();
    adminFeedbackList.innerHTML = "";

    if (!entries.length){
      const empty = document.createElement("div");
      empty.className = "admin-feedback-empty";
      empty.textContent = tr("No feedback submitted yet.");
      adminFeedbackList.appendChild(empty);
      return;
    }

    entries.forEach(entry => {
      const card = document.createElement("article");
      card.className = "admin-feedback-card";

      const when = new Date(entry.createdAt);
      const timestamp = Number.isNaN(when.getTime())
        ? entry.createdAt
        : when.toLocaleString();

      card.innerHTML = `
        <div class="admin-feedback-meta">
          <span>${escapeHtml(timestamp)}</span>
        </div>
        <div class="admin-feedback-context">${escapeHtml(entry.context || "Unknown activity")}</div>
        <div class="admin-feedback-text">${escapeHtml(entry.feedback || "")}</div>
      `;

      adminFeedbackList.appendChild(card);
    });
  }

  function showUpdateLogPage(){
    document.body.classList.add("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = true;
    updateLogPage.hidden = false;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    applyTranslations(document);
    window.scrollTo({top:0, behavior:"auto"});
  }

  function showFeedbackAdminPage(){
    document.body.classList.remove("update-log-open");
    mainPage.hidden = true;
    gamesPage.hidden = true;
    toolsPage.hidden = true;
    sentenceGuessPage.hidden = true;
    spinWheelPage.hidden = true;
    wordlePage.hidden = true;
    sharkWordPage.hidden = true;
    hotseatPage.hidden = true;
    tasksPage.hidden = true;
    feedbackAdminPage.hidden = false;
    updateLogPage.hidden = true;
    studentManagerPage.hidden = true;
    wordManagerPage.hidden = true;
    document.body.classList.remove("tasks-subpage-open");
    renderFeedbackAdmin();
    applyTranslations(document);
    window.scrollTo({top:0, behavior:"auto"});
  }

  const WHEEL_STORAGE_KEY = "andy_spin_wheel_entries_v1";
  const WHEEL_COLOURS = ["#fca5a5", "#fdba74", "#fde68a", "#bef264", "#86efac", "#67e8f9", "#93c5fd", "#c4b5fd", "#f0abfc", "#f9a8d4"];
  let wheelItems = loadWheelItems();
  let wheelRotation = 0;
  let wheelSpinning = false;

  function loadWheelItems(){
    try{
      const saved = JSON.parse(profileGet(WHEEL_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.map(item => String(item).trim()).filter(Boolean) : [];
    }catch(_){
      return [];
    }
  }

  function saveWheelItems(){
    profileSet(WHEEL_STORAGE_KEY, JSON.stringify(wheelItems));
  }

  // Shared profile roster for games and future classroom tools.
  function sharedStudentRoster(groupId = activeStudentGroupId){
    const group = studentGroups.find(item => item.id === groupId);
    const students = group?.students || state.students || [];
    return [...new Set(students.map(name => String(name).trim()).filter(Boolean))];
  }

  function importRosterToWheel(){
    const groupId = wheelGroupSelect?.value || activeStudentGroupId;
    const group = studentGroups.find(item => item.id === groupId);
    const students = sharedStudentRoster(groupId);
    if (!students.length){
      spinWheelResult.textContent = "Add students from your profile menu first.";
      return;
    }
    const existing = new Set(wheelItems.map(item => item.toLocaleLowerCase()));
    const additions = students.filter(student => !existing.has(student.toLocaleLowerCase()));
    wheelItems.push(...additions);
    saveWheelItems();
    spinWheelResult.textContent = additions.length ? `${additions.length} students imported from ${group?.name || "your class list"}.` : `${group?.name || "This class list"} is already on the wheel.`;
    renderSpinWheel();
  }

  function drawSpinWheel(){
    const ctx = spinWheelCanvas.getContext("2d");
    const size = spinWheelCanvas.width;
    const center = size / 2;
    const radius = center - 5;
    ctx.clearRect(0, 0, size, size);

    if (!wheelItems.length){
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";
      ctx.font = "700 30px system-ui";
      ctx.fillText("Add entries", center, center - 8);
      ctx.font = "20px system-ui";
      ctx.fillText("to build your wheel", center, center + 28);
      return;
    }

    const slice = (Math.PI * 2) / wheelItems.length;
    wheelItems.forEach((item, index) => {
      const start = -Math.PI / 2 + index * slice;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLOURS[index % WHEEL_COLOURS.length];
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + slice / 2);
      ctx.fillStyle = "#172033";
      ctx.font = `700 ${Math.max(15, Math.min(27, 220 / Math.max(1, wheelItems.length)))}px system-ui`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label = item.length > 18 ? `${item.slice(0, 17)}…` : item;
      ctx.fillText(label, radius - 36, 0);
      ctx.restore();
    });
  }

  function renderSpinWheel(){
    renderWheelGroupChoices();
    drawSpinWheel();
    wheelEntryCount.textContent = `${wheelItems.length} ${wheelItems.length === 1 ? "entry" : "entries"}`;
    spinWheelBtn.disabled = wheelSpinning || wheelItems.length < 2;
    if (!wheelSpinning && wheelItems.length < 2){
      spinWheelResult.textContent = "Add at least two entries to begin.";
    }
    wheelItemList.innerHTML = "";
    wheelItems.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "wheel-entry-row";
      const name = document.createElement("span");
      name.className = "wheel-entry-name";
      name.textContent = item;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.dataset.wheelEdit = String(index);
      edit.textContent = "Edit";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary";
      remove.dataset.wheelDelete = String(index);
      remove.textContent = "Delete";
      row.append(name, edit, remove);
      wheelItemList.append(row);
    });
  }

  function addWheelEntries(){
    const singleEntry = wheelSingleEntryInput.value.trim();
    const entries = [
      ...(singleEntry ? [singleEntry] : []),
      ...wheelEntriesInput.value.split(/[\s,]+/).map(entry => entry.trim()).filter(Boolean)
    ];
    if (!entries.length){
      spinWheelResult.textContent = "Type or paste one or more entries first.";
      return;
    }
    wheelItems.push(...entries);
    wheelSingleEntryInput.value = "";
    wheelEntriesInput.value = "";
    saveWheelItems();
    spinWheelResult.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"} added.`;
    renderSpinWheel();
  }

  function spinWheel(){
    if (wheelSpinning || wheelItems.length < 2) return;
    const selectedIndex = Math.floor(Math.random() * wheelItems.length);
    const sliceDegrees = 360 / wheelItems.length;
    const targetDegrees = -(selectedIndex * sliceDegrees + sliceDegrees / 2);
    const currentDegrees = ((wheelRotation % 360) + 360) % 360;
    const extraTurns = 6 + Math.floor(Math.random() * 3);
    const delta = ((targetDegrees - currentDegrees + 360) % 360) + extraTurns * 360;

    wheelSpinning = true;
    wheelRotation += delta;
    spinWheelResult.textContent = "Spinning…";
    spinWheelBtn.disabled = true;
    spinWheelCanvas.style.transform = `rotate(${wheelRotation}deg)`;

    window.setTimeout(() => {
      wheelSpinning = false;
      spinWheelResult.textContent = `Chosen: ${wheelItems[selectedIndex]}`;
      spinWheelBtn.disabled = wheelItems.length < 2;
    }, 5250);
  }

  const WORDLE_WORDS = [
    "APPLE","BEACH","BRAIN","BREAD","BRICK","BRUSH","CHAIR","CLOUD","DANCE","DREAM",
    "DRINK","EARTH","FLAME","FRUIT","GIANT","GRAPE","GRASS","GREEN","HEART","HOUSE",
    "LIGHT","MOUSE","NIGHT","OCEAN","PAINT","PAPER","PLANT","PLATE","POINT","QUEEN",
    "RIVER","ROBOT","ROUND","SHARK","SHEEP","SHIRT","SMILE","SNAKE","SPACE","SPOON",
    "STORM","STORY","TABLE","TEACH","TIGER","TRAIN","WATER","WHALE","WORLD","WRITE"
  ];

  const WORDLE_KEY_ROWS = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","BACK"]
  ];

  let wordleAnswer = "";
  let wordleGuesses = [];
  let wordleCurrent = "";
  let wordleFinished = false;
  let wordleKeyStates = {};

  function chooseWordleWord(){
    const next = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    if (WORDLE_WORDS.length > 1 && next === wordleAnswer){
      return WORDLE_WORDS[(WORDLE_WORDS.indexOf(next) + 1) % WORDLE_WORDS.length];
    }
    return next;
  }

  function startWordleGame(){
    wordleAnswer = chooseWordleWord();
    wordleGuesses = [];
    wordleCurrent = "";
    wordleFinished = false;
    wordleKeyStates = {};
    setWordleMessage(tr("New word ready!"), "");
    renderWordle();
  }

  function setWordleMessage(text, type = ""){
    if (!wordleMessage) return;
    wordleMessage.textContent = text || "";
    wordleMessage.className = `wordle-message${type ? ` ${type}` : ""}`;
  }

  function scoreWordleGuess(guess){
    const result = Array(5).fill("absent");
    const remaining = wordleAnswer.split("");

    for (let i = 0; i < 5; i++){
      if (guess[i] === wordleAnswer[i]){
        result[i] = "correct";
        remaining[i] = null;
      }
    }

    for (let i = 0; i < 5; i++){
      if (result[i] === "correct") continue;
      const found = remaining.indexOf(guess[i]);
      if (found !== -1){
        result[i] = "present";
        remaining[found] = null;
      }
    }

    return result;
  }

  function updateWordleKeyState(letter, nextState){
    const rank = {absent:1, present:2, correct:3};
    const current = wordleKeyStates[letter];
    if (!current || rank[nextState] > rank[current]){
      wordleKeyStates[letter] = nextState;
    }
  }

  function submitWordleGuess(){
    if (wordleFinished) return;
    if (wordleCurrent.length !== 5){
      setWordleMessage(tr("Not enough letters"), "warning");
      return;
    }

    const guess = wordleCurrent.toUpperCase();
    const score = scoreWordleGuess(guess);
    wordleGuesses.push({guess, score});

    guess.split("").forEach((letter, index) => {
      updateWordleKeyState(letter, score[index]);
    });

    wordleCurrent = "";

    if (guess === wordleAnswer){
      wordleFinished = true;
      setWordleMessage(`${tr("Great job!")} ${wordleAnswer}`, "success");
    } else if (wordleGuesses.length >= 6){
      wordleFinished = true;
      setWordleMessage(`${tr("The word was")} ${wordleAnswer}`, "warning");
    } else {
      setWordleMessage("", "");
    }

    renderWordle();
  }

  function handleWordleKey(key){
    if (wordleFinished) return;

    if (key === "ENTER"){
      submitWordleGuess();
      return;
    }

    if (key === "BACK"){
      wordleCurrent = wordleCurrent.slice(0,-1);
      renderWordle();
      return;
    }

    if (/^[A-Z]$/.test(key) && wordleCurrent.length < 5){
      wordleCurrent += key;
      renderWordle();
    }
  }

  function renderWordle(){
    if (!wordleBoard || !wordleKeyboard) return;
    if (!wordleAnswer){
      wordleAnswer = chooseWordleWord();
    }

    wordleBoard.innerHTML = "";

    for (let rowIndex = 0; rowIndex < 6; rowIndex++){
      const row = document.createElement("div");
      row.className = "wordle-row";

      const completed = wordleGuesses[rowIndex];
      const activeText = rowIndex === wordleGuesses.length ? wordleCurrent : "";

      for (let col = 0; col < 5; col++){
        const tile = document.createElement("div");
        tile.className = "wordle-tile";

        if (completed){
          tile.textContent = completed.guess[col];
          tile.classList.add(completed.score[col]);
        } else if (activeText[col]){
          tile.textContent = activeText[col];
          tile.classList.add("filled");
        }

        row.appendChild(tile);
      }

      wordleBoard.appendChild(row);
    }

    wordleKeyboard.innerHTML = "";
    WORDLE_KEY_ROWS.forEach(keys => {
      const row = document.createElement("div");
      row.className = "wordle-keyboard-row";

      keys.forEach(key => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wordle-key";
        button.dataset.wordleKey = key;

        if (key === "ENTER"){
          button.classList.add("wide");
          button.textContent = tr("Enter");
        } else if (key === "BACK"){
          button.classList.add("wide");
          button.textContent = "⌫";
          button.title = tr("Delete");
          button.setAttribute("aria-label", tr("Delete"));
        } else {
          button.textContent = key;
          if (wordleKeyStates[key]){
            button.classList.add(wordleKeyStates[key]);
          }
        }

        row.appendChild(button);
      });

      wordleKeyboard.appendChild(row);
    });
  }

  const SHARK_WORDS = [
    "APPLE", "BEACH", "BIRD", "CLOUD", "CORAL", "DOLPHIN", "DRAGON", "FLOWER",
    "FOREST", "FRIEND", "GARDEN", "JUNGLE", "MUSIC", "OCEAN", "PLANET", "RAINBOW",
    "ROCKET", "SCHOOL", "SEASHELL", "SHARK", "SMILE", "STARFISH", "SUNSHINE", "TIGER", "TREASURE", "WHALE"
  ];
  let sharkWordAnswer = "";
  let sharkWordSourceWords = [...SHARK_WORDS];
  let sharkWordGuessed = new Set();
  let sharkWordWrong = 0;
  let sharkWordFinished = false;

  function startSharkWordGame(){
    const choices = sharkWordSourceWords.filter(word => word !== sharkWordAnswer);
    sharkWordAnswer = choices[Math.floor(Math.random() * choices.length)] || sharkWordSourceWords[0] || SHARK_WORDS[0];
    sharkWordGuessed = new Set();
    sharkWordWrong = 0;
    sharkWordFinished = false;
    setSharkWordMessage("Find the hidden word!", "");
    renderSharkWord();
  }

  function setSharkWordMessage(text, type = ""){
    sharkWordMessage.textContent = text;
    sharkWordMessage.className = `wordle-message${type ? ` ${type}` : ""}`;
  }

  function guessSharkWordLetter(letter){
    if (sharkWordFinished || sharkWordGuessed.has(letter)) return;
    sharkWordGuessed.add(letter);
    if (!sharkWordAnswer.includes(letter)) sharkWordWrong += 1;
    const solved = sharkWordAnswer.split("").every(item => /\s/.test(item) || sharkWordGuessed.has(item));
    if (solved){
      sharkWordFinished = true;
      setSharkWordMessage(`Great job! You found ${sharkWordAnswer}.`, "success");
    } else if (sharkWordWrong >= 8){
      sharkWordFinished = true;
      setSharkWordMessage(`The word was ${sharkWordAnswer}. Try another quest!`, "warning");
    } else if (sharkWordAnswer.includes(letter)){
      setSharkWordMessage("Nice letter — keep going!", "success");
    } else {
      setSharkWordMessage("A bubble joined the wave meter. Try another letter!", "warning");
    }
    renderSharkWord();
  }

  function renderSharkWord(){
    sharkWordBubbles.innerHTML = "";
    for (let index = 0; index < 8; index++){
      const bubble = document.createElement("span");
      bubble.className = `shark-word-bubble${index < sharkWordWrong ? " filled" : ""}`;
      sharkWordBubbles.appendChild(bubble);
    }
    sharkWordMisses.textContent = String(sharkWordWrong);
    sharkWordDisplay.innerHTML = "";
    sharkWordAnswer.split("").forEach(letter => {
      const cell = document.createElement("span");
      cell.className = `shark-word-letter${/\s/.test(letter) ? " space" : ""}`;
      cell.textContent = /\s/.test(letter) ? "" : (sharkWordGuessed.has(letter) || sharkWordFinished ? letter : "");
      sharkWordDisplay.appendChild(cell);
    });
    const guessed = [...sharkWordGuessed].sort();
    sharkWordGuesses.textContent = `Guessed letters: ${guessed.length ? guessed.join(", ") : "none"}`;
    sharkWordKeyboard.innerHTML = "";
    WORDLE_KEY_ROWS.slice(0, 2).concat([["Z", "X", "C", "V", "B", "N", "M"]]).forEach(keys => {
      const row = document.createElement("div");
      row.className = "wordle-keyboard-row";
      keys.forEach(letter => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wordle-key";
        button.dataset.sharkWordKey = letter;
        button.textContent = letter;
        if (sharkWordGuessed.has(letter)) button.classList.add(sharkWordAnswer.includes(letter) ? "correct" : "absent");
        button.disabled = sharkWordFinished || sharkWordGuessed.has(letter);
        row.appendChild(button);
      });
      sharkWordKeyboard.appendChild(row);
    });
  }

  function loadSharkWordSource(){
    try{
      const saved = JSON.parse(profileGet(SHARK_WORD_SOURCE_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) return saved.map(word => String(word).trim().toUpperCase()).filter(Boolean);
    }catch(_){}
    return [...SHARK_WORDS];
  }
  function renderSharkWordGroupChoices(){
    sharkWordGroupSelect.innerHTML = "";
    wordGroups.forEach(group => { const option = document.createElement("option"); option.value = group.id; option.textContent = `${group.name} (${(group.words || []).length})`; sharkWordGroupSelect.append(option); });
    sharkWordGroupSelect.value = wordGroups.some(group => group.id === activeWordGroupId) ? activeWordGroupId : wordGroups[0].id;
  }

  let hotseatEntries = [];
  let hotseatIndex = 0;
  function renderHotseatGroups(){
    const previous = hotseatWordGroupSelect.value;
    hotseatWordGroupSelect.innerHTML = "";
    wordGroups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = `${group.name} (${(group.words || []).length})`;
      hotseatWordGroupSelect.append(option);
    });
    hotseatWordGroupSelect.value = wordGroups.some(group => group.id === previous) ? previous : (wordGroups[0]?.id || "");
    hotseatSetup.hidden = false;
    hotseatCard.hidden = true;
    hotseatStatus.textContent = wordGroups.length ? "Choose a saved word list to begin." : "Create a word list first.";
  }
  function shuffleEntries(entries){
    return [...entries].sort(() => Math.random() - .5);
  }
  function startHotseat(){
    const group = wordGroups.find(item => item.id === hotseatWordGroupSelect.value);
    hotseatEntries = shuffleEntries((group?.words || []).map(normalizeWordEntry).filter(entry => entry.word));
    if (!hotseatEntries.length){
      hotseatStatus.textContent = "This word list is empty. Add some words first.";
      return;
    }
    hotseatIndex = 0;
    hotseatSetup.hidden = true;
    hotseatCard.hidden = false;
    renderHotseatCard();
  }
  function renderHotseatCard(){
    const entry = hotseatEntries[hotseatIndex];
    if (!entry) return;
    hotseatWord.textContent = entry.word;
    hotseatDefinition.textContent = entry.definition ? `Definition: ${entry.definition}` : "";
    hotseatSentence.textContent = entry.sentence ? `“${entry.sentence}”` : "";
    hotseatDefinition.hidden = !hotseatShowDefinition.checked || !entry.definition;
    hotseatSentence.hidden = !hotseatShowSentence.checked || !entry.sentence;
    hotseatNextBtn.textContent = hotseatIndex === hotseatEntries.length - 1 ? "Start again ↻" : "Next word →";
  }
  function nextHotseatWord(){
    if (!hotseatEntries.length) return;
    hotseatIndex = (hotseatIndex + 1) % hotseatEntries.length;
    if (hotseatIndex === 0) hotseatEntries = shuffleEntries(hotseatEntries);
    renderHotseatCard();
  }

  const ZH_TEXT = {
    "Y5A Tasks":"Y5A 任务",
    "Settings":"设置",
    "Teacher controls are hidden from the main student view.":"教师控制项已从学生主视图中隐藏。",
    "Close":"关闭",
    "Checklist Controls":"任务清单控制",
    "Edit Students":"编辑学生",
    "Completion Timestamps: Off":"完成时间：关",
    "Completion Timestamps: On":"完成时间：开",
    "Reset checklist":"重置任务清单",
    "Import/Export Data":"导入/导出数据",
    "Copy / Paste Data":"复制 / 粘贴数据",
    "Export backup":"导出备份",
    "Import backup":"导入备份",
    "Live JSON Save":"实时 JSON 保存",
    "No JSON file connected":"未连接 JSON 文件",
    "Choose JSON Save File":"选择 JSON 保存文件",
    "Change JSON Save File":"更换 JSON 保存文件",
    "Save JSON Now":"立即保存 JSON",
    "Disconnect":"断开连接",
    "Once connected, the checklist, archived tasks, and Version History are automatically written to this JSON file. Browser storage is kept as a backup.":"连接后，任务清单、已归档任务和版本历史会自动写入此 JSON 文件。浏览器存储仍会作为备用。",
    "Security":"安全",
    "Change Password":"修改密码",
    "Main Page":"主页",
    "Report":"反馈",
    "Admin Panel":"管理面板",
    "Update Log":"更新日志",
    "A record of major features and smaller changes made to this project.":"记录此项目中的主要功能和较小改动。",
    "Send Feedback":"提交反馈",
    "Tell us what happened or what could be improved.":"请告诉我们发生了什么，或哪些地方可以改进。",
    "Current activity":"当前活动",
    "Write your feedback here...":"请在这里填写反馈...",
    "Submit Feedback":"提交反馈",
    "Review feedback submitted from anywhere in the project.":"查看项目中各页面提交的反馈。",
    "No feedback submitted yet.":"暂时还没有提交反馈。",
    "Your Classroom Hub":"班级工具中心",
    "Open the tools you use for your class. More sections can be added here later.":"打开你在班级中使用的工具。以后可以继续在这里添加更多功能。",
    "Tasks":"任务",
    "Games":"游戏",
    "Wordle":"Wordle",
    "Sentence / Definition Guess":"句子 / 定义猜词",
    "Students read a sentence or definition and try to guess the hidden word.":"学生阅读句子或定义，并尝试猜出隐藏的单词。",
    "Ready for the next classroom game":"准备好添加下一个课堂游戏",
    "This page is ready for us to add the clue, answer reveal, scoring, teams, and other guessing-game controls.":"此页面已准备好添加线索、答案揭晓、计分、分组和其他猜词游戏功能。",
    "Guess the five-letter word in six tries using the classroom keyboard.":"使用课堂键盘，在六次机会内猜出五个字母的单词。",
    "Guess the five-letter word in six tries. Tap the keyboard below to enter letters.":"在六次机会内猜出五个字母的单词。点击下方键盘输入字母。",
    "Back to Games":"返回游戏",
    "New Word":"新单词",
    "Reveal Word":"显示答案",
    "Correct letter and position":"字母和位置都正确",
    "Correct letter, wrong position":"字母正确，但位置不对",
    "Letter is not in the word":"单词中没有这个字母",
    "Enter":"提交",
    "Delete":"删除",
    "Not enough letters":"字母不够",
    "Great job!":"太棒了！",
    "The word was":"答案是",
    "New word ready!":"新单词已准备好！",
    "Open Games":"打开游戏",
    "Classroom games and activities can be added here.":"可以在这里添加课堂游戏和活动。",
    "Open your student and teacher task checklist, archive, table view, notes, timer, and more.":"打开学生和教师任务清单、归档、表格视图、备注、计时器等功能。",
    "Open Tasks":"打开任务",
    "Back to Main":"返回主页",
    "Checklist View":"任务清单",
    "Table View":"表格视图",
    "No unfinished work":"没有未完成任务",
    "Student Tasks Overview":"学生任务总览",
    "Tick boxes here or in Checklist View — both stay synced.":"可在此处或任务清单中勾选，两边会自动同步。",
    "Full Screen":"全屏",
    "Exit Full Screen":"退出全屏",
    "All Tasks":"全部任务",
    "Show unfinished only":"只显示未完成",
    "Show all students":"显示所有学生",
    "No unfinished students":"没有未完成的学生",
    "Classwork":"课堂任务",
    "Homework":"家庭作业",
    "Overdue":"逾期",
    "To Do":"待完成",
    "Student Tasks":"学生任务",
    "Teacher Tasks":"教师任务",
    "Teacher Task":"教师任务",
    "Date added":"添加日期",
    "Alphabetical":"按字母排序",
    "Due date":"截止日期",
    "Due":"截止日期",
    "Due Today":"今天截止",
    "Clear overdue flag":"清除逾期标记",
    "Individual":"个人",
    "Pair":"两人合作",
    "Group":"小组",
    "Automatic":"自动",
    "Manual":"手动",
    "Present":"出勤",
    "Absent":"缺席",
    "Complete":"已完成",
    "Not complete":"未完成",
    "Pending":"待完成",
    "Done":"完成",
    "Clear":"清除",
    "Archive task":"归档任务",
    "Delete task":"删除任务",
    "Mark all as complete":"全部标记为完成",
    "Mark none as complete":"全部取消完成",
    "Move to":"移动到",
    "Search for a student...":"搜索学生...",
    "Add Classwork":"添加课堂任务",
    "Add Homework":"添加家庭作业",
    "Add Teacher Task":"添加教师任务",
    "Archive":"归档",
    "Version History":"版本历史",
    "Clear history":"清除历史",
    "Restore":"恢复",
    "Locked":"已锁定",
    "No actions have been recorded yet.":"暂时没有记录任何操作。",
    "No archived tasks yet.":"暂时没有已归档任务。",
    "Archive task":"归档任务",
    "Set Up JSON Save File":"设置 JSON 保存文件",
    "This checklist can automatically save its data to a JSON file on this computer. The JSON includes your active tasks, archived tasks, and Version History.":"此任务清单可以自动将数据保存到电脑上的 JSON 文件中。JSON 文件包含当前任务、已归档任务和版本历史。",
    "Recommended file:":"推荐文件：",
    "Not Now":"暂不设置",
    "Set Up JSON File":"设置 JSON 文件",
    "How Your Data Is Saved":"数据如何保存",
    "This browser does not support automatic saving to a JSON file on your computer.":"此浏览器不支持自动保存到电脑上的 JSON 文件。",
    "For live JSON saving, open this page in Google Chrome or Microsoft Edge. In this browser, your checklist will still save automatically, but it is stored only inside the browser.":"如需实时保存到 JSON 文件，请使用 Google Chrome 或 Microsoft Edge 打开此页面。在当前浏览器中，任务清单仍会自动保存，但只保存在浏览器内部。",
    "Important: if you clear this browser's cookies, website data, or storage, your saved checklist may be deleted. You can still use Settings → Export backup to make a manual JSON backup.":"重要：如果清除此浏览器的 Cookie、网站数据或存储内容，已保存的任务清单可能会被删除。你仍可使用“设置 → 导出备份”手动创建 JSON 备份。",
    "I Understand":"我明白了",
    "Change Lock Password":"修改锁定密码",
    "Enter your current password, then enter the new password twice.":"请输入当前密码，然后输入两次新密码。",
    "Current password":"当前密码",
    "New password":"新密码",
    "Confirm new password":"确认新密码",
    "Cancel":"取消",
    "Update Password":"更新密码",
    "Unlock Settings":"解锁设置",
    "Exit Locked Mode":"退出锁定模式",
    "Enter the password to unlock the table and open Settings.":"请输入密码以解锁并打开设置。",
    "Enter the password to exit Locked Mode and re-enable teacher controls.":"请输入密码以退出锁定模式并重新启用教师控制。",
    "Incorrect password.":"密码错误。",
    "Edit students":"编辑学生",
    "Add Batch Students":"批量添加学生",
    "+ Add student":"+ 添加学生",
    "Save students":"保存学生",
    "Copy / Paste Checklist Data":"复制 / 粘贴任务清单数据",
    "Copy Data":"复制数据",
    "Apply Data":"应用数据",
    "Classroom Timer":"课堂计时器",
    "Start":"开始",
    "Pause":"暂停",
    "Reset":"重置",
    "Time":"时间",
    "30 sec":"30 秒",
    "15 min":"15 分钟",
    "30 min":"30 分钟",
    "60 min":"60 分钟",
    "Student Note":"学生备注",
    "Clear note":"清除备注",
    "Save note":"保存备注",
    "No unfinished Student Tasks.":"没有未完成的学生任务。",
    "All Student Tasks are complete. Only unfinished tasks appear in this table.":"所有学生任务都已完成。此表格只显示未完成的任务。",
    "No Student Tasks have been added yet.":"尚未添加学生任务。",
    "Student Tasks appear here. Teacher Tasks stay only in Checklist View.":"学生任务会显示在这里。教师任务只显示在任务清单中。",
    "No unfinished Classwork tasks.":"没有未完成的课堂任务。",
    "No unfinished Homework tasks.":"没有未完成的家庭作业。",
    "There are no unfinished Classwork tasks to show.":"没有未完成的课堂任务可显示。",
    "There are no unfinished Homework tasks to show.":"没有未完成的家庭作业可显示。",
    "No due":"无截止日期",
    "Marked overdue":"已标记逾期",
    "Task":"任务",
    "Untitled Task":"未命名任务",
    "Next":"下一步",
    "Ready":"完成设置",
    "Choose students":"选择学生",
    "Group size":"小组人数",
    "Task type":"任务类型",
    "Student task type":"学生任务类型",
    "Sort tasks":"排序任务",
    "+ Teacher Task":"+ 教师任务",
    "+ Classwork":"+ 课堂任务",
    "+ Homework":"+ 家庭作业",
    "Remove this task":"移除此任务",
    "Remove task":"移除任务",
    "Choose task format":"选择任务形式",
    "Manual Selection":"手动选择",
    "Choose how pairs are selected":"选择配对方式",
    "Choose how groups are selected":"选择分组方式",
    "Is anyone absent?":"有学生缺席吗？",
    "Tap a student to mark them absent before the pairs are created.":"在自动配对前，点击学生姓名将其标记为缺席。",
    "Next →":"下一步 →",
    "Students":"学生",
    "This pair needs at least 2 students":"每组至少需要 2 名学生",
    "Incomplete pair":"配对未完成",
    "Click to return this student to the name picker, or drag to move them":"点击将学生放回姓名列表，或拖动学生调整位置",
    "Return everyone in this pair to the name picker":"将此配对中的所有学生放回姓名列表",
    "Unassigned Students":"未分配学生",
    "Drag or click students to create pairs.":"拖动或点击学生来创建配对。",
    "Drag or click students to create groups.":"拖动或点击学生来创建小组。",
    "Finish Pairing":"完成配对",
    "Finish Grouping":"完成分组",
    "Choose group size":"选择小组人数",
    "How many students should be in each group?":"每组应有多少名学生？",
    "Present students":"出勤学生",
    "Create Groups":"创建小组",
    "Create Pairs":"创建配对",
    "Mark student present for this task":"将此学生标记为出勤",
    "Mark student absent for this task":"将此学生标记为缺席",
    "Mark present":"标记为出勤",
    "Mark absent":"标记为缺席",
    "Add note":"添加备注",
    "Edit note":"编辑备注",
    "Click to mark this student incomplete":"点击将此学生标记为未完成",
    "Overdue — click to mark this student complete":"已逾期——点击标记该学生为完成",
    "Click to mark this student complete":"点击将此学生标记为完成",
    "View incomplete tasks":"查看未完成任务",
    "Classwork tasks":"课堂任务",
    "Homework tasks":"家庭作业",
    "Pair Selection":"配对方式",
    "Group Selection":"分组方式",
    "Attendance":"出勤情况",
    "This group needs at least 2 students":"每组至少需要 2 名学生",
    "Incomplete group":"小组未完成",
    "Return everyone in this group to the name picker":"将此小组中的所有学生放回姓名列表",
    "No students are unassigned.":"所有学生都已分配。",
    "No students available.":"没有可用学生。",
    "All complete":"全部完成",
    "Mark all complete":"全部标记完成",
    "Mark none complete":"全部取消完成",
    "Move to Classwork":"移动到课堂任务",
    "Move to Homework":"移动到家庭作业",
    "Move to Teacher Task":"移动到教师任务",
    "Archive this task":"归档此任务",
    "Delete this task":"删除此任务",
    "Classwork time exceeded":"课堂任务时间已超出",
    "Marked overdue manually":"已手动标记逾期",
    "This homework is overdue because its due date has passed.":"此家庭作业已超过截止日期。",
    "Mark task as overdue":"将任务标记为逾期",
    "Clear manual overdue flag":"清除手动逾期标记"
  };

  const ZH_PATTERNS = [
    [/^(\d+) unfinished tasks shown\.$/, "$1 个未完成任务"],
    [/^(\d+) unfinished task shown\.$/, "$1 个未完成任务"],
    [/^(\d+) unfinished Classwork tasks shown\.$/, "$1 个未完成课堂任务"],
    [/^(\d+) unfinished Homework tasks shown\.$/, "$1 个未完成家庭作业"],
    [/^(\d+) absent$/, "$1 人缺席"],
    [/^Added (.+)$/, "添加于 $1"],
    [/^Archived (.+)$/, "归档于 $1"],
    [/^Due (.+)$/, "截止：$1"],
    [/^Group (\d+)$/, "第 $1 组"],
    [/^Pair (\d+)$/, "第 $1 对"],
    [/^Today (.+)$/, "今天 $1"],
    [/^Connected: (.+)$/, "已连接：$1"],
    [/^Loaded: (.+)$/, "已载入：$1"],
    [/^(\d+) marked absent\.$/, "已标记 $1 人缺席。"],
    [/^Return all students in pair (\d+) to the unassigned list$/, "将第 $1 对中的所有学生放回未分配列表"],
    [/^Return all students in group (\d+) to the unassigned list$/, "将第 $1 组中的所有学生放回未分配列表"],
    [/^Mark Pair (\d+) complete$/, "将第 $1 对标记为完成"],
    [/^Mark Group (\d+) complete$/, "将第 $1 组标记为完成"],
    [/^Add or edit note for (.+)$/, "为 $1 添加或编辑备注"],
    [/^Create a new (.+)$/, "新建$1"],
    [/^Unarchive to (.+)$/, "恢复到$1"],
    [/^Unarchives back to (.+)\.$/, "恢复后回到$1。"]
  ];

  function tr(text){
    const raw = String(text ?? "");
    if (uiLanguage !== "zh") return raw;

    const trimmed = raw.trim();
    if (!trimmed) return raw;

    if (ZH_TEXT[trimmed]){
      return raw.replace(trimmed, ZH_TEXT[trimmed]);
    }

    for (const [pattern, replacement] of ZH_PATTERNS){
      if (pattern.test(trimmed)){
        const translated = trimmed.replace(pattern, replacement);
        return raw.replace(trimmed, translated);
      }
    }

    return raw;
  }

  function translateTextNode(node){
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent) return;

    // Preserve user-entered/student/task data and script/style content.
    if (parent.closest(
      "script, style, .task-title, .archive-task-title, .student-name, .archive-student-name, " +
      ".student-detail-name, [data-student-name], input, textarea, option"
    )) return;

    node.nodeValue = tr(node.nodeValue);
  }

  function translateElementAttributes(root = document){
    root.querySelectorAll("[placeholder]").forEach(el => {
      if (!el.dataset.i18nPlaceholderEn){
        el.dataset.i18nPlaceholderEn = el.getAttribute("placeholder") || "";
      }
      const en = el.dataset.i18nPlaceholderEn;
      el.setAttribute("placeholder", uiLanguage === "zh" ? tr(en) : en);
    });

    root.querySelectorAll("[title]").forEach(el => {
      if (!el.dataset.i18nTitleEn){
        el.dataset.i18nTitleEn = el.getAttribute("title") || "";
      }
      const en = el.dataset.i18nTitleEn;
      el.setAttribute("title", uiLanguage === "zh" ? tr(en) : en);
    });

    root.querySelectorAll("[aria-label]").forEach(el => {
      if (!el.dataset.i18nAriaEn){
        el.dataset.i18nAriaEn = el.getAttribute("aria-label") || "";
      }
      const en = el.dataset.i18nAriaEn;
      el.setAttribute("aria-label", uiLanguage === "zh" ? tr(en) : en);
    });
  }

  function applyTranslations(root = document){
    if (!root) return;

    // Restore known static text from English snapshots when switching back.
    root.querySelectorAll("[data-i18n-en]").forEach(el => {
      if (uiLanguage === "en") el.textContent = el.dataset.i18nEn;
      else el.textContent = tr(el.dataset.i18nEn);
    });

    const walker = document.createTreeWalker(
      root === document ? document.body : root,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.children.length > 0) return;
      if (!parent.dataset.i18nEn && node.nodeValue.trim() && !parent.closest(
        "script, style, .task-title, .archive-task-title, .student-name, .archive-student-name, " +
        ".student-detail-name, [data-student-name], input, textarea, option"
      )){
        // Only snapshot leaf text elements. Never replace a container that
        // holds interactive children such as date inputs or buttons.
        if (uiLanguage === "en"){
          parent.dataset.i18nEn = parent.textContent.trim();
        }
      }
    });

    root.querySelectorAll("[data-i18n-en]").forEach(el => {
      const en = el.dataset.i18nEn;
      if (!en) return;

      // Explicit translation markers on leaf elements are safe to replace.
      // Containers with child elements must keep those children intact.
      if (el.children.length === 0){
        el.textContent = uiLanguage === "zh" ? tr(en) : en;
      }
    });

    translateElementAttributes(root === document ? document : root);

    document.documentElement.lang = uiLanguage === "zh" ? "zh-CN" : "en";
    languageToggleBtn.textContent = uiLanguage === "zh" ? "EN" : "中";
    languageToggleBtn.title = uiLanguage === "zh" ? "Switch to English" : "切换到中文";
    languageToggleBtn.setAttribute(
      "aria-label",
      uiLanguage === "zh" ? "Switch to English" : "切换到中文"
    );
  }

  function setUiLanguage(language){
    uiLanguage = language === "zh" ? "zh" : "en";
    profileSet(LANGUAGE_STORAGE_KEY, uiLanguage);

    // Full rerender regenerates dynamic English source strings, then translation is applied.
    render();
    updateTableLockUI();
    updateTimestampToggleUI();
    updateJsonSaveUI(jsonFileHandle ? "connected" : "idle");

    if (archiveDialog && archiveDialog.open) renderArchive();
    if (historyDialog && historyDialog.open) renderVersionHistory();
    if (wordlePage && !wordlePage.hidden) renderWordle();

    applyTranslations(document);
  }

  function toggleUiLanguage(){
    setUiLanguage(uiLanguage === "zh" ? "en" : "zh");
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function parseDateOnly(value){
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function animateCheckbox(checkbox){
    if (!checkbox || !checkbox.checked) return;
    checkbox.classList.remove("check-pop");
    void checkbox.offsetWidth;
    checkbox.classList.add("check-pop");
    checkbox.addEventListener("animationend", () => {
      checkbox.classList.remove("check-pop");
    }, { once:true });
  }

  function celebrateCompletion(target){
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    target.classList.remove("completion-celebrate");
    void target.offsetWidth;
    target.classList.add("completion-celebrate");

    const stars = [
      {x:"-54px", y:"-34px", d:"0ms"},
      {x:"-22px", y:"-52px", d:"25ms"},
      {x:"18px", y:"-50px", d:"50ms"},
      {x:"52px", y:"-28px", d:"15ms"},
      {x:"-58px", y:"10px", d:"45ms"},
      {x:"58px", y:"8px", d:"65ms"},
      {x:"-35px", y:"38px", d:"20ms"},
      {x:"34px", y:"40px", d:"55ms"}
    ];

    stars.forEach(({x,y,d}, index) => {
      const star = document.createElement("span");
      star.className = "completion-star";
      star.textContent = index % 2 ? "✦" : "★";
      star.style.setProperty("--star-x", x);
      star.style.setProperty("--star-y", y);
      star.style.setProperty("--star-delay", d);
      target.appendChild(star);
    });

    window.setTimeout(() => {
      target.classList.remove("completion-celebrate");
      target.querySelectorAll(".completion-star").forEach(star => star.remove());
    }, 760);
  }

  function finishCompletionCelebration(target){
    celebrateCompletion(target);
    window.setTimeout(() => render(), 560);
  }

  function recordCompletionTick(task, student, iso = new Date().toISOString()){
    task.completedAt = task.completedAt || {};
    task.completionHistory = task.completionHistory || {};

    if (!Array.isArray(task.completionHistory[student])){
      task.completionHistory[student] = [];
    }

    task.completionHistory[student].push(iso);
    task.completedAt[student] = iso;
    return iso;
  }

  function completionTimestampText(iso){
    if (!iso) return "";

    const when = new Date(iso);
    if (Number.isNaN(when.getTime())) return "";

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - when.getTime());
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    let relative;
    if (days >= 1){
      relative = `${days}d ago`;
    } else if (hours >= 1){
      relative = `${hours}h ago`;
    } else if (mins >= 1){
      relative = `${mins}m ago`;
    } else {
      relative = "Just now";
    }

    const sameDay =
      when.getFullYear() === now.getFullYear() &&
      when.getMonth() === now.getMonth() &&
      when.getDate() === now.getDate();

    const exact = sameDay
      ? when.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      : when.toLocaleString([], {
          month:"short",
          day:"numeric",
          hour:"2-digit",
          minute:"2-digit"
        });

    return `${relative} (${exact})`;
  }

  function isStudentAbsent(task, student){
    return !!(task.absent && task.absent[student]);
  }

  function classDueMode(task){
    if (!task || studentTaskType(task) !== "classwork") return "";
    return ["this-class", "next-class", "later-today", "custom"].includes(task.classDueMode)
      ? task.classDueMode
      : "this-class";
  }

  function thisClassDueDate(task){
    if (!task) return null;

    if (task.classDueAt){
      const explicit = new Date(task.classDueAt);
      if (!Number.isNaN(explicit.getTime())) return explicit;
    }

    // Backward compatibility for older "This class" tasks:
    // treat the class as a 45-minute window from task creation.
    const start = task.createdAt ? new Date(task.createdAt) : new Date();
    if (Number.isNaN(start.getTime())) return null;

    return new Date(start.getTime() + 45 * 60 * 1000);
  }

  function classDueLabel(task){
    const mode = classDueMode(task);
    if (mode === "this-class") return "This class";
    if (mode === "next-class") return "Next class";
    if (mode === "later-today") return "Later today";
    if (mode === "custom") return task.dueAt ? friendlyDueDate(task.dueAt) : "Custom date";
    return "This class";
  }

  function taskDueDate(task){
    const d = parseDateOnly(task.dueAt);
    if (!d) return null;

    if (studentTaskType(task) === "classwork"){
      const mode = classDueMode(task);

      // "This class" stays pending until the current 45-minute class window ends.
      if (mode === "this-class"){
        return thisClassDueDate(task);
      }

      // "Later today" remains pending until the end of the day.
      if (mode === "later-today"){
        d.setHours(23,59,59,999);
        return d;
      }

      // Next class and Custom are considered due from the beginning
      // of their selected date.
      d.setHours(0,0,0,0);
      return d;
    }

    // Homework keeps the existing date-based behaviour.
    d.setHours(0,0,0,0);
    return d;
  }

  function isTaskOverdue(task, now = new Date()){
    if (task && task.forcedOverdue) return true;

    const due = taskDueDate(task);
    if (!due) return false;

    if (
      studentTaskType(task) === "classwork" &&
      ["this-class", "later-today"].includes(classDueMode(task))
    ){
      return now.getTime() >= due.getTime();
    }

    const today = new Date(now);
    today.setHours(0,0,0,0);

    return due.getTime() <= today.getTime();
  }

  function isTaskPending(task, student, now = new Date()){
    return !isStudentAbsent(task, student) &&
      !task.completed[student] &&
      !isTaskOverdue(task, now);
  }

  function ordinalDay(day){
    const mod100 = day % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
    switch (day % 10){
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  }

  function friendlyDueDate(value){
    const d = parseDateOnly(value);
    if (!d) return "No due date";
    const weekday = d.toLocaleDateString([], { weekday:"long" });
    return `${weekday} ${ordinalDay(d.getDate())}`;
  }

  function formatDateOnly(value){
    const d = parseDateOnly(value);
    if (!d) return "No due date";
    return d.toLocaleDateString([], {
      weekday:"short",
      year:"numeric",
      month:"short",
      day:"numeric"
    });
  }

  function isDueToday(task){
    if (!task.dueAt) return false;
    return task.dueAt === localDateValue(new Date());
  }

  function formatDue(task){
    if (task && task.forcedOverdue) return "Marked overdue";

    if (studentTaskType(task) === "classwork"){
      const mode = classDueMode(task);
      if (mode === "this-class"){
        const due = thisClassDueDate(task);
        return due
          ? `Due this class · ${due.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
          : "Due this class";
      }
      if (mode === "later-today") return "Due later today";
      if (mode === "next-class") return "Due next class";
      if (mode === "custom"){
        return task.dueAt ? `Due ${formatDateOnly(task.dueAt)}` : "Choose a due date";
      }
    }

    if (!task.dueAt) return "No due date";
    if (isDueToday(task)) return "Due Today";
    return formatDateOnly(task.dueAt);
  }

  function localDateValue(date){
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }


  function taskAudience(task){
    return task && task.audience === "teacher" ? "teacher" : "student";
  }

  function activeTasks(){
    return state.tasks.filter(task => !task.archived);
  }

  function archivedTasks(){
    return state.tasks.filter(task => !!task.archived);
  }

  function studentTasks(){
    return activeTasks().filter(task => taskAudience(task) === "student");
  }

  function studentTaskType(task){
    return task && task.studentTaskType === "homework" ? "homework" : "classwork";
  }

  function taskWorkMode(task){
    if (!task) return "";
    if (task.workMode === "pair") return "pair";
    if (task.workMode === "group") return "group";
    if (task.workMode === "individual") return "individual";
    return "";
  }

  function taskWorkModeLabel(mode){
    if (mode === "pair") return "👥 Pair";
    if (mode === "group") return "👨‍👩‍👧 Group";
    if (mode === "individual") return "👤 Individual";
    return "";
  }

  function pairSelectionLabel(task){
    if (!task || taskWorkMode(task) !== "pair") return "";
    if (task.pairSelectionMode === "automatic") return "Automatic";
    if (task.pairSelectionMode === "manual") return "Manual";
    return "";
  }

  function workModeSelectionTooltip(task){
    const mode = taskWorkMode(task);

    if (mode === "pair"){
      if (task.pairSelectionMode === "automatic") return "Automatic selection";
      if (task.pairSelectionMode === "manual") return "Manual selection";
      return "Pair task";
    }

    if (mode === "group"){
      if (task.groupSelectionMode === "automatic") return "Automatic selection";
      if (task.groupSelectionMode === "manual") return "Manual selection";
      return "Group task";
    }

    return "Individual task";
  }

  function groupSizeLabel(task){
    if (!task || taskWorkMode(task) !== "group") return "";
    return [3,4,5,6].includes(Number(task.groupSize))
      ? `${Number(task.groupSize)} per group`
      : "";
  }

  function balancedGroupSizes(studentCount, preferredSize){
    const count = Math.max(0, Number(studentCount) || 0);
    const size = Math.max(1, Number(preferredSize) || 1);

    if (!count) return [];
    if (count <= size) return [count];

    const numberOfGroups = Math.ceil(count / size);
    const baseSize = Math.floor(count / numberOfGroups);
    const largerGroups = count % numberOfGroups;

    return Array.from({length:numberOfGroups}, (_, index) =>
      baseSize + (index < largerGroups ? 1 : 0)
    );
  }

  function groupBreakdownText(studentCount, groupSize){
    const sizes = balancedGroupSizes(studentCount, groupSize);
    if (!sizes.length) return "No students present";

    const counts = {};
    sizes.forEach(size => {
      counts[size] = (counts[size] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a,b) => Number(b[0]) - Number(a[0]))
      .map(([size, count]) =>
        `${count} ${count === 1 ? "group" : "groups"} of ${size}`
      )
      .join(" + ");
  }

  function buildBalancedGroups(students, preferredSize){
    const shuffled = [...students];

    for (let i = shuffled.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const sizes = balancedGroupSizes(shuffled.length, preferredSize);
    const groups = [];
    let offset = 0;

    sizes.forEach(size => {
      groups.push(shuffled.slice(offset, offset + size));
      offset += size;
    });

    return groups;
  }

  function isAutomaticPairTask(task){
    return !!(
      task &&
      taskWorkMode(task) === "pair" &&
      task.pairSelectionMode === "automatic" &&
      task.pairSetupStage === "ready" &&
      Array.isArray(task.pairGroups) &&
      task.pairGroups.length
    );
  }

  function isManualPairTask(task){
    return !!(
      task &&
      taskWorkMode(task) === "pair" &&
      task.pairSelectionMode === "manual" &&
      task.pairSetupStage === "ready" &&
      Array.isArray(task.pairGroups) &&
      task.pairGroups.length
    );
  }

  function manualPairUnpairedStudents(task){
    const paired = new Set(
      (Array.isArray(task.pairGroups) ? task.pairGroups : [])
        .flat()
        .map(String)
    );

    return state.students.filter(student =>
      !isStudentAbsent(task, student) && !paired.has(student)
    );
  }

  function isGeneratedGroupTask(task){
    return !!(
      task &&
      taskWorkMode(task) === "group" &&
      task.groupSetupStage === "ready" &&
      Array.isArray(task.groupGroups) &&
      task.groupGroups.length
    );
  }

  function pairGroupComplete(task, group){
    if (!Array.isArray(group) || !group.length) return false;

    const requiredMembers = group.filter(student => !isStudentAbsent(task, student));
    return requiredMembers.length > 0 &&
      requiredMembers.every(student => !!task.completed[student]);
  }

  function filteredStudentTasks(){
    const tasks = studentTasks();
    if (activeStudentTaskFilter === "classwork"){
      return tasks.filter(task => studentTaskType(task) === "classwork");
    }
    if (activeStudentTaskFilter === "homework"){
      return tasks.filter(task => studentTaskType(task) === "homework");
    }
    return tasks;
  }

  function isTaskAllComplete(task){
    const requiredStudents = state.students.filter(student => !isStudentAbsent(task, student));
    return requiredStudents.length > 0 &&
      requiredStudents.every(student => !!task.completed[student]);
  }

  function teacherTasks(){
    return activeTasks().filter(task => taskAudience(task) === "teacher");
  }

  function incompleteCountForStudent(student){
    const now = new Date();
    return activeTasks().reduce((count, task) => {
      return count + (
        !isStudentAbsent(task, student) &&
        !task.completed[student] &&
        isTaskOverdue(task, now) ? 1 : 0
      );
    }, 0);
  }

  function studentSeverityClass(count){
    if (count <= 0) return "complete";
    if (count === 1) return "severity-1";
    if (count === 2) return "severity-2";
    return "severity-3";
  }

  function tableStudentStatus(student, tasks = studentTasks()){
    const now = new Date();
    let pending = 0;
    let overdue = 0;

    tasks.forEach(task => {
      if (task.completed[student] || isStudentAbsent(task, student)) return;

      if (isTaskOverdue(task, now)){
        overdue++;
      } else {
        pending++;
      }
    });

    return {
      pending,
      overdue,
      total: pending + overdue,
      className: overdue > 0 ? "table-overdue" : (pending > 0 ? "table-pending" : "complete")
    };
  }

  function attentionSeverityStyle(count){
    const n = Number(count) || 1;

    if (n === 1){
      return {
        bg:"#fefce8",
        text:"#854d0e",
        border:"#fde68a",
        boldName:false
      };
    }

    if (n === 2){
      return {
        bg:"var(--warn-soft)",
        text:"var(--warn)",
        border:"#fed7aa",
        boldName:false
      };
    }

    return {
      bg:"#fef2f2",
      text:"#b91c1c",
      border:"#fecaca",
      boldName:true
    };
  }

  function updateAttentionPanelUI(){
    const collapsed = !!state.settings.attentionCollapsed;
    attentionSummaryPanel.classList.toggle("attention-collapsed", collapsed);
    attentionToggleBtn.textContent = collapsed ? "+" : "−";
    attentionToggleBtn.setAttribute("aria-expanded", String(!collapsed));
    attentionToggleBtn.title = collapsed
      ? "Expand unfinished work"
      : "Minimise unfinished work";
    attentionSummaryPanel.title = collapsed
      ? "Click to expand unfinished work"
      : "Click to minimise unfinished work";
  }

  function renderSummary(){
    updateAttentionPanelUI();
    attentionList.innerHTML = "";

    if (activeTasks().length === 0){
      attentionHeading.innerHTML = 'No unfinished work <span class="attention-success-tick">✓</span>';
      attentionText.textContent = "Add a task to start tracking completion.";
      summaryCount.textContent = "";
      return;
    }

    const outstanding = state.students
      .map(name => ({name, count: incompleteCountForStudent(name)}))
      .filter(x => x.count > 0)
      .sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));

    attentionHeading.textContent = outstanding.length
      ? `${outstanding.length} ${outstanding.length === 1 ? "student has" : "students have"} unfinished work`
      : "No unfinished work";

    summaryCount.textContent = "";

    attentionText.textContent = outstanding.length
      ? "Highlighted students have one or more overdue tasks:"
      : "Everyone has completed every current task.";

    if (!outstanding.length){
      const chip = document.createElement("span");
      chip.className = "chip complete";
      chip.textContent = "✓ All tasks complete";
      attentionList.appendChild(chip);
      return;
    }

    outstanding.forEach(({name,count}) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.studentName = name;
      chip.title = `${count} incomplete task${count === 1 ? "" : "s"} — click to view`;
      chip.style.cursor = "pointer";

      const severity = attentionSeverityStyle(count);
      chip.style.background = severity.bg;
      chip.style.color = severity.text;
      chip.style.borderColor = severity.border;
      chip.style.fontWeight = "500";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      nameSpan.style.fontWeight = severity.boldName ? "750" : "500";

      const countSpan = document.createElement("span");
      countSpan.textContent = ` — ${count}`;
      countSpan.style.fontWeight = "750";

      chip.appendChild(nameSpan);
      chip.appendChild(countSpan);
      attentionList.appendChild(chip);
    });
  }

  function fitTableToViewport(){
    const table = tableView.querySelector(".overview-table");
    if (!table) return;

    const resetFullscreenSizing = () => {
      table.style.zoom = "1";
      table.style.width = "100%";
      table.style.height = "";
      [
        "--fs-body-font",
        "--fs-name-font",
        "--fs-task-font",
        "--fs-meta-font",
        "--fs-due-font",
        "--fs-stamp-font",
        "--fs-checkbox-size",
        "--fs-name-width",
        "--fs-header-height",
        "--fs-row-height"
      ].forEach(name => table.style.removeProperty(name));
    };

    const isFullscreen =
      document.fullscreenElement === tablePanel ||
      tablePanel.classList.contains("fullscreen-fallback");

    if (!isFullscreen){
      resetFullscreenSizing();
      tableScaleNote.textContent = "";
      return;
    }

    requestAnimationFrame(() => {
      const taskCount = Math.max(1, studentTasks().length);
      const studentCount = Math.max(1, state.students.length);

      const availableWidth = Math.max(480, tableView.clientWidth - 2);
      const availableHeight = Math.max(360, tableView.clientHeight - 2);

      // Keep the student-name column readable while giving lesson columns
      // the rest of the screen. With many lessons, the name column contracts.
      const nameWidth = Math.max(
        118,
        Math.min(190, availableWidth * (taskCount <= 6 ? 0.16 : taskCount <= 12 ? 0.13 : 0.105))
      );

      const taskWidth = Math.max(1, (availableWidth - nameWidth) / taskCount);

      // Reserve a larger row for lesson titles, then divide every remaining
      // vertical pixel evenly between the students.
      const headerHeight = Math.max(
        46,
        Math.min(82, availableHeight * (taskCount <= 6 ? 0.105 : 0.09))
      );
      const rowHeight = Math.max(13, (availableHeight - headerHeight) / studentCount);

      // Checkbox size reacts to BOTH row height and lesson-column width.
      // Few lessons = large boxes; many lessons = progressively smaller boxes.
      const checkboxSize = Math.max(
        8,
        Math.min(30, rowHeight * 0.68, taskWidth * 0.42)
      );

      const bodyFont = Math.max(
        8,
        Math.min(17, rowHeight * 0.43, taskWidth * 0.22 + 7)
      );

      const nameFont = Math.max(
        9,
        Math.min(17, rowHeight * 0.44)
      );

      const taskFont = Math.max(
        8,
        Math.min(18, headerHeight * 0.24, taskWidth * 0.16 + 8)
      );

      const metaFont = Math.max(6.5, Math.min(11, taskFont * 0.72));
      const dueFont = Math.max(6, Math.min(10, taskFont * 0.64));
      const stampFont = Math.max(5.5, Math.min(9, bodyFont * 0.58));

      table.style.zoom = "1";
      table.style.width = "100%";
      table.style.height = "100%";

      table.style.setProperty("--fs-name-width", `${nameWidth.toFixed(1)}px`);
      table.style.setProperty("--fs-header-height", `${headerHeight.toFixed(1)}px`);
      table.style.setProperty("--fs-row-height", `${rowHeight.toFixed(2)}px`);
      table.style.setProperty("--fs-checkbox-size", `${checkboxSize.toFixed(1)}px`);
      table.style.setProperty("--fs-body-font", `${bodyFont.toFixed(1)}px`);
      table.style.setProperty("--fs-name-font", `${nameFont.toFixed(1)}px`);
      table.style.setProperty("--fs-task-font", `${taskFont.toFixed(1)}px`);
      table.style.setProperty("--fs-meta-font", `${metaFont.toFixed(1)}px`);
      table.style.setProperty("--fs-due-font", `${dueFont.toFixed(1)}px`);
      table.style.setProperty("--fs-stamp-font", `${stampFont.toFixed(1)}px`);

      tableScaleNote.textContent =
        `Full screen · ${Math.round(checkboxSize)}px ticks · ${taskCount} task${taskCount === 1 ? "" : "s"}`;
    });
  }

  function renderTable(){
    tableView.innerHTML = "";

    const allStudentTableTasks = studentTasks();
    const allTableTasks = allStudentTableTasks.filter(task => !isTaskAllComplete(task));
    const classworkTasks = allTableTasks.filter(task => studentTaskType(task) === "classwork");
    const homeworkTasks = allTableTasks.filter(task => studentTaskType(task) === "homework");

    const tableTasks =
      activeTableTaskFilter === "classwork"
        ? classworkTasks
        : activeTableTaskFilter === "homework"
          ? homeworkTasks
          : allTableTasks;

    if (tableTaskFilters){
      tableTaskFilters.querySelectorAll("[data-table-task-filter]").forEach(btn => {
        const filter = btn.dataset.tableTaskFilter;
        const count =
          filter === "classwork"
            ? classworkTasks.length
            : filter === "homework"
              ? homeworkTasks.length
              : allTableTasks.length;

        btn.classList.toggle("active", filter === activeTableTaskFilter);
        btn.innerHTML = `${
          filter === "classwork"
            ? "Classwork"
            : filter === "homework"
              ? "Homework"
              : "All Tasks"
        } <span class="student-task-subtab-count">${count}</span>`;
      });
    }

    if (allTableTasks.length === 0){
      tableSummary.textContent = allStudentTableTasks.length
        ? "No unfinished Student Tasks."
        : "No Student Tasks have been added yet.";
      tableView.innerHTML = allStudentTableTasks.length
        ? '<div class="empty">All Student Tasks are complete. Only unfinished tasks appear in this table.</div>'
        : '<div class="empty">Student Tasks appear here. Teacher Tasks stay only in Checklist View.</div>';
      return;
    }

    if (tableTasks.length === 0){
      const label =
        activeTableTaskFilter === "classwork"
          ? "Classwork"
          : activeTableTaskFilter === "homework"
            ? "Homework"
            : "Student";
      tableSummary.textContent = `No unfinished ${label} tasks.`;
      tableView.innerHTML = `<div class="empty">There are no unfinished ${label} tasks to show.</div>`;
      return;
    }

    const totalChecks = state.students.length * tableTasks.length;
    const completeChecks = tableTasks.reduce((sum, task) =>
      sum + state.students.filter(student => !!task.completed[student]).length, 0);

    const tableFilterLabel =
      activeTableTaskFilter === "classwork"
        ? "Classwork"
        : activeTableTaskFilter === "homework"
          ? "Homework"
          : "Student Task";
    tableSummary.textContent = `${tableTasks.length} unfinished ${tableFilterLabel}${tableTasks.length === 1 ? "" : "s"} shown.`;

    const table = document.createElement("table");
    table.className = "overview-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    const studentHead = document.createElement("th");
    studentHead.textContent = "Student";
    headRow.appendChild(studentHead);

    tableTasks.forEach(task => {
      const th = document.createElement("th");
      th.className = "table-task-title";
      if (isTaskAllComplete(task)){
        th.classList.add("task-all-complete");
      }
      const titleDiv = document.createElement("div");
      titleDiv.textContent = task.title || "Untitled Task";
      const catDiv = document.createElement("div");
      catDiv.textContent =
        taskAudience(task) === "student"
          ? tr(studentTaskType(task) === "homework" ? "Homework" : "Classwork")
          : (task.category || tr("Teacher Task"));
      catDiv.style.marginTop = "5px";
      catDiv.style.fontSize = "11px";
      catDiv.style.fontWeight = "700";
      catDiv.style.color = "var(--accent)";

      const dueDiv = document.createElement("div");
      dueDiv.style.marginTop = "3px";
      dueDiv.style.fontSize = "12px";
      dueDiv.style.fontWeight = "700";

      if (studentTaskType(task) === "classwork"){
        if (isTaskOverdue(task)){
          dueDiv.textContent = "⏰";
          dueDiv.title = "Classwork time exceeded";
          dueDiv.setAttribute("aria-label", "Classwork time exceeded");
        } else {
          dueDiv.textContent = "";
        }
      } else {
        dueDiv.textContent = task.dueAt ? formatDue(task) : "No due";
        dueDiv.style.fontSize = "9px";
        dueDiv.style.fontWeight = "600";
        dueDiv.style.color = task.dueAt
          ? (isTaskOverdue(task) ? "#b91c1c" : "#1d4ed8")
          : "var(--muted)";
      }

      th.appendChild(titleDiv);
      th.appendChild(catDiv);
      if (dueDiv.textContent){
        th.appendChild(dueDiv);
      }
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    state.students.forEach(student => {
      const row = document.createElement("tr");
      const tableStatus = tableStudentStatus(student, tableTasks);
      if (tableStatus.total > 0) row.classList.add("has-incomplete");

      const nameCell = document.createElement("td");
      const status = tableStudentStatus(student, tableTasks);

      const nameWrap = document.createElement("span");
      nameWrap.className = "student-name-wrap";

      const nameLink = document.createElement("span");
      nameLink.className = `table-student-link student-name ${status.className}`;
      nameLink.textContent = student;
      nameLink.dataset.studentName = student;

      if (status.overdue > 0){
        nameLink.title = `${status.overdue} overdue, ${status.pending} due in future`;
      } else if (status.pending > 0){
        nameLink.title = `${status.pending} outstanding task${status.pending === 1 ? "" : "s"} due in future`;
      } else {
        nameLink.title = "No outstanding work";
      }

      nameWrap.appendChild(nameLink);

      if (status.overdue > 0){
        const countBadge = document.createElement("span");
        countBadge.className = `incomplete-count-badge table-overdue`;
        countBadge.textContent = String(status.overdue);
        countBadge.setAttribute(
          "aria-label",
          `${status.overdue} overdue task${status.overdue === 1 ? "" : "s"}`
        );

        countBadge.title = `${status.overdue} task${status.overdue === 1 ? "" : "s"} due today or earlier`;
        nameWrap.appendChild(countBadge);
      }

      nameCell.appendChild(nameWrap);
      row.appendChild(nameCell);

      tableTasks.forEach(task => {
        const cell = document.createElement("td");
        if (isTaskAllComplete(task)){
          cell.classList.add("task-all-complete");
        }

        const studentTaskOverdue =
          !isStudentAbsent(task, student) &&
          !task.completed[student] &&
          isTaskOverdue(task);

        if (studentTaskOverdue){
          cell.classList.add("student-task-overdue");
        }

        const wrap = document.createElement("span");
        wrap.className = "table-check-wrap";

        if (isStudentAbsent(task, student)){
          cell.classList.add("absent-cell");
          const absentLabel = document.createElement("span");
          absentLabel.className = "absent-label";
          absentLabel.textContent = "Absent";
          wrap.appendChild(absentLabel);
        } else {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = !!task.completed[student];
          checkbox.disabled = tableLocked;
          checkbox.dataset.tableTask = task.id;
          checkbox.dataset.tableStudent = student;
          checkbox.setAttribute("aria-label", `${student} - ${task.title}`);
          wrap.appendChild(checkbox);

          if (state.settings.completionTimestamps && checkbox.checked){
            const ts = task.completedAt && task.completedAt[student];
            const text = completionTimestampText(ts);

            if (text){
              const stamp = document.createElement("span");
              stamp.className = "table-completion-time";
              stamp.dataset.completedAt = ts;
              stamp.textContent = text;
              wrap.appendChild(stamp);
            }
          }
        }

        cell.appendChild(wrap);
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableView.appendChild(table);
    fitTableToViewport();
  }

  function centerActiveSetupCard(){
    const setupCard = tasksEl.querySelector(
      ".task-setup-card:not([hidden])"
    );
    if (!setupCard) return;

    requestAnimationFrame(() => {
      setupCard.scrollIntoView({
        behavior:"smooth",
        block:"center",
        inline:"nearest"
      });
    });
  }

  function renderCore(){
    tasksEl.innerHTML = "";
    updateArchiveButtonUI();

    const studentTaskCount = studentTasks().length;
    const teacherTaskCount = teacherTasks().length;
    const classworkCount = studentTasks().filter(task => studentTaskType(task) === "classwork").length;
    const homeworkCount = studentTasks().filter(task => studentTaskType(task) === "homework").length;
    const visibleTasks = sortedActiveTaskList(
      activeTaskAudience === "teacher"
        ? teacherTasks()
        : filteredStudentTasks()
    );

    const tabs = document.createElement("div");
    tabs.className = "task-audience-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Task type");
    tabs.innerHTML = `
      <button type="button"
              class="task-audience-tab ${activeTaskAudience === "student" ? "active" : ""}"
              data-task-audience-tab="student"
              role="tab"
              aria-selected="${activeTaskAudience === "student"}">
        ${tr("Student Tasks")} <span class="task-audience-count">${studentTaskCount}</span>
      </button>
      <button type="button"
              class="task-audience-tab ${activeTaskAudience === "teacher" ? "active" : ""}"
              data-task-audience-tab="teacher"
              role="tab"
              aria-selected="${activeTaskAudience === "teacher"}">
        ${tr("Teacher Tasks")} <span class="task-audience-count">${teacherTaskCount}</span>
      </button>
    `;
    tasksEl.appendChild(tabs);

    if (activeTaskAudience === "student"){
      const subtabsRow = document.createElement("div");
      subtabsRow.className = "student-task-subtabs-row";
      subtabsRow.innerHTML = `
        <div class="student-task-subtabs"
             role="tablist"
             aria-label="Student task type">
          <button type="button"
                  class="student-task-subtab ${activeStudentTaskFilter === "all" ? "active" : ""}"
                  data-student-task-filter="all">
            ${tr("All Tasks")} <span class="student-task-subtab-count">${studentTaskCount}</span>
          </button>
          <button type="button"
                  class="student-task-subtab ${activeStudentTaskFilter === "classwork" ? "active" : ""}"
                  data-student-task-filter="classwork">
            ${tr("Classwork")} <span class="student-task-subtab-count">${classworkCount}</span>
          </button>
          <button type="button"
                  class="student-task-subtab ${activeStudentTaskFilter === "homework" ? "active" : ""}"
                  data-student-task-filter="homework">
            ${tr("Homework")} <span class="student-task-subtab-count">${homeworkCount}</span>
          </button>
        </div>

        <div class="sort-dropdown-wrap">
          <button type="button"
                  class="sort-dropdown-trigger sort-icon-trigger"
                  aria-haspopup="menu"
                  aria-label="Sort tasks"
                  title="Sort tasks">
            ⇅
          </button>
          <div class="sort-dropdown-menu" role="menu">
            <button type="button"
                    class="${activeTaskSort === "date-added" ? "active" : ""}"
                    data-task-sort="date-added"
                    role="menuitem">
              ${tr("Date added")}
            </button>
            <button type="button"
                    class="${activeTaskSort === "alphabetical" ? "active" : ""}"
                    data-task-sort="alphabetical"
                    role="menuitem">
              ${tr("Alphabetical")}
            </button>
            <button type="button"
                    class="${activeTaskSort === "due-date" ? "active" : ""}"
                    data-task-sort="due-date"
                    role="menuitem">
              ${tr("Due date")}
            </button>
          </div>
        </div>
      `;
      tasksEl.appendChild(subtabsRow);
    }

    const tabHead = document.createElement("div");
    tabHead.className = "task-tab-head";
    tabHead.innerHTML = `
      <div class="task-tab-actions-wrap">
        ${
          activeTaskAudience === "teacher"
            ? `
              <div class="sort-dropdown-wrap">
                <button type="button"
                        class="sort-dropdown-trigger sort-icon-trigger"
                        aria-haspopup="menu"
                        aria-label="Sort tasks"
                        title="Sort tasks">
                  ⇅
                </button>
                <div class="sort-dropdown-menu" role="menu">
                  <button type="button"
                          class="${activeTaskSort === "date-added" ? "active" : ""}"
                          data-task-sort="date-added"
                          role="menuitem">
                    ${tr("Date added")}
                  </button>
                  <button type="button"
                          class="${activeTaskSort === "alphabetical" ? "active" : ""}"
                          data-task-sort="alphabetical"
                          role="menuitem">
                    ${tr("Alphabetical")}
                  </button>
                  <button type="button"
                          class="${activeTaskSort === "due-date" ? "active" : ""}"
                          data-task-sort="due-date"
                          role="menuitem">
                    ${tr("Due date")}
                  </button>
                </div>
              </div>
            `
            : ""
        }

        <button type="button"
                class="secondary small unfinished-filter-btn ${showUnfinishedOnly ? "active" : ""}"
                data-toggle-unfinished-only
                aria-pressed="${showUnfinishedOnly ? "true" : "false"}"
                title="${tr(showUnfinishedOnly ? "Show all students" : "Show unfinished only")}">
          ${showUnfinishedOnly ? "✓ " : ""}${tr(showUnfinishedOnly ? "Show all students" : "Show unfinished only")}
        </button>

        <div class="task-tab-add-actions">
        ${
          activeTaskAudience === "teacher"
            ? `
              <button class="secondary small"
                      type="button"
                      data-add-current-task="teacher"
                      ${tableLocked ? "disabled" : ""}>
                ${tr("+ Teacher Task")}
              </button>
            `
            : activeStudentTaskFilter === "all"
              ? `
                <button class="secondary small"
                        type="button"
                        data-add-student-subtask="classwork"
                        ${tableLocked ? "disabled" : ""}>
                  ${tr("+ Classwork")}
                </button>
                <button class="secondary small"
                        type="button"
                        data-add-student-subtask="homework"
                        ${tableLocked ? "disabled" : ""}>
                  ${tr("+ Homework")}
                </button>
              `
              : `
                <button class="secondary small"
                        type="button"
                        data-add-student-subtask="${activeStudentTaskFilter}"
                        ${tableLocked ? "disabled" : ""}>
                  ${tr(activeStudentTaskFilter === "homework" ? "+ Homework" : "+ Classwork")}
                </button>
              `
        }
        </div>
      </div>
    `;
    tasksEl.appendChild(tabHead);

    const taskList = document.createElement("div");
    taskList.className = "task-tab-list";
    tasksEl.appendChild(taskList);

    visibleTasks.forEach((task, taskIndex) => {
      if (!taskWorkMode(task)){
        const setupCard = document.createElement("section");
        setupCard.className = "task-setup-card";
        setupCard.dataset.taskCard = task.id;
        setupCard.draggable = !tableLocked;
        setupCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>
          <div class="task-setup-options" aria-label="Choose task format">
            <button type="button"
                    class="task-setup-option"
                    data-set-work-mode="${task.id}"
                    data-work-mode="individual"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">👤</span>
              <span>${tr("Individual")}</span>
            </button>
            <button type="button"
                    class="task-setup-option"
                    data-set-work-mode="${task.id}"
                    data-work-mode="pair"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">👥</span>
              <span>${tr("Pair")}</span>
            </button>
            <button type="button"
                    class="task-setup-option"
                    data-set-work-mode="${task.id}"
                    data-work-mode="group"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">👨‍👩‍👧</span>
              <span>${tr("Group")}</span>
            </button>
          </div>
        `;
        taskList.appendChild(setupCard);
        return;
      }

      if (taskWorkMode(task) === "pair" && !pairSelectionLabel(task)){
        const pairSetupCard = document.createElement("section");
        pairSetupCard.className = "task-setup-card";
        pairSetupCard.dataset.taskCard = task.id;
        pairSetupCard.draggable = !tableLocked;
        pairSetupCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="task-setup-options"
               style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:560px;"
               aria-label="Choose how pairs are selected">
            <button type="button"
                    class="task-setup-option"
                    data-set-pair-selection="${task.id}"
                    data-pair-selection="manual"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">🖐️</span>
              <span>${tr("Manual Selection")}</span>
            </button>
            <button type="button"
                    class="task-setup-option"
                    data-set-pair-selection="${task.id}"
                    data-pair-selection="automatic"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">⚡</span>
              <span>${tr("Automatic")}</span>
            </button>
          </div>
        `;
        taskList.appendChild(pairSetupCard);
        return;
      }

      if (taskWorkMode(task) === "group" && !task.groupSelectionMode){
        const groupSetupCard = document.createElement("section");
        groupSetupCard.className = "task-setup-card";
        groupSetupCard.dataset.taskCard = task.id;
        groupSetupCard.draggable = !tableLocked;
        groupSetupCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="task-setup-options"
               style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:560px;"
               aria-label="Choose how groups are selected">
            <button type="button"
                    class="task-setup-option"
                    data-set-group-selection="${task.id}"
                    data-group-selection="manual"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">🖐️</span>
              <span>${tr("Manual Selection")}</span>
            </button>
            <button type="button"
                    class="task-setup-option"
                    data-set-group-selection="${task.id}"
                    data-group-selection="automatic"
                    ${tableLocked ? "disabled" : ""}>
              <span class="setup-icon">⚡</span>
              <span>${tr("Automatic")}</span>
            </button>
          </div>
        `;
        taskList.appendChild(groupSetupCard);
        return;
      }

      if (
        taskWorkMode(task) === "pair" &&
        task.pairSelectionMode === "automatic" &&
        task.pairSetupStage === "attendance"
      ){
        const attendanceCard = document.createElement("section");
        attendanceCard.className = "task-setup-card";
        attendanceCard.dataset.taskCard = task.id;
        attendanceCard.draggable = !tableLocked;

        const absentCount = state.students.filter(student => isStudentAbsent(task, student)).length;

        attendanceCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="pair-attendance-head">
            <div class="pair-attendance-head-row">
              <div>
                <h3>${tr("Is anyone absent?")}</h3>
                <p>${tr("Tap a student to mark them absent before the pairs are created.")}${
                  absentCount ? ` ${uiLanguage === "zh" ? `已标记 ${absentCount} 人缺席。` : `${absentCount} marked absent.`}` : ""
                }</p>
              </div>
              <button type="button"
                      class="primary pair-attendance-next"
                      data-pair-attendance-next="${task.id}"
                      ${tableLocked ? "disabled" : ""}>
                ${tr("Next →")}
              </button>
            </div>
          </div>

          <div class="pair-attendance-grid">
            ${state.students.map(student => {
              const absent = isStudentAbsent(task, student);
              return `
                <button type="button"
                        class="pair-attendance-student ${absent ? "absent" : ""}"
                        data-pair-attendance-task="${task.id}"
                        data-pair-attendance-student="${escapeHtml(student)}"
                        ${tableLocked ? "disabled" : ""}>
                  <span>${escapeHtml(student)}</span>
                  <span class="pair-attendance-state">${tr(absent ? "Absent" : "Present")}</span>
                </button>
              `;
            }).join("")}
          </div>

        `;

        taskList.appendChild(attendanceCard);
        return;
      }

      if (
        taskWorkMode(task) === "pair" &&
        task.pairSelectionMode === "manual" &&
        task.pairSetupStage === "manual-pairing"
      ){
        const manualCard = document.createElement("section");
        manualCard.className = "task-setup-card manual-pair-workspace";
        manualCard.dataset.taskCard = task.id;
        manualCard.draggable = false;

        const unpaired = manualPairUnpairedStudents(task);
        const pairGroups = Array.isArray(task.pairGroups) ? task.pairGroups : [];

        const buildManualPairTable = entries => `
          <table class="automatic-pair-table">
            <thead>
              <tr>
                <th class="automatic-pair-kind">#</th>
                <th>${tr("Students")}</th>
                <th style="width:46px;"></th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(({pair, pairIndex}) => `
                <tr class="automatic-pair-row manual-pair-preview-row"
                    data-manual-pair-row-task="${task.id}"
                    data-manual-pair-row-index="${pairIndex}">
                  <td class="automatic-pair-kind">
                    ${pairIndex + 1}
                    ${
                      pair.length < 2
                        ? '<span class="manual-pair-warning" title="This pair needs at least 2 students" aria-label="Incomplete pair">!</span>'
                        : ""
                    }
                  </td>
                  <td>
                    <div class="automatic-pair-members">
                      ${pair.map(student => `
                        <span class="automatic-pair-member manual-pair-member-btn ${tableLocked ? "disabled" : ""}"
                              role="button"
                              tabindex="${tableLocked ? "-1" : "0"}"
                              draggable="${tableLocked ? "false" : "true"}"
                              data-remove-manual-pair-student-task="${task.id}"
                              data-remove-manual-pair-student-index="${pairIndex}"
                              data-remove-manual-pair-student="${escapeHtml(student)}"
                              data-manual-created-student-task="${task.id}"
                              data-manual-created-student-index="${pairIndex}"
                              data-manual-created-student="${escapeHtml(student)}"
                              aria-disabled="${tableLocked ? "true" : "false"}"
                              title="Click to return this student to the name picker, or drag to move them">
                          ${escapeHtml(student)}
                        </span>
                      `).join("")}
                    </div>
                  </td>
                  <td style="text-align:center;">
                    <button type="button"
                            class="manual-pair-undo"
                            data-undo-manual-pair-task="${task.id}"
                            data-undo-manual-pair-index="${pairIndex}"
                            ${tableLocked ? "disabled" : ""}
                            aria-label="Return all students in pair ${pairIndex + 1} to the unassigned list"
                            title="Return everyone in this pair to the name picker">
                      ×
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;

        const indexedPairs = pairGroups.map((pair, pairIndex) => ({pair, pairIndex}));
        const splitPoint = Math.ceil(indexedPairs.length / 2);

        manualCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="manual-pair-head">
            <h3>Create the pairs</h3>
            <p>Click a student to automatically add them to the next pair, or drag one student onto another to choose the pairing yourself. Incomplete pairs are filled first. If one student is left at the end, they are added to an existing pair to make a group of three.</p>
          </div>

          <div class="manual-pair-pool" data-manual-pair-pool="${task.id}">
            ${
              unpaired.length
                ? unpaired.map(student => `
                    <span class="manual-pair-student"
                          role="button"
                          tabindex="${tableLocked ? "-1" : "0"}"
                          draggable="${tableLocked ? "false" : "true"}"
                          data-manual-pair-task="${task.id}"
                          data-manual-pair-student="${escapeHtml(student)}"
                          title="Click to add this student to the next pair, or drag onto another student">
                      ${escapeHtml(student)}
                    </span>
                  `).join("")
                : '<span style="color:var(--muted);font-size:12px;">All students have been assigned.</span>'
            }
          </div>

          ${
            pairGroups.length
              ? `
                <div class="manual-pairs-preview">
                  <h4>Pairs created</h4>
                  ${
                    indexedPairs.length > 1
                      ? `
                        <div class="collaborative-columns">
                          ${buildManualPairTable(indexedPairs.slice(0, splitPoint))}
                          ${buildManualPairTable(indexedPairs.slice(splitPoint))}
                        </div>
                      `
                      : buildManualPairTable(indexedPairs)
                  }
                </div>
              `
              : ""
          }

          <div class="manual-pair-actions">
            <span class="manual-pair-status">
              ${pairGroups.length} ${pairGroups.length === 1 ? "pair" : "pairs"} created · ${unpaired.length} unassigned
            </span>
            <button type="button"
                    class="primary"
                    data-finish-manual-pairing="${task.id}"
                    ${
                      tableLocked ||
                      !pairGroups.length ||
                      pairGroups.some(group => group.length < 2)
                        ? "disabled"
                        : ""
                    }>
              Done
            </button>
          </div>
        `;

        taskList.appendChild(manualCard);
        return;
      }

      if (
        taskWorkMode(task) === "group" &&
        task.groupSetupStage === "attendance"
      ){
        const attendanceCard = document.createElement("section");
        attendanceCard.className = "task-setup-card";
        attendanceCard.dataset.taskCard = task.id;
        attendanceCard.draggable = !tableLocked;

        const absentCount = state.students.filter(student => isStudentAbsent(task, student)).length;

        attendanceCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="pair-attendance-head">
            <div class="pair-attendance-head-row">
              <div>
                <h3>${tr("Is anyone absent?")}</h3>
                <p>Tap a student to mark them absent before the groups are created.${
                  absentCount ? ` ${absentCount} marked absent.` : ""
                }</p>
              </div>
              <button type="button"
                      class="primary pair-attendance-next"
                      data-group-attendance-next="${task.id}"
                      ${tableLocked ? "disabled" : ""}>
                ${tr("Next →")}
              </button>
            </div>
          </div>

          <div class="pair-attendance-grid">
            ${state.students.map(student => {
              const absent = isStudentAbsent(task, student);
              return `
                <button type="button"
                        class="pair-attendance-student ${absent ? "absent" : ""}"
                        data-group-attendance-task="${task.id}"
                        data-group-attendance-student="${escapeHtml(student)}"
                        ${tableLocked ? "disabled" : ""}>
                  <span>${escapeHtml(student)}</span>
                  <span class="pair-attendance-state">${tr(absent ? "Absent" : "Present")}</span>
                </button>
              `;
            }).join("")}
          </div>

        `;

        taskList.appendChild(attendanceCard);
        return;
      }

      if (
        taskWorkMode(task) === "group" &&
        task.groupSetupStage === "size"
      ){
        const sizeCard = document.createElement("section");
        sizeCard.className = "task-setup-card";
        sizeCard.dataset.taskCard = task.id;
        sizeCard.draggable = !tableLocked;

        const presentCount = state.students.filter(student => !isStudentAbsent(task, student)).length;

        sizeCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="group-size-head">
            <h3>How many students per group?</h3>
            <p>Choose the group size for this activity.</p>
          </div>

          <div class="group-size-options">
            ${[3,4,5,6].map(size => `
              <button type="button"
                      class="group-size-btn"
                      data-set-group-size="${task.id}"
                      data-group-size="${size}"
                      ${tableLocked ? "disabled" : ""}>
                ${size}
                <small>${groupBreakdownText(presentCount, size)}</small>
              </button>
            `).join("")}
          </div>
        `;

        taskList.appendChild(sizeCard);
        return;
      }

      if (
        taskWorkMode(task) === "group" &&
        task.groupSelectionMode === "manual" &&
        task.groupSetupStage === "manual-grouping"
      ){
        const manualCard = document.createElement("section");
        manualCard.className = "task-setup-card manual-pair-workspace";
        manualCard.dataset.taskCard = task.id;
        manualCard.draggable = false;

        const unassigned = manualGroupUnassignedStudents(task);
        const groups = Array.isArray(task.groupGroups) ? task.groupGroups : [];
        const targetSize = Number(task.groupSize) || 4;

        const buildManualGroupTable = entries => `
          <table class="automatic-pair-table generated-group-wrap">
            <thead>
              <tr>
                <th class="automatic-pair-kind">#</th>
                <th>${tr("Students")}</th>
                <th style="width:46px;"></th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(({group, groupIndex}) => `
                <tr class="automatic-pair-row manual-group-preview-row group-color-${(groupIndex % 6) + 1}"
                    data-manual-group-row-task="${task.id}"
                    data-manual-group-row-index="${groupIndex}">
                  <td class="automatic-pair-kind">
                    ${groupIndex + 1}
                    ${
                      group.length < targetSize
                        ? `<span class="manual-pair-warning"
                                 title="This group currently has ${group.length} of ${targetSize} students"
                                 aria-label="Incomplete group">!</span>`
                        : ""
                    }
                  </td>
                  <td>
                    <div class="automatic-pair-members">
                      ${group.map(student => `
                        <span class="automatic-pair-member manual-pair-member-btn ${tableLocked ? "disabled" : ""}"
                              role="button"
                              tabindex="${tableLocked ? "-1" : "0"}"
                              draggable="${tableLocked ? "false" : "true"}"
                              data-remove-manual-group-student-task="${task.id}"
                              data-remove-manual-group-student-index="${groupIndex}"
                              data-remove-manual-group-student="${escapeHtml(student)}"
                              data-manual-created-group-student-task="${task.id}"
                              data-manual-created-group-student-index="${groupIndex}"
                              data-manual-created-group-student="${escapeHtml(student)}"
                              aria-disabled="${tableLocked ? "true" : "false"}"
                              title="Click to return this student to the name picker, or drag to move them">
                          ${escapeHtml(student)}
                        </span>
                      `).join("")}
                    </div>
                  </td>
                  <td style="text-align:center;">
                    <button type="button"
                            class="manual-pair-undo"
                            data-undo-manual-group-task="${task.id}"
                            data-undo-manual-group-index="${groupIndex}"
                            ${tableLocked ? "disabled" : ""}
                            aria-label="Return all students in group ${groupIndex + 1} to the chooser"
                            title="Return everyone in this group to the name picker">
                      ×
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;

        const indexedGroups = groups.map((group, groupIndex) => ({group, groupIndex}));
        const splitPoint = Math.ceil(indexedGroups.length / 2);

        manualCard.innerHTML = `
          <button type="button"
                  class="task-setup-remove"
                  data-delete-setup-task="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Remove this task"
                  title="Remove task">
            ×
          </button>

          <div class="manual-pair-head">
            <h3>Create the groups</h3>
            <p>Target: ${targetSize} students per group. Click or drag names to arrange the groups. Students may be left unassigned if they are not taking part in this activity.</p>
          </div>

          <div class="manual-pair-pool" data-manual-group-pool="${task.id}">
            ${
              unassigned.length
                ? unassigned.map(student => `
                    <span class="manual-pair-student"
                          role="button"
                          tabindex="${tableLocked ? "-1" : "0"}"
                          draggable="${tableLocked ? "false" : "true"}"
                          data-manual-group-task="${task.id}"
                          data-manual-group-student="${escapeHtml(student)}"
                          title="Click to add this student to the next group, or drag to place them">
                      ${escapeHtml(student)}
                    </span>
                  `).join("")
                : '<span style="color:var(--muted);font-size:12px;">All students have been assigned.</span>'
            }
          </div>

          ${
            groups.length
              ? `
                <div class="manual-pairs-preview">
                  <h4>Groups created</h4>
                  ${
                    indexedGroups.length > 1
                      ? `
                        <div class="collaborative-columns">
                          ${buildManualGroupTable(indexedGroups.slice(0, splitPoint))}
                          ${buildManualGroupTable(indexedGroups.slice(splitPoint))}
                        </div>
                      `
                      : buildManualGroupTable(indexedGroups)
                  }
                </div>
              `
              : ""
          }

          <div class="manual-pair-actions">
            <span class="manual-pair-status">
              ${groups.length} ${groups.length === 1 ? "group" : "groups"} created · ${unassigned.length} unassigned
            </span>
            <button type="button"
                    class="primary"
                    data-finish-manual-grouping="${task.id}"
                    ${
                      tableLocked ||
                      !groups.length ||
                      groups.some(group => group.length < 2)
                        ? "disabled"
                        : ""
                    }>
              Done
            </button>
          </div>
        `;

        taskList.appendChild(manualCard);
        return;
      }

      const card = document.createElement("section");

      const doneCount = state.students.filter(s => !!task.completed[s]).length;
      const absentCount = state.students.filter(s => isStudentAbsent(task, s)).length;
      const requiredStudents = state.students.filter(s => !isStudentAbsent(task, s));
      const allComplete =
        requiredStudents.length > 0 &&
        requiredStudents.every(student => !!task.completed[student]);

      const audience = taskAudience(task);
      card.className =
        "task-card " + audience + "-task" +
        (task.collapsed ? " collapsed" : "") +
        (allComplete ? " all-complete" : "");
      card.dataset.taskCard = task.id;
      card.dataset.taskAudience = audience;
      card.draggable = !tableLocked;

      const head = document.createElement("div");
      head.className = "task-head";
      head.innerHTML = `
        <button class="secondary small collapse-btn"
                data-toggle-task="${task.id}"
                aria-label="${task.collapsed ? "Expand" : "Collapse"} ${escapeHtml(task.title)}"
                title="${task.collapsed ? "Expand task" : "Collapse task"}">
          ${task.collapsed ? "▶" : "▼"}
        </button>
        <span class="task-title-inline">
          <input class="task-title" aria-label="Task title" value="${escapeHtml(task.title)}" data-task-title="${task.id}" />
          <span class="progress task-title-progress">${doneCount}/${state.students.length} complete${absentCount ? ` · ${absentCount} absent` : ""}</span>
          ${allComplete ? `
            <button type="button"
                    class="all-complete-badge"
                    data-archive-task="${task.id}"
                    ${tableLocked ? "disabled" : ""}
                    aria-label="Archive completed task"
                    title="${tableLocked ? "Unlock to archive this task" : "Archive this completed task"}">
              All complete
            </button>
          ` : ""}
        </span>
        ${audience === "student" ? `
          <button type="button"
                  class="student-task-type-pill ${studentTaskType(task)}"
                  data-toggle-student-task-type="${task.id}"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="${
                    studentTaskType(task) === "homework"
                      ? "Change this task to Classwork"
                      : "Change this task to Homework"
                  }"
                  title="${
                    studentTaskType(task) === "homework"
                      ? "Click to change to Classwork"
                      : "Click to change to Homework"
                  }">
            ${studentTaskType(task) === "homework" ? "Homework" : "Classwork"}
          </button>
        ` : ""}
        ${taskWorkMode(task) ? `
          <span class="task-work-mode-pill"
                title="${escapeHtml(workModeSelectionTooltip(task))}">
            ${taskWorkModeLabel(taskWorkMode(task))}
          </span>
        ` : ""}
        ${
          audience === "student"
            ? (
                studentTaskType(task) === "homework"
                  ? `
                    <label class="task-due-wrap" title="${escapeHtml(formatDue(task))}">
                      ${tr("Due")}
                      <span class="friendly-date-picker ${task.dueAt ? (isTaskOverdue(task) ? "overdue" : "upcoming") : ""}">
                        <span class="friendly-date-label">${
                          isDueToday(task)
                            ? tr("Due Today")
                            : friendlyDueDate(task.dueAt || defaultDueDateValue())
                        }</span>
                        <input type="date"
                               value="${escapeHtml(task.dueAt || defaultDueDateValue())}"
                               data-task-due="${task.id}"
                               aria-label="Due date for ${escapeHtml(task.title)}" />
                      </span>
                    </label>
                    <button type="button"
                            class="secondary small class-overdue-toggle ${isTaskOverdue(task) ? "active" : ""}"
                            data-toggle-task-overdue="${task.id}"
                            ${tableLocked ? "disabled" : ""}
                            aria-pressed="${isTaskOverdue(task) ? "true" : "false"}"
                            aria-label="${task.forcedOverdue ? "Clear manual overdue flag" : "Mark task as overdue"}"
                            title="${
                              task.forcedOverdue
                                ? "Clear manual overdue flag"
                                : (
                                    isTaskOverdue(task)
                                      ? "Overdue automatically because the due date has passed"
                                      : "Mark task as overdue"
                                  )
                            }">
                      ⏰
                    </button>
                  `
                  : `
                    <label class="task-due-wrap" title="${escapeHtml(formatDue(task))}">
                      ${tr("Due")}
                      <span class="friendly-date-picker ${task.dueAt ? (isTaskOverdue(task) ? "overdue" : "upcoming") : ""}">
                        <span class="friendly-date-label">${
                          isDueToday(task)
                            ? tr("Due Today")
                            : friendlyDueDate(task.dueAt || todayDueDateValue())
                        }</span>
                        <input type="date"
                               value="${escapeHtml(task.dueAt || todayDueDateValue())}"
                               data-task-due="${task.id}"
                               aria-label="${tr("Due date")} ${escapeHtml(task.title)}" />
                      </span>
                    </label>
                    <button type="button"
                            class="secondary small class-overdue-toggle ${task.forcedOverdue ? "active" : ""}"
                            data-toggle-task-overdue="${task.id}"
                            ${tableLocked ? "disabled" : ""}
                            aria-pressed="${task.forcedOverdue ? "true" : "false"}"
                            aria-label="${task.forcedOverdue ? tr("Clear overdue flag") : tr("Mark task as overdue")}"
                            title="${task.forcedOverdue ? tr("Clear overdue flag") : tr("Mark task as overdue")}">
                      ⏰
                    </button>
                  `
              )
            : ""
        }
        <span class="task-move-menu-wrap task-actions-menu-wrap">
          <button class="secondary small icon-only-btn task-actions-trigger"
                  data-toggle-move-menu="${task.id}"
                  type="button"
                  ${tableLocked ? "disabled" : ""}
                  aria-label="Task actions"
                  aria-expanded="false"
                  title="Task actions">
            ⋯
          </button>

          <span class="task-move-menu task-actions-menu"
                data-move-menu="${task.id}"
                hidden>
            <button type="button"
                    class="task-move-option"
                    data-set-task-completion="${task.id}"
                    data-task-completion-value="all"
                    ${tableLocked ? "disabled" : ""}>
              <span>✓ Mark all as complete</span>
            </button>

            <button type="button"
                    class="task-move-option"
                    data-set-task-completion="${task.id}"
                    data-task-completion-value="none"
                    ${tableLocked ? "disabled" : ""}>
              <span>☐ Mark none as complete</span>
            </button>

            <span class="task-actions-section-label">Move to</span>

            <button type="button"
                    class="task-move-option ${
                      audience === "student" && studentTaskType(task) === "classwork" ? "current" : ""
                    }"
                    data-set-task-destination="${task.id}"
                    data-task-destination="classwork">
              <span>Classwork</span>
              ${
                audience === "student" && studentTaskType(task) === "classwork"
                  ? '<span class="task-move-check">✓</span>'
                  : ""
              }
            </button>

            <button type="button"
                    class="task-move-option ${
                      audience === "student" && studentTaskType(task) === "homework" ? "current" : ""
                    }"
                    data-set-task-destination="${task.id}"
                    data-task-destination="homework">
              <span>Homework</span>
              ${
                audience === "student" && studentTaskType(task) === "homework"
                  ? '<span class="task-move-check">✓</span>'
                  : ""
              }
            </button>

            <button type="button"
                    class="task-move-option ${audience === "teacher" ? "current" : ""}"
                    data-set-task-destination="${task.id}"
                    data-task-destination="teacher">
              <span>Teacher Task</span>
              ${audience === "teacher" ? '<span class="task-move-check">✓</span>' : ""}
            </button>

            <span class="task-actions-divider"></span>

            <button type="button"
                    class="task-move-option"
                    data-archive-task-menu="${task.id}"
                    ${tableLocked ? "disabled" : ""}>
              <span>Archive task</span>
              <span aria-hidden="true">📦</span>
            </button>

            <button type="button"
                    class="task-move-option task-actions-delete"
                    data-delete-task="${task.id}"
                    ${tableLocked ? "disabled" : ""}>
              <span>Delete task</span>
              <span aria-hidden="true">×</span>
            </button>
          </span>
        </span>
      `;
      card.appendChild(head);

      const searchWrap = document.createElement("div");
      searchWrap.className = "task-search-wrap";
      searchWrap.dataset.taskSearchWrap = task.id;
      searchWrap.innerHTML = `
        <input
          class="task-search-input"
          type="search"
          placeholder="Search for a student..."
          autocomplete="off"
          data-task-search-input="${task.id}"
          aria-label="Search students in ${escapeHtml(task.title)}"
        />
        <button class="secondary small"
                type="button"
                data-clear-task-search="${task.id}">
          Clear
        </button>
      `;
      card.appendChild(searchWrap);

      if (isAutomaticPairTask(task) || isManualPairTask(task) || isGeneratedGroupTask(task)){
        const generatedGroups =
          isGeneratedGroupTask(task) ? task.groupGroups : task.pairGroups;
        const groupKind = isGeneratedGroupTask(task) ? "group" : "pair";

        const pairWrap = document.createElement("div");
        pairWrap.className =
          "automatic-pair-wrap" + (groupKind === "group" ? " generated-group-wrap" : "");
        pairWrap.dataset.taskCollaborativeList = task.id;

        const buildCollaborativeTable = groupEntries => {
          const column = document.createElement("div");
          column.className = groupKind === "group" ? "group-task-stack" : "pair-task-stack";

          groupEntries.forEach(({group, groupIndex}) => {
            const complete = pairGroupComplete(task, group);
            const visibleGroupMembers = showUnfinishedOnly
              ? group.filter(student => !isStudentAbsent(task, student) && !task.completed[student])
              : group;

            if (showUnfinishedOnly && visibleGroupMembers.length === 0){
              return;
            }

            const block = document.createElement("section");
            block.className =
              `${groupKind === "group" ? "group-task-block" : "pair-task-block"} ` +
              `${groupKind === "group"
                ? `group-color-${(groupIndex % 6) + 1}`
                : `pair-color-${(groupIndex % 14) + 1}`} ` +
              `${complete ? "complete" : ""}`;
            block.dataset.searchName = visibleGroupMembers.join(" ").toLowerCase();

            const label = groupKind === "group" ? "Group" : "Pair";

            block.innerHTML = `
              <div class="group-task-title">
                <strong>${label} ${groupIndex + 1}</strong>
                <label class="group-task-title-check">
                  <span>Done</span>
                  <input type="checkbox"
                         ${complete ? "checked" : ""}
                         ${tableLocked ? "disabled" : ""}
                         data-collab-group-task="${task.id}"
                         data-collab-group-kind="${groupKind}"
                         data-collab-group-index="${groupIndex}"
                         aria-label="Mark ${label} ${groupIndex + 1} complete" />
                </label>
              </div>
              <div class="group-task-members">
                ${visibleGroupMembers.map(student => `
                  <span class="automatic-pair-member student-name ${
                          task.completed[student]
                            ? "collab-member-complete"
                            : (
                                !isStudentAbsent(task, student) && isTaskOverdue(task)
                                  ? "collab-member-overdue"
                                  : ""
                              )
                        }"
                        data-student-name="${escapeHtml(student)}"
                        data-collab-student-task="${task.id}"
                        data-collab-student="${escapeHtml(student)}"
                        title="${
                          task.completed[student]
                            ? "Click to mark this student incomplete"
                            : (
                                !isStudentAbsent(task, student) && isTaskOverdue(task)
                                  ? "Overdue — click to mark this student complete"
                                  : "Click to mark this student complete"
                              )
                        }">
                    ${escapeHtml(student)}
                    ${
                      task.completed[student]
                        ? '<span class="collab-member-check" aria-hidden="true">✓</span>'
                        : ""
                    }
                  </span>
                `).join("")}
              </div>
            `;

            column.appendChild(block);
          });

          return column;
        };

        const indexedGroups = generatedGroups.map((group, groupIndex) => ({group, groupIndex}));

        if (indexedGroups.length > 1){
          const splitPoint = Math.ceil(indexedGroups.length / 2);
          const columns = document.createElement("div");
          columns.className = "collaborative-columns";
          columns.appendChild(buildCollaborativeTable(indexedGroups.slice(0, splitPoint)));
          columns.appendChild(buildCollaborativeTable(indexedGroups.slice(splitPoint)));
          pairWrap.appendChild(columns);
        } else {
          pairWrap.appendChild(buildCollaborativeTable(indexedGroups));
        }

        card.appendChild(pairWrap);
      } else {
        const list = document.createElement("div");
        list.className = "student-list";
        list.dataset.taskStudentList = task.id;

        const visibleStudents = showUnfinishedOnly
          ? state.students.filter(student =>
              !isStudentAbsent(task, student) && !task.completed[student]
            )
          : state.students;

        const rowsPerColumn = Math.max(1, Math.ceil(visibleStudents.length / 3));

        visibleStudents.forEach((student, index) => {
          const absent = isStudentAbsent(task, student);
          const complete = !!task.completed[student];
          const pending =
            audience === "student" &&
            !absent &&
            !complete &&
            isTaskPending(task, student);
          const overdue =
            audience === "student" &&
            !absent &&
            !complete &&
            isTaskOverdue(task);

          const row = document.createElement("label");
          row.className = "student-row " + (
            absent ? "absent-row" :
            (complete ? "complete-row" :
              (
                audience === "teacher"
                  ? "incomplete"
                  : (overdue ? "overdue" : (pending ? "pending" : "incomplete"))
              ))
          );
          row.dataset.searchName = student.toLowerCase();

          const columnNumber = Math.min(3, Math.floor(index / rowsPerColumn) + 1);
          const rowNumber = (index % rowsPerColumn) + 1;
          row.style.gridColumn = String(columnNumber);
          row.style.gridRow = String(rowNumber);

          const timestampText =
            state.settings.completionTimestamps && complete
              ? completionTimestampText(task.completedAt && task.completedAt[student])
              : "";

          row.innerHTML = `
            <input type="checkbox"
                   ${complete ? "checked" : ""}
                   ${absent ? "disabled" : ""}
                   data-task="${task.id}"
                   data-student="${escapeHtml(student)}" />
            <span class="student-name-wrap">
              <span class="student-name"
                    data-student-name="${escapeHtml(student)}"
                    title="View incomplete tasks">${escapeHtml(student)}</span>
              ${complete ? '<span class="individual-name-check" aria-hidden="true">✓</span>' : ""}
              ${timestampText ? `<span class="completion-time" data-completed-at="${escapeHtml(task.completedAt[student])}">${escapeHtml(timestampText)}</span>` : ""}
              ${task.notes && task.notes[student] ? `<span class="student-task-note">${escapeHtml(task.notes[student])}</span>` : ""}
            </span>
            <span class="row-actions">
              <span class="status-label">${
                absent ? tr("Absent") :
                (complete ? tr("Complete") :
                  (
                    audience === "teacher"
                      ? tr("Not complete")
                      : (overdue ? tr("Overdue") : (pending ? tr("Pending") : tr("Not complete")))
                  ))
              }</span>
              <button type="button"
                      class="secondary absent-btn ${absent ? "active" : ""}"
                      data-absent-task="${task.id}"
                      data-absent-student="${escapeHtml(student)}"
                      ${tableLocked ? "disabled" : ""}
                      aria-label="${absent ? "Mark student present for this task" : "Mark student absent for this task"}"
                      title="${absent ? "Mark present" : "Mark absent"}">
                ${absent ? "✓" : "⊘"}
              </button>
              <button type="button"
                      class="secondary note-btn ${task.notes && task.notes[student] ? "has-note" : ""}"
                      data-note-task="${task.id}"
                      data-note-student="${escapeHtml(student)}"
                      ${tableLocked ? "disabled" : ""}
                      aria-label="Add or edit note for ${escapeHtml(student)}"
                      title="${task.notes && task.notes[student] ? "Edit note" : "Add note"}">
                📝
              </button>
            </span>
          `;
          list.appendChild(row);
        });

        card.appendChild(list);

        if (showUnfinishedOnly && visibleStudents.length === 0){
          const noUnfinished = document.createElement("div");
          noUnfinished.className = "task-tab-empty";
          noUnfinished.textContent = tr("No unfinished students");
          card.appendChild(noUnfinished);
        }
      }

      taskList.appendChild(card);
    });

    if (!visibleTasks.length){
      const emptyLabel =
        activeTaskAudience === "teacher"
          ? tr("Teacher Tasks")
          : activeStudentTaskFilter === "classwork"
            ? tr("Classwork tasks")
            : activeStudentTaskFilter === "homework"
              ? tr("Homework tasks")
              : tr("Student Tasks");

      const emptyAudience = activeTaskAudience === "teacher" ? "teacher" : "student";
      const emptyStudentType =
        activeTaskAudience === "student" &&
        (activeStudentTaskFilter === "classwork" || activeStudentTaskFilter === "homework")
          ? activeStudentTaskFilter
          : "classwork";

      taskList.innerHTML = `
        <div class="task-tab-empty"
             role="button"
             tabindex="0"
             data-empty-add-audience="${emptyAudience}"
             data-empty-add-student-type="${emptyStudentType}"
             aria-label="Create a new ${emptyLabel}">
          ${uiLanguage === "zh" ? `还没有${emptyLabel}。点击这里创建一个。` : `No ${emptyLabel} yet. Click here to create one.`}
        </div>
      `;
    }

    renderSummary();
    renderTable();
    applyTranslations(tasksEl);
  }

  function render(){
    renderCore();
    applyTranslations(document);
  }


  function todayDueDateValue(){
    return localDateValue(new Date());
  }

  function setClassworkDueMode(task, mode){
    if (!task || studentTaskType(task) !== "classwork") return;
    if (!["this-class", "next-class", "later-today", "custom"].includes(mode)) return;

    task.classDueMode = mode;

    if (mode === "this-class"){
      task.dueAt = todayDueDateValue();
      task.classDueAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    } else if (mode === "later-today"){
      task.dueAt = todayDueDateValue();
      task.classDueAt = "";
    } else if (mode === "next-class"){
      task.dueAt = defaultDueDateValue();
      task.classDueAt = "";
    } else if (mode === "custom"){
      task.classDueAt = "";
      if (!task.dueAt){
        task.dueAt = todayDueDateValue();
      }
    }
  }

  function defaultDueDateValue(){
    const d = new Date();
    d.setHours(12,0,0,0);

    const day = d.getDay(); // 0 Sun, 1 Mon ... 5 Fri, 6 Sat
    if (day === 5){
      d.setDate(d.getDate() + 3); // Friday -> Monday
    } else if (day === 6){
      d.setDate(d.getDate() + 2); // Saturday -> Monday
    } else {
      d.setDate(d.getDate() + 1); // Sunday-Thursday -> next day
    }

    return localDateValue(d);
  }

  function addTask(audience = "student", requestedStudentTaskType = null){
    if (tableLocked){
      alert("Locked Mode is on. Unlock it before adding a task.");
      return;
    }

    audience = audience === "teacher" ? "teacher" : "student";

    let nextStudentTaskType = "classwork";
    if (requestedStudentTaskType === "homework" || requestedStudentTaskType === "classwork"){
      nextStudentTaskType = requestedStudentTaskType;
    } else if (activeStudentTaskFilter === "homework" || activeStudentTaskFilter === "classwork"){
      nextStudentTaskType = activeStudentTaskFilter;
    }

    const number = activeTasks().filter(task => taskAudience(task) === audience).length + 1;
    const newTask = {
      id: uid(),
      title: audience === "teacher"
        ? `Teacher Task ${number}`
        : `${nextStudentTaskType === "homework" ? "Homework" : "Classwork"} Task ${number}`,
      completed: {},
      completedAt: {},
      completionHistory: {},
      absent: {},
      notes: {},
      archived: false,
      archivedAt: "",
      createdAt: new Date().toISOString(),
      audience,
      studentTaskType: nextStudentTaskType,
      workMode: "",
      pairSelectionMode: "",
      pairSetupStage: "",
      pairGroups: [],
      groupSelectionMode: "",
      groupSetupStage: "",
      groupSize: 0,
      groupGroups: [],
      collapsed: false,
      category: nextStudentTaskType === "homework" ? "English HW" : "English CW",
      dueAt: nextStudentTaskType === "classwork"
        ? todayDueDateValue()
        : defaultDueDateValue(),
      classDueMode: nextStudentTaskType === "classwork" ? "this-class" : "",
      classDueAt: nextStudentTaskType === "classwork"
        ? new Date(Date.now() + 45 * 60 * 1000).toISOString()
        : "",
      forcedOverdue: false
    };
    state.tasks.push(newTask);
    saveState();
    render();

    requestAnimationFrame(() => {
      const input = document.querySelector(`[data-task-title="${newTask.id}"]`);
      if (input){
        input.focus();
        input.select();
      }
    });
  }

  function setTaskWorkMode(id, mode){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!["individual", "pair", "group"].includes(mode)) return;

    task.workMode = mode;

    task.pairSelectionMode = "";
    task.pairSetupStage = "";
    task.pairGroups = [];
    task.groupSelectionMode = "";
    task.groupSetupStage = "";
    task.groupSize = 0;
    task.groupGroups = [];

    saveState();
    render();
    centerActiveSetupCard();
  }

  function setPairSelectionMode(id, mode){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || taskWorkMode(task) !== "pair") return;
    if (mode !== "manual" && mode !== "automatic") return;

    task.pairSelectionMode = mode;
    task.pairSetupStage =
      mode === "automatic"
        ? "attendance"
        : "manual-pairing";
    task.pairGroups = [];
    saveState();
    render();
    centerActiveSetupCard();
  }

  function autoPlaceManualPairStudent(taskId, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    const unpaired = manualPairUnpairedStudents(task);
    if (!unpaired.includes(student)) return;

    task.pairGroups = Array.isArray(task.pairGroups) ? task.pairGroups : [];

    // First fill any incomplete pair/group row with one person in it.
    const incompleteIndex = task.pairGroups.findIndex(group =>
      Array.isArray(group) && group.length === 1
    );

    if (incompleteIndex !== -1){
      task.pairGroups[incompleteIndex].push(student);
      saveState();
      render();
      return;
    }

    // If this is the last unassigned student, add them to an existing
    // normal pair to create a trio instead of leaving them alone.
    if (unpaired.length === 1){
      const pairIndex = task.pairGroups.findIndex(group =>
        Array.isArray(group) && group.length === 2
      );

      if (pairIndex !== -1){
        task.pairGroups[pairIndex].push(student);
        saveState();
        render();
        return;
      }
    }

    // Otherwise start a new row with this student.
    task.pairGroups.push([student]);
    saveState();
    render();
  }

  function createManualPair(taskId, sourceStudent, targetStudent){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    if (!sourceStudent || !targetStudent || sourceStudent === targetStudent) return;

    const unpaired = new Set(manualPairUnpairedStudents(task));
    if (!unpaired.has(sourceStudent) || !unpaired.has(targetStudent)) return;

    task.pairGroups = Array.isArray(task.pairGroups) ? task.pairGroups : [];
    task.pairGroups.push([sourceStudent, targetStudent]);

    saveState();
    render();
  }

  function addManualStudentToPair(taskId, student, pairIndex){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    const unpaired = new Set(manualPairUnpairedStudents(task));
    if (!unpaired.has(student)) return;

    const index = Number(pairIndex);
    const pair = Array.isArray(task.pairGroups) ? task.pairGroups[index] : null;
    if (!Array.isArray(pair) || pair.length >= 3) return;

    pair.push(student);

    saveState();
    render();
  }

  function moveManualPairStudent(taskId, fromIndex, student, toIndex = null){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    const sourceIndex = Number(fromIndex);
    if (!Array.isArray(task.pairGroups) || !Array.isArray(task.pairGroups[sourceIndex])) return;

    const sourceGroup = task.pairGroups[sourceIndex];
    const studentIndex = sourceGroup.indexOf(student);
    if (studentIndex === -1) return;

    // Remove from source first.
    sourceGroup.splice(studentIndex, 1);

    // If dropping onto another pair, add there if capacity allows.
    if (toIndex !== null && toIndex !== undefined && toIndex !== ""){
      let targetIndex = Number(toIndex);

      // If the source group was removed before the target group, compensate index shift.
      const removeSource = sourceGroup.length === 0;
      if (removeSource){
        task.pairGroups.splice(sourceIndex, 1);
        if (sourceIndex < targetIndex) targetIndex -= 1;
      }

      const targetGroup = task.pairGroups[targetIndex];
      if (Array.isArray(targetGroup) && targetGroup.length < 3){
        targetGroup.push(student);
      } else {
        // If the destination is no longer valid, return student to chooser.
      }
    } else if (sourceGroup.length === 0){
      task.pairGroups.splice(sourceIndex, 1);
    }

    saveState();
    render();
  }

  function removeStudentFromManualPair(taskId, pairIndex, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    const index = Number(pairIndex);
    if (!Array.isArray(task.pairGroups) || !Array.isArray(task.pairGroups[index])) return;

    const pair = task.pairGroups[index];
    const studentIndex = pair.indexOf(student);
    if (studentIndex === -1) return;

    pair.splice(studentIndex, 1);

    // Only the clicked student returns to the picker.
    // Keep any remaining student in this row so another student can be
    // dragged onto them to rebuild the pair.
    if (pair.length === 0){
      task.pairGroups.splice(index, 1);
    }

    saveState();
    render();
  }

  function undoManualPair(taskId, pairIndex){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    const index = Number(pairIndex);
    if (!Array.isArray(task.pairGroups) || !task.pairGroups[index]) return;

    task.pairGroups.splice(index, 1);

    saveState();
    render();
  }

  function finishManualPairing(taskId){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "manual" ||
      task.pairSetupStage !== "manual-pairing"
    ) return;

    if (!Array.isArray(task.pairGroups) || !task.pairGroups.length) return;

    // Present students may intentionally be left out of this activity,
    // but every pair/trio that is created must contain at least 2 students.
    if (task.pairGroups.some(group => !Array.isArray(group) || group.length < 2)) return;

    task.pairSetupStage = "ready";
    saveState();
    render();
  }

  function completeAutomaticPairAttendance(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (
      !task ||
      taskWorkMode(task) !== "pair" ||
      task.pairSelectionMode !== "automatic"
    ) return;

    const presentStudents = state.students.filter(student => !isStudentAbsent(task, student));

    // Fisher-Yates shuffle: generated once, then saved so refreshes do not reshuffle.
    const shuffled = [...presentStudents];
    for (let i = shuffled.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groups = [];

    if (shuffled.length % 2 === 1 && shuffled.length >= 3){
      // Keep the final three together so there is only one group of 3.
      while (shuffled.length > 3){
        groups.push(shuffled.splice(0, 2));
      }
      groups.push(shuffled.splice(0, 3));
    } else {
      while (shuffled.length){
        groups.push(shuffled.splice(0, Math.min(2, shuffled.length)));
      }
    }

    task.pairGroups = groups;
    task.pairSetupStage = "ready";
    saveState();
    render();
    centerActiveSetupCard();
  }

  function setGroupSelectionMode(id, mode){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || taskWorkMode(task) !== "group") return;
    if (mode !== "manual" && mode !== "automatic") return;

    task.groupSelectionMode = mode;
    task.groupSetupStage = "attendance";
    task.groupSize = 0;
    task.groupGroups = [];
    saveState();
    render();
    centerActiveSetupCard();
  }

  function completeGroupAttendance(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || taskWorkMode(task) !== "group") return;

    task.groupSetupStage = "size";
    saveState();
    render();
    centerActiveSetupCard();
  }

  function setGroupSize(id, size){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    const numericSize = Number(size);

    if (!task || taskWorkMode(task) !== "group") return;
    if (![3,4,5,6].includes(numericSize)) return;

    const presentStudents = state.students.filter(student => !isStudentAbsent(task, student));

    task.groupSize = numericSize;

    if (task.groupSelectionMode === "manual"){
      task.groupGroups = [];
      task.groupSetupStage = "manual-grouping";
    } else {
      task.groupGroups = buildBalancedGroups(presentStudents, numericSize);
      task.groupSetupStage = "ready";
    }

    saveState();
    render();
    centerActiveSetupCard();
  }

  function manualGroupUnassignedStudents(task){
    const assigned = new Set(
      (Array.isArray(task.groupGroups) ? task.groupGroups : [])
        .flat()
        .map(String)
    );

    return state.students.filter(student =>
      !isStudentAbsent(task, student) && !assigned.has(student)
    );
  }

  function createManualGroupSeed(taskId, sourceStudent, targetStudent){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    if (!sourceStudent || !targetStudent || sourceStudent === targetStudent) return;

    const unassigned = new Set(manualGroupUnassignedStudents(task));
    if (!unassigned.has(sourceStudent) || !unassigned.has(targetStudent)) return;

    task.groupGroups = Array.isArray(task.groupGroups) ? task.groupGroups : [];
    task.groupGroups.push([sourceStudent, targetStudent]);

    saveState();
    render();
  }

  function autoPlaceManualGroupStudent(taskId, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    const unassigned = manualGroupUnassignedStudents(task);
    if (!unassigned.includes(student)) return;

    task.groupGroups = Array.isArray(task.groupGroups) ? task.groupGroups : [];
    const targetSize = [3,4,5,6].includes(Number(task.groupSize)) ? Number(task.groupSize) : 4;

    // Fill the first incomplete group before starting a new one.
    const incompleteIndex = task.groupGroups.findIndex(group =>
      Array.isArray(group) && group.length < targetSize
    );

    if (incompleteIndex !== -1){
      task.groupGroups[incompleteIndex].push(student);
      saveState();
      render();
      return;
    }

    // If this is the final unassigned student and groups already exist,
    // add them to the smallest existing group rather than creating a group of one.
    if (unassigned.length === 1 && task.groupGroups.length){
      let smallestIndex = 0;
      for (let i = 1; i < task.groupGroups.length; i++){
        if (task.groupGroups[i].length < task.groupGroups[smallestIndex].length){
          smallestIndex = i;
        }
      }
      task.groupGroups[smallestIndex].push(student);
      saveState();
      render();
      return;
    }

    task.groupGroups.push([student]);
    saveState();
    render();
  }

  function removeStudentFromManualGroup(taskId, groupIndex, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    const index = Number(groupIndex);
    if (!Array.isArray(task.groupGroups) || !Array.isArray(task.groupGroups[index])) return;

    const group = task.groupGroups[index];
    const studentIndex = group.indexOf(student);
    if (studentIndex === -1) return;

    group.splice(studentIndex, 1);
    if (group.length === 0) task.groupGroups.splice(index, 1);

    saveState();
    render();
  }

  function undoManualGroup(taskId, groupIndex){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    const index = Number(groupIndex);
    if (!Array.isArray(task.groupGroups) || !task.groupGroups[index]) return;

    task.groupGroups.splice(index, 1);
    saveState();
    render();
  }

  function addManualStudentToGroup(taskId, student, groupIndex){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    const unassigned = new Set(manualGroupUnassignedStudents(task));
    if (!unassigned.has(student)) return;

    const index = Number(groupIndex);
    const group = Array.isArray(task.groupGroups) ? task.groupGroups[index] : null;
    if (!Array.isArray(group)) return;

    group.push(student);
    saveState();
    render();
  }

  function moveManualGroupStudent(taskId, fromIndex, student, toIndex = null){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    const sourceIndex = Number(fromIndex);
    if (!Array.isArray(task.groupGroups) || !Array.isArray(task.groupGroups[sourceIndex])) return;

    const source = task.groupGroups[sourceIndex];
    const studentIndex = source.indexOf(student);
    if (studentIndex === -1) return;

    source.splice(studentIndex, 1);

    if (toIndex !== null && toIndex !== undefined && toIndex !== ""){
      let targetIndex = Number(toIndex);
      if (source.length === 0){
        task.groupGroups.splice(sourceIndex, 1);
        if (sourceIndex < targetIndex) targetIndex -= 1;
      }

      const target = task.groupGroups[targetIndex];
      if (Array.isArray(target)){
        target.push(student);
      }
    } else if (source.length === 0){
      task.groupGroups.splice(sourceIndex, 1);
    }

    saveState();
    render();
  }

  function finishManualGrouping(taskId){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      taskWorkMode(task) !== "group" ||
      task.groupSelectionMode !== "manual" ||
      task.groupSetupStage !== "manual-grouping"
    ) return;

    if (!Array.isArray(task.groupGroups) || !task.groupGroups.length) return;

    // Do not allow a one-person group.
    if (task.groupGroups.some(group => !Array.isArray(group) || group.length < 2)) return;

    task.groupSetupStage = "ready";
    saveState();
    render();
  }

  function resetTaskWorkMode(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.workMode = "";
    task.pairSelectionMode = "";
    task.pairSetupStage = "";
    task.pairGroups = [];
    task.groupSelectionMode = "";
    task.groupSetupStage = "";
    task.groupSize = 0;
    task.groupGroups = [];
    saveState();
    render();
  }

  function toggleStudentTaskType(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || taskAudience(task) !== "student") return;

    const currentType = studentTaskType(task);
    const nextType = currentType === "classwork" ? "homework" : "classwork";

    task.studentTaskType = nextType;
    task.category = nextType === "homework" ? "English HW" : "English CW";

    if (nextType === "classwork"){
      setClassworkDueMode(task, "this-class");
    } else {
      task.classDueMode = "";
      task.classDueAt = "";
      if (!task.dueAt || task.dueAt === todayDueDateValue()){
        task.dueAt = defaultDueDateValue();
      }
    }

    saveState();
    render();
  }

  function setTaskDestination(id, destination){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (destination === "teacher"){
      task.audience = "teacher";
    } else if (destination === "classwork" || destination === "homework"){
      task.audience = "student";
      task.studentTaskType = destination;
      task.category = destination === "homework" ? "English HW" : "English CW";

      if (destination === "classwork"){
        setClassworkDueMode(task, "this-class");
      } else {
        task.classDueMode = "";
        task.classDueAt = "";
        if (!task.dueAt || task.dueAt === todayDueDateValue()){
          task.dueAt = defaultDueDateValue();
        }
      }
    } else {
      return;
    }

    saveState();
    render();
  }

  function moveTaskByDrop(id, audience){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const nextAudience = audience === "teacher" ? "teacher" : "student";
    if (taskAudience(task) === nextAudience) return;

    task.audience = nextAudience;

    if (nextAudience === "student"){
      if (activeStudentTaskFilter === "homework" || activeStudentTaskFilter === "classwork"){
        task.studentTaskType = activeStudentTaskFilter;
      } else if (!task.studentTaskType){
        task.studentTaskType = "classwork";
      }

      if (studentTaskType(task) === "classwork"){
        if (!task.classDueMode) setClassworkDueMode(task, "this-class");
      } else {
        task.classDueMode = "";
        task.classDueAt = "";
        task.dueAt = task.dueAt || defaultDueDateValue();
      }
    }

    saveState();
    activeTaskAudience = nextAudience;
    render();
  }

  function moveTaskToAudience(id, audience){
    if (tableLocked) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const nextAudience = audience === "teacher" ? "teacher" : "student";
    if (taskAudience(task) === nextAudience) return;

    task.audience = nextAudience;

    if (nextAudience === "student"){
      if (activeStudentTaskFilter === "homework" || activeStudentTaskFilter === "classwork"){
        task.studentTaskType = activeStudentTaskFilter;
      } else if (!task.studentTaskType){
        task.studentTaskType = "classwork";
      }
    }

    saveState();
    render();
  }

  function openStudentDetail(student){
    const now = new Date();
    const currentTasks = activeTasks();
    const overdue = currentTasks.filter(task =>
      !isStudentAbsent(task, student) &&
      !task.completed[student] &&
      isTaskOverdue(task, now)
    );
    const pending = currentTasks.filter(task =>
      !isStudentAbsent(task, student) &&
      !task.completed[student] &&
      !isTaskOverdue(task, now)
    );
    const completeCount = currentTasks.filter(task => !!task.completed[student]).length;
    const absentCount = currentTasks.filter(task => isStudentAbsent(task, student)).length;

    studentDetailName.textContent = student;
    studentDetailSummary.textContent = currentTasks.length
      ? `${completeCount} completed · ${pending.length} pending · ${overdue.length} overdue · ${absentCount} absent.`
      : "No active tasks have been added yet.";

    studentDetailContent.innerHTML = "";

    if (!currentTasks.length){
      const box = document.createElement("div");
      box.className = "student-detail-complete";
      box.textContent = "There are no current tasks to check.";
      studentDetailContent.appendChild(box);
    } else if (!overdue.length && !pending.length){
      const box = document.createElement("div");
      box.className = "student-detail-complete";
      box.textContent = "✓ All current tasks are complete.";
      studentDetailContent.appendChild(box);
    } else {
      if (overdue.length){
        const heading = document.createElement("strong");
        heading.textContent = `Overdue incomplete tasks (${overdue.length})`;
        studentDetailContent.appendChild(heading);

        const list = document.createElement("div");
        list.className = "student-detail-list";

        overdue.forEach(task => {
          const item = document.createElement("div");
          item.className = "student-detail-item";
          item.innerHTML = `<span><strong>${escapeHtml(task.title || "Untitled Task")}</strong><br><span style="font-size:12px;color:var(--muted)">${escapeHtml(task.category || "UOI CW")} · Due ${escapeHtml(formatDue(task))}</span></span>`;
          list.appendChild(item);
        });

        studentDetailContent.appendChild(list);
      }

      if (pending.length){
        const heading = document.createElement("strong");
        heading.style.display = "block";
        heading.style.marginTop = overdue.length ? "18px" : "0";
        heading.textContent = `Pending — not due yet (${pending.length})`;
        studentDetailContent.appendChild(heading);

        const list = document.createElement("div");
        list.className = "student-detail-list";

        pending.forEach(task => {
          const item = document.createElement("div");
          item.className = "student-detail-item";
          item.style.background = "#f8fafc";
          item.style.borderColor = "#cbd5e1";
          item.innerHTML = `<span><strong>${escapeHtml(task.title || "Untitled Task")}</strong><br><span style="font-size:12px;color:var(--muted)">${escapeHtml(task.category || "UOI CW")} · Due ${escapeHtml(formatDue(task))}</span></span>`;
          list.appendChild(item);
        });

        studentDetailContent.appendChild(list);
      }
    }

    studentDetailDialog.showModal();
  }

  function openStudentNote(taskId, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    activeNoteTarget = { taskId, student };
    studentNoteTitle.textContent = student;
    studentNoteContext.textContent = task.title || "Untitled Task";
    studentNoteText.value = (task.notes && task.notes[student]) || "";
    studentNoteDialog.showModal();
    requestAnimationFrame(() => studentNoteText.focus());
  }

  function saveStudentNote(){
    if (!activeNoteTarget) return;

    const task = state.tasks.find(t => t.id === activeNoteTarget.taskId);
    if (!task) return;

    task.notes = task.notes || {};
    const note = studentNoteText.value.trim();

    if (note){
      task.notes[activeNoteTarget.student] = note;
    } else {
      delete task.notes[activeNoteTarget.student];
    }

    saveState();
    render();
    studentNoteDialog.close();
    activeNoteTarget = null;
  }

  function clearStudentNote(){
    if (!activeNoteTarget) return;

    const task = state.tasks.find(t => t.id === activeNoteTarget.taskId);
    if (!task) return;

    task.notes = task.notes || {};
    delete task.notes[activeNoteTarget.student];

    saveState();
    render();
    studentNoteDialog.close();
    activeNoteTarget = null;
  }

  function toggleStudentAbsent(taskId, student){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.absent = task.absent || {};
    task.completed = task.completed || {};
    task.completedAt = task.completedAt || {};

    const nextAbsent = !task.absent[student];
    task.absent[student] = nextAbsent;

    if (nextAbsent){
      // Absence nulls the student out for this task.
      task.completed[student] = false;
      delete task.completedAt[student];
    }

    saveState();
    render();
  }

  function archiveDateText(iso){
    if (!iso) return "Archived";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Archived";
    return `Archived ${d.toLocaleDateString([], {
      year:"numeric",
      month:"short",
      day:"numeric"
    })}`;
  }

  function archiveTask(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || task.archived) return;

    task.archived = true;
    task.archivedAt = new Date().toISOString();
    task.collapsed = false;

    saveState();
    render();
    updateArchiveButtonUI();

    if (archiveDialog.open){
      renderArchive();
    }
  }

  function restoreArchivedTask(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || !task.archived) return;

    task.archived = false;
    task.archivedAt = "";
    task.collapsed = false;

    saveState();
    render();
    renderArchive();
    updateArchiveButtonUI();
  }

  function updateArchiveButtonUI(){
    const count = archivedTasks().length;
    archiveBtn.title = count
      ? `Archive · ${count} task${count === 1 ? "" : "s"}`
      : "Archive";
    archiveBtn.setAttribute(
      "aria-label",
      count
        ? `Open archive with ${count} task${count === 1 ? "" : "s"}`
        : "Open archive"
    );
  }

  function taskCreatedValue(task){
    const raw = task.createdAt || "";
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function taskDueValue(task){
    const due = parseDateOnly(task.dueAt);
    return due ? due.getTime() : Number.POSITIVE_INFINITY;
  }

  function sortedActiveTaskList(tasks){
    const sorted = [...tasks];

    if (activeTaskSort === "alphabetical"){
      return sorted.sort((a,b) =>
        String(a.title || "").localeCompare(
          String(b.title || ""),
          undefined,
          {sensitivity:"base"}
        )
      );
    }

    if (activeTaskSort === "due-date"){
      return sorted.sort((a,b) => {
        const diff = taskDueValue(a) - taskDueValue(b);
        if (diff !== 0) return diff;
        return String(a.title || "").localeCompare(
          String(b.title || ""),
          undefined,
          {sensitivity:"base"}
        );
      });
    }

    // Date added: newest first.
    return sorted.sort((a,b) => taskCreatedValue(b) - taskCreatedValue(a));
  }

  function archiveDateValue(task){
    const raw = task.createdAt || task.archivedAt || "";
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function archiveDueValue(task){
    const due = parseDateOnly(task.dueAt);
    return due ? due.getTime() : Number.POSITIVE_INFINITY;
  }

  function sortedArchivedTasks(){
    const tasks = [...archivedTasks()];

    if (activeArchiveSort === "alphabetical"){
      return tasks.sort((a,b) =>
        String(a.title || "").localeCompare(String(b.title || ""), undefined, {sensitivity:"base"})
      );
    }

    if (activeArchiveSort === "due-date"){
      return tasks.sort((a,b) => {
        const diff = archiveDueValue(a) - archiveDueValue(b);
        if (diff !== 0) return diff;
        return String(a.title || "").localeCompare(String(b.title || ""), undefined, {sensitivity:"base"});
      });
    }

    // Date added: newest first.
    return tasks.sort((a,b) => archiveDateValue(b) - archiveDateValue(a));
  }

  function updateArchiveSortUI(){
    document.querySelectorAll("[data-archive-sort]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.archiveSort === activeArchiveSort);
    });
  }

  function renderArchive(){
    const archived = sortedArchivedTasks();
    archiveList.innerHTML = "";
    updateArchiveSortUI();

    if (!archived.length){
      archiveList.innerHTML = '<div class="archive-empty">No archived tasks yet.</div>';
      return;
    }

    archived.forEach(task => {
      const details = document.createElement("details");
      details.className = "archive-task-card";

      const completeCount = state.students.filter(student => !!task.completed[student]).length;
      const absentCount = state.students.filter(student => isStudentAbsent(task, student)).length;
      const typeText =
        taskAudience(task) === "teacher"
          ? "Teacher Task"
          : (studentTaskType(task) === "homework" ? "Homework" : "Classwork");
      const workModeText = taskWorkModeLabel(taskWorkMode(task)) || "Task";
      const dueText =
        taskAudience(task) === "student" && task.dueAt
          ? `Due ${formatDue(task)}`
          : "";

      const summary = document.createElement("summary");
      summary.innerHTML = `
        <div class="archive-task-title-row">
          <span class="archive-task-title">${escapeHtml(task.title || "Untitled Task")}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span class="archive-task-complete">✓ ${completeCount}/${state.students.length}</span>
            <button type="button"
                    class="archive-unarchive-icon"
                    data-restore-archive-task="${task.id}"
                    ${tableLocked ? "disabled" : ""}
                    aria-label="Unarchive ${escapeHtml(task.title || "Untitled Task")}"
                    title="${tableLocked ? "Unlock to unarchive this task" : `Unarchive to ${taskAudience(task) === "teacher" ? "Teacher Tasks" : (studentTaskType(task) === "homework" ? "Homework" : "Classwork")}`}">
              ↩
            </button>
          </span>
        </div>
        <div class="archive-meta">
          <span class="archive-meta-pill ${
            taskAudience(task) === "teacher"
              ? "archive-meta-teacher"
              : (studentTaskType(task) === "homework" ? "archive-meta-homework" : "archive-meta-classwork")
          }">${escapeHtml(typeText)}</span>
          <span class="archive-meta-pill archive-meta-mode">${escapeHtml(workModeText)}</span>
          ${dueText ? `<span class="archive-meta-pill archive-meta-due">${escapeHtml(dueText)}</span>` : ""}
          ${absentCount ? `<span class="archive-meta-pill archive-meta-absent">${absentCount} absent</span>` : ""}
          <span class="archive-meta-pill archive-meta-added">Added ${escapeHtml(new Date(task.createdAt || task.archivedAt || Date.now()).toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"}))}</span>
          <span class="archive-meta-pill archive-meta-archived">${escapeHtml(archiveDateText(task.archivedAt))}</span>
        </div>
      `;
      details.appendChild(summary);

      const body = document.createElement("div");
      body.className = "archive-task-body";

      const studentGrid = document.createElement("div");
      studentGrid.className = "archive-students-grid";

      state.students.forEach(student => {
        const row = document.createElement("div");
        row.className = "archive-student-row";

        const name = document.createElement("span");
        name.className = "archive-student-name";
        name.textContent = student;

        const status = document.createElement("span");
        const absent = isStudentAbsent(task, student);
        const complete = !!task.completed[student];

        status.className =
          "archive-student-status " +
          (absent ? "absent" : (complete ? "" : "incomplete"));

        status.textContent = absent ? "Absent" : (complete ? "Complete" : "Not complete");

        if (complete && task.completedAt && task.completedAt[student]){
          status.title = completionTimestampText(task.completedAt[student]);
        }

        row.appendChild(name);
        row.appendChild(status);
        studentGrid.appendChild(row);
      });

      body.appendChild(studentGrid);

      const returnNote = document.createElement("div");
      returnNote.style.marginTop = "10px";
      returnNote.style.fontSize = "11px";
      returnNote.style.color = "var(--muted)";
      returnNote.textContent =
        taskAudience(task) === "teacher"
          ? "Unarchives back to Teacher Tasks."
          : `Unarchives back to ${studentTaskType(task) === "homework" ? "Homework" : "Classwork"}.`;
      body.appendChild(returnNote);

      details.appendChild(body);
      archiveList.appendChild(details);
    });

    applyTranslations(archiveList);
  }

  function closeArchiveSortMenu(){
    if (archiveSortDropdown) archiveSortDropdown.classList.remove("open");
    if (archiveSortTrigger) archiveSortTrigger.setAttribute("aria-expanded", "false");
  }

  function openArchive(){
    closeArchiveSortMenu();
    renderArchive();
    archiveDialog.showModal();
  }

  function toggleTask(id){
    if (tableLocked) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.collapsed = !task.collapsed;
    saveState();
    render();
  }

  function deleteSetupTask(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const isInitialSetup = !taskWorkMode(task);
    const isPairSetup = taskWorkMode(task) === "pair" && !pairSelectionLabel(task);
    const isAutomaticAttendanceSetup =
      taskWorkMode(task) === "pair" &&
      task.pairSelectionMode === "automatic" &&
      task.pairSetupStage === "attendance";
    const isManualPairingSetup =
      taskWorkMode(task) === "pair" &&
      task.pairSelectionMode === "manual" &&
      task.pairSetupStage === "manual-pairing";
    const isGroupSetup =
      taskWorkMode(task) === "group" &&
      (
        !task.groupSelectionMode ||
        task.groupSetupStage === "attendance" ||
        task.groupSetupStage === "size" ||
        task.groupSetupStage === "manual-grouping"
      );

    if (
      !isInitialSetup &&
      !isPairSetup &&
      !isAutomaticAttendanceSetup &&
      !isManualPairingSetup &&
      !isGroupSetup
    ) return;

    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    render();
  }

  function deleteTask(id){
    if (tableLocked){
      alert("The table is locked. Unlock it before deleting a task.");
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    if (!confirm(`Delete "${task.title}"?`)) return;
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    render();
  }

  function toggleCollaborativeStudent(taskId, student, sourceElement = null){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (
      !task ||
      (!isGeneratedGroupTask(task) &&
       !isAutomaticPairTask(task) &&
       !isManualPairTask(task))
    ) return;
    if (!state.students.includes(student)) return;
    if (isStudentAbsent(task, student)) return;

    const wasComplete = !!task.completed[student];
    task.completed[student] = !wasComplete;

    if (!wasComplete){
      recordCompletionTick(task, student);
    } else {
      task.completedAt = task.completedAt || {};
      delete task.completedAt[student];
      // Keep completionHistory so previous completion ticks remain recorded.
    }

    saveState();

    if (!wasComplete){
      const box = sourceElement
        ? sourceElement.closest(".group-task-block, .pair-task-block, .automatic-pair-row")
        : null;
      if (box){
        finishCompletionCelebration(box);
        return;
      }
    }

    render();
  }

  function toggleTaskOverdue(id){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task || taskAudience(task) !== "student") return;

    // Manual overdue flag. Automatic date-based overdue status remains active
    // independently when a Homework due date has already passed.
    task.forcedOverdue = !task.forcedOverdue;
    saveState();
    render();
  }

  function setTaskCompletion(id, value){
    if (tableLocked) return;

    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const requiredStudents = state.students.filter(
      student => !isStudentAbsent(task, student)
    );

    if (value === "all"){
      const nowIso = new Date().toISOString();

      requiredStudents.forEach(student => {
        const wasComplete = !!task.completed[student];
        task.completed[student] = true;

        if (!wasComplete){
          recordCompletionTick(task, student, nowIso);
        }
      });
    } else if (value === "none"){
      requiredStudents.forEach(student => {
        task.completed[student] = false;
        task.completedAt = task.completedAt || {};
        delete task.completedAt[student];
        // Keep completionHistory so previous completion ticks remain recorded.
      });
    } else {
      return;
    }

    saveState();
    render();
  }

  function markAllComplete(){
    if (!activeTasks().length) return;
    if (!confirm("Mark every student complete for every active task?")) return;
    const nowIso = new Date().toISOString();
    activeTasks().forEach(task => {
      state.students.forEach(student => {
        if (isStudentAbsent(task, student)) return;
        const wasComplete = !!task.completed[student];
        task.completed[student] = true;
        if (!wasComplete){
          recordCompletionTick(task, student, nowIso);
        }
      });
    });
    saveState();
    render();
  }

  function rosterStudentNumber(name){
    const match = String(name || "").trim().match(/^(\d+)/);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
  }

  function updateRosterDuplicateWarnings(){
    const rows = [...rosterList.querySelectorAll(".roster-row")];
    const counts = new Map();

    rows.forEach(row => {
      const input = row.querySelector("input");
      const value = input ? input.value.trim() : "";
      if (!value) return;
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    rows.forEach(row => {
      const input = row.querySelector("input");
      const value = input ? input.value.trim() : "";
      row.classList.toggle("duplicate-name", !!value && (counts.get(value) || 0) > 1);
    });
  }

  function sortRosterRowsByStudentNumber(){
    const rows = [...rosterList.querySelectorAll(".roster-row")];
    rows.sort((a,b) => {
      const aInput = a.querySelector("input");
      const bInput = b.querySelector("input");
      const aValue = aInput ? aInput.value.trim() : "";
      const bValue = bInput ? bInput.value.trim() : "";
      const aNum = rosterStudentNumber(aValue);
      const bNum = rosterStudentNumber(bValue);

      if (aNum !== bNum) return aNum - bNum;
      return aValue.localeCompare(bValue, undefined, {numeric:true, sensitivity:"base"});
    });
    rows.forEach(row => rosterList.appendChild(row));
  }

  function parseBatchStudentLine(line){
    let raw = String(line || "").trim();
    if (!raw) return null;

    // Normalise common pasted spreadsheet/list separators.
    const tabParts = raw.split(/\t+/).map(x => x.trim()).filter(Boolean);
    const commaParts = raw.split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);

    let number = "";
    let chinese = "";
    let english = "";

    if (tabParts.length >= 3){
      number = tabParts[0].replace(/[^\d]/g, "");
      chinese = tabParts[1];
      english = tabParts.slice(2).join(" ");
    } else if (commaParts.length >= 3){
      number = commaParts[0].replace(/[^\d]/g, "");
      chinese = commaParts[1];
      english = commaParts.slice(2).join(" ");
    } else {
      // Fallback for plain text: find the leading number, then split where
      // the first Latin-letter English name begins.
      const leading = raw.match(/^\s*(\d+)[\s.\-:、，,)]*(.*)$/);
      if (!leading) return null;

      number = leading[1];
      const remainder = leading[2].trim();
      const englishStart = remainder.search(/[A-Za-z]/);

      if (englishStart >= 0){
        chinese = remainder.slice(0, englishStart).trim().replace(/[，,;；|]+$/g, "").trim();
        english = remainder.slice(englishStart).trim();
      } else {
        chinese = remainder;
      }
    }

    number = String(Number(number || 0) || "").trim();
    chinese = String(chinese || "").replace(/\s+/g, " ").trim();
    english = String(english || "").replace(/\s+/g, " ").trim();

    if (!number || (!chinese && !english)) return null;

    return [number, chinese, english].filter(Boolean).join(" ");
  }

  function splitBatchStudentRecords(text){
    const raw = String(text || "")
      .replace(/\r/g, "\n")
      .trim();

    if (!raw) return [];

    // First preserve normal line-by-line pastes.
    const normalLines = raw
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    const records = [];

    normalLines.forEach(line => {
      // Detect repeated student-number markers even when the whole class was
      // pasted on one line, e.g.
      // 1伊茉溱Jasmine2何以然Chloe He3徐芯爱Alicia
      //
      // A record starts with 1-3 digits and continues until the next number.
      const matches = [...line.matchAll(/(\d{1,3})\s*([^\d]+?)(?=(?:\d{1,3})\s*[^\d]|$)/g)];

      if (matches.length >= 2){
        matches.forEach(match => {
          const number = match[1];
          const rest = String(match[2] || "").trim();
          if (rest) records.push(`${number} ${rest}`);
        });
        return;
      }

      // If there is only one normal record on the line, keep the original
      // separators (tabs/commas/spaces) so parseBatchStudentLine can use them.
      records.push(line);
    });

    return records;
  }

  function applyBatchStudents(){
    const records = splitBatchStudentRecords(batchStudentText.value);
    const parsed = [];
    let skipped = 0;

    records.forEach(record => {
      if (!record.trim()) return;
      const student = parseBatchStudentLine(record);
      if (student){
        parsed.push(student);
      } else {
        skipped++;
      }
    });

    if (!parsed.length){
      batchStudentMessage.textContent = "No student rows could be read. Include each student number before their Chinese and English name.";
      batchStudentMessage.style.color = "var(--danger)";
      return;
    }

    parsed.forEach(name => addRosterRow(name, false));
    sortRosterRowsByStudentNumber();
    updateRosterDuplicateWarnings();

    batchStudentMessage.style.color = "var(--good)";
    batchStudentMessage.textContent =
      `${parsed.length} student${parsed.length === 1 ? "" : "s"} added` +
      (skipped ? ` · ${skipped} record${skipped === 1 ? "" : "s"} skipped` : "");

    batchStudentText.value = "";
    batchStudentPanel.hidden = true;
  }

  function openRoster(){
    syncStudentsFromActiveGroup();
    renderStudentGroups();
    rosterList.innerHTML = "";
    batchStudentPanel.hidden = true;
    batchStudentText.value = "";
    batchStudentMessage.textContent = "";
    state.students.forEach(name => addRosterRow(name, false));
    sortRosterRowsByStudentNumber();
    updateRosterDuplicateWarnings();
  }

  function addRosterRow(name="", focusNew=true){
    const row = document.createElement("div");
    row.className = "roster-row";
    row.innerHTML = `
      <div class="roster-name-wrap">
        <input type="text" value="${escapeHtml(name)}" placeholder="Student name" />
        <span class="roster-duplicate-warning">⚠ Duplicate name</span>
      </div>
      <button class="danger-btn small" type="button">Remove</button>
    `;

    const input = row.querySelector("input");
    input.addEventListener("input", updateRosterDuplicateWarnings);
    input.addEventListener("change", () => {
      sortRosterRowsByStudentNumber();
      updateRosterDuplicateWarnings();
    });

    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      updateRosterDuplicateWarnings();
    });

    rosterList.appendChild(row);
    updateRosterDuplicateWarnings();
    if (!name && focusNew) input.focus();
  }

  function saveRoster(){
    sortRosterRowsByStudentNumber();
    updateRosterDuplicateWarnings();

    const names = [...rosterList.querySelectorAll("input")]
      .map(i => i.value.trim())
      .filter(Boolean);

    const unique = [...new Set(names)];

    if (!unique.length){
      alert("Please keep at least one student.");
      return;
    }

    const oldStudents = [...state.students];
    state.students = unique;
    const group = activeStudentGroup();
    if (group) group.students = [...unique];
    saveStudentGroups();

    state.tasks.forEach(task => {
      const nextCompleted = {};
      const nextCompletedAt = {};
      const nextCompletionHistory = {};
      const nextAbsent = {};
      const nextNotes = {};
      const currentCompletedAt = task.completedAt || {};
      const currentCompletionHistory = task.completionHistory || {};
      const currentAbsent = task.absent || {};
      const currentNotes = task.notes || {};

      unique.forEach(student => {
        if (oldStudents.includes(student)){
          nextCompleted[student] = !!task.completed[student];
          if (currentCompletedAt[student]){
            nextCompletedAt[student] = currentCompletedAt[student];
          }
          if (Array.isArray(currentCompletionHistory[student])){
            nextCompletionHistory[student] = [...currentCompletionHistory[student]];
          }
          if (currentAbsent[student]){
            nextAbsent[student] = true;
          }
          if (currentNotes[student]){
            nextNotes[student] = currentNotes[student];
          }
        } else {
          nextCompleted[student] = false;
        }
      });

      task.completed = nextCompleted;
      task.completedAt = nextCompletedAt;
      task.completionHistory = nextCompletionHistory;
      task.absent = nextAbsent;
      task.notes = nextNotes;

      if (Array.isArray(task.pairGroups)){
        task.pairGroups = task.pairGroups
          .map(group => group.filter(student => unique.includes(student) && !nextAbsent[student]))
          .filter(group => group.length);
      }

      if (Array.isArray(task.groupGroups)){
        task.groupGroups = task.groupGroups
          .map(group => group.filter(student => unique.includes(student) && !nextAbsent[student]))
          .filter(group => group.length);
      }
    });

    saveState();
    render();
    renderSpinWheel();
  }

  function portableBackupObject(){
    return {
      app: "Student Task Checklist",
      schemaVersion: DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
      versionHistory: historyEntries.slice(0, MAX_HISTORY_ENTRIES)
    };
  }

  function portableBackupText(){
    return JSON.stringify(portableBackupObject(), null, 2);
  }

  function openDataTransfer(){
    dataTransferText.value = portableBackupText();
    dataTransferMessage.textContent =
      "Tip: copy this whole block and save it in Notes, email, or a text file. Paste it into any future version.";
    dataTransferDialog.showModal();
    dataTransferText.focus();
    dataTransferText.select();
  }

  async function copyTransferData(){
    const text = dataTransferText.value || portableBackupText();
    try{
      await navigator.clipboard.writeText(text);
      dataTransferMessage.textContent = "✓ Data copied to clipboard.";
    }catch(e){
      dataTransferText.focus();
      dataTransferText.select();
      dataTransferMessage.textContent =
        "Clipboard access was blocked. The data is selected — use Ctrl+C or Cmd+C.";
    }
  }

  function safeVersionHistory(raw){
    if (!Array.isArray(raw)) return [];

    return raw
      .filter(entry =>
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.description === "string" &&
        entry.before &&
        Array.isArray(entry.before.students) &&
        Array.isArray(entry.before.tasks)
      )
      .map(entry => ({
        ...entry,
        before: safeState(entry.before)
      }))
      .slice(0, MAX_HISTORY_ENTRIES);
  }

  function importPortableBundle(text){
    const parsed = JSON.parse(text);
    const candidate = parsed && parsed.data ? parsed.data : parsed;

    return {
      state: safeState(candidate),
      versionHistory: safeVersionHistory(parsed && parsed.versionHistory)
    };
  }

  function importPortableText(text){
    return importPortableBundle(text).state;
  }

  function applyImportedBundle(bundle){
    state = bundle.state;
    historyEntries = bundle.versionHistory || [];

    suppressVersionHistory = true;
    try{
      profileSet(STORAGE_KEY, JSON.stringify(state));
      profileSet(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries.slice(0, MAX_HISTORY_ENTRIES)));
      lastSavedStateSnapshot = cloneChecklistState(state);
    } finally {
      suppressVersionHistory = false;
    }

    render();
    updateTimestampToggleUI();
    updateArchiveButtonUI();

    if (historyDialog && historyDialog.open){
      renderVersionHistory();
    }
    if (archiveDialog && archiveDialog.open){
      renderArchive();
    }
  }

  function applyPastedData(){
    const text = dataTransferText.value.trim();
    if (!text){
      dataTransferMessage.textContent = "Paste checklist data into the box first.";
      return;
    }

    try{
      const imported = importPortableBundle(text);
      if (!confirm("Replace the current checklist, archive, and Version History with the pasted data?")) return;
      applyImportedBundle(imported);
      queueJsonFileSave();
      dataTransferMessage.textContent = "✓ Data, archive, and Version History imported successfully.";
      setTimeout(() => dataTransferDialog.close(), 500);
    }catch(e){
      dataTransferMessage.textContent =
        "That data could not be read. Make sure you copied the complete checklist data block.";
    }
  }

  function exportBackup(){
    const data = portableBackupText();
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `student-checklist-data-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const imported = importPortableBundle(reader.result);
        if (!confirm("Replace the current checklist, archive, and Version History with this backup?")) return;
        applyImportedBundle(imported);
        queueJsonFileSave();
      }catch(e){
        alert("That file does not appear to be a valid checklist backup.");
      }finally{
        importFile.value = "";
      }
    };
    reader.readAsText(file);
  }

  function resetChecklist(){
    if (!confirm("Reset the whole checklist? This deletes all tasks and restores the default student list.")) return;
    if (!confirm("Are you sure? Export a backup first if you may need this data later.")) return;
    state = freshState();
    saveState();
    render();
  }

  function positionAdminPanel(){
    if (adminPanel.hidden) return;

    const buttonRect = adminToggleBtn.getBoundingClientRect();
    const panelWidth = Math.min(330, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(window.innerWidth - panelWidth - 12, buttonRect.right - panelWidth)
    );

    adminPanel.style.width = `${panelWidth}px`;
    adminPanel.style.left = `${left}px`;
    adminPanel.style.top = `${Math.min(window.innerHeight - 12, buttonRect.bottom + 8)}px`;
  }

  function setAdminPanel(open){
    adminPanel.hidden = !open;
    adminToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    adminToggleBtn.textContent = "⚙";
    adminToggleBtn.title = open ? "Close settings menu" : "Settings";
    adminToggleBtn.setAttribute("aria-label", open ? "Close settings menu" : "Open settings menu");

    if (open){
      requestAnimationFrame(positionAdminPanel);
    }
  }

  function updateTeacherControls(){
    // Task creation is handled inside the Student/Teacher task sections.
  }

  adminToggleBtn.addEventListener("click", () => {
    if (!adminPanel.hidden){
      setAdminPanel(false);
      return;
    }

    if (tableLocked){
      openUnlockDialog("admin");
      return;
    }

    setAdminPanel(true);
  });

  closeAdminBtn.addEventListener("click", () => {
    setAdminPanel(false);
  });

  document.addEventListener("click", e => {
    if (adminPanel.hidden) return;
    if (adminPanel.contains(e.target) || adminToggleBtn.contains(e.target)) return;
    setAdminPanel(false);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !adminPanel.hidden){
      setAdminPanel(false);
      adminToggleBtn.focus();
    }
  });

  window.addEventListener("resize", positionAdminPanel);
  window.addEventListener("scroll", positionAdminPanel, true);

  function updateTimestampToggleUI(){
    const btn = document.getElementById("timestampToggleBtn");
    if (!btn) return;

    const on = !!state.settings.completionTimestamps;
    btn.textContent = `Completion Timestamps: ${on ? "On" : "Off"}`;
    btn.classList.toggle("primary", on);
    btn.classList.toggle("secondary", !on);
    btn.title = on
      ? "Completion timestamps are shown beside completed ticks"
      : "Show completion timestamps (tick times are still recorded in the data)";
  }

  function toggleCompletionTimestamps(){
    state.settings.completionTimestamps = !state.settings.completionTimestamps;
    saveState();
    updateTimestampToggleUI();
    render();
  }

  function adminGuard(action){
    return (...args) => {
      if (tableLocked){
        alert("The table is locked. Unlock it before using Admin controls.");
        return;
      }
      setAdminPanel(false);
      return action(...args);
    };
  }

  function openChangePasswordDialog(){
    if (tableLocked) return;
    setAdminPanel(false);
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmNewPasswordInput.value = "";
    changePasswordError.textContent = "";
    changePasswordDialog.showModal();
    requestAnimationFrame(() => currentPasswordInput.focus());
  }

  changePasswordBtn.addEventListener("click", adminGuard(openChangePasswordDialog));

  changePasswordForm.addEventListener("submit", e => {
    e.preventDefault();
    if (tableLocked) return;

    const current = currentPasswordInput.value;
    const next = newPasswordInput.value;
    const confirmNext = confirmNewPasswordInput.value;

    if (current !== tableUnlockPassword){
      changePasswordError.textContent = "Current password is incorrect.";
      currentPasswordInput.select();
      currentPasswordInput.focus();
      return;
    }

    if (next.length < 4){
      changePasswordError.textContent = "New password must be at least 4 characters.";
      newPasswordInput.focus();
      return;
    }

    if (next !== confirmNext){
      changePasswordError.textContent = "The new passwords do not match.";
      confirmNewPasswordInput.select();
      confirmNewPasswordInput.focus();
      return;
    }

    tableUnlockPassword = next;
    profileSet(PASSWORD_STORAGE_KEY, tableUnlockPassword);
    changePasswordDialog.close();
    alert("Lock password updated.");
  });

  document.getElementById("cancelChangePasswordBtn").addEventListener("click", () => {
    changePasswordDialog.close();
  });

  changePasswordDialog.addEventListener("click", e => {
    if (e.target === changePasswordDialog) changePasswordDialog.close();
  });

  closeBrowserStorageNoticeBtn.addEventListener("click", () => {
    profileSet(BROWSER_STORAGE_NOTICE_KEY, "seen");
    browserStorageNoticeDialog.close();
  });

  closeBrowserStorageNoticeX.addEventListener("click", () => {
    profileSet(BROWSER_STORAGE_NOTICE_KEY, "seen");
    browserStorageNoticeDialog.close();
  });

  browserStorageNoticeDialog.addEventListener("click", event => {
    if (event.target === browserStorageNoticeDialog){
      profileSet(BROWSER_STORAGE_NOTICE_KEY, "seen");
      browserStorageNoticeDialog.close();
    }
  });

  browserStorageNoticeDialog.addEventListener("cancel", () => {
    profileSet(BROWSER_STORAGE_NOTICE_KEY, "seen");
  });

  startJsonSetupBtn.addEventListener("click", async () => {
    if (tableLocked) return;
    jsonSetupDialog.close();
    await connectJsonSaveFile();
  });

  skipJsonSetupBtn.addEventListener("click", () => {
    profileSet(JSON_SETUP_DISMISSED_KEY, "seen");
    jsonSetupDialog.close();
  });

  closeJsonSetupBtn.addEventListener("click", () => {
    profileSet(JSON_SETUP_DISMISSED_KEY, "seen");
    jsonSetupDialog.close();
  });

  jsonSetupDialog.addEventListener("click", e => {
    if (e.target === jsonSetupDialog){
      profileSet(JSON_SETUP_DISMISSED_KEY, "seen");
      jsonSetupDialog.close();
    }
  });

  jsonSetupDialog.addEventListener("cancel", () => {
    profileSet(JSON_SETUP_DISMISSED_KEY, "seen");
  });

  connectJsonFileBtn.addEventListener("click", adminGuard(connectJsonSaveFile));

  saveJsonNowBtn.addEventListener("click", async () => {
    if (tableLocked || !jsonFileHandle) return;
    const saved = await writeStateToJsonFile({requestPermission:true, showMessage:true});
    if (!saved && jsonFileHandle){
      updateJsonSaveUI("warning", `Permission is needed to save ${jsonFileHandle.name || "the JSON file"}.`);
    }
  });

  disconnectJsonFileBtn.addEventListener("click", disconnectJsonSaveFile);

  document.getElementById("editStudentsBtn").addEventListener("click", adminGuard(() => navigateTo("students")));
  studentGroupSelect.addEventListener("change", () => {
    activeStudentGroupId = studentGroupSelect.value;
    openRoster();
    render();
  });
  addStudentGroupBtn.addEventListener("click", () => {
    const name = newStudentGroupName.value.trim();
    if (!name){
      newStudentGroupName.focus();
      return;
    }
    if (studentGroups.some(group => group.name.toLocaleLowerCase() === name.toLocaleLowerCase())){
      alert("A group with that name already exists.");
      return;
    }
    const group = {id: uid(), name, students: []};
    studentGroups.push(group);
    activeStudentGroupId = group.id;
    newStudentGroupName.value = "";
    saveStudentGroups();
    openRoster();
    renderSpinWheel();
  });
  renameStudentGroupBtn.addEventListener("click", () => {
    const group = activeStudentGroup();
    const name = prompt("Rename this student group:", group?.name || "");
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (studentGroups.some(item => item.id !== group.id && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())){
      alert("A group with that name already exists.");
      return;
    }
    group.name = trimmed;
    saveStudentGroups();
    renderStudentGroups();
    renderSpinWheel();
  });
  deleteStudentGroupBtn.addEventListener("click", () => {
    if (studentGroups.length === 1){
      alert("Keep at least one student group.");
      return;
    }
    const group = activeStudentGroup();
    if (!confirm(`Delete the ${group.name} group and its students?`)) return;
    studentGroups = studentGroups.filter(item => item.id !== group.id);
    activeStudentGroupId = studentGroups[0].id;
    saveStudentGroups();
    openRoster();
    render();
    renderSpinWheel();
  });
  document.getElementById("timestampToggleBtn").addEventListener("click", adminGuard(toggleCompletionTimestamps));
  document.getElementById("transferDataBtn").addEventListener("click", adminGuard(openDataTransfer));
  document.getElementById("copyDataBtn").addEventListener("click", copyTransferData);
  document.getElementById("applyDataBtn").addEventListener("click", applyPastedData);
  document.getElementById("cancelDataTransferBtn").addEventListener("click", () => dataTransferDialog.close());
  document.getElementById("addStudentBtn").addEventListener("click", () => addRosterRow(""));
  document.getElementById("addBatchStudentsBtn").addEventListener("click", () => {
    batchStudentPanel.hidden = false;
    batchStudentMessage.textContent = "";
    requestAnimationFrame(() => batchStudentText.focus());
  });
  document.getElementById("cancelBatchStudentsBtn").addEventListener("click", () => {
    batchStudentPanel.hidden = true;
    batchStudentText.value = "";
    batchStudentMessage.textContent = "";
  });
  document.getElementById("applyBatchStudentsBtn").addEventListener("click", applyBatchStudents);
  document.getElementById("cancelRosterBtn").addEventListener("click", () => navigateTo("main"));
  studentManagerBackBtn.addEventListener("click", () => navigateTo("main"));
  wordManagerBackBtn.addEventListener("click", () => navigateTo("main"));
  wordGroupSelect.addEventListener("change", () => { activeWordGroupId = wordGroupSelect.value; renderWordEntries(); });
  addWordGroupBtn.addEventListener("click", () => {
    const name = newWordGroupName.value.trim();
    if (!name) return newWordGroupName.focus();
    if (wordGroups.some(group => group.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return alert("A group with that name already exists.");
    const group = {id:uid(), name, words:[]}; wordGroups.push(group); activeWordGroupId = group.id; newWordGroupName.value = ""; saveWordGroups(); renderWordEntries();
  });
  renameWordGroupBtn.addEventListener("click", () => {
    const group = activeWordGroup(); const name = prompt("Rename this word group:", group.name);
    if (name === null || !name.trim()) return;
    const next = name.trim();
    if (wordGroups.some(item => item.id !== group.id && item.name.toLocaleLowerCase() === next.toLocaleLowerCase())) return alert("A group with that name already exists.");
    group.name = next; saveWordGroups(); renderWordEntries();
  });
  deleteWordGroupBtn.addEventListener("click", () => {
    if (wordGroups.length === 1) return alert("Keep at least one word group.");
    const group = activeWordGroup();
    if (!confirm(`Delete the ${group.name} group and its words?`)) return;
    wordGroups = wordGroups.filter(item => item.id !== group.id); activeWordGroupId = wordGroups[0].id; saveWordGroups(); renderWordEntries();
  });
  addSingleWordBtn.addEventListener("click", () => {
    const word = newWordInput.value.trim(); if (!word) return newWordInput.focus();
    addWordsToActiveGroup([{word, definition:newWordDefinitionInput.value.trim(), sentence:newWordSentenceInput.value.trim()}]);
    newWordInput.value = ""; newWordDefinitionInput.value = ""; newWordSentenceInput.value = ""; newWordInput.focus();
  });
  newWordInput.addEventListener("keydown", event => { if (event.key === "Enter"){ event.preventDefault(); addSingleWordBtn.click(); } });
  showWordImportBtn.addEventListener("click", () => { wordImportPanel.hidden = false; wordImportText.focus(); });
  cancelWordImportBtn.addEventListener("click", () => { wordImportPanel.hidden = true; wordImportText.value = ""; wordImportMessage.textContent = ""; });
  applyWordImportBtn.addEventListener("click", () => {
    const entries = parseWordListImport(wordImportText.value); const added = addWordsToActiveGroup(entries);
    wordImportMessage.textContent = added ? `${added} word entries added.` : "No new word entries to add.";
    if (added) { wordImportText.value = ""; wordImportPanel.hidden = true; }
  });
  document.getElementById("saveRosterBtn").addEventListener("click", saveRoster);
  document.getElementById("exportBtn").addEventListener("click", adminGuard(exportBackup));
  document.getElementById("importBtn").addEventListener("click", adminGuard(() => importFile.click()));
  importFile.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (file) importBackup(file);
  });
  document.getElementById("resetBtn").addEventListener("click", adminGuard(resetChecklist));

  tasksEl.addEventListener("click", e => {
    const groupChooserName = e.target.closest("[data-manual-group-student]");
    if (groupChooserName){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked) return;

      autoPlaceManualGroupStudent(
        groupChooserName.dataset.manualGroupTask,
        groupChooserName.dataset.manualGroupStudent
      );
      return;
    }

    const groupCreatedName = e.target.closest("[data-remove-manual-group-student-task]");
    if (groupCreatedName){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked || groupCreatedName.getAttribute("aria-disabled") === "true") return;

      removeStudentFromManualGroup(
        groupCreatedName.dataset.removeManualGroupStudentTask,
        groupCreatedName.dataset.removeManualGroupStudentIndex,
        groupCreatedName.dataset.removeManualGroupStudent
      );
      return;
    }

    const groupDelete = e.target.closest("[data-undo-manual-group-task]");
    if (groupDelete){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked || groupDelete.disabled) return;

      undoManualGroup(
        groupDelete.dataset.undoManualGroupTask,
        groupDelete.dataset.undoManualGroupIndex
      );
      return;
    }

    const chooserName = e.target.closest("[data-manual-pair-student]");
    if (chooserName){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked) return;

      autoPlaceManualPairStudent(
        chooserName.dataset.manualPairTask,
        chooserName.dataset.manualPairStudent
      );
      return;
    }

    const manualName = e.target.closest("[data-remove-manual-pair-student-task]");
    if (manualName){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked || manualName.getAttribute("aria-disabled") === "true") return;

      removeStudentFromManualPair(
        manualName.dataset.removeManualPairStudentTask,
        manualName.dataset.removeManualPairStudentIndex,
        manualName.dataset.removeManualPairStudent
      );
      return;
    }

    const manualDelete = e.target.closest("[data-undo-manual-pair-task]");
    if (manualDelete){
      e.preventDefault();
      e.stopImmediatePropagation();
      if (tableLocked || manualDelete.disabled) return;

      undoManualPair(
        manualDelete.dataset.undoManualPairTask,
        manualDelete.dataset.undoManualPairIndex
      );
      return;
    }
  }, true);

  tasksEl.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;

    const groupChooserName = e.target.closest("[data-manual-group-student]");
    if (groupChooserName && !tableLocked){
      e.preventDefault();
      e.stopPropagation();
      autoPlaceManualGroupStudent(
        groupChooserName.dataset.manualGroupTask,
        groupChooserName.dataset.manualGroupStudent
      );
      return;
    }

    const groupCreatedName = e.target.closest("[data-remove-manual-group-student-task]");
    if (groupCreatedName && !tableLocked){
      e.preventDefault();
      e.stopPropagation();
      removeStudentFromManualGroup(
        groupCreatedName.dataset.removeManualGroupStudentTask,
        groupCreatedName.dataset.removeManualGroupStudentIndex,
        groupCreatedName.dataset.removeManualGroupStudent
      );
      return;
    }

    const chooserName = e.target.closest("[data-manual-pair-student]");
    if (chooserName && !tableLocked){
      e.preventDefault();
      e.stopPropagation();

      autoPlaceManualPairStudent(
        chooserName.dataset.manualPairTask,
        chooserName.dataset.manualPairStudent
      );
      return;
    }

    const manualName = e.target.closest("[data-remove-manual-pair-student-task]");
    if (!manualName || tableLocked) return;

    e.preventDefault();
    e.stopPropagation();

    removeStudentFromManualPair(
      manualName.dataset.removeManualPairStudentTask,
      manualName.dataset.removeManualPairStudentIndex,
      manualName.dataset.removeManualPairStudent
    );
  });

  tasksEl.addEventListener("click", e => {
    const dueInput = e.target.closest('input[type="date"][data-task-due]');
    if (!dueInput || tableLocked) return;

    // Some browsers open date inputs natively. showPicker() is used only when
    // available and does not prevent the normal click behaviour.
    if (typeof dueInput.showPicker === "function"){
      try{
        dueInput.showPicker();
      }catch(_){}
    }
  });

  tasksEl.addEventListener("change", e => {
    const collabGroupCheckbox = e.target.closest("[data-collab-group-task]");
    if (collabGroupCheckbox){
      if (tableLocked) return;

      const task = state.tasks.find(t => t.id === collabGroupCheckbox.dataset.collabGroupTask);
      if (!task) return;

      const sourceGroups =
        collabGroupCheckbox.dataset.collabGroupKind === "group"
          ? task.groupGroups
          : task.pairGroups;

      if (!Array.isArray(sourceGroups)) return;

      const groupIndex = Number(collabGroupCheckbox.dataset.collabGroupIndex);
      const group = sourceGroups[groupIndex];
      if (!Array.isArray(group) || !group.length) return;

      animateCheckbox(collabGroupCheckbox);

      const nowIso = new Date().toISOString();

      group.forEach(student => {
        if (isStudentAbsent(task, student)) return;

        const wasComplete = !!task.completed[student];
        task.completed[student] = collabGroupCheckbox.checked;

        if (collabGroupCheckbox.checked){
          if (!wasComplete){
            recordCompletionTick(task, student, nowIso);
          }
        } else {
          task.completedAt = task.completedAt || {};
          delete task.completedAt[student];
        }
      });

      saveState();

      if (collabGroupCheckbox.checked){
        const box = collabGroupCheckbox.closest(".group-task-block, .pair-task-block, .automatic-pair-row");
        if (box){
          finishCompletionCelebration(box);
          return;
        }
      }

      render();
      return;
    }

    const classDueSelect = e.target.closest("[data-class-due-mode]");
    if (classDueSelect){
      if (tableLocked) return;
      const task = state.tasks.find(t => t.id === classDueSelect.dataset.classDueMode);
      if (!task) return;
      setClassworkDueMode(task, classDueSelect.value);
      saveState();
      render();
      return;
    }

    const due = e.target.closest("[data-task-due]");
    if (due){
      const task = state.tasks.find(t => t.id === due.dataset.taskDue);
      if (!task) return;
      task.dueAt = due.value || "";
      if (studentTaskType(task) === "classwork"){
        task.classDueMode = "custom";
      }
      saveState();
      render();
      return;
    }

    const category = e.target.closest("[data-task-category]");
    if (category){
      const task = state.tasks.find(t => t.id === category.dataset.taskCategory);
      if (!task) return;
      task.category = category.value;
      saveState();
      render();
      return;
    }

    const cb = e.target.closest('input[type="checkbox"][data-task]');
    if (!cb) return;
    const task = state.tasks.find(t => t.id === cb.dataset.task);
    if (!task) return;

    const student = cb.dataset.student;
    if (isStudentAbsent(task, student)) return;
    animateCheckbox(cb);
    task.completed[student] = cb.checked;

    if (cb.checked){
      recordCompletionTick(task, student);
    } else {
      task.completedAt = task.completedAt || {};
      delete task.completedAt[student];
      // Keep completionHistory so every previous tick remains recorded.
    }

    saveState();

    if (cb.checked){
      const row = cb.closest(".student-row");
      if (row){
        finishCompletionCelebration(row);
        return;
      }
    }

    render();
  });

  tasksEl.addEventListener("keydown", e => {
    const emptyAdd = e.target.closest("[data-empty-add-audience]");
    if (!emptyAdd || (e.key !== "Enter" && e.key !== " ")) return;

    e.preventDefault();
    if (tableLocked) return;

    const audience = emptyAdd.dataset.emptyAddAudience === "teacher" ? "teacher" : "student";
    const studentType = emptyAdd.dataset.emptyAddStudentType;

    addTask(
      audience,
      audience === "student" ? studentType : null
    );
  });

  tasksEl.addEventListener("input", e => {
    const searchInput = e.target.closest("[data-task-search-input]");
    if (searchInput){
      applyTaskSearch(searchInput.dataset.taskSearchInput, searchInput.value);
      return;
    }

    const input = e.target.closest("[data-task-title]");
    if (!input) return;
    const task = state.tasks.find(t => t.id === input.dataset.taskTitle);
    if (!task || tableLocked) return;
    task.title = input.value;
    saveState();
    renderTable();
  });

  function applyTaskSearch(taskId, query){
    const q = String(query || "").trim().toLowerCase();

    const list = tasksEl.querySelector(`[data-task-student-list="${taskId}"]`);
    if (list){
      const rows = [...list.querySelectorAll(".student-row")];
      list.classList.toggle("search-active", !!q);

      rows.forEach(row => {
        const matches = !q || (row.dataset.searchName || "").includes(q);
        row.style.display = matches ? "" : "none";
      });
    }

    const collaborativeList =
      tasksEl.querySelector(`[data-task-collaborative-list="${taskId}"]`);

    if (collaborativeList){
      const rows = [
        ...collaborativeList.querySelectorAll(".automatic-pair-row"),
        ...collaborativeList.querySelectorAll(".group-task-block"),
        ...collaborativeList.querySelectorAll(".pair-task-block")
      ];

      rows.forEach(row => {
        const matches = !q || (row.dataset.searchName || "").includes(q);
        row.style.display = matches ? "" : "none";
      });

      // Hide an entire left/right table or collaborative column if none of its entries match.
      collaborativeList.querySelectorAll(".automatic-pair-table").forEach(table => {
        const visibleRows = [...table.querySelectorAll("tbody .automatic-pair-row")]
          .some(row => row.style.display !== "none");
        table.style.display = visibleRows ? "" : "none";
      });

      collaborativeList.querySelectorAll(".group-task-stack, .pair-task-stack").forEach(stack => {
        const visibleEntries = [...stack.querySelectorAll(".group-task-block, .pair-task-block")]
          .some(entry => entry.style.display !== "none");
        stack.style.display = visibleEntries ? "" : "none";
      });
    }
  }

  let draggedTaskId = null;
  let draggedManualPairTaskId = null;
  let draggedManualPairStudent = null;
  let draggedManualPairSourceIndex = null;
  let draggedManualPairFromCreated = false;
  let draggedManualGroupTaskId = null;
  let draggedManualGroupStudent = null;
  let draggedManualGroupSourceIndex = null;
  let draggedManualGroupFromCreated = false;

  tasksEl.addEventListener("dragstart", e => {
    if (tableLocked) return;

    const createdGroupStudent = e.target.closest("[data-manual-created-group-student-task]");
    if (createdGroupStudent){
      draggedManualGroupTaskId = createdGroupStudent.dataset.manualCreatedGroupStudentTask;
      draggedManualGroupStudent = createdGroupStudent.dataset.manualCreatedGroupStudent;
      draggedManualGroupSourceIndex = createdGroupStudent.dataset.manualCreatedGroupStudentIndex;
      draggedManualGroupFromCreated = true;
      createdGroupStudent.classList.add("dragging");

      if (e.dataTransfer){
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedManualGroupStudent);
      }
      return;
    }

    const chooserGroupStudent = e.target.closest("[data-manual-group-student]");
    if (chooserGroupStudent){
      draggedManualGroupTaskId = chooserGroupStudent.dataset.manualGroupTask;
      draggedManualGroupStudent = chooserGroupStudent.dataset.manualGroupStudent;
      draggedManualGroupSourceIndex = null;
      draggedManualGroupFromCreated = false;
      chooserGroupStudent.classList.add("dragging");

      if (e.dataTransfer){
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedManualGroupStudent);
      }
      return;
    }

    const createdStudent = e.target.closest("[data-manual-created-student-task]");
    if (createdStudent){
      draggedManualPairTaskId = createdStudent.dataset.manualCreatedStudentTask;
      draggedManualPairStudent = createdStudent.dataset.manualCreatedStudent;
      draggedManualPairSourceIndex = createdStudent.dataset.manualCreatedStudentIndex;
      draggedManualPairFromCreated = true;
      createdStudent.classList.add("dragging");

      if (e.dataTransfer){
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedManualPairStudent);
      }
      return;
    }

    const manualStudent = e.target.closest("[data-manual-pair-student]");
    if (manualStudent){
      draggedManualPairTaskId = manualStudent.dataset.manualPairTask;
      draggedManualPairStudent = manualStudent.dataset.manualPairStudent;
      draggedManualPairSourceIndex = null;
      draggedManualPairFromCreated = false;
      manualStudent.classList.add("dragging");

      if (e.dataTransfer){
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
          "application/x-y5-manual-pair",
          JSON.stringify({
            taskId: draggedManualPairTaskId,
            student: draggedManualPairStudent
          })
        );
        e.dataTransfer.setData("text/plain", draggedManualPairStudent);
      }
      return;
    }

    const card = e.target.closest("[data-task-card]");
    if (!card) return;

    draggedTaskId = card.dataset.taskCard;
    card.classList.add("dragging");

    if (e.dataTransfer){
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedTaskId);
    }
  });

  tasksEl.addEventListener("dragend", e => {
    const manualStudent = e.target.closest("[data-manual-pair-student]");
    if (manualStudent) manualStudent.classList.remove("dragging");

    const card = e.target.closest("[data-task-card]");
    if (card) card.classList.remove("dragging");

    draggedTaskId = null;
    draggedManualPairTaskId = null;
    draggedManualPairStudent = null;
    draggedManualPairSourceIndex = null;
    draggedManualPairFromCreated = false;
    draggedManualGroupTaskId = null;
    draggedManualGroupStudent = null;
    draggedManualGroupSourceIndex = null;
    draggedManualGroupFromCreated = false;

    tasksEl.querySelectorAll(".task-audience-tab.drag-target").forEach(tab => {
      tab.classList.remove("drag-target");
    });
    tasksEl.querySelectorAll(".pair-drop-target").forEach(el => {
      el.classList.remove("pair-drop-target");
    });
    tasksEl.querySelectorAll(".manual-pair-row-drop-target").forEach(el => {
      el.classList.remove("manual-pair-row-drop-target");
    });
    tasksEl.querySelectorAll(".manual-pair-pool-drop-target").forEach(el => {
      el.classList.remove("manual-pair-pool-drop-target");
    });
  });

  tasksEl.addEventListener("dragover", e => {
    if (tableLocked) return;

    if (draggedManualGroupStudent && draggedManualGroupTaskId){
      const targetGroupStudent = e.target.closest("[data-manual-group-student]");
      if (
        !draggedManualGroupFromCreated &&
        targetGroupStudent &&
        targetGroupStudent.dataset.manualGroupTask === draggedManualGroupTaskId &&
        targetGroupStudent.dataset.manualGroupStudent !== draggedManualGroupStudent
      ){
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

        tasksEl.querySelectorAll(".pair-drop-target").forEach(other => {
          if (other !== targetGroupStudent) other.classList.remove("pair-drop-target");
        });
        targetGroupStudent.classList.add("pair-drop-target");
        return;
      }

      const targetPool = e.target.closest("[data-manual-group-pool]");
      if (
        draggedManualGroupFromCreated &&
        targetPool &&
        targetPool.dataset.manualGroupPool === draggedManualGroupTaskId
      ){
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        targetPool.classList.add("manual-pair-pool-drop-target");
        return;
      }

      const targetRow = e.target.closest("[data-manual-group-row-task]");
      if (targetRow && targetRow.dataset.manualGroupRowTask === draggedManualGroupTaskId){
        const targetIndex = Number(targetRow.dataset.manualGroupRowIndex);
        if (
          draggedManualGroupFromCreated &&
          Number(draggedManualGroupSourceIndex) === targetIndex
        ) return;

        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        targetRow.classList.add("manual-pair-row-drop-target");
        return;
      }

      return;
    }

    if (draggedManualPairStudent && draggedManualPairTaskId){
      const targetPool = e.target.closest("[data-manual-pair-pool]");
      if (
        draggedManualPairFromCreated &&
        targetPool &&
        targetPool.dataset.manualPairPool === draggedManualPairTaskId
      ){
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        targetPool.classList.add("manual-pair-pool-drop-target");
        return;
      }

      const targetStudent = e.target.closest("[data-manual-pair-student]");
      if (
        targetStudent &&
        targetStudent.dataset.manualPairTask === draggedManualPairTaskId &&
        targetStudent.dataset.manualPairStudent !== draggedManualPairStudent
      ){
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

        tasksEl.querySelectorAll(".pair-drop-target").forEach(other => {
          if (other !== targetStudent) other.classList.remove("pair-drop-target");
        });
        targetStudent.classList.add("pair-drop-target");
        return;
      }

      const targetRow = e.target.closest("[data-manual-pair-row-task]");
      if (targetRow && targetRow.dataset.manualPairRowTask === draggedManualPairTaskId){
        const targetIndex = Number(targetRow.dataset.manualPairRowIndex);

        if (
          draggedManualPairFromCreated &&
          Number(draggedManualPairSourceIndex) === targetIndex
        ){
          return;
        }

        const task = state.tasks.find(t => t.id === draggedManualPairTaskId);
        const pair = task && Array.isArray(task.pairGroups)
          ? task.pairGroups[targetIndex]
          : null;

        if (Array.isArray(pair) && pair.length < 3){
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

          tasksEl.querySelectorAll(".manual-pair-row-drop-target").forEach(other => {
            if (other !== targetRow) other.classList.remove("manual-pair-row-drop-target");
          });
          targetRow.classList.add("manual-pair-row-drop-target");
          return;
        }
      }

      return;
    }

    const tab = e.target.closest("[data-task-audience-tab]");
    if (!tab || !draggedTaskId) return;

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

    tasksEl.querySelectorAll(".task-audience-tab.drag-target").forEach(other => {
      if (other !== tab) other.classList.remove("drag-target");
    });
    tab.classList.add("drag-target");
  });

  tasksEl.addEventListener("dragleave", e => {
    const tab = e.target.closest("[data-task-audience-tab]");
    if (!tab) return;

    const related = e.relatedTarget;
    if (!related || !tab.contains(related)){
      tab.classList.remove("drag-target");
    }
  });

  tasksEl.addEventListener("drop", e => {
    if (tableLocked) return;

    if (draggedManualGroupStudent && draggedManualGroupTaskId){
      const targetGroupStudent = e.target.closest("[data-manual-group-student]");
      if (
        !draggedManualGroupFromCreated &&
        targetGroupStudent &&
        targetGroupStudent.dataset.manualGroupTask === draggedManualGroupTaskId &&
        targetGroupStudent.dataset.manualGroupStudent !== draggedManualGroupStudent
      ){
        e.preventDefault();

        const sourceStudent = draggedManualGroupStudent;
        const taskId = draggedManualGroupTaskId;
        const targetStudent = targetGroupStudent.dataset.manualGroupStudent;

        draggedManualGroupTaskId = null;
        draggedManualGroupStudent = null;
        draggedManualGroupSourceIndex = null;
        draggedManualGroupFromCreated = false;

        createManualGroupSeed(taskId, sourceStudent, targetStudent);
        return;
      }

      const targetPool = e.target.closest("[data-manual-group-pool]");
      if (
        draggedManualGroupFromCreated &&
        targetPool &&
        targetPool.dataset.manualGroupPool === draggedManualGroupTaskId
      ){
        e.preventDefault();

        const student = draggedManualGroupStudent;
        const taskId = draggedManualGroupTaskId;
        const sourceIndex = draggedManualGroupSourceIndex;

        draggedManualGroupTaskId = null;
        draggedManualGroupStudent = null;
        draggedManualGroupSourceIndex = null;
        draggedManualGroupFromCreated = false;

        moveManualGroupStudent(taskId, sourceIndex, student, null);
        return;
      }

      const targetRow = e.target.closest("[data-manual-group-row-task]");
      if (targetRow && targetRow.dataset.manualGroupRowTask === draggedManualGroupTaskId){
        e.preventDefault();

        const student = draggedManualGroupStudent;
        const taskId = draggedManualGroupTaskId;
        const targetIndex = targetRow.dataset.manualGroupRowIndex;

        if (draggedManualGroupFromCreated){
          const sourceIndex = draggedManualGroupSourceIndex;

          draggedManualGroupTaskId = null;
          draggedManualGroupStudent = null;
          draggedManualGroupSourceIndex = null;
          draggedManualGroupFromCreated = false;

          moveManualGroupStudent(taskId, sourceIndex, student, targetIndex);
        } else {
          draggedManualGroupTaskId = null;
          draggedManualGroupStudent = null;
          addManualStudentToGroup(taskId, student, targetIndex);
        }
        return;
      }

      return;
    }

    if (draggedManualPairStudent && draggedManualPairTaskId){
      const targetPool = e.target.closest("[data-manual-pair-pool]");
      if (
        draggedManualPairFromCreated &&
        targetPool &&
        targetPool.dataset.manualPairPool === draggedManualPairTaskId
      ){
        e.preventDefault();

        const student = draggedManualPairStudent;
        const taskId = draggedManualPairTaskId;
        const sourceIndex = draggedManualPairSourceIndex;

        draggedManualPairStudent = null;
        draggedManualPairTaskId = null;
        draggedManualPairSourceIndex = null;
        draggedManualPairFromCreated = false;

        moveManualPairStudent(taskId, sourceIndex, student, null);
        return;
      }

      const targetStudent = e.target.closest("[data-manual-pair-student]");
      if (
        !draggedManualPairFromCreated &&
        targetStudent &&
        targetStudent.dataset.manualPairTask === draggedManualPairTaskId &&
        targetStudent.dataset.manualPairStudent !== draggedManualPairStudent
      ){
        e.preventDefault();
        const sourceStudent = draggedManualPairStudent;
        const taskId = draggedManualPairTaskId;
        const targetName = targetStudent.dataset.manualPairStudent;

        draggedManualPairStudent = null;
        draggedManualPairTaskId = null;
        createManualPair(taskId, sourceStudent, targetName);
        return;
      }

      const targetRow = e.target.closest("[data-manual-pair-row-task]");
      if (targetRow && targetRow.dataset.manualPairRowTask === draggedManualPairTaskId){
        e.preventDefault();

        const student = draggedManualPairStudent;
        const taskId = draggedManualPairTaskId;
        const pairIndex = targetRow.dataset.manualPairRowIndex;

        if (draggedManualPairFromCreated){
          const sourceIndex = draggedManualPairSourceIndex;

          draggedManualPairStudent = null;
          draggedManualPairTaskId = null;
          draggedManualPairSourceIndex = null;
          draggedManualPairFromCreated = false;

          moveManualPairStudent(taskId, sourceIndex, student, pairIndex);
        } else {
          draggedManualPairStudent = null;
          draggedManualPairTaskId = null;
          addManualStudentToPair(taskId, student, pairIndex);
        }
        return;
      }

      return;
    }

    const tab = e.target.closest("[data-task-audience-tab]");
    if (!tab) return;

    e.preventDefault();
    tab.classList.remove("drag-target");

    const taskId =
      draggedTaskId ||
      (e.dataTransfer ? e.dataTransfer.getData("text/plain") : "");

    if (!taskId) return;

    const audience =
      tab.dataset.taskAudienceTab === "teacher" ? "teacher" : "student";

    draggedTaskId = null;
    moveTaskByDrop(taskId, audience);
  });


  let floatingTimerRemaining = 5 * 60;
  let floatingTimerInitial = 5 * 60;
  let floatingTimerRunning = false;
  let floatingTimerInterval = null;
  let floatingTimerSettingsVisible = true;

  function formatTimerSeconds(totalSeconds){
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }

  function formatTimerScaleValue(totalSeconds){
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (seconds < 60) return `${seconds} sec`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs ? `${mins} min ${secs} sec` : `${mins} min`;
  }

  function fitFloatingTimerText(){
    if (!floatingTimerPanel || floatingTimerPanel.hidden) return;

    const rect = floatingTimerPanel.getBoundingClientRect();
    const displayOnly = floatingTimerPanel.classList.contains("display-only");

    if (displayOnly){
      const byHeight = rect.height * .72;
      const byWidth = rect.width / 4.5;
      const fontSize = Math.max(28, Math.min(byHeight, byWidth));
      floatingTimerDisplay.style.fontSize = `${fontSize}px`;
    } else {
      floatingTimerDisplay.style.fontSize = "";
    }
  }

  function setTimerSettingsVisible(visible){
    floatingTimerSettingsVisible = !!visible;
    floatingTimerPanel.classList.toggle("display-only", !floatingTimerSettingsVisible);

    if (floatingTimerSettingsVisible){
      // Give the settings panel enough room again without changing its screen position.
      const rect = floatingTimerPanel.getBoundingClientRect();
      if (rect.height < 220) floatingTimerPanel.style.height = "240px";
      if (rect.width < 240) floatingTimerPanel.style.width = "330px";
    }

    floatingTimerDisplayOnlyBtn.hidden = !(floatingTimerRunning && floatingTimerSettingsVisible);
    requestAnimationFrame(fitFloatingTimerText);
  }

  function renderFloatingTimer(){
    floatingTimerDisplay.textContent = formatTimerSeconds(floatingTimerRemaining);
    floatingTimerStartBtn.textContent = floatingTimerRunning ? "Pause" : "Start";
    floatingTimerDisplayOnlyBtn.hidden = !(floatingTimerRunning && floatingTimerSettingsVisible);
    floatingTimerPanel.classList.toggle("finished", floatingTimerRemaining === 0);
    floatingTimerRange.value = String(Math.max(
      Number(floatingTimerRange.min),
      Math.min(Number(floatingTimerRange.max), floatingTimerInitial)
    ));
    floatingTimerScaleValue.textContent = formatTimerScaleValue(floatingTimerInitial);

    document.title = floatingTimerRunning
      ? `${formatTimerSeconds(floatingTimerRemaining)} · Y5A Tasks`
      : "Y5A Tasks";

    requestAnimationFrame(fitFloatingTimerText);
  }

  function stopFloatingTimer(){
    floatingTimerRunning = false;
    if (floatingTimerInterval){
      clearInterval(floatingTimerInterval);
      floatingTimerInterval = null;
    }
    renderFloatingTimer();
  }

  function startFloatingTimer(){
    if (floatingTimerRemaining <= 0){
      floatingTimerRemaining = floatingTimerInitial || 300;
    }

    floatingTimerRunning = true;
    if (floatingTimerInterval) clearInterval(floatingTimerInterval);

    // As soon as the countdown starts, switch to the clean student-display mode.
    setTimerSettingsVisible(false);

    floatingTimerInterval = setInterval(() => {
      floatingTimerRemaining = Math.max(0, floatingTimerRemaining - 1);

      if (floatingTimerRemaining <= 0){
        stopFloatingTimer();
        return;
      }

      renderFloatingTimer();
    }, 1000);

    renderFloatingTimer();
  }

  function setFloatingTimer(totalSeconds){
    stopFloatingTimer();

    const min = Number(floatingTimerRange.min) || 30;
    const max = Number(floatingTimerRange.max) || 3600;
    const next = Math.max(min, Math.min(max, Math.floor(Number(totalSeconds) || 300)));

    floatingTimerInitial = next;
    floatingTimerRemaining = next;
    floatingTimerRange.value = String(next);
    floatingTimerScaleValue.textContent = formatTimerScaleValue(next);

    renderFloatingTimer();
  }

  floatingTimerLauncher.addEventListener("click", () => {
    floatingTimerPanel.hidden = !floatingTimerPanel.hidden;

    if (!floatingTimerPanel.hidden){
      if (!floatingTimerPanel.dataset.positioned){
        floatingTimerPanel.style.left = `${Math.max(12, Math.round((window.innerWidth - 330) / 2))}px`;
        floatingTimerPanel.style.top = `${Math.max(12, Math.round((window.innerHeight - 240) / 2))}px`;
        floatingTimerPanel.style.right = "auto";
        floatingTimerPanel.style.bottom = "auto";
        floatingTimerPanel.dataset.positioned = "true";
      }
      if (!floatingTimerRunning) setTimerSettingsVisible(true);
      renderFloatingTimer();
    }
  });

  floatingTimerDisplayOnlyBtn.addEventListener("click", () => {
    if (!floatingTimerRunning) return;
    setTimerSettingsVisible(false);
  });

  floatingTimerCloseBtn.addEventListener("click", () => {
    floatingTimerPanel.hidden = true;
  });

  floatingTimerRevealBtn.addEventListener("click", e => {
    e.stopPropagation();
    setTimerSettingsVisible(true);
  });

  floatingTimerStartBtn.addEventListener("click", () => {
    if (floatingTimerRunning){
      stopFloatingTimer();
    } else {
      startFloatingTimer();
    }
  });

  floatingTimerResetBtn.addEventListener("click", () => {
    stopFloatingTimer();
    floatingTimerRemaining = floatingTimerInitial;
    renderFloatingTimer();
  });

  floatingTimerRange.addEventListener("input", () => {
    const next = Number(floatingTimerRange.value) || 300;
    floatingTimerScaleValue.textContent = formatTimerScaleValue(next);

    // While choosing the time, preview the selected value live.
    if (!floatingTimerRunning){
      floatingTimerInitial = next;
      floatingTimerRemaining = next;
      renderFloatingTimer();
    }
  });

  // Drag from either the settings header or directly from the timer display.
  let timerDragState = null;

  function beginFloatingTimerDrag(e){
    if (e.target.closest("button,input")) return;

    const rect = floatingTimerPanel.getBoundingClientRect();
    timerDragState = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function moveFloatingTimerDrag(e){
    if (!timerDragState) return;

    const rect = floatingTimerPanel.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);

    const left = Math.min(maxLeft, Math.max(0, e.clientX - timerDragState.offsetX));
    const top = Math.min(maxTop, Math.max(0, e.clientY - timerDragState.offsetY));

    floatingTimerPanel.style.left = `${left}px`;
    floatingTimerPanel.style.top = `${top}px`;
    floatingTimerPanel.style.right = "auto";
    floatingTimerPanel.style.bottom = "auto";
  }

  function endFloatingTimerDrag(){
    timerDragState = null;
  }

  [floatingTimerDragHandle, floatingTimerDisplay].forEach(handle => {
    handle.addEventListener("pointerdown", beginFloatingTimerDrag);
    handle.addEventListener("pointermove", moveFloatingTimerDrag);
    handle.addEventListener("pointerup", endFloatingTimerDrag);
    handle.addEventListener("pointercancel", endFloatingTimerDrag);
  });

  // Keep the digits proportional as the user freely resizes the timer.
  if ("ResizeObserver" in window){
    const floatingTimerResizeObserver = new ResizeObserver(() => {
      fitFloatingTimerText();
    });
    floatingTimerResizeObserver.observe(floatingTimerPanel);
  } else {
    window.addEventListener("resize", fitFloatingTimerText);
  }

  renderFloatingTimer();

  function toggleAttentionPanel(){
    state.settings.attentionCollapsed = !state.settings.attentionCollapsed;
    saveState();
    updateAttentionPanelUI();
  }

  attentionToggleBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    toggleAttentionPanel();
  });

  attentionSummaryPanel.addEventListener("click", e => {
    // Student chips keep opening student details instead of collapsing the panel.
    if (e.target.closest("[data-student-name]")) return;

    // The dedicated +/- button has its own handler above.
    if (e.target.closest("#attentionToggleBtn")) return;

    toggleAttentionPanel();
  });

  attentionList.addEventListener("click", e => {
    const studentName = e.target.closest("[data-student-name]");
    if (studentName){
      e.preventDefault();
      e.stopPropagation();
      openStudentDetail(studentName.dataset.studentName);
    }
  });

  tasksEl.addEventListener("click", e => {
    const unfinishedToggle = e.target.closest("[data-toggle-unfinished-only]");
    if (unfinishedToggle){
      e.preventDefault();
      e.stopPropagation();
      showUnfinishedOnly = !showUnfinishedOnly;
      render();
      return;
    }

    const sortTrigger = e.target.closest(".sort-dropdown-trigger");
    if (sortTrigger){
      e.preventDefault();
      e.stopPropagation();
      const wrap = sortTrigger.closest(".sort-dropdown-wrap");
      document.querySelectorAll(".sort-dropdown-wrap.open").forEach(el => {
        if (el !== wrap) el.classList.remove("open");
      });
      wrap.classList.toggle("open");
      return;
    }

    const archiveTaskBtn = e.target.closest("[data-archive-task]");
    if (archiveTaskBtn){
      e.preventDefault();
      e.stopPropagation();
      if (archiveTaskBtn.disabled || tableLocked) return;
      archiveTask(archiveTaskBtn.dataset.archiveTask);
      return;
    }

    const collapsedTaskCard = e.target.closest(".task-card.collapsed[data-task-card]");
    if (collapsedTaskCard){
      e.preventDefault();
      e.stopPropagation();

      const task = state.tasks.find(t => t.id === collapsedTaskCard.dataset.taskCard);
      if (task && task.collapsed){
        task.collapsed = false;
        saveState();
        render();
      }
      return;
    }

    const emptyAdd = e.target.closest("[data-empty-add-audience]");
    if (emptyAdd){
      if (tableLocked) return;
      const audience = emptyAdd.dataset.emptyAddAudience === "teacher" ? "teacher" : "student";
      const studentType = emptyAdd.dataset.emptyAddStudentType;
      return addTask(
        audience,
        audience === "student" ? studentType : null
      );
    }

    const audienceTab = e.target.closest("[data-task-audience-tab]");
    if (audienceTab){
      activeTaskAudience = audienceTab.dataset.taskAudienceTab === "teacher" ? "teacher" : "student";
      render();
      return;
    }

    const taskSortBtn = e.target.closest("[data-task-sort]");
    if (taskSortBtn){
      const nextSort = taskSortBtn.dataset.taskSort;
      if (["date-added","alphabetical","due-date"].includes(nextSort)){
        activeTaskSort = nextSort;
        document.querySelectorAll(".sort-dropdown-wrap.open").forEach(el => el.classList.remove("open"));
        render();
      }
      return;
    }

    const studentFilterTab = e.target.closest("[data-student-task-filter]");
    if (studentFilterTab){
      const nextFilter = studentFilterTab.dataset.studentTaskFilter;
      activeStudentTaskFilter =
        nextFilter === "classwork" || nextFilter === "homework" ? nextFilter : "all";
      render();
      return;
    }

    const addStudentSubtaskBtn = e.target.closest("[data-add-student-subtask]");
    if (addStudentSubtaskBtn){
      if (addStudentSubtaskBtn.disabled || tableLocked) return;
      return addTask("student", addStudentSubtaskBtn.dataset.addStudentSubtask);
    }

    const addCurrentTaskBtn = e.target.closest("[data-add-current-task]");
    if (addCurrentTaskBtn){
      if (addCurrentTaskBtn.disabled || tableLocked) return;
      return addTask(addCurrentTaskBtn.dataset.addCurrentTask);
    }

    const collaborativeStudentName = e.target.closest("[data-collab-student-task]");
    if (collaborativeStudentName){
      e.preventDefault();
      e.stopPropagation();
      if (tableLocked) return;

      return toggleCollaborativeStudent(
        collaborativeStudentName.dataset.collabStudentTask,
        collaborativeStudentName.dataset.collabStudent,
        collaborativeStudentName
      );
    }

    const automaticPairRow = e.target.closest(".automatic-pair-row");
    if (automaticPairRow){
      // Shared Pair/Group completion can only be changed by clicking
      // the actual checkbox. Clicking the rest of the row does nothing.
      if (e.target.closest('input[type="checkbox"]')) return;

      return;
    }

    // Only the actual student-name text opens the details popup.
    // Clicking anywhere else in a standard student row should behave like a normal checkbox label.
    if (e.target.classList && e.target.classList.contains("student-name")){
      e.preventDefault();
      e.stopPropagation();
      return openStudentDetail(e.target.dataset.studentName);
    }

    const workModeBtn = e.target.closest("[data-set-work-mode]");
    if (workModeBtn){
      e.preventDefault();
      e.stopPropagation();
      if (workModeBtn.disabled || tableLocked) return;
      return setTaskWorkMode(
        workModeBtn.dataset.setWorkMode,
        workModeBtn.dataset.workMode
      );
    }

    const finishManualPairBtn = e.target.closest("[data-finish-manual-pairing]");
    if (finishManualPairBtn){
      e.preventDefault();
      e.stopPropagation();
      if (finishManualPairBtn.disabled || tableLocked) return;
      return finishManualPairing(finishManualPairBtn.dataset.finishManualPairing);
    }

    const pairSelectionBtn = e.target.closest("[data-set-pair-selection]");
    if (pairSelectionBtn){
      e.preventDefault();
      e.stopPropagation();
      if (pairSelectionBtn.disabled || tableLocked) return;
      return setPairSelectionMode(
        pairSelectionBtn.dataset.setPairSelection,
        pairSelectionBtn.dataset.pairSelection
      );
    }

    const attendanceStudentBtn = e.target.closest("[data-pair-attendance-task]");
    if (attendanceStudentBtn){
      e.preventDefault();
      e.stopPropagation();
      if (attendanceStudentBtn.disabled || tableLocked) return;
      return toggleStudentAbsent(
        attendanceStudentBtn.dataset.pairAttendanceTask,
        attendanceStudentBtn.dataset.pairAttendanceStudent
      );
    }

    const attendanceNextBtn = e.target.closest("[data-pair-attendance-next]");
    if (attendanceNextBtn){
      e.preventDefault();
      e.stopPropagation();
      if (attendanceNextBtn.disabled || tableLocked) return;
      return completeAutomaticPairAttendance(attendanceNextBtn.dataset.pairAttendanceNext);
    }

    const groupSelectionBtn = e.target.closest("[data-set-group-selection]");
    if (groupSelectionBtn){
      e.preventDefault();
      e.stopPropagation();
      if (groupSelectionBtn.disabled || tableLocked) return;
      return setGroupSelectionMode(
        groupSelectionBtn.dataset.setGroupSelection,
        groupSelectionBtn.dataset.groupSelection
      );
    }

    const finishManualGroupBtn = e.target.closest("[data-finish-manual-grouping]");
    if (finishManualGroupBtn){
      e.preventDefault();
      e.stopPropagation();
      if (finishManualGroupBtn.disabled || tableLocked) return;
      return finishManualGrouping(finishManualGroupBtn.dataset.finishManualGrouping);
    }

    const groupAttendanceStudentBtn = e.target.closest("[data-group-attendance-task]");
    if (groupAttendanceStudentBtn){
      e.preventDefault();
      e.stopPropagation();
      if (groupAttendanceStudentBtn.disabled || tableLocked) return;
      return toggleStudentAbsent(
        groupAttendanceStudentBtn.dataset.groupAttendanceTask,
        groupAttendanceStudentBtn.dataset.groupAttendanceStudent
      );
    }

    const groupAttendanceNextBtn = e.target.closest("[data-group-attendance-next]");
    if (groupAttendanceNextBtn){
      e.preventDefault();
      e.stopPropagation();
      if (groupAttendanceNextBtn.disabled || tableLocked) return;
      return completeGroupAttendance(groupAttendanceNextBtn.dataset.groupAttendanceNext);
    }

    const groupSizeBtn = e.target.closest("[data-set-group-size]");
    if (groupSizeBtn){
      e.preventDefault();
      e.stopPropagation();
      if (groupSizeBtn.disabled || tableLocked) return;
      return setGroupSize(
        groupSizeBtn.dataset.setGroupSize,
        groupSizeBtn.dataset.groupSize
      );
    }

    const resetWorkModeBtn = e.target.closest("[data-reset-work-mode]");
    if (resetWorkModeBtn){
      e.preventDefault();
      e.stopPropagation();
      if (resetWorkModeBtn.disabled || tableLocked) return;
      return resetTaskWorkMode(resetWorkModeBtn.dataset.resetWorkMode);
    }

    const studentTypeBtn = e.target.closest("[data-toggle-student-task-type]");
    if (studentTypeBtn){
      e.preventDefault();
      e.stopPropagation();
      if (studentTypeBtn.disabled || tableLocked) return;
      return toggleStudentTaskType(studentTypeBtn.dataset.toggleStudentTaskType);
    }

    const moveMenuBtn = e.target.closest("[data-toggle-move-menu]");
    if (moveMenuBtn){
      e.preventDefault();
      e.stopPropagation();
      if (moveMenuBtn.disabled || tableLocked) return;

      const taskId = moveMenuBtn.dataset.toggleMoveMenu;
      const menu = tasksEl.querySelector(`[data-move-menu="${taskId}"]`);
      if (!menu) return;

      const opening = menu.hidden;
      tasksEl.querySelectorAll("[data-move-menu]").forEach(otherMenu => {
        otherMenu.hidden = true;
      });
      tasksEl.querySelectorAll("[data-toggle-move-menu]").forEach(btn => {
        btn.setAttribute("aria-expanded", "false");
      });

      menu.hidden = !opening;
      moveMenuBtn.setAttribute("aria-expanded", opening ? "true" : "false");
      return;
    }

    const destinationBtn = e.target.closest("[data-set-task-destination]");
    if (destinationBtn){
      e.preventDefault();
      e.stopPropagation();
      if (destinationBtn.disabled || tableLocked) return;

      return setTaskDestination(
        destinationBtn.dataset.setTaskDestination,
        destinationBtn.dataset.taskDestination
      );
    }

    const noteBtn = e.target.closest("[data-note-task]");
    if (noteBtn){
      e.preventDefault();
      e.stopPropagation();
      if (noteBtn.disabled || tableLocked) return;
      return openStudentNote(
        noteBtn.dataset.noteTask,
        noteBtn.dataset.noteStudent
      );
    }

    const absentBtn = e.target.closest("[data-absent-task]");
    if (absentBtn){
      e.preventDefault();
      e.stopPropagation();
      if (absentBtn.disabled || tableLocked) return;
      return toggleStudentAbsent(
        absentBtn.dataset.absentTask,
        absentBtn.dataset.absentStudent
      );
    }


    const clearSearch = e.target.closest("[data-clear-task-search]");
    if (clearSearch){
      const taskId = clearSearch.dataset.clearTaskSearch;
      const input = tasksEl.querySelector(`[data-task-search-input="${taskId}"]`);
      if (input) input.value = "";
      applyTaskSearch(taskId, "");
      if (input) input.focus();
      return;
    }

    const toggle = e.target.closest("[data-toggle-task]");
    if (toggle) return toggleTask(toggle.dataset.toggleTask);

    const setupDel = e.target.closest("[data-delete-setup-task]");
    if (setupDel){
      e.preventDefault();
      e.stopPropagation();
      if (setupDel.disabled || tableLocked) return;
      return deleteSetupTask(setupDel.dataset.deleteSetupTask);
    }

    const archiveMenuAction = e.target.closest("[data-archive-task-menu]");
    if (archiveMenuAction){
      e.preventDefault();
      e.stopPropagation();
      if (archiveMenuAction.disabled || tableLocked) return;
      return archiveTask(archiveMenuAction.dataset.archiveTaskMenu);
    }

    const del = e.target.closest("[data-delete-task]");
    if (del){
      e.preventDefault();
      e.stopPropagation();
      if (del.disabled || tableLocked) return;
      return deleteTask(del.dataset.deleteTask);
    }

    const overdueAction = e.target.closest("[data-toggle-task-overdue]");
    if (overdueAction){
      e.preventDefault();
      e.stopPropagation();
      if (overdueAction.disabled || tableLocked) return;
      return toggleTaskOverdue(overdueAction.dataset.toggleTaskOverdue);
    }

    const completionAction = e.target.closest("[data-set-task-completion]");
    if (completionAction){
      e.preventDefault();
      e.stopPropagation();
      if (completionAction.disabled || tableLocked) return;
      return setTaskCompletion(
        completionAction.dataset.setTaskCompletion,
        completionAction.dataset.taskCompletionValue
      );
    }
  });

  document.addEventListener("click", e => {
    if (e.target.closest(".task-move-menu-wrap")) return;

    tasksEl.querySelectorAll("[data-move-menu]").forEach(menu => {
      menu.hidden = true;
    });
    tasksEl.querySelectorAll("[data-toggle-move-menu]").forEach(btn => {
      btn.setAttribute("aria-expanded", "false");
    });
  });

  tableTaskFilters.addEventListener("click", e => {
    const btn = e.target.closest("[data-table-task-filter]");
    if (!btn) return;

    const filter = btn.dataset.tableTaskFilter;
    if (!["all", "classwork", "homework"].includes(filter)) return;

    activeTableTaskFilter = filter;
    renderTable();
  });

  tableView.addEventListener("change", e => {
    if (tableLocked) return;

    const cb = e.target.closest('input[type="checkbox"][data-table-task]');
    if (!cb) return;
    const task = state.tasks.find(t => t.id === cb.dataset.tableTask);
    if (!task) return;

    const student = cb.dataset.tableStudent;
    animateCheckbox(cb);
    task.completed[student] = cb.checked;

    if (cb.checked){
      recordCompletionTick(task, student);
    } else {
      task.completedAt = task.completedAt || {};
      delete task.completedAt[student];
      // Keep completionHistory so every previous tick remains recorded.
    }

    saveState();

    if (cb.checked){
      const cell = cb.closest("td") || cb.closest("tr");
      if (cell){
        finishCompletionCelebration(cell);
        return;
      }
    }

    render();
  });

  tableView.addEventListener("click", e => {
    if (e.target.classList && e.target.classList.contains("student-name")){
      openStudentDetail(e.target.dataset.studentName);
    }
  });

  document.getElementById("closeStudentDetailBtn").addEventListener("click", () => {
    studentDetailDialog.close();
  });

  studentDetailDialog.addEventListener("click", e => {
    if (e.target === studentDetailDialog) studentDetailDialog.close();
  });

  studentNoteForm.addEventListener("submit", e => {
    e.preventDefault();
    saveStudentNote();
  });

  document.getElementById("clearStudentNoteBtn").addEventListener("click", clearStudentNote);

  document.getElementById("cancelStudentNoteBtn").addEventListener("click", () => {
    activeNoteTarget = null;
    studentNoteDialog.close();
  });

  studentNoteDialog.addEventListener("click", e => {
    if (e.target === studentNoteDialog){
      activeNoteTarget = null;
      studentNoteDialog.close();
    }
  });

  dataTransferDialog.addEventListener("click", e => {
    if (e.target === dataTransferDialog) dataTransferDialog.close();
  });

  function updateTableLockUI(){
    tablePanel.classList.toggle("table-locked", tableLocked);
    document.body.classList.toggle("locked-mode", tableLocked);
    lockTableBtn.textContent = tableLocked ? "🔒" : "🔓";
    lockTableBtn.title = tableLocked ? "Unlock mode" : "Lock mode";
    lockTableBtn.setAttribute("aria-label", tableLocked ? "Unlock mode" : "Lock mode");
    lockTableBtn.title = tableLocked
      ? "Enter password to exit Locked Mode"
      : "Enter Locked Mode";

    if (tableLocked){
      setAdminPanel(false);
      if (changePasswordDialog && changePasswordDialog.open) changePasswordDialog.close();
      if (jsonSetupDialog && jsonSetupDialog.open) jsonSetupDialog.close();
      if (browserStorageNoticeDialog && browserStorageNoticeDialog.open) browserStorageNoticeDialog.close();
    }

    // Locked Mode is view-only. Navigation/view controls remain usable,
    // but controls that can change stored checklist/history/settings data are disabled.
    adminToggleBtn.disabled = tableLocked;
    versionHistoryBtn.disabled = tableLocked;
    clearHistoryBtn.disabled = tableLocked;
    if (connectJsonFileBtn) connectJsonFileBtn.disabled = tableLocked;
    if (saveJsonNowBtn) saveJsonNowBtn.disabled = tableLocked || !jsonFileHandle;
    if (disconnectJsonFileBtn) disconnectJsonFileBtn.disabled = tableLocked || !jsonFileHandle;

    updateTeacherControls();
    if (archiveDialog && archiveDialog.open){
      renderArchive();
    }
    if (historyDialog && historyDialog.open){
      renderVersionHistory();
    }
  }

  function openUnlockDialog(action){
    pendingUnlockAction = action;
    unlockPassword.value = "";
    unlockError.textContent = "";

    if (action === "admin"){
      unlockDialogTitle.textContent = "Unlock Settings";
      unlockDialogText.textContent = "Enter the password to unlock the table and open Settings.";
    } else {
      unlockDialogTitle.textContent = "Exit Locked Mode";
      unlockDialogText.textContent = "Enter the password to exit Locked Mode and re-enable teacher controls.";
    }

    unlockDialog.showModal();
    requestAnimationFrame(() => unlockPassword.focus());
  }

  function finishUnlock(){
    tableLocked = false;
    updateTableLockUI();
    render();

    const action = pendingUnlockAction;
    pendingUnlockAction = null;
    unlockDialog.close();

    if (action === "admin"){
      setAdminPanel(true);
    }
  }

  function toggleTableLock(){
    if (!tableLocked){
      tableLocked = true;
      updateTableLockUI();
      render();
      return;
    }

    openUnlockDialog("table");
  }

  versionHistoryBtn.addEventListener("click", () => {
    if (tableLocked) return;
    openVersionHistory();
  });

  closeHistoryBtn.addEventListener("click", () => {
    historyDialog.close();
  });

  clearHistoryBtn.addEventListener("click", clearVersionHistory);

  historyDialog.addEventListener("click", e => {
    const restoreBtn = e.target.closest("[data-restore-history-entry]");
    if (restoreBtn){
      e.preventDefault();
      e.stopPropagation();
      if (restoreBtn.disabled || tableLocked) return;
      restoreVersionHistoryEntry(restoreBtn.dataset.restoreHistoryEntry);
      return;
    }

    if (e.target === historyDialog){
      historyDialog.close();
    }
  });

  archiveBtn.addEventListener("click", openArchive);

  closeArchiveBtn.addEventListener("click", () => {
    closeArchiveSortMenu();
    archiveDialog.close();
  });

  archiveDialog.addEventListener("click", e => {
    const sortTrigger = e.target.closest("#archiveSortTrigger");
    if (sortTrigger){
      e.preventDefault();
      e.stopPropagation();

      const opening = !archiveSortDropdown.classList.contains("open");
      archiveSortDropdown.classList.toggle("open", opening);
      archiveSortTrigger.setAttribute("aria-expanded", opening ? "true" : "false");
      return;
    }

    const sortBtn = e.target.closest("[data-archive-sort]");
    if (sortBtn){
      e.preventDefault();
      e.stopPropagation();
      activeArchiveSort = sortBtn.dataset.archiveSort;
      closeArchiveSortMenu();
      renderArchive();
      return;
    }

    if (!e.target.closest("#archiveSortDropdown")){
      closeArchiveSortMenu();
    }

    const restoreBtn = e.target.closest("[data-restore-archive-task]");
    if (restoreBtn){
      e.preventDefault();
      e.stopPropagation();
      if (restoreBtn.disabled || tableLocked) return;
      restoreArchivedTask(restoreBtn.dataset.restoreArchiveTask);
      return;
    }

    if (e.target === archiveDialog){
      closeArchiveSortMenu();
      archiveDialog.close();
    }
  });

  openTasksPageBtn.addEventListener("click", () => navigateTo("tasks"));
  openGamesPageBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  openToolsPageBtn.addEventListener("click", () => { window.location.href = "tools/index.html"; });
  openWordlePageBtn.addEventListener("click", () => { window.location.href = "games/wordle.html"; });
  openSentenceGuessPageBtn.addEventListener("click", () => { window.location.href = "games/sentence-guess.html"; });
  openSpinWheelPageBtn.addEventListener("click", () => { window.location.href = "games/spin-wheel.html"; });
  openSharkWordPageBtn.addEventListener("click", () => { window.location.href = "games/shark-word-quest.html"; });
  openHotseatPageBtn.addEventListener("click", () => { window.location.href = "games/hotseat.html"; });
  function filterGames(){
    const query = gameSearchInput.value.trim().toLocaleLowerCase();
    let visible = 0;
    gamesGrid.querySelectorAll("[data-game-card]").forEach(card => {
      const matches = !query || card.dataset.gameSearch.includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    gamesSearchEmpty.hidden = visible !== 0;
  }
  function setGamesView(view){
    const isList = view === "list";
    gamesGrid.classList.toggle("list-view", isList);
    gamesGridViewBtn.classList.toggle("is-active", !isList);
    gamesListViewBtn.classList.toggle("is-active", isList);
    gamesGridViewBtn.setAttribute("aria-pressed", String(!isList));
    gamesListViewBtn.setAttribute("aria-pressed", String(isList));
  }
  gameSearchInput.addEventListener("input", filterGames);
  clearGameSearchBtn.addEventListener("click", () => {
    gameSearchInput.value = "";
    filterGames();
    gameSearchInput.focus();
  });
  gamesGridViewBtn.addEventListener("click", () => setGamesView("grid"));
  gamesListViewBtn.addEventListener("click", () => setGamesView("list"));
  backToMainBtn.addEventListener("click", () => navigateTo("main"));
  gamesBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  toolsBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  wordleBackToGamesBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  wordleBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  sentenceGuessBackToGamesBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  sentenceGuessBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  spinWheelBackToGamesBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  spinWheelBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  sharkWordBackToGamesBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  sharkWordBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  sharkWordNewGameBtn.addEventListener("click", startSharkWordGame);
  sharkWordRevealBtn.addEventListener("click", () => {
    if (sharkWordFinished) return;
    sharkWordFinished = true;
    setSharkWordMessage(`The word was ${sharkWordAnswer}.`, "warning");
    renderSharkWord();
  });
  importSharkWordGroupBtn.addEventListener("click", () => {
    const group = wordGroups.find(item => item.id === sharkWordGroupSelect.value);
    const words = (group?.words || []).map(entry => normalizeWordEntry(entry).word.toUpperCase()).filter(Boolean);
    if (!words.length){
      setSharkWordMessage("This word list is empty. Add words to it first.", "warning");
      return;
    }
    sharkWordSourceWords = [...new Set(words)];
    profileSet(SHARK_WORD_SOURCE_KEY, JSON.stringify(sharkWordSourceWords));
    sharkWordAnswer = "";
    startSharkWordGame();
    setSharkWordMessage(`${sharkWordSourceWords.length} words imported from ${group.name}.`, "success");
  });
  sharkWordKeyboard.addEventListener("click", event => {
    const key = event.target.closest("[data-shark-word-key]");
    if (key) guessSharkWordLetter(key.dataset.sharkWordKey);
  });
  hotseatBackToGamesBtn.addEventListener("click", () => { window.location.href = "games/index.html"; });
  hotseatBackToMainBtn.addEventListener("click", () => navigateTo("main"));
  hotseatStartBtn.addEventListener("click", startHotseat);
  hotseatNextBtn.addEventListener("click", nextHotseatWord);
  hotseatRestartBtn.addEventListener("click", () => renderHotseatGroups());
  hotseatShowDefinition.addEventListener("change", renderHotseatCard);
  hotseatShowSentence.addEventListener("change", renderHotseatCard);

  addWheelEntriesBtn.addEventListener("click", addWheelEntries);
  importRosterToWheelBtn.addEventListener("click", importRosterToWheel);
  addSingleWheelEntryBtn.addEventListener("click", addWheelEntries);
  wheelSingleEntryInput.addEventListener("keydown", event => {
    if (event.key === "Enter"){
      event.preventDefault();
      addWheelEntries();
    }
  });
  clearWheelEntriesBtn.addEventListener("click", () => {
    if (!wheelItems.length) return;
    if (!window.confirm("Clear every wheel entry?")) return;
    wheelItems = [];
    saveWheelItems();
    renderSpinWheel();
  });
  wheelEntriesInput.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") addWheelEntries();
  });
  wheelItemList.addEventListener("click", event => {
    const edit = event.target.closest("[data-wheel-edit]");
    const remove = event.target.closest("[data-wheel-delete]");
    if (edit){
      const index = Number(edit.dataset.wheelEdit);
      const next = window.prompt("Edit wheel entry", wheelItems[index]);
      if (next === null) return;
      const value = next.trim();
      if (!value) return;
      wheelItems[index] = value;
      saveWheelItems();
      renderSpinWheel();
    }
    if (remove){
      const index = Number(remove.dataset.wheelDelete);
      wheelItems.splice(index, 1);
      saveWheelItems();
      renderSpinWheel();
    }
  });
  spinWheelBtn.addEventListener("click", spinWheel);

  wordleKeyboard.addEventListener("click", e => {
    const key = e.target.closest("[data-wordle-key]");
    if (!key) return;
    handleWordleKey(key.dataset.wordleKey);
  });

  wordleNewGameBtn.addEventListener("click", startWordleGame);

  wordleRevealBtn.addEventListener("click", () => {
    if (!wordleAnswer) wordleAnswer = chooseWordleWord();
    wordleFinished = true;
    setWordleMessage(`${tr("The word was")} ${wordleAnswer}`, "warning");
    renderWordle();
  });

  document.addEventListener("keydown", e => {
    if (wordlePage.hidden && sharkWordPage.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (!sharkWordPage.hidden){
      if (/^[a-zA-Z]$/.test(e.key)){
        guessSharkWordLetter(e.key.toUpperCase());
        e.preventDefault();
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)){
      handleWordleKey(e.key.toUpperCase());
      e.preventDefault();
    } else if (e.key === "Enter"){
      handleWordleKey("ENTER");
      e.preventDefault();
    } else if (e.key === "Backspace" || e.key === "Delete"){
      handleWordleKey("BACK");
      e.preventDefault();
    }
  });

  reportIssueBtn.addEventListener("click", openReportDialog);
  openFeedbackAdminBtn.addEventListener("click", () => navigateTo("feedback"));
  openUpdateLogBtn.addEventListener("click", () => navigateTo("updates"));
  feedbackAdminBackBtn.addEventListener("click", () => navigateTo("main"));
  updateLogBackBtn.addEventListener("click", () => navigateTo("main"));

  cancelReportBtn.addEventListener("click", () => reportDialog.close());

  reportForm.addEventListener("submit", e => {
    e.preventDefault();
    submitFeedback();
  });

  reportDialog.addEventListener("click", e => {
    if (e.target === reportDialog) reportDialog.close();
  });

  languageToggleBtn.addEventListener("click", toggleUiLanguage);

  lockTableBtn.addEventListener("click", toggleTableLock);

  unlockForm.addEventListener("submit", e => {
    e.preventDefault();

    if (unlockPassword.value !== tableUnlockPassword){
      unlockError.textContent = "Incorrect password.";
      unlockPassword.select();
      unlockPassword.focus();
      return;
    }

    finishUnlock();
  });

  document.getElementById("cancelUnlockBtn").addEventListener("click", () => {
    pendingUnlockAction = null;
    unlockDialog.close();
  });

  unlockDialog.addEventListener("click", e => {
    if (e.target === unlockDialog){
      pendingUnlockAction = null;
      unlockDialog.close();
    }
  });

  function updateFullscreenButton(){
    const active =
      document.fullscreenElement === tablePanel ||
      tablePanel.classList.contains("fullscreen-fallback");
    fullscreenTableBtn.textContent = active ? `↙ ${tr("Exit Full Screen")}` : `⛶ ${tr("Full Screen")}`;
    fullscreenTableBtn.title = active
      ? "Exit full-screen table view"
      : "Show the table using the full screen";
    requestAnimationFrame(fitTableToViewport);
  }

  async function toggleTableFullscreen(){
    try{
      if (document.fullscreenElement === tablePanel){
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement){
        await document.exitFullscreen();
      }

      if (tablePanel.requestFullscreen){
        await tablePanel.requestFullscreen();
      } else {
        // Fallback for browsers/file previews that block the Fullscreen API.
        tablePanel.classList.toggle("fullscreen-fallback");
        updateFullscreenButton();
      }
    }catch(e){
      tablePanel.classList.toggle("fullscreen-fallback");
      updateFullscreenButton();
    }
  }

  fullscreenTableBtn.addEventListener("click", toggleTableFullscreen);

  document.addEventListener("click", e => {
    if (!e.target.closest(".sort-dropdown-wrap")){
      document.querySelectorAll(".sort-dropdown-wrap.open").forEach(el => el.classList.remove("open"));
    }
  });

  function lockedMutationTarget(target){
    if (!target || !target.closest) return null;

    return target.closest([
      "[data-task]",
      "[data-table-task]",
      "[data-task-title]",
      "[data-task-category]",
      "[data-task-due]",
      "[data-class-due-mode]",
      "[data-toggle-student-task-type]",
      "[data-toggle-task-overdue]",
      "[data-set-task-completion]",
      "[data-set-task-destination]",
      "[data-delete-task]",
      "[data-delete-setup-task]",
      "[data-archive-task]",
      "[data-archive-task-menu]",
      "[data-restore-archive-task]",
      "[data-restore-history-entry]",
      "[data-absent-task]",
      "[data-note-task]",
      "[data-collab-student-task]",
      "[data-collab-group-task]",
      "[data-task-work-mode]",
      "[data-pair-selection-mode]",
      "[data-group-selection-mode]",
      "[data-pair-attendance]",
      "[data-group-attendance]",
      "[data-group-size]",
      "[data-manual-pair-student]",
      "[data-remove-manual-pair-student-task]",
      "[data-undo-manual-pair-task]",
      "[data-manual-group-student]",
      "[data-remove-manual-group-student-task]",
      "[data-undo-manual-group-task]",
      "[data-finish-manual-pairing]",
      "[data-finish-manual-grouping]",
      "[data-next-pair-step]",
      "[data-next-group-step]",
      "[data-add-task]",
      "[data-empty-add-audience]",
      ".task-title",
      ".task-category"
    ].join(","));
  }

  document.addEventListener("click", e => {
    if (!tableLocked) return;
    if (!lockedMutationTarget(e.target)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  document.addEventListener("change", e => {
    if (!tableLocked) return;
    if (!lockedMutationTarget(e.target)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    // Restore rendered state if a browser visually toggled a checkbox before
    // the change event was cancelled.
    render();
  }, true);

  document.addEventListener("input", e => {
    if (!tableLocked) return;
    if (!lockedMutationTarget(e.target)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  document.addEventListener("fullscreenchange", updateFullscreenButton);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && tablePanel.classList.contains("fullscreen-fallback")){
      tablePanel.classList.remove("fullscreen-fallback");
      updateFullscreenButton();
    }
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");

      if (btn.dataset.tab === "tablePanel"){
        requestAnimationFrame(fitTableToViewport);
      }
    });
  });

  window.addEventListener("resize", () => {
    if (document.getElementById("tablePanel").classList.contains("active")){
      fitTableToViewport();
    }
  });

  function refreshVisibleCompletionTimes(){
    document.querySelectorAll("[data-completed-at]").forEach(el => {
      el.textContent = completionTimestampText(el.dataset.completedAt);
    });
  }

  // Refresh visible relative completion timestamps once per minute without
  // rebuilding the page or interrupting task-title editing.
  setInterval(() => {
    if (state.settings.completionTimestamps){
      refreshVisibleCompletionTimes();
    }
  }, 60000);

  // Refresh the warning state automatically when a due time passes while the page is open.
  let lastDueStateSignature = "";
  setInterval(() => {
    const signature = activeTasks().map(task =>
      `${task.id}:${task.dueAt}:${isTaskOverdue(task) ? 1 : 0}`
    ).join("|");

    if (signature !== lastDueStateSignature){
      lastDueStateSignature = signature;
      render();
    }
  }, 30000);

  setAdminPanel(false);
  updateTableLockUI();
  updateTimestampToggleUI();
  updateJsonSaveUI("idle");
  window.addEventListener("resize", fitTableToViewport);

  window.addEventListener("hashchange", applyRoute);
  document.querySelectorAll("[data-app-version]").forEach(element => {
    element.textContent = `v${APP_VERSION}`;
  });
  render();
  applyRoute();
  applyTranslations(document);
  restoreJsonSaveConnection();
  requestAnimationFrame(showUnsupportedBrowserStorageNotice);
  lastDueStateSignature = activeTasks().map(task =>
    `${task.id}:${task.dueAt}:${isTaskOverdue(task) ? 1 : 0}`
  ).join("|");
  saveState();

  try{
    const savedSession = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
    const account = savedSession && accounts()[savedSession.username];
    if (account) activateProfile(savedSession.username);
    else showLogin();
  }catch(_){
    showLogin();
  }
})();

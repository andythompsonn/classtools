(() => {
  const gamesHome = "../index.html#games";
  const existingNav = document.getElementById("sideNav");

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
          <button class="side-nav-item" type="button"><span class="nav-glyph">👥</span><span>Import Group<small>Load a saved class or group</small></span></button>
          <button class="side-nav-item" type="button"><span class="nav-glyph">📋</span><span>Import List<small>Load a custom matching list</small></span></button>
          <button class="side-nav-item" id="goBackBtn" type="button"><span class="nav-glyph">←</span><span>Go Back<small>Return to the games page</small></span></button>
        </div>
      </aside>`);
  }

  const handle = document.getElementById("sideNavHandle");
  const backdrop = document.getElementById("sideNavBackdrop");
  const nav = document.getElementById("sideNav");
  const closeButton = document.getElementById("sideNavClose");
  const backButton = document.getElementById("goBackBtn");
  const close = () => { nav.classList.remove("open"); backdrop.classList.remove("show"); nav.setAttribute("aria-hidden", "true"); handle.setAttribute("aria-expanded", "false"); };
  const open = () => { nav.classList.add("open"); backdrop.classList.add("show"); nav.setAttribute("aria-hidden", "false"); handle.setAttribute("aria-expanded", "true"); };
  handle.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  if (!existingNav) backButton.addEventListener("click", () => { window.location.href = gamesHome; });
})();

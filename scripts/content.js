(function () {
  const BTN_ID = "qqpoisk-watch-button";
  const WATCH_LABEL = "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c";
  const WATCH_ICON = "\uD83D\uDC41";
  const WILL_WATCH_LABEL = "\u0431\u0443\u0434\u0443 \u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c";
  const WATCH_MOVIE_LABEL = "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0444\u0438\u043b\u044c\u043c";
  const WATCH_MOVIE_LABEL_SHORT = "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0444\u0438\u043b\u044c\u043c";

  function isMoviePage() {
    return /^\/(film|series)\/\d+\/?/.test(window.location.pathname);
  }

  function buildTargetUrl() {
    const path = window.location.pathname;
    return `https://www.qqpoisk.ru${path}`;
  }

  function cleanHandlers(el) {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  }

  function createButton(referenceEl, useIcon = false) {
    if (!referenceEl) return null;
    const targetUrl = buildTargetUrl();
    const clone = referenceEl.cloneNode(true);
    clone.id = BTN_ID;
    clone.dataset.qqpoisk = "true";
    clone.dataset.qqpoiskUrl = targetUrl;

    if (clone.tagName === "A") {
      clone.href = targetUrl;
      clone.target = "_self";
      clone.rel = "noopener noreferrer";
    } else {
      clone.removeAttribute("disabled");
      clone.type = "button";
      clone.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(clone.dataset.qqpoiskUrl || buildTargetUrl());
        },
        true
      );
    }

    cleanHandlers(clone);
    clone.textContent = useIcon ? WATCH_ICON : WATCH_LABEL;
    clone.setAttribute("aria-label", WATCH_LABEL);
    clone.setAttribute("title", WATCH_LABEL);
    return clone;
  }

  function findWillWatchButton() {
    const candidates = Array.from(document.querySelectorAll("button, a"));
    return candidates.find((el) => {
      const txt = (el.textContent || "").trim().toLowerCase();
      return txt.includes(WILL_WATCH_LABEL);
    });
  }

  function findWatchMovieButton() {
    const candidates = Array.from(document.querySelectorAll("button, a"));
    return candidates.find((el) => {
      const txt = (el.textContent || "").trim();
      return txt === WATCH_MOVIE_LABEL || txt === WATCH_MOVIE_LABEL_SHORT;
    });
  }

  function findMoreButtonNear(willWatch) {
    if (!willWatch) return null;
    const row = findActionRow(willWatch);
    if (!row) return null;
    const clicks = Array.from(row.querySelectorAll("button, a")).filter(
      (el) => el !== willWatch && el.id !== BTN_ID
    );
    return (
      clicks.find((el) => {
        const txt = (el.textContent || "").trim();
        return txt === "..." || txt === "\u2026";
      }) || null
    );
  }

  function findActionRow(willWatch) {
    let node = willWatch;
    while (node && node !== document.body) {
      const parent = node.parentElement;
      if (!parent) break;
      const style = window.getComputedStyle(parent);
      const isRowFlex =
        style.display.includes("flex") && style.flexDirection !== "column";
      if (isRowFlex && parent.querySelectorAll("button, a").length >= 2) {
        return parent;
      }
      node = parent;
    }
    return willWatch.parentElement;
  }

  function rowChildContaining(row, el) {
    if (!row || !el) return null;
    for (const child of Array.from(row.children)) {
      if (child.contains(el)) return child;
    }
    return null;
  }

  function wrapLike(rowChild, btn) {
    if (!rowChild || !btn) return btn;
    if (rowChild.tagName === "A" || rowChild.tagName === "BUTTON") return btn;
    const wrap = rowChild.cloneNode(false);
    wrap.removeAttribute("id");
    wrap.removeAttribute("data-testid");
    wrap.innerHTML = "";
    wrap.appendChild(btn);
    return wrap;
  }

  function mountButton() {
    if (!isMoviePage()) return;
    if (document.getElementById(BTN_ID)) {
      const existing = document.getElementById(BTN_ID);
      const targetUrl = buildTargetUrl();
      if (existing && existing.tagName === "A") {
        existing.href = targetUrl;
      } else if (existing) {
        existing.dataset.qqpoiskUrl = targetUrl;
      }
      return;
    }

    let willWatch = findWillWatchButton();

    if (!willWatch) {
      willWatch = findWatchMovieButton();
    }

    if (!willWatch || !willWatch.parentElement) return;
    const row = findActionRow(willWatch);
    const moreButton = findMoreButtonNear(willWatch);
    const template = moreButton || willWatch;

    const btn = createButton(template);
    if (!btn) return;
    btn.textContent = WATCH_LABEL;
    btn.setAttribute("aria-label", WATCH_LABEL);
    btn.setAttribute("title", WATCH_LABEL);

    if (row) {
      const moreChild = rowChildContaining(row, moreButton);
      const watchChild = rowChildContaining(row, willWatch);
      const targetChild = moreChild || watchChild;
      const nodeToInsert = wrapLike(targetChild, btn);

      if (targetChild && targetChild.parentElement === row) {
        targetChild.insertAdjacentElement("beforebegin", nodeToInsert);
      } else if (watchChild && watchChild.parentElement === row) {
        watchChild.insertAdjacentElement("afterend", nodeToInsert);
      } else {
        row.appendChild(nodeToInsert);
      }
    } else {
      willWatch.insertAdjacentElement("afterend", btn);
    }
  }

  const observer = new MutationObserver(() => mountButton());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  mountButton();
})();

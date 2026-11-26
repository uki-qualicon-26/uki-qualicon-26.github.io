/* Hub: register once, then do the quiz, then unlock the workshop. The session is shared with /quiz/ and /workshop/. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var EMAIL_RE = /^[a-z0-9._%+'-]+@([a-z0-9-]+\.)*ibm\.com$/i;
  var api = window.QuizApi;

  function show(view) {
    ["register", "home"].forEach(function (v) { $("view-" + v).classList.toggle("hidden", v !== view); });
  }
  function showError(msg) {
    var e = $("error");
    e.textContent = msg || "";
    e.classList.toggle("hidden", !msg);
  }
  function fmtClock(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  function setBadge(id, text, cls) {
    var b = $(id); b.textContent = text; b.className = "state " + (cls || "");
  }

  function renderHome(s, name) {
    $("home-name").textContent = s.name || name || "player";
    var qs = s.quiz_state;

    // Part 1: quiz
    if (qs === "submitted") {
      setBadge("quiz-badge", "Done", "ok");
      $("quiz-text").textContent = "You have submitted the quiz. You can look at your result and the leaderboard again.";
      $("quiz-btn").textContent = "See my result";
      $("quiz-btn").className = "btn secondary";
    } else if (qs === "in_progress") {
      setBadge("quiz-badge", "In progress", "go");
      $("quiz-text").textContent = "Your clock is running. Go back to your quiz to finish it.";
      $("quiz-btn").textContent = "Resume the quiz";
      $("quiz-btn").className = "btn big";
    } else {
      setBadge("quiz-badge", "Start here", "go");
      $("quiz-text").textContent = "Answer the questions against the clock. Score first, speed breaks ties. One attempt per person.";
      $("quiz-btn").textContent = "Start the quiz";
      $("quiz-btn").className = "btn big";
    }

    // Part 2: workshop (locked until the quiz is submitted)
    var ws = $("ws-btn"), card = $("card-workshop");
    if (qs !== "submitted") {
      card.classList.add("locked");
      setBadge("ws-badge", "Locked", "lock");
      $("ws-text").textContent = "Finish the quiz first. This unlocks automatically when you submit it.";
      ws.classList.add("hidden");
    } else {
      card.classList.remove("locked");
      ws.classList.remove("hidden");
      if (s.finished_at) {
        setBadge("ws-badge", "Completed", "ok");
        $("ws-text").textContent = "You completed the workshop. You can reopen it to review the steps.";
        ws.textContent = "Review the workshop"; ws.className = "btn secondary";
      } else if (s.path || (s.done && s.done.length)) {
        setBadge("ws-badge", "In progress", "go");
        $("ws-text").textContent = "Pick up where you left off.";
        ws.textContent = "Continue the workshop"; ws.className = "btn big";
      } else {
        setBadge("ws-badge", "Unlocked", "ok");
        $("ws-text").textContent = "Use IBM Bob with Jira and Playwright, one step at a time. Choose Path A (Jira MCP) or Path B (no MCP needed).";
        ws.textContent = "Open the workshop"; ws.className = "btn big";
      }
    }
    show("home");
  }

  function refresh() {
    var sess = api.session.get();
    if (!sess) { return enterRegister(); }
    api.workshopGet(sess.token).then(function (s) { showError(""); renderHome(s, sess.name); })
      .catch(function (e) {
        if (e.code === "invalid_token") { api.session.clear(); return enterRegister(); }
        showError(e.message);
      });
  }

  function enterRegister() {
    show("register");
    if (!api.isConfigured()) {
      $("reg-btn").disabled = true;
      return showError("This portal is not configured yet.");
    }
    api.config().then(function (c) {
      if (!c.quiz_open) { $("reg-btn").disabled = true; showError("Registration is closed right now."); }
    }).catch(function (e) { showError(e.message); });
  }

  function onRegister(ev) {
    ev.preventDefault();
    showError("");
    var name = $("name").value.replace(/\s+/g, " ").trim();
    var email = $("email").value.trim().toLowerCase();
    if (name.length < 2) { return showError("Please enter your full name."); }
    if (!EMAIL_RE.test(email)) { return showError("Please use your IBM email address (ending in ibm.com)."); }
    $("reg-btn").disabled = true;
    api.register(name, email).then(function (r) {
      api.session.set(r.token, r.name);
      refresh();
    }).catch(function (e) { showError(e.message); })
      .then(function () { $("reg-btn").disabled = false; });
  }

  $("reg-form").addEventListener("submit", onRegister);
  // Coming back from the quiz or workshop tab: refresh the cards.
  document.addEventListener("visibilitychange", function () { if (!document.hidden && api.session.get()) { refresh(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { refresh(); } });
  refresh();
})();

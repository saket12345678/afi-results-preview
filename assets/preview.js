
/* Preview copy: one competition page holds every event; the event list and picker switch them without a server.
   The season page's month and search filters work in the browser. */
(function () {
  var evs = document.querySelectorAll(".pv-ev");
  if (evs.length) {
    var links = document.querySelectorAll(".afr-evlist a");
    var pick = document.querySelector(".afr-evpick select");
    var ids = Array.prototype.map.call(evs, function (e) { return e.id.slice(3); });
    links.forEach(function (a, i) { a.setAttribute("href", "#ev-" + (ids[i] || "")); a.removeAttribute("aria-current"); });
    function show(id) {
      if (ids.indexOf(id) < 0) id = ids[0];
      evs.forEach(function (e) { e.hidden = e.id !== "ev-" + id; });
      links.forEach(function (a) { a.classList.toggle("pv-on", a.getAttribute("href") === "#ev-" + id); });
      if (pick) pick.value = id;
    }
    if (pick) {
      pick.removeAttribute("onchange");
      pick.form.addEventListener("submit", function (e) { e.preventDefault(); });
      pick.addEventListener("change", function () { location.hash = "ev-" + pick.value; });
    }
    window.addEventListener("hashchange", function () { show(location.hash.slice(4)); });
    show(location.hash.slice(4));
  }
  var form = document.querySelector(".afr-filters");
  if (form) {
    var lvl = form.querySelector('select[name="afr_c"]');
    if (lvl) lvl.closest("label").remove();
    form.querySelectorAll("select").forEach(function (s) { s.removeAttribute("onchange"); });
    function filter() {
      var m = (form.querySelector('select[name="afr_m"]') || {}).value || "";
      var q = ((form.querySelector('input[name="afr_q"]') || {}).value || "").toLowerCase();
      document.querySelectorAll(".afr-month-block").forEach(function (b) {
        var any = false;
        b.querySelectorAll(".afr-item").forEach(function (it) {
          var t = it.querySelector("time"), mm = t ? +t.getAttribute("datetime").slice(5, 7) : 0;
          var ok = (!m || mm === +m) && (!q || it.textContent.toLowerCase().indexOf(q) >= 0);
          it.hidden = !ok; any = any || ok;
        });
        b.hidden = !any;
      });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); filter(); });
    form.addEventListener("change", filter);
    form.addEventListener("input", filter);
  }
})();

(function () {
  function enableCardLayer() {
    if (!document.querySelector(".project-item")) return;
    var canvas = document.getElementById("canvas");
    if (canvas) canvas.style.pointerEvents = "none";
    var list = document.querySelector(".project-list");
    if (list) {
      list.style.position = "relative";
      list.style.zIndex = "20";
    }
    document.querySelectorAll(".project-item, .project-item *").forEach(function (item) {
      item.style.pointerEvents = "auto";
    });
  }

  function openProject(event) {
    var card = event.target && event.target.closest && event.target.closest("a.project-item[href^='/projects/']");
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    window.location.assign(card.getAttribute("href"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enableCardLayer);
  } else {
    enableCardLayer();
  }
  window.addEventListener("load", enableCardLayer);

  document.addEventListener("click", openProject, true);
  document.addEventListener("pointerup", function (event) {
    var card = event.target && event.target.closest && event.target.closest("a.project-item[href^='/projects/']");
    if (card) card.style.cursor = "pointer";
  }, true);
})();

(function () {
  "use strict";

  function buildCarousel(grid) {
    if (!grid || grid.dataset.carouselReady === "true") return;

    var cards = Array.prototype.slice.call(
      grid.querySelectorAll(".project-card"),
    );
    if (cards.length < 2) return;

    grid.dataset.carouselReady = "true";

    var carousel = document.createElement("div");
    carousel.className = "project-carousel";
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-label", "Featured projects carousel");

    var stage = document.createElement("div");
    stage.className = "project-carousel-stage";
    stage.setAttribute("tabindex", "0");
    stage.setAttribute(
      "aria-label",
      "Project cards. Use the left and right arrow keys to browse.",
    );

    var controls = document.createElement("div");
    controls.className = "project-carousel-controls";

    var previousButton = document.createElement("button");
    previousButton.className = "carousel-arrow carousel-previous";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Previous project");
    previousButton.innerHTML = '<span aria-hidden="true">&#8592;</span>';

    var pagination = document.createElement("div");
    pagination.className = "carousel-pagination";
    pagination.setAttribute("role", "group");
    pagination.setAttribute("aria-label", "Choose a project");

    var counter = document.createElement("span");
    counter.className = "carousel-counter";
    counter.setAttribute("aria-live", "polite");

    var nextButton = document.createElement("button");
    nextButton.className = "carousel-arrow carousel-next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next project");
    nextButton.innerHTML = '<span aria-hidden="true">&#8594;</span>';

    grid.parentNode.replaceChild(carousel, grid);
    carousel.appendChild(stage);
    carousel.appendChild(controls);
    controls.appendChild(previousButton);
    controls.appendChild(pagination);
    controls.appendChild(counter);
    controls.appendChild(nextButton);

    var currentIndex = 0;
    var dots = [];
    var total = cards.length;

    cards.forEach(function (card, index) {
      card.classList.add("carousel-card");
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", index + 1 + " of " + total);

      if (!card.querySelector("img.project-image")) {
        var firstTag = card.querySelector(".tag");
        var isJava = firstTag && /java/i.test(firstTag.textContent);
        var cover = document.createElement("div");
        cover.className =
          "project-cover-placeholder " +
          (isJava ? "cover-java" : "cover-design");

        var glyph = document.createElement("span");
        glyph.className = "project-cover-glyph";
        glyph.textContent = isJava ? "{ }" : "◈";

        var coverLabel = document.createElement("span");
        coverLabel.className = "project-cover-label";
        coverLabel.textContent = isJava
          ? "JAVA  /  DATA STRUCTURES"
          : "FIGMA  /  UI CONCEPT";

        cover.appendChild(glyph);
        cover.appendChild(coverLabel);
        card.insertBefore(cover, card.firstChild);
      }

      var images = card.querySelectorAll("img");
      images.forEach(function (image) {
        image.setAttribute("draggable", "false");
      });

      stage.appendChild(card);

      var dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute(
        "aria-label",
        "Go to project " +
          (index + 1) +
          ": " +
          ((card.querySelector("h3") || {}).textContent || "Project").trim(),
      );
      dot.addEventListener("click", function () {
        goTo(index);
      });
      pagination.appendChild(dot);
      dots.push(dot);
    });

    function wrapIndex(index) {
      return (index + total) % total;
    }

    function getSpread() {
      var width = carousel.clientWidth || window.innerWidth;
      if (width <= 480) return width * 0.62;
      if (width <= 767) return Math.max(190, Math.min(270, width * 0.61));
      if (width <= 992) return Math.max(220, Math.min(300, width * 0.29));
      return Math.max(260, Math.min(390, width * 0.31));
    }

    function render() {
      cards.forEach(function (card, index) {
        var offset = index - currentIndex;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        var distance = Math.abs(offset);
        var position = "hidden";
        if (distance === 0) position = "active";
        else if (distance === 1) position = offset < 0 ? "previous" : "next";

        card.dataset.position = position;
        card.style.setProperty("--offset", String(offset));
        card.style.setProperty(
          "--translate-x",
          (distance === 1 ? offset * getSpread() : 0) + "px",
        );
        card.style.setProperty(
          "--translate-z",
          (distance === 0 ? 0 : distance === 1 ? -145 : -1200) + "px",
        );
        card.style.setProperty(
          "--rotate-y",
          (distance === 1 ? offset * -23 : 0) + "deg",
        );
        card.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
        card.inert = distance !== 0;
      });

      dots.forEach(function (dot, index) {
        var isActive = index === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      counter.textContent =
        String(currentIndex + 1).padStart(2, "0") +
        " / " +
        String(total).padStart(2, "0");
    }

    function goTo(index) {
      currentIndex = wrapIndex(index);
      render();
    }

    previousButton.addEventListener("click", function () {
      goTo(currentIndex - 1);
    });

    nextButton.addEventListener("click", function () {
      goTo(currentIndex + 1);
    });

    stage.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
    });

    var pointerStartX = 0;
    var pointerActive = false;
    var pointerId = null;
    var suppressNextClick = false;

    stage.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest("button")) return;

      pointerStartX = event.clientX;
      pointerActive = true;
      pointerId = event.pointerId;
      stage.classList.add("is-dragging");
      try {
        stage.setPointerCapture(pointerId);
      } catch (error) {}
    });

    stage.addEventListener("pointerup", function (event) {
      if (
        !pointerActive ||
        (pointerId !== null && event.pointerId !== pointerId)
      )
        return;
      var distance = event.clientX - pointerStartX;
      pointerActive = false;
      pointerId = null;
      stage.classList.remove("is-dragging");

      if (distance <= -45) {
        suppressNextClick = true;
        goTo(currentIndex + 1);
      } else if (distance >= 45) {
        suppressNextClick = true;
        goTo(currentIndex - 1);
      }
    });

    stage.addEventListener(
      "click",
      function (event) {
        if (!suppressNextClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick = false;
      },
      true,
    );

    stage.addEventListener("pointercancel", function () {
      pointerActive = false;
      pointerId = null;
      stage.classList.remove("is-dragging");
    });

    stage.addEventListener("lostpointercapture", function () {
      pointerActive = false;
      pointerId = null;
      stage.classList.remove("is-dragging");
    });

    render();
    window.addEventListener("resize", render, { passive: true });
  }

  function init() {
    document.querySelectorAll(".projects-flexbox").forEach(buildCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

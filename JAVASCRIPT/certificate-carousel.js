(function () {
  "use strict";

  function buildCarousel(grid) {
    if (!grid || grid.dataset.carouselReady === "true") return;

    var cards = Array.prototype.slice.call(
      grid.querySelectorAll(".certificate-card"),
    );
    if (cards.length < 2) return;

    grid.dataset.carouselReady = "true";

    var carousel = document.createElement("div");
    carousel.className = "certificate-carousel";
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-label", "Certificates carousel");

    var stage = document.createElement("div");
    stage.className = "certificate-carousel-stage";
    stage.setAttribute("tabindex", "0");
    stage.setAttribute(
      "aria-label",
      "Certificate cards. Use the left and right arrow keys to browse.",
    );

    var controls = document.createElement("div");
    controls.className =
      "project-carousel-controls certificate-carousel-controls";

    var previousButton = document.createElement("button");
    previousButton.className = "carousel-arrow carousel-previous";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Previous certificate");
    previousButton.innerHTML = '<span aria-hidden="true">&#8592;</span>';

    var pagination = document.createElement("div");
    pagination.className = "carousel-pagination";
    pagination.setAttribute("role", "group");
    pagination.setAttribute("aria-label", "Choose a certificate");

    var counter = document.createElement("span");
    counter.className = "carousel-counter";
    counter.setAttribute("aria-live", "polite");

    var nextButton = document.createElement("button");
    nextButton.className = "carousel-arrow carousel-next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next certificate");
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
      card.classList.add("certificate-carousel-card");
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", index + 1 + " of " + total);

      card.querySelectorAll("img").forEach(function (image) {
        image.setAttribute("draggable", "false");
      });

      stage.appendChild(card);

      var title = card.querySelector("h5");
      var dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute(
        "aria-label",
        "Go to certificate " +
          (index + 1) +
          ": " +
          ((title && title.textContent) || "Certificate").trim(),
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
      if (width <= 992) return Math.max(220, Math.min(300, width * 0.3));
      return Math.max(290, Math.min(410, width * 0.34));
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
          (distance === 1 ? offset * -22 : 0) + "deg",
        );
        card.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
        card.inert = distance !== 0;
      });

      dots.forEach(function (dot, index) {
        var active = index === currentIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
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

    function cancelPointer() {
      pointerActive = false;
      pointerId = null;
      stage.classList.remove("is-dragging");
    }
    stage.addEventListener("pointercancel", cancelPointer);
    stage.addEventListener("lostpointercapture", cancelPointer);

    render();
    window.addEventListener("resize", render, { passive: true });
  }

  function init() {
    document.querySelectorAll(".certificates-flexbox").forEach(buildCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

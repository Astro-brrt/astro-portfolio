(function () {
    "use strict";
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    function updateActiveLink() {
        var currentId = "home";
        var marker = window.scrollY + window.innerHeight * 0.35;
        sections.forEach(function (section) {
            if (section.offsetTop <= marker) currentId = section.id;
        });
        navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
        });
    }
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("hashchange", updateActiveLink);
    updateActiveLink();
})();

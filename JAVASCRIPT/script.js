var typingText = "Information Technology Student";
var typingSpeed = 80;
var currentIndex = 0;
var typingElement = document.getElementById("typing-text");

function typeWriter() {
    if (typingElement && currentIndex < typingText.length) {
        typingElement.textContent += typingText.charAt(currentIndex);
        currentIndex++;
        setTimeout(typeWriter, typingSpeed);
    }
}

typeWriter();

var skillFills = document.querySelectorAll(".skill-fill");

if (skillFills.length > 0) {
    setTimeout(function () {
        skillFills.forEach(function (bar) {
            var targetWidth = bar.getAttribute("data-width");
            bar.style.width = targetWidth;
        });
    }, 400);
}

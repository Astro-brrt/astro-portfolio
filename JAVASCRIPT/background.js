var canvas = document.getElementById("bg-canvas");

if (canvas) {
  var ctx = canvas.getContext("2d");
  var STAR_COUNT = 120;
  var stars = [];
  var shootingStars = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createStar() {
    return {
      x: randomBetween(0, canvas.width),
      y: randomBetween(0, canvas.height),
      size: randomBetween(0.4, 1.8),
      speedX: randomBetween(-0.15, 0.15),
      speedY: randomBetween(-0.2, -0.05),
      alpha: randomBetween(0.2, 0.8),
      twinkleSpeed: randomBetween(0.005, 0.02),
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
    };
  }

  function createAllStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }
  }

  function createShootingStar() {
    return {
      x: randomBetween(0, canvas.width),
      y: randomBetween(0, canvas.height * 0.5),
      tailLen: randomBetween(80, 180),
      speed: randomBetween(6, 12),
      angle: Math.PI / 5,
      alpha: 1,
      age: 0,
      maxAge: randomBetween(30, 60),
    };
  }

  function updateAndDrawStars() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];

      s.alpha += s.twinkleSpeed * s.twinkleDir;

      if (s.alpha >= 0.85 || s.alpha <= 0.1) {
        s.twinkleDir = s.twinkleDir * -1;
      }

      s.x += s.speedX;
      s.y += s.speedY;

      if (s.y < 0) {
        s.y = canvas.height;
      }
      if (s.x < 0) {
        s.x = canvas.width;
      }
      if (s.x > canvas.width) {
        s.x = 0;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 210, 255, " + s.alpha + ")";
      ctx.fill();
    }
  }

  function updateAndDrawShootingStars() {
    for (var i = shootingStars.length - 1; i >= 0; i--) {
      var s = shootingStars[i];

      s.age++;

      if (s.age >= s.maxAge) {
        shootingStars.splice(i, 1);
        continue;
      }

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;

      var fadeFactor = 1 - s.age / s.maxAge;
      var tailX = s.x - Math.cos(s.angle) * s.tailLen;
      var tailY = s.y - Math.sin(s.angle) * s.tailLen;

      var gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      gradient.addColorStop(1, "rgba(180, 190, 255, " + fadeFactor * 0.9 + ")");

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, " + fadeFactor + ")";
      ctx.fill();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateAndDrawStars();
    updateAndDrawShootingStars();
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  createAllStars();

  window.addEventListener("resize", function () {
    resizeCanvas();
    createAllStars();
  });

  setInterval(
    function () {
      if (shootingStars.length < 3) {
        shootingStars.push(createShootingStar());
      }
    },
    randomBetween(3000, 6000),
  );

  animate();
}
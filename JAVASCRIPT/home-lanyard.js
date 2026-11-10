(function () {
  var wrap = document.getElementById("home-lanyard");
  var canvas = document.getElementById("home-lanyard-canvas");
  if (!wrap || !canvas) return;

  var CONFIG = {
    name: "Justine Lei",
    role: "Information Technology Student",
    header: "INFORMATION TECHNOLOGY",
    footer: "School ID:24-3399 \u2022 2026",
    photo: "Images/indexpicture.png",
    accent: "#6366f1",
  };

  var CARD_W = 220;
  var CARD_H = 316;
  var CLIP_OFFSET = 22;
  var SEGMENTS = 8;
  var GRAVITY = 0.8;
  var DAMPING = 0.992;
  var ITERATIONS = 16;
  var PULL = 0.78;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0,
    H = 0,
    s = 1;
  var cardW = CARD_W,
    cardH = CARD_H,
    clipOff = CLIP_OFFSET;
  var strap = [];
  var card = [];
  var links = [];
  var cardArt = null;
  var drag = null;
  var pointerId = null;
  var hovering = false;
  var visible = true;

  function makePoint(x, y, pinned) {
    return { x: x, y: y, px: x, py: y, pin: !!pinned };
  }

  function link(a, b, len) {
    links.push({ a: a, b: b, len: len });
  }

  function build() {
    W = window.innerWidth || document.documentElement.clientWidth || 330;
    H = window.innerHeight || document.documentElement.clientHeight || 470;

    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    s = Math.min(1, W / 480, H / 600);
    cardW = CARD_W * s;
    cardH = CARD_H * s;
    clipOff = CLIP_OFFSET * s;

    var stageWidth;
    if (W >= 993) {
      stageWidth = Math.min(1300, W * 0.9);
    } else if (W >= 768) {
      stageWidth = W * 0.92;
    } else {
      stageWidth = W * 0.9;
    }
    var stageLeft = (W - stageWidth) / 2;
    var ax;
    if (W >= 993) {
      ax = stageLeft + stageWidth * 0.74;
    } else if (W >= 768) {
      ax = stageLeft + stageWidth * 0.75;
    } else {
      ax = W * 0.72;
    }
    ax = Math.max(cardW / 2 + 12 * s, Math.min(W - cardW / 2 - 18 * s, ax));
    var anchorY = 0;

    var cardTop = (W < 768 ? 220 : 250) * s;
    var clipY = cardTop - clipOff;
    var segLen = (clipY - anchorY) / SEGMENTS;

    strap = [];
    card = [];
    links = [];

    for (var i = 0; i <= SEGMENTS; i++) {
      strap.push(makePoint(ax, anchorY + i * segLen, i === 0));
    }
    for (var j = 0; j < SEGMENTS; j++) {
      link(strap[j], strap[j + 1], segLen);
    }

    var clip = strap[SEGMENTS];
    var tl = makePoint(ax - cardW / 2, cardTop);
    var tr = makePoint(ax + cardW / 2, cardTop);
    var bl = makePoint(ax - cardW / 2, cardTop + cardH);
    var br = makePoint(ax + cardW / 2, cardTop + cardH);
    card = [tl, tr, bl, br];

    var hang = Math.sqrt((cardW / 2) * (cardW / 2) + clipOff * clipOff);
    link(clip, tl, hang);
    link(clip, tr, hang);
    link(tl, tr, cardW);
    link(bl, br, cardW);
    link(tl, bl, cardH);
    link(tr, br, cardH);
    link(tl, br, Math.sqrt(cardW * cardW + cardH * cardH));
    link(tr, bl, Math.sqrt(cardW * cardW + cardH * cardH));

    if (!reduceMotion) {
      for (var k = 0; k < card.length; k++) {
        card[k].px = card[k].x - 11 * s;
        card[k].py = card[k].y + 2 * s;
      }
    }
  }

  function integrate(p) {
    if (p.pin) return;
    var vx = (p.x - p.px) * DAMPING;
    var vy = (p.y - p.py) * DAMPING;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  function cardBasis() {
    var tl = card[0],
      tr = card[1],
      bl = card[2];
    var ux = (tr.x - tl.x) / cardW;
    var uy = (tr.y - tl.y) / cardW;
    var vx = (bl.x - tl.x) / cardH;
    var vy = (bl.y - tl.y) / cardH;
    return { ux: ux, uy: uy, vx: vx, vy: vy, ox: tl.x, oy: tl.y };
  }

  function applyDrag() {
    if (!drag) return;
    var b = cardBasis();
    var gx = b.ox + b.ux * drag.u * cardW + b.vx * drag.v * cardH;
    var gy = b.oy + b.uy * drag.u * cardW + b.vy * drag.v * cardH;
    var dx = drag.x - gx;
    var dy = drag.y - gy;
    var d = Math.sqrt(dx * dx + dy * dy);
    var maxD = Math.max(W, H) * 1.1;
    if (d > maxD) {
      dx = (dx / d) * maxD;
      dy = (dy / d) * maxD;
    }
    var u = drag.u,
      v = drag.v;
    var w = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
    var sumSq = w[0] * w[0] + w[1] * w[1] + w[2] * w[2] + w[3] * w[3];
    for (var i = 0; i < 4; i++) {
      card[i].x += (dx * PULL * w[i]) / sumSq;
      card[i].y += (dy * PULL * w[i]) / sumSq;
    }
  }

  function solve() {
    for (var it = 0; it < ITERATIONS; it++) {
      for (var i = 0; i < links.length; i++) {
        var l = links[i];
        var a = l.a,
          b = l.b;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (d - l.len) / d;
        var wa = a.pin ? 0 : 1;
        var wb = b.pin ? 0 : 1;
        var tw = wa + wb;
        if (tw === 0) continue;
        var ox = (dx * diff) / tw;
        var oy = (dy * diff) / tw;
        if (wa) {
          a.x += ox * wa;
          a.y += oy * wa;
        }
        if (wb) {
          b.x -= ox * wb;
          b.y -= oy * wb;
        }
      }
    }
  }

  function keepInBounds() {
    for (var i = 0; i < card.length; i++) {
      var p = card[i];
      if (p.x < 0) p.x = 0;
      if (p.x > W) p.x = W;
      if (p.y < 0) p.y = 0;
      if (p.y > H) p.y = H;
    }
  }

  function step() {
    var i;
    for (i = 0; i < strap.length; i++) integrate(strap[i]);
    for (i = 0; i < card.length; i++) integrate(card[i]);
    applyDrag();
    solve();
    keepInBounds();
  }

  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function renderCardArt(photo) {
    var Q = 3;
    var c = document.createElement("canvas");
    c.width = CARD_W * Q;
    c.height = CARD_H * Q;
    var g = c.getContext("2d");
    g.scale(Q, Q);

    roundRectPath(g, 0, 0, CARD_W, CARD_H, 16);
    g.save();
    g.clip();

    var bg = g.createLinearGradient(0, 0, CARD_W, CARD_H);
    bg.addColorStop(0, "#1e1b4b");
    bg.addColorStop(0.55, "#312e81");
    bg.addColorStop(1, "#4338ca");
    g.fillStyle = bg;
    g.fillRect(0, 0, CARD_W, CARD_H);

    var glow = g.createRadialGradient(CARD_W, 0, 0, CARD_W, 0, 170);
    glow.addColorStop(0, "rgba(167,139,250,0.55)");
    glow.addColorStop(1, "rgba(167,139,250,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, CARD_W, CARD_H);

    g.fillStyle = "rgba(255,255,255,0.55)";
    var dots = [
      [22, 30],
      [190, 52],
      [34, 296],
      [160, 20],
      [200, 240],
      [12, 150],
      [120, 40],
    ];
    for (var i = 0; i < dots.length; i++) {
      g.beginPath();
      g.arc(dots[i][0], dots[i][1], 1.1, 0, Math.PI * 2);
      g.fill();
    }

    roundRectPath(g, CARD_W / 2 - 16, 12, 32, 9, 4.5);
    g.fillStyle = "rgba(5,6,25,0.85)";
    g.fill();

    g.fillStyle = "#c7d2fe";
    g.textAlign = "center";
    g.font = "600 7.5px Poppins, sans-serif";
    if ("letterSpacing" in g) g.letterSpacing = "1.6px";
    g.fillText(CONFIG.header, CARD_W / 2, 42);
    if ("letterSpacing" in g) g.letterSpacing = "0px";

    var px = 16,
      py = 52,
      pw = CARD_W - 32,
      ph = 172;
    g.save();
    roundRectPath(g, px, py, pw, ph, 12);
    g.clip();
    g.fillStyle = "#1e3a8a";
    g.fillRect(px, py, pw, ph);
    if (photo) {
      var iw = photo.naturalWidth,
        ih = photo.naturalHeight;
      var sc = Math.max(pw / iw, ph / ih);
      var dw = iw * sc,
        dh = ih * sc;
      g.drawImage(photo, px + (pw - dw) / 2, py + (ph - dh) * 0.2, dw, dh);
    }
    g.restore();
    roundRectPath(g, px, py, pw, ph, 12);
    g.lineWidth = 1.5;
    g.strokeStyle = "rgba(255,255,255,0.4)";
    g.stroke();

    g.textAlign = "left";
    g.fillStyle = "#ffffff";
    g.font = "700 23px Poppins, sans-serif";
    g.fillText(CONFIG.name, 18, 252);
    g.fillStyle = "#c7d2fe";
    g.font = "400 9.5px Poppins, sans-serif";
    g.fillText(CONFIG.role, 18, 267);

    g.fillStyle = "rgba(255,255,255,0.65)";
    g.font = "600 7px Poppins, sans-serif";
    if ("letterSpacing" in g) g.letterSpacing = "1px";
    g.fillText(CONFIG.footer, 18, 297);
    if ("letterSpacing" in g) g.letterSpacing = "0px";

    g.fillStyle = "rgba(255,255,255,0.8)";
    var bx = 146;
    var widths = [1.5, 1, 2.5, 1, 1.5, 2, 1, 1.5, 1, 2.5, 1];
    for (var k = 0; k < widths.length; k++) {
      g.fillRect(bx, 286, widths[k], 18);
      bx += widths[k] + 1.6;
    }

    g.restore();
    roundRectPath(g, 0.75, 0.75, CARD_W - 1.5, CARD_H - 1.5, 15.5);
    g.lineWidth = 1.5;
    g.strokeStyle = "rgba(199,210,254,0.35)";
    g.stroke();

    cardArt = c;
  }

  function drawStrap() {
    var n = strap.length;
    var path = new Path2D();
    path.moveTo(strap[0].x, strap[0].y);
    for (var i = 1; i < n - 1; i++) {
      var mx = (strap[i].x + strap[i + 1].x) / 2;
      var my = (strap[i].y + strap[i + 1].y) / 2;
      path.quadraticCurveTo(strap[i].x, strap[i].y, mx, my);
    }
    path.lineTo(strap[n - 1].x, strap[n - 1].y);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(72, 76, 96, 0.48)";
    ctx.lineWidth = 24 * s;
    ctx.stroke(path);
    ctx.strokeStyle = "#11131a";
    ctx.lineWidth = 20 * s;
    ctx.stroke(path);
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1.2 * s;
    ctx.stroke(path);
  }

  function drawCard() {
    if (!cardArt) return;
    var b = cardBasis();
    ctx.save();
    ctx.setTransform(
      dpr * b.ux,
      dpr * b.uy,
      dpr * b.vx,
      dpr * b.vy,
      dpr * b.ox,
      dpr * b.oy,
    );

    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 28 * dpr;
    ctx.shadowOffsetY = 14 * dpr;
    ctx.drawImage(cardArt, 0, 0, cardW, cardH);
    ctx.shadowColor = "transparent";

    var tilt = Math.atan2(b.uy, b.ux);
    var gx = cardW * (0.5 + tilt * 1.6);
    ctx.save();
    roundRectPath(ctx, 0, 0, cardW, cardH, 16 * s);
    ctx.clip();
    var gloss = ctx.createLinearGradient(gx - 70 * s, 0, gx + 70 * s, cardH);
    gloss.addColorStop(0, "rgba(255,255,255,0)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0.16)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, cardW, cardH);
    ctx.restore();

    var cx = cardW / 2;
    var cw = 24 * s;
    var metal = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
    metal.addColorStop(0, "#9ca3af");
    metal.addColorStop(0.5, "#f3f4f6");
    metal.addColorStop(1, "#9ca3af");
    roundRectPath(
      ctx,
      cx - cw / 2,
      -clipOff + 2 * s,
      cw,
      clipOff + 20 * s,
      5 * s,
    );
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();
    roundRectPath(ctx, cx - 7 * s, 8 * s, 14 * s, 6 * s, 3 * s);
    ctx.fillStyle = "rgba(10,13,36,0.85)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, -clipOff, 4.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = "#e5e7eb";
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawStrap();
    drawCard();
  }

  function localPoint(event) {
    var rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hitTest(x, y) {
    var b = cardBasis();
    var rx = x - b.ox;
    var ry = y - b.oy;
    var u = (rx * b.ux + ry * b.uy) / cardW;
    var v = (rx * b.vx + ry * b.vy) / cardH;
    var pad = 8 / cardW;
    if (u < -pad || u > 1 + pad || v < -pad || v > 1 + pad) return null;
    return { u: Math.min(1, Math.max(0, u)), v: Math.min(1, Math.max(0, v)) };
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    var point = localPoint(event);
    var h = hitTest(point.x, point.y);
    if (!h) return;

    drag = { u: h.u, v: h.v, x: point.x, y: point.y };
    pointerId = event.pointerId;
    hovering = true;
    canvas.classList.add("is-dragging");
    document.body.classList.add("lanyard-dragging");
    document.body.classList.remove("lanyard-hover");
    event.preventDefault();
    event.stopPropagation();
  }

  function moveDrag(event) {
    var point = localPoint(event);
    if (!drag || (pointerId !== null && event.pointerId !== pointerId)) {
      var over = !!hitTest(point.x, point.y);
      if (over !== hovering) {
        hovering = over;
        document.body.classList.toggle("lanyard-hover", over);
      }
      return;
    }

    drag.x = point.x;
    drag.y = point.y;
    event.preventDefault();
  }

  function finishDrag(event) {
    if (!drag || (event && pointerId !== null && event.pointerId !== pointerId))
      return;
    drag = null;
    pointerId = null;
    canvas.classList.remove("is-dragging");
    document.body.classList.remove("lanyard-dragging");
    if (event && typeof event.clientX === "number") {
      var point = localPoint(event);
      hovering = !!hitTest(point.x, point.y);
    }
    document.body.classList.toggle("lanyard-hover", hovering);
  }

  document.addEventListener(
    "pointerdown",
    function (event) {
      var point = localPoint(event);
      if (hitTest(point.x, point.y)) {
        startDrag(event);
      }
    },
    true,
  );

  document.addEventListener(
    "pointermove",
    function (event) {
      if (drag) {
        moveDrag(event);
        return;
      }
      var point = localPoint(event);
      hovering = !!hitTest(point.x, point.y);
      document.body.classList.toggle("lanyard-hover", hovering);
    },
    true,
  );

  document.addEventListener("pointerup", finishDrag, true);
  document.addEventListener("pointercancel", finishDrag, true);

  canvas.addEventListener("keydown", function (event) {
    var impulse = event.shiftKey ? 18 : 9;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      var direction = event.key === "ArrowLeft" ? -1 : 1;
      for (var i = 0; i < card.length; i++)
        card[i].px -= direction * impulse * s;
      event.preventDefault();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      var vertical = event.key === "ArrowUp" ? -1 : 1;
      for (var j = 0; j < card.length; j++)
        card[j].py -= vertical * impulse * s;
      event.preventDefault();
    }
  });

  var last = 0;
  var acc = 0;
  var FIXED = 1000 / 60;

  function loop(t) {
    requestAnimationFrame(loop);
    if (!visible) {
      last = t;
      return;
    }
    var dt = t - last;
    last = t;
    if (dt > 100) dt = FIXED;
    acc += dt;
    var steps = 0;
    while (acc >= FIXED && steps < 4) {
      step();
      acc -= FIXED;
      steps++;
    }
    if (steps === 4) acc = 0;
    draw();
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      build();
      draw();
    }, 150);
  });

  function init() {
    build();
    var img = new Image();
    img.onload = function () {
      renderCardArt(img);
    };
    img.onerror = function () {
      renderCardArt(null);
    };
    img.src = CONFIG.photo;
    requestAnimationFrame(loop);
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load("700 23px Poppins"),
      document.fonts.load("600 8px Poppins"),
      document.fonts.load("400 10px Poppins"),
    ]).then(init, init);
  } else {
    init();
  }
})();

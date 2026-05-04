const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const padding = 20; // pixels of empty space on left/right

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// parameters
const maxScroll = document.body.scrollHeight - window.innerHeight;
const targetFraction = 2.5; // want ~250% height max (this is very unlikely as it would require only downward steps)
const stepSizePx = (maxScroll * stepLength) / (targetFraction * cssHeight); // dynamically defined stepSizePx to ensure the walk rarely reaches the bottom
// const stepSizePx = 10;   // scroll pixels per step
const stepLength = 10;   // fixed step length (grid spacing)

// to keep the walk restrained within the box
const usableWidth = cssWidth - 2 * padding;
const maxStepsX = Math.floor((usableWidth / 2) / stepLength);
const centerX = Math.floor(cssWidth / 2 / stepLength) * stepLength;
const minX = centerX - maxStepsX * stepLength;
const maxX = centerX + maxStepsX * stepLength;

canvas.style.width = cssWidth + "px";
canvas.style.height = cssHeight + "px";

canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;

ctx.scale(dpr, dpr);

// --- Random walk storage ---
let points = [];

// initialize
function resetPoints() {
    points = [{
        x: centerX,
        y: 0
    }];
}
resetPoints();

// --- Step function ---
function addStep() {
    const last = points[points.length - 1];

    let dx = 0;
    let dy = 0;

    const atLeft = last.x <= minX;
    const atRight = last.x >= maxX;
    const atTop = last.y <= 0;

    const r = Math.random();

    if (atTop) {
        dy = stepLength;
    }
      else if (atLeft) {
        if (r < 0.5) dy = stepLength;
        else dx = stepLength;
    } else if (atRight) {
        if (r < 0.5) dy = stepLength;
        else dx = -stepLength;
    } else {
        if (r < 0.33) dy = stepLength;
        else if (r < 0.66) dx = stepLength;
        else dx = -stepLength;
    }

    points.push({
        x: last.x + dx,
        y: last.y + dy
    });
}

// --- Draw ---
function draw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
}

// --- Scroll handler ---
window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const stepsNeeded = Math.floor(scrollTop / stepSizePx);

    while (points.length - 1 < stepsNeeded) {
        addStep();
    }

    while (points.length - 1 > stepsNeeded) {
        points.pop();
    }

    draw();
});

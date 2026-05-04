const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// parameters
const stepSizePx = 30;   // scroll pixels per step
const stepLength = 10;   // fixed step length (grid spacing)

// to keep the walk restrained within the box
const maxStepsX = Math.floor((cssWidth / 2) / stepLength);
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

// parameters
const stepSizePx = 30;   // scroll pixels per step
const stepLength = 10;   // fixed step length (grid spacing)

// initialize
function resetPoints() {
    points = [{
        x: centerX,
        y: 0
    }];
}
resetPoints();

// --- Biased discrete lattice step ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// to keep the walk restrained within the box
const maxStepsX = Math.floor((cssWidth / 2) / stepLength);
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

// --- Biased discrete lattice step ---
function addStep() {
    const last = points[points.length - 1];

    let dx = 0;
    let dy = 0;

    const atLeft = last.x <= minX;
    const atRight = last.x >= maxX;

    const r = Math.random();

    if (atLeft) {
        // can only go right or down
        if (r < 0.7) {
            dy = stepLength;      // down
        } else {
            dx = stepLength;      // right
        }
    } else if (atRight) {
        // can only go left or down
        if (r < 0.7) {
            dy = stepLength;      // down
        } else {
            dx = -stepLength;     // left
        }
    } else {
        // normal case (no upward motion)
        if (r < 0.6) {
            dy = stepLength;      // down
        } else if (r < 0.8) {
            dx = stepLength;      // right
        } else {
            dx = -stepLength;     // left
        }
    }

    points.push({
        x: last.x + dx,
        y: last.y + dy
    });
}

    draw();
});

// --- Scroll handler ---
window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const stepsNeeded = Math.floor(scrollTop / stepSizePx);

    // grow
    while (points.length - 1 < stepsNeeded) {
        addStep();
    }

    // shrink
    while (points.length - 1 > stepsNeeded) {
        points.pop();
    }

    draw();
});

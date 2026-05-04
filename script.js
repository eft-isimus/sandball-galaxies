const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// size canvas
const margin = 20;
canvas.width = 200;
canvas.height = window.innerHeight - 2 * margin;

// random walk storage
let points = [];

// parameters
const stepSizePx = 30;   // scroll pixels per step
const stepLength = 10;   // length of each step

// initialize starting point (top center)
function resetPoints() {
    points = [{
        x: canvas.width / 2,
        y: 0
    }];
}
resetPoints();

// generate next step (biased downward)
function addStep() {
    const last = points[points.length - 1];

    const dx = (Math.random() - 0.5) * 20;   // small horizontal randomness
    const dy = Math.random() * stepLength;   // always downward (biased)

    points.push({
        x: last.x + dx,
        y: last.y + dy
    });
}

// draw full walk
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
}

// scroll handler
window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    const stepsNeeded = Math.floor(scrollTop / stepSizePx);

    // grow
    while (points.length - 1 < stepsNeeded) {
        addStep();
    }

    // shrink (when scrolling up)
    while (points.length - 1 > stepsNeeded) {
        points.pop();
    }

    draw();
});

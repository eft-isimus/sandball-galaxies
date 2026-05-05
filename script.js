const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const plotDiv = document.getElementById("plotDiv");
const walkDiv = document.getElementById("walkDiv");

const crabImg = new Image();
crabImg.src = "crab.png";

const padding = 20;
const margin = 20;
const dpr = window.devicePixelRatio || 1;
const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// ==============================
// RIGHT PANEL: SCROLL WALKER
// ==============================
const rightStepLength = 10; // restored independent step size for right panel

const maxScroll = document.body.scrollHeight - window.innerHeight;
const targetFraction = 2.5;
const stepSizePx = (maxScroll * rightStepLength) / (targetFraction * cssHeight);

const usableWidth = cssWidth - 2 * padding;
const maxStepsX = Math.floor((usableWidth / 2) / rightStepLength);
const centerX = Math.floor(cssWidth / 2 / rightStepLength) * rightStepLength;
const minX = centerX - maxStepsX * rightStepLength;
const maxX = centerX + maxStepsX * rightStepLength;

if (canvas && ctx) {
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);
}

let points = [];

function resetPoints() {
    points = [{ x: centerX, y: 0 }];
}

function addStep() {
    const last = points[points.length - 1];
    let dx = 0;
    let dy = 0;

    const atLeft = last.x <= minX;
    const atRight = last.x >= maxX;
    const atTop = last.y <= 0;
    const r = Math.random();

    if (atTop) {
        dy = rightStepLength;
    } else if (atLeft) {
        if (r < 0.5) dy = rightStepLength;
        else dx = rightStepLength;
    } else if (atRight) {
        if (r < 0.5) dy = rightStepLength;
        else dx = -rightStepLength;
    } else {
        if (r < 0.33) dy = rightStepLength;
        else if (r < 0.66) dx = rightStepLength;
        else dx = -rightStepLength;
    }

    points.push({ x: last.x + dx, y: last.y + dy });
}

function drawRightWalker() {
    if (!ctx) return;

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (!points.length) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    if (!crabImg.complete) return;

    const last = points[points.length - 1];
    const size = 20;
    ctx.save();
    ctx.translate(last.x, last.y);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(crabImg, -size / 2, -size / 2, size, size);
    ctx.restore();
}

window.addEventListener("scroll", () => {
    const stepsNeeded = Math.floor(window.scrollY / stepSizePx);

    while (points.length - 1 < stepsNeeded) addStep();
    while (points.length - 1 > stepsNeeded) points.pop();

    drawRightWalker();
});

crabImg.onload = drawRightWalker;
resetPoints();
drawRightWalker();

// ==============================
// TABS
// ==============================
function showTab(id) {
    document.querySelectorAll(".tab-content").forEach(el => {
        el.style.display = "none";
    });

    const target = document.getElementById(id);
    if (target) target.style.display = "block";

    if (id === "tab2") {
        resetTimeEnsemble();
    }
}
window.showTab = showTab;

// ==============================
// TIME ENSEMBLE (BOTTOM / TAB2)
// ==============================
const maxTimeSteps = 100;
const timeStepLength = 1; // independent step size for time-ensemble walk
const W = 300;
const H = 300;
const plotConfig = { displayModeBar: false, responsive: true };

let timeAnimationToken = 0;

function stepTimeWalk(pts) {
    const { x, y } = pts[pts.length - 1];
    const r = Math.random();
    pts.push(
        r < 0.25 ? { x, y: y - timeStepLength } :
        r < 0.5  ? { x, y: y + timeStepLength } :
        r < 0.75 ? { x: x + timeStepLength, y } :
                   { x: x - timeStepLength, y }
    );
}

function computeR2(pts) {
    const n = pts.length;
    const out = [];

    for (let k = 1; k < n; k++) {
        let s = 0;
        for (let t = 0; t < n - k; t++) {
            const dx = pts[t + k].x - pts[t].x;
            const dy = pts[t + k].y - pts[t].y;
            s += dx * dx + dy * dy;
        }
        out[k] = s / (n - k);
    }

    return out;
}

function renderWalkPane(pts) {
    Plotly.newPlot(
        "walkDiv",
        [{
            x: pts.map(p => p.x),
            y: pts.map(p => p.y),
            mode: "lines+markers",
            marker: { size: 3 },
            line: { width: 2 }
        }],
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "x", range: [-25, 25], scaleanchor: "y", scaleratio: 1 },
            yaxis: { title: "y", range: [-25, 25] }
        },
        plotConfig
    );
}

function renderR2Pane(pts) {
    const r2 = computeR2(pts);
    const kVals = [];
    const rVals = [];

    for (let k = 1; k < r2.length; k++) {
        if (r2[k] !== undefined) {
            kVals.push(k);
            rVals.push(r2[k]);
        }
    }

    const idealX = Array.from({ length: maxTimeSteps }, (_, i) => i + 1);
    const idealY = idealX.map(n => n); // slope 1 line: R² = N

    Plotly.newPlot(
        "plotDiv",
        [
            {
                x: kVals,
                y: rVals,
                mode: "lines+markers",
                marker: { size: 4 },
                line: { width: 2 },
                name: "Simulated R²(N)"
            },
            {
                x: idealX,
                y: idealY,
                mode: "lines",
                line: { color: "rgba(255,0,0,0.7)", width: 2 },
                name: "Ideal R²=N"
            }
        ],
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "N" },
            yaxis: { title: "R²(N)" }
        },
        plotConfig
    );
}

function animateWalkThenPlotR2() {
    if (!walkDiv || !plotDiv) return;

    if (!window.Plotly) {
        const msg = "Plotly failed to load.";
        walkDiv.textContent = msg;
        plotDiv.textContent = msg;
        return;
    }

    const token = ++timeAnimationToken;
    const pts = [{ x: 0, y: 0 }];
    const delayMs = 40;
    let stepsDone = 0;

    Plotly.newPlot(
        "plotDiv",
        [],
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "N" },
            yaxis: { title: "R²(N)" }
        },
        plotConfig
    );

    renderWalkPane(pts);

    function tick() {
        if (token !== timeAnimationToken) return;

        if (stepsDone >= maxTimeSteps) {
            renderR2Pane(pts);
            return;
        }

        stepTimeWalk(pts);
        stepsDone += 1;
        renderWalkPane(pts);

        setTimeout(tick, delayMs);
    }

    tick();
}

function resetTimeEnsemble() {
    animateWalkThenPlotR2();
}
window.resetTimeEnsemble = resetTimeEnsemble;

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
const stepLength = 10;

// --- right interactive walker ---
const maxScroll = document.body.scrollHeight - window.innerHeight;
const targetFraction = 2.5;
const stepSizePx = (maxScroll * stepLength) / (targetFraction * cssHeight);

const usableWidth = cssWidth - 2 * padding;
const maxStepsX = Math.floor((usableWidth / 2) / stepLength);
const centerX = Math.floor(cssWidth / 2 / stepLength) * stepLength;
const minX = centerX - maxStepsX * stepLength;
const maxX = centerX + maxStepsX * stepLength;

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
        dy = stepLength;
    } else if (atLeft) {
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

// --- tabs ---
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

// --- time ensemble static plots ---
const maxTimeSteps = 100;
const W = 300;
const H = 300;
const plotConfig = { displayModeBar: false, responsive: true };

function generateWalk(nSteps) {
    const pts = [{ x: 0, y: 0 }];

    for (let i = 0; i < nSteps; i++) {
        const { x, y } = pts[pts.length - 1];
        const r = Math.random();

        pts.push(
            r < 0.25 ? { x, y: y - stepLength } :
            r < 0.5  ? { x, y: y + stepLength } :
            r < 0.75 ? { x: x + stepLength, y } :
                       { x: x - stepLength, y }
        );
    }

    return pts;
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

function renderStaticTimeEnsemble() {
    if (!walkDiv || !plotDiv) {
        console.error("Missing walkDiv or plotDiv in DOM.");
        return;
    }

    if (!window.Plotly) {
        const msg = "Plotly failed to load.";
        walkDiv.textContent = msg;
        plotDiv.textContent = msg;
        return;
    }

    const pts = generateWalk(maxTimeSteps);

    const walkData = [{
        x: pts.map(p => p.x),
        y: pts.map(p => p.y),
        mode: "lines+markers",
        marker: { size: 3 },
        line: { width: 2 }
    }];

    const walkLayout = {
        width: W,
        height: H,
        margin: { t: 20, l: 40, r: 10, b: 40 },
        xaxis: { title: "x", scaleanchor: "y", scaleratio: 1 },
        yaxis: { title: "y" }
    };

    const r2 = computeR2(pts);
    const kVals = [];
    const rVals = [];

    for (let k = 1; k < r2.length; k++) {
        if (r2[k] !== undefined) {
            kVals.push(k);
            rVals.push(r2[k]);
        }
    }

    const r2Data = [{
        x: kVals,
        y: rVals,
        mode: "lines+markers",
        marker: { size: 4 },
        line: { width: 2 }
    }];

    const r2Layout = {
        width: W,
        height: H,
        margin: { t: 20, l: 40, r: 10, b: 40 },
        xaxis: { title: "N" },
        yaxis: { title: "R²(N)" }
    };

    try {
        Plotly.newPlot("walkDiv", walkData, walkLayout, plotConfig);
        Plotly.newPlot("plotDiv", r2Data, r2Layout, plotConfig);
    } catch (err) {
        console.error(err);
        walkDiv.textContent = `Plot render error: ${err.message}`;
        plotDiv.textContent = `Plot render error: ${err.message}`;
    }
}

function resetTimeEnsemble() {
    renderStaticTimeEnsemble();
}

window.resetTimeEnsemble = resetTimeEnsemble;

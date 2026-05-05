const plotDiv = document.getElementById("plotDiv");


function ensurePlotlyLoaded() {
    if (window.Plotly) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js";
        script.onload = () => window.Plotly ? resolve() : reject(new Error("Plotly failed to initialize"));
        script.onerror = () => reject(new Error("Plotly CDN load failed"));
        document.head.appendChild(script);
    });
}

function showPlotError(err) {
    const msg = `Plot rendering failed: ${err.message}`;
    if (walkDiv) walkDiv.textContent = msg;
    if (plotDiv) plotDiv.textContent = msg;
}

const crabImg = new Image();
crabImg.src = "crab.png"; // crab for walker :)
crabImg.onload = draw;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const padding = 20; // pixels of empty space on left/right

// --- High DPI (fix low resolution) ---
const margin = 20;
const dpr = window.devicePixelRatio || 1;

const cssWidth = 200;
const cssHeight = window.innerHeight - 2 * margin;

// parameters
const stepLength = 10;   // fixed step length (grid spacing)
const maxScroll = document.body.scrollHeight - window.innerHeight;
const targetFraction = 2.5; // want ~250% height max
const stepSizePx = (maxScroll * stepLength) / (targetFraction * cssHeight);

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
    const last = points[points.length - 1];

const size = 20;

// move origin to crab position
ctx.save();
ctx.translate(last.x, last.y);

// rotate (-90° = -π/2)
ctx.rotate(-Math.PI / 2);

// draw centered
ctx.drawImage(
    crabImg,
    -size / 2,
    -size / 2,
    size,
    size
    );
    ctx.restore();
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

// to control the tabs
function showTab(id) {
    document.querySelectorAll('.tab-content')
        .forEach(el => el.style.display = 'none');

    document.getElementById(id).style.display = 'block';
}

// --- TIME ENSEMBLE (STATIC PLOTS) ---

const walkDiv = document.getElementById("walkDiv");
const W = 300, H = 300, maxSteps = 100;

const walkLayout = {
    width: W,
    height: H,
    margin: { t: 20, l: 40, r: 10, b: 40 },
    xaxis: { title: "x", scaleanchor: "y", scaleratio: 1 },
    yaxis: { title: "y" }
};

const plotLayout = {
    width: W,
    height: H,
    margin: { t: 20, l: 40, r: 10, b: 40 },
    xaxis: { title: "N" },
    yaxis: { title: "R²(N)" }
};

const plotConfig = { displayModeBar: false, responsive: false };

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

function computeR2(points) {
    const n = points.length;
    const R2 = [];
    for (let k = 1; k < n; k++) {
        let s = 0;
        for (let t = 0; t < n - k; t++) {
            const dx = points[t + k].x - points[t].x;
            const dy = points[t + k].y - points[t].y;
            s += dx * dx + dy * dy;
        }
        R2[k] = s / (n - k);
    }
    return R2;
}

async function renderStaticTimeEnsemble() {
    await ensurePlotlyLoaded();
    const pts = generateWalk(maxSteps);

    Plotly.newPlot(walkDiv, [{
        x: pts.map(p => p.x),
        y: pts.map(p => p.y),
        mode: "lines+markers",
        marker: { size: 3 },
        line: { width: 2 }
    }], walkLayout, plotConfig);

    const R2 = computeR2(pts);
    const x = [];
    const y = [];
    for (let k = 1; k < R2.length; k++) {
        if (R2[k] !== undefined) {
            x.push(k);
            y.push(R2[k]);
        }
    }

    Plotly.newPlot(plotDiv, [{
        x: x,
        y: y,
        mode: "lines+markers",
        marker: { size: 4 },
        line: { width: 2 }
    }], plotLayout, plotConfig);
}

function resetTimeEnsemble() {
    renderStaticTimeEnsemble().catch(showPlotError);
}

// hook into tabs
const oldShowTab = showTab;
showTab = function(id) {
    oldShowTab(id);
    if (id === "tab2") resetTimeEnsemble();
};

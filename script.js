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
const rightStepLength = 10;

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
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
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
        initTimeEnsemble();
    }
}
window.showTab = showTab;

// ==============================
// TIME ENSEMBLE WITH SLIDER
// ==============================
const timeStepLength = 1;
const maxSliderSteps = 200;
const walkPlotRange = 25;
const W = 300;
const H = 300;
const stepDelayMs = 12; // reduced from 30 -> faster stepping

const plotConfig = { displayModeBar: false, responsive: true };

const stepSlider = document.getElementById("stepSlider");
const stepValue = document.getElementById("stepValue");

let precomputedWalk = [];
let currentStep = 0;
let targetStep = 0;
let sliderTimer = null;

function computeOneStep(x, y) {
    const r = Math.random();
    if (r < 0.25) return { x, y: y - timeStepLength };
    if (r < 0.5) return { x, y: y + timeStepLength };
    if (r < 0.75) return { x: x + timeStepLength, y };
    return { x: x - timeStepLength, y };
}

function buildPrecomputedWalk(nSteps) {
    const pts = [{ x: 0, y: 0 }];
    for (let i = 0; i < nSteps; i++) {
        const last = pts[pts.length - 1];
        pts.push(computeOneStep(last.x, last.y));
    }
    return pts;
}

function extendPrecomputedWalkTo(targetLen) {
    while (precomputedWalk.length < targetLen) {
        const last = precomputedWalk[precomputedWalk.length - 1];
        precomputedWalk.push(computeOneStep(last.x, last.y));
    }
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

function renderWalkPane(stepCount) {
    const pts = precomputedWalk.slice(0, stepCount + 1);

    const trace = [
    // full walk path (up to current step)
    ...(stepCount === 0 ? [] : [{
        x: pts.map(p => p.x),
        y: pts.map(p => p.y),
        mode: "lines+markers",
        marker: { size: 3, color: "rgba(50,50,50,0.5)" },
        line: { width: 2, color: "rgba(50,50,50,0.8)" },
        name: "Walk",
        showlegend: false
    }]),

    // static origin marker
    {
        x: [0],
        y: [0],
        mode: "markers",
        marker: { size: 5, color: "green" },
        name: "Origin",
        showlegend: false
    },

    // current walker position marker
    {
        x: [pts[pts.length - 1].x],
        y: [pts[pts.length - 1].y],
        mode: "markers",
        marker: { size: 5, color: "red" },
        name: "Current Position",
        showlegend: false
    }
];

    Plotly.react(
        "walkDiv",
        trace,
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "x", range: [-walkPlotRange, walkPlotRange], scaleanchor: "y", scaleratio: 1 },
            yaxis: { title: "y", range: [-walkPlotRange, walkPlotRange] }
        },
        plotConfig
    );
}

function renderR2Pane(stepCount) {
    const idealX = Array.from({ length: 201 }, (_, i) => i); // 0..200
    const idealY = idealX.map(n => n);

    let simTrace = [];
    if (stepCount >= 2) {
        const pts = precomputedWalk.slice(0, stepCount + 1);
        const r2 = computeR2(pts);
        const kVals = [];
        const rVals = [];

        for (let k = 1; k < r2.length; k++) {
            if (r2[k] !== undefined) {
                kVals.push(k);
                rVals.push(r2[k]);
            }
        }

        simTrace = [{
            x: kVals,
            y: rVals,
            mode: "lines+markers",
            marker: { size: 4 },
            line: { width: 2 },
            name: "Simulated R²(N)"
        }];
    }

    const idealTrace = {
        x: idealX,
        y: idealY,
        mode: "lines",
        line: { color: "rgba(255,0,0,0.7)", width: 2 },
        name: "Ideal R²=N"
    };

    Plotly.react(
        "plotDiv",
        [...simTrace, idealTrace],
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "N", range: [-5, 205] },
            yaxis: { title: "R²(N)", range: [-5, 205] },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                xanchor: "left",
                yanchor: "top",
                bgcolor: "rgba(255,255,255,0.65)"
            }
        },
        plotConfig
    );
}

function renderTimeEnsemble(stepCount) {
    renderWalkPane(stepCount);
    renderR2Pane(stepCount);
    if (stepValue) stepValue.textContent = String(stepCount);
}

function tickTowardsTarget() {
    if (currentStep === targetStep) {
        sliderTimer = null;
        return;
    }

    currentStep += currentStep < targetStep ? 1 : -1;
    extendPrecomputedWalkTo(currentStep + 1);
    renderTimeEnsemble(currentStep);

    sliderTimer = setTimeout(tickTowardsTarget, stepDelayMs);
}

function setTargetStep(n) {
    targetStep = Math.max(0, Math.min(maxSliderSteps, n));
    if (!sliderTimer) tickTowardsTarget();
}

function initTimeEnsemble() {
    if (!window.Plotly || !walkDiv || !plotDiv || !stepSlider || !stepValue) return;

    precomputedWalk = buildPrecomputedWalk(0);
    currentStep = 0;
    targetStep = 0;

    stepSlider.min = "0";
    stepSlider.max = String(maxSliderSteps);
    stepSlider.step = "1";
    stepSlider.value = "0";

    stepSlider.oninput = (e) => {
        const newVal = Number(e.target.value);
        setTargetStep(newVal);
    };

    renderTimeEnsemble(0);
}

function resetTimeEnsemble() {
    if (sliderTimer) {
        clearTimeout(sliderTimer);
        sliderTimer = null;
    }

    precomputedWalk = buildPrecomputedWalk(0);
    currentStep = 0;
    targetStep = 0;

    if (stepSlider) stepSlider.value = "0";
    renderTimeEnsemble(0);
}
window.resetTimeEnsemble = resetTimeEnsemble;

// ==============================
// PARTICLE ENSEMBLE (TAB 1)
// ==============================
const particleWalkDiv = document.getElementById("particleWalkDiv");
const particlePlotDiv = document.getElementById("particlePlotDiv");
const addWalkBtn = document.getElementById("addWalkBtn");
const particleCount = document.getElementById("particleCount");

const particleMaxWalks = 50;
const particleSteps = 200;
const particleStepLength = 1;
const particleTotalRenderMs = 200; // 0.2 s total
const particleStepDelayMs = particleTotalRenderMs / particleSteps; // 1 ms
const particleWalkRange = 25;

let particleWalks = []; // array of full walks, each walk length = particleSteps + 1
let particleAnimating = false;
let particleCurrentStep = 0;
let particleAnimTimer = null;

// Plotly default color cycle
const particleColors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

function particleOneStep(x, y) {
    const r = Math.random();
    if (r < 0.25) return { x, y: y - particleStepLength };
    if (r < 0.5) return { x, y: y + particleStepLength };
    if (r < 0.75) return { x: x + particleStepLength, y };
    return { x: x - particleStepLength, y };
}

function buildParticleWalk(nSteps) {
    const pts = [{ x: 0, y: 0 }];
    for (let i = 0; i < nSteps; i++) {
        const last = pts[pts.length - 1];
        pts.push(particleOneStep(last.x, last.y));
    }
    return pts;
}

// plain MSD for one walk: R^2(N) = x(N)^2 + y(N)^2
function computePlainR2ForWalk(walk) {
    const out = [];
    for (let n = 1; n < walk.length; n++) {
        const x = walk[n].x;
        const y = walk[n].y;
        out[n] = x * x + y * y;
    }
    return out;
}

// average plain R^2(N) over all currently present walks
function computeParticleEnsembleR2(currentStep) {
    const nWalks = particleWalks.length;
    if (nWalks === 0 || currentStep < 1) return { x: [], y: [] };

    const yAvg = [];
    for (let n = 1; n <= currentStep; n++) {
        let s = 0;
        for (let w = 0; w < nWalks; w++) {
            const p = particleWalks[w][n];
            s += p.x * p.x + p.y * p.y;
        }
        yAvg.push(s / nWalks);
    }

    const xVals = Array.from({ length: currentStep }, (_, i) => i + 1);
    return { x: xVals, y: yAvg };
}

function renderParticleWalkPane(stepCount) {
    if (!particleWalkDiv || !window.Plotly) return;

    const traces = [];

    // draw each walk with low alpha line + endpoint marker in same color
    for (let w = 0; w < particleWalks.length; w++) {
        const colorHex = particleColors[w % particleColors.length];
        const walk = particleWalks[w].slice(0, stepCount + 1);

        if (walk.length > 1) {
            traces.push({
                x: walk.map(p => p.x),
                y: walk.map(p => p.y),
                mode: "lines",
                line: { width: 2, color: colorHex },
                opacity: 0.45,
                showlegend: false
            });
        }

        const end = walk[walk.length - 1];
        traces.push({
            x: [end.x],
            y: [end.y],
            mode: "markers",
            marker: { size: 5, color: colorHex },
            showlegend: false
        });
    }

    // static origin marker (keep size = 5 like your time tab)
    traces.push({
        x: [0],
        y: [0],
        mode: "markers",
        marker: { size: 5, color: "green" },
        showlegend: false
    });

    Plotly.react(
        "particleWalkDiv",
        traces,
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "x", range: [-particleWalkRange, particleWalkRange], scaleanchor: "y", scaleratio: 1 },
            yaxis: { title: "y", range: [-particleWalkRange, particleWalkRange] }
        },
        plotConfig
    );
}

function renderParticleR2Pane(stepCount) {
    if (!particlePlotDiv || !window.Plotly) return;

    const idealX = Array.from({ length: 201 }, (_, i) => i); // 0..200
    const idealY = idealX.map(n => n);

    const avg = computeParticleEnsembleR2(stepCount);

    const traces = [];

    if (avg.x.length > 0) {
        traces.push({
            x: avg.x,
            y: avg.y,
            mode: "lines+markers",
            marker: { size: 4 },
            line: { width: 2 },
            name: "Ensemble ⟨R²(N)⟩"
        });
    }

    traces.push({
        x: idealX,
        y: idealY,
        mode: "lines",
        line: { color: "rgba(255,0,0,0.7)", width: 2 },
        name: "Ideal R²=N"
    });

    Plotly.react(
        "particlePlotDiv",
        traces,
        {
            width: W,
            height: H,
            margin: { t: 20, l: 40, r: 10, b: 40 },
            xaxis: { title: "N", range: [-5, 205] },
            yaxis: { title: "R²(N)", range: [-5, 205] },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                xanchor: "left",
                yanchor: "top",
                bgcolor: "rgba(255,255,255,0.65)"
            }
        },
        plotConfig
    );
}

function renderParticle(stepCount) {
    renderParticleWalkPane(stepCount);
    renderParticleR2Pane(stepCount);
    if (particleCount) particleCount.textContent = String(particleWalks.length);
}

function particleTick() {
    if (particleCurrentStep >= particleSteps) {
        particleAnimating = false;
        particleAnimTimer = null;
        return;
    }

    particleCurrentStep += 1;
    renderParticle(particleCurrentStep);

    particleAnimTimer = setTimeout(particleTick, particleStepDelayMs);
}

function startParticleAnimationFromZero() {
    if (particleAnimTimer) {
        clearTimeout(particleAnimTimer);
        particleAnimTimer = null;
    }
    particleAnimating = true;
    particleCurrentStep = 0;
    renderParticle(0);
    particleTick();
}

function updateAddWalkButtonState() {
    if (!addWalkBtn) return;
    const atMax = particleWalks.length >= particleMaxWalks;
    addWalkBtn.disabled = atMax;
}

function addParticleWalk() {
    if (particleAnimating) return;
    if (particleWalks.length >= particleMaxWalks) return;

    particleWalks.push(buildParticleWalk(particleSteps));
    updateAddWalkButtonState();
    startParticleAnimationFromZero();
}

function initParticleEnsemble() {
    if (!window.Plotly || !particleWalkDiv || !particlePlotDiv || !addWalkBtn) return;

    if (particleWalks.length === 0) {
        particleWalks.push(buildParticleWalk(particleSteps)); // initial single walk
        updateAddWalkButtonState();
        startParticleAnimationFromZero();
    } else {
        renderParticle(particleCurrentStep);
    }

    addWalkBtn.onclick = addParticleWalk;
}

/**
 * widgets.js — Interactive SVG widgets for A-level Statistics 1 teacher slides
 * Vanilla JS + SVG only. No external dependencies. Works offline.
 *
 * Color palette:
 *   Blue accent:   #0A5CFF
 *   Blue light bg: #E6F0FF
 *   Text:          #2F3B4C
 *   Green:         #16A34A
 *   Amber:         #D97706
 *   Border:        #E5E7EB
 */

// ============================================================
// WIDGET 1: Normal Distribution Slider
// ============================================================

function initNormalDist(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.color = '#2F3B4C';

  const SVG_W = 400, SVG_H = 200;
  const PAD = { top: 15, right: 20, bottom: 35, left: 20 };
  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = SVG_H - PAD.top - PAD.bottom;
  const X_MIN = -5, X_MAX = 5;

  // State
  let mu = 0, sigma = 1, bx = 1;

  // --- Build DOM ---
  container.innerHTML = '';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.display = 'block';
  svg.style.border = '1px solid #E5E7EB';
  svg.style.borderRadius = '8px';
  svg.style.background = '#FAFAFA';

  // Shade path
  const shadePath = document.createElementNS(svgNS, 'path');
  shadePath.setAttribute('fill', '#0A5CFF');
  shadePath.setAttribute('fill-opacity', '0.2');
  shadePath.setAttribute('stroke', 'none');
  svg.appendChild(shadePath);

  // Curve path
  const curvePath = document.createElementNS(svgNS, 'path');
  curvePath.setAttribute('fill', 'none');
  curvePath.setAttribute('stroke', '#0A5CFF');
  curvePath.setAttribute('stroke-width', '2.5');
  svg.appendChild(curvePath);

  // Axis line
  const axisLine = document.createElementNS(svgNS, 'line');
  axisLine.setAttribute('stroke', '#2F3B4C');
  axisLine.setAttribute('stroke-width', '1.5');
  svg.appendChild(axisLine);

  // Tick/label group
  const tickGroup = document.createElementNS(svgNS, 'g');
  svg.appendChild(tickGroup);

  // Boundary vertical line
  const bLine = document.createElementNS(svgNS, 'line');
  bLine.setAttribute('stroke', '#D97706');
  bLine.setAttribute('stroke-width', '1.5');
  bLine.setAttribute('stroke-dasharray', '4,3');
  svg.appendChild(bLine);

  container.appendChild(svg);

  // Info labels
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = 'margin-top:8px;padding:8px 12px;background:#E6F0FF;border-radius:6px;font-size:13px;line-height:1.7;';
  container.appendChild(infoDiv);

  // Sliders
  function makeSliderRow(label, min, max, step, value, onChange) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:7px;font-size:13px;';
    const lbl = document.createElement('label');
    lbl.style.cssText = 'width:120px;flex-shrink:0;color:#2F3B4C;font-weight:600;';
    lbl.textContent = label;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.cssText = 'flex:1;accent-color:#0A5CFF;';
    const val = document.createElement('span');
    val.style.cssText = 'width:40px;text-align:right;color:#0A5CFF;font-weight:700;';
    val.textContent = value;
    slider.addEventListener('input', () => {
      val.textContent = slider.value;
      onChange(parseFloat(slider.value));
    });
    row.appendChild(lbl);
    row.appendChild(slider);
    row.appendChild(val);
    return row;
  }

  container.appendChild(makeSliderRow('μ (mean): ', -5, 5, 0.1, 0, v => { mu = v; render(); }));
  container.appendChild(makeSliderRow('σ (std dev): ', 0.5, 3, 0.1, 1, v => { sigma = v; render(); }));
  container.appendChild(makeSliderRow('Boundary x: ', -4, 4, 0.1, 1, v => { bx = v; render(); }));

  // Helpers
  function pdf(x) {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
  }

  function toSvgX(x) {
    return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  }

  function toSvgY(y, yMax) {
    return PAD.top + plotH - (y / yMax) * plotH;
  }

  function normalCDF(z) {
    // Abramowitz & Stegun approximation
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);
    const t = 1 / (1 + 0.2316419 * z);
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const result = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;
    return sign === 1 ? result : 1 - result;
  }

  function render() {
    const SAMPLES = 200;
    const xs = [];
    for (let i = 0; i <= SAMPLES; i++) {
      xs.push(X_MIN + (i / SAMPLES) * (X_MAX - X_MIN));
    }
    const ys = xs.map(x => pdf(x));
    const yMax = Math.max(...ys) * 1.15;

    // Curve path
    let curveParts = [];
    xs.forEach((x, i) => {
      const cx = toSvgX(x);
      const cy = toSvgY(ys[i], yMax);
      curveParts.push(`${i === 0 ? 'M' : 'L'}${cx.toFixed(2)},${cy.toFixed(2)}`);
    });
    curvePath.setAttribute('d', curveParts.join(' '));

    // Shade area left of bx
    const axisY = toSvgY(0, yMax);
    let shadeParts = [];
    const clampedBx = Math.min(Math.max(bx, X_MIN), X_MAX);
    const shadeXs = xs.filter(x => x <= clampedBx);
    if (shadeXs.length > 0) {
      shadeXs.forEach((x, i) => {
        const cx = toSvgX(x);
        const cy = toSvgY(pdf(x), yMax);
        shadeParts.push(`${i === 0 ? 'M' : 'L'}${cx.toFixed(2)},${cy.toFixed(2)}`);
      });
      // Close down to axis
      const lastX = toSvgX(shadeXs[shadeXs.length - 1]);
      shadeParts.push(`L${lastX.toFixed(2)},${axisY.toFixed(2)}`);
      shadeParts.push(`L${toSvgX(shadeXs[0]).toFixed(2)},${axisY.toFixed(2)}`);
      shadeParts.push('Z');
    }
    shadePath.setAttribute('d', shadeParts.join(' '));

    // Axis
    axisLine.setAttribute('x1', PAD.left);
    axisLine.setAttribute('y1', axisY);
    axisLine.setAttribute('x2', PAD.left + plotW);
    axisLine.setAttribute('y2', axisY);

    // Ticks
    tickGroup.innerHTML = '';
    const tickPositions = [
      { x: mu - 2 * sigma, label: 'μ-2σ' },
      { x: mu - sigma, label: 'μ-σ' },
      { x: mu, label: 'μ' },
      { x: mu + sigma, label: 'μ+σ' },
      { x: mu + 2 * sigma, label: 'μ+2σ' },
    ];
    tickPositions.forEach(tp => {
      if (tp.x < X_MIN - 0.1 || tp.x > X_MAX + 0.1) return;
      const tx = toSvgX(tp.x);
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', tx); tick.setAttribute('y1', axisY);
      tick.setAttribute('x2', tx); tick.setAttribute('y2', axisY + 5);
      tick.setAttribute('stroke', '#2F3B4C'); tick.setAttribute('stroke-width', '1');
      tickGroup.appendChild(tick);
      const ttext = document.createElementNS(svgNS, 'text');
      ttext.setAttribute('x', tx);
      ttext.setAttribute('y', axisY + 16);
      ttext.setAttribute('text-anchor', 'middle');
      ttext.setAttribute('font-size', '9');
      ttext.setAttribute('fill', '#2F3B4C');
      ttext.textContent = tp.label;
      tickGroup.appendChild(ttext);
      // Numeric value
      const numVal = tp.x.toFixed(1);
      const ntext = document.createElementNS(svgNS, 'text');
      ntext.setAttribute('x', tx);
      ntext.setAttribute('y', axisY + 27);
      ntext.setAttribute('text-anchor', 'middle');
      ntext.setAttribute('font-size', '8');
      ntext.setAttribute('fill', '#888');
      ntext.textContent = numVal;
      tickGroup.appendChild(ntext);
    });

    // Boundary vertical line
    const bsvgX = toSvgX(clampedBx);
    bLine.setAttribute('x1', bsvgX); bLine.setAttribute('y1', PAD.top);
    bLine.setAttribute('x2', bsvgX); bLine.setAttribute('y2', axisY);

    // Info
    const prob = normalCDF((clampedBx - mu) / sigma);
    const zval = ((clampedBx - mu) / sigma).toFixed(3);
    infoDiv.innerHTML =
      `<span style="color:#D97706;font-weight:700;">Boundary: x = ${clampedBx.toFixed(2)}</span> &nbsp;|&nbsp; ` +
      `<span style="color:#2F3B4C;font-weight:600;">Z = (${clampedBx.toFixed(2)} − ${mu.toFixed(2)}) / ${sigma.toFixed(2)} = <b>${zval}</b></span>` +
      `<br><span style="color:#0A5CFF;font-weight:700;">P(X &lt; ${clampedBx.toFixed(2)}) = Φ(${zval}) = <b>${prob.toFixed(4)}</b></span>`;
  }

  render();
}

// ============================================================
// WIDGET 2: Histogram Builder (Frequency Density)
// ============================================================

function initHistogram(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.color = '#2F3B4C';

  const SVG_W = 400, SVG_H = 220;
  const PAD = { top: 15, right: 20, bottom: 40, left: 55 };
  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = SVG_H - PAD.top - PAD.bottom;
  const svgNS = 'http://www.w3.org/2000/svg';

  const classes = [
    { label: '150–155', lower: 150, upper: 155, freq: 4 },
    { label: '155–160', lower: 155, upper: 160, freq: 12 },
    { label: '160–165', lower: 160, upper: 165, freq: 18 },
    { label: '165–170', lower: 165, upper: 170, freq: 10 },
    { label: '170–175', lower: 170, upper: 175, freq: 6 },
  ];

  const freqs = classes.map(c => c.freq);
  const xMin = classes[0].lower;
  const xMax = classes[classes.length - 1].upper;
  const totalRange = xMax - xMin;

  container.innerHTML = '';

  // SVG
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.cssText = 'display:block;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;';
  container.appendChild(svg);

  // Total area label
  const totalDiv = document.createElement('div');
  totalDiv.style.cssText = 'margin-top:8px;padding:6px 12px;background:#E6F0FF;border-radius:6px;font-size:13px;font-weight:600;color:#0A5CFF;';
  container.appendChild(totalDiv);

  // Controls
  const ctrlDiv = document.createElement('div');
  ctrlDiv.style.cssText = 'margin-top:10px;';
  container.appendChild(ctrlDiv);

  function toSvgX(val) {
    return PAD.left + ((val - xMin) / totalRange) * plotW;
  }

  function render() {
    svg.innerHTML = '';

    const fds = classes.map(c => c.freq / (c.upper - c.lower));
    const maxFD = Math.max(...fds) * 1.15;

    function toSvgY(fd) {
      return PAD.top + plotH - (fd / maxFD) * plotH;
    }

    const axisY = PAD.top + plotH;

    // Bars
    classes.forEach((cls, i) => {
      const fd = fds[i];
      const x1 = toSvgX(cls.lower);
      const x2 = toSvgX(cls.upper);
      const bw = x2 - x1;
      const barTop = toSvgY(fd);
      const barH = axisY - barTop;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', x1);
      rect.setAttribute('y', barTop);
      rect.setAttribute('width', bw);
      rect.setAttribute('height', barH);
      rect.setAttribute('fill', '#0A5CFF');
      rect.setAttribute('fill-opacity', '0.75');
      rect.setAttribute('stroke', '#fff');
      rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);

      // FD value label
      const fdLabel = document.createElementNS(svgNS, 'text');
      fdLabel.setAttribute('x', (x1 + x2) / 2);
      fdLabel.setAttribute('y', Math.max(barTop - 4, PAD.top + 10));
      fdLabel.setAttribute('text-anchor', 'middle');
      fdLabel.setAttribute('font-size', '10');
      fdLabel.setAttribute('fill', '#2F3B4C');
      fdLabel.setAttribute('font-weight', '600');
      fdLabel.textContent = fd.toFixed(2);
      svg.appendChild(fdLabel);
    });

    // Y axis
    const yAxis = document.createElementNS(svgNS, 'line');
    yAxis.setAttribute('x1', PAD.left); yAxis.setAttribute('y1', PAD.top);
    yAxis.setAttribute('x2', PAD.left); yAxis.setAttribute('y2', axisY);
    yAxis.setAttribute('stroke', '#2F3B4C'); yAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(yAxis);

    // X axis
    const xAxis = document.createElementNS(svgNS, 'line');
    xAxis.setAttribute('x1', PAD.left); xAxis.setAttribute('y1', axisY);
    xAxis.setAttribute('x2', PAD.left + plotW); xAxis.setAttribute('y2', axisY);
    xAxis.setAttribute('stroke', '#2F3B4C'); xAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(xAxis);

    // X axis labels (class boundaries)
    const boundaries = [150, 155, 160, 165, 170, 175];
    boundaries.forEach(b => {
      const bx = toSvgX(b);
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', bx); tick.setAttribute('y1', axisY);
      tick.setAttribute('x2', bx); tick.setAttribute('y2', axisY + 5);
      tick.setAttribute('stroke', '#2F3B4C'); tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', bx); t.setAttribute('y', axisY + 16);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '9');
      t.setAttribute('fill', '#2F3B4C');
      t.textContent = b;
      svg.appendChild(t);
    });

    // X axis title
    const xTitle = document.createElementNS(svgNS, 'text');
    xTitle.setAttribute('x', PAD.left + plotW / 2);
    xTitle.setAttribute('y', SVG_H - 2);
    xTitle.setAttribute('text-anchor', 'middle');
    xTitle.setAttribute('font-size', '10');
    xTitle.setAttribute('fill', '#2F3B4C');
    xTitle.textContent = 'Height (cm)';
    svg.appendChild(xTitle);

    // Y axis label (rotated)
    const yTitle = document.createElementNS(svgNS, 'text');
    yTitle.setAttribute('transform', `translate(12,${PAD.top + plotH / 2}) rotate(-90)`);
    yTitle.setAttribute('text-anchor', 'middle');
    yTitle.setAttribute('font-size', '9');
    yTitle.setAttribute('fill', '#2F3B4C');
    yTitle.textContent = 'Frequency Density';
    svg.appendChild(yTitle);

    // Y tick marks
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const fdVal = (maxFD / yTicks) * i;
      const ty = toSvgY(fdVal);
      const ytick = document.createElementNS(svgNS, 'line');
      ytick.setAttribute('x1', PAD.left - 4); ytick.setAttribute('y1', ty);
      ytick.setAttribute('x2', PAD.left); ytick.setAttribute('y2', ty);
      ytick.setAttribute('stroke', '#2F3B4C'); ytick.setAttribute('stroke-width', '1');
      svg.appendChild(ytick);
      const yt = document.createElementNS(svgNS, 'text');
      yt.setAttribute('x', PAD.left - 6); yt.setAttribute('y', ty + 3);
      yt.setAttribute('text-anchor', 'end'); yt.setAttribute('font-size', '8');
      yt.setAttribute('fill', '#555');
      yt.textContent = fdVal.toFixed(1);
      svg.appendChild(yt);
    }

    // Total area
    const total = classes.reduce((s, c) => s + c.freq, 0);
    const totalArea = classes.reduce((s, c) => s + c.freq / (c.upper - c.lower) * (c.upper - c.lower), 0);
    totalDiv.textContent = `Total area = Σ(freq density × class width) = ${totalArea.toFixed(0)} = total frequency (${total}). Area = frequency — always!`;
  }

  // Build controls
  ctrlDiv.innerHTML = '';
  classes.forEach((cls, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:13px;';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'width:75px;flex-shrink:0;font-weight:600;';
    lbl.textContent = cls.label;
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '−';
    minusBtn.style.cssText = 'width:26px;height:26px;border:1px solid #E5E7EB;border-radius:4px;background:#fff;cursor:pointer;font-size:15px;line-height:1;color:#2F3B4C;';
    const freqVal = document.createElement('span');
    freqVal.style.cssText = 'width:28px;text-align:center;font-weight:700;color:#0A5CFF;';
    freqVal.textContent = cls.freq;
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.style.cssText = minusBtn.style.cssText;
    const fdSpan = document.createElement('span');
    fdSpan.style.cssText = 'color:#16A34A;font-size:12px;';
    function updateFd() {
      fdSpan.textContent = `fd = ${(classes[i].freq / (cls.upper - cls.lower)).toFixed(2)}`;
    }
    minusBtn.addEventListener('click', () => {
      if (classes[i].freq > 1) { classes[i].freq--; freqVal.textContent = classes[i].freq; updateFd(); render(); }
    });
    plusBtn.addEventListener('click', () => {
      if (classes[i].freq < 40) { classes[i].freq++; freqVal.textContent = classes[i].freq; updateFd(); render(); }
    });
    updateFd();
    row.appendChild(lbl);
    row.appendChild(minusBtn);
    row.appendChild(freqVal);
    row.appendChild(plusBtn);
    row.appendChild(fdSpan);
    ctrlDiv.appendChild(row);
  });

  render();
}

// ============================================================
// WIDGET 3: Scatter Plot + Regression Line
// ============================================================

function initScatterRegression(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.color = '#2F3B4C';

  const SVG_W = 380, SVG_H = 220;
  const PAD = { top: 15, right: 20, bottom: 40, left: 45 };
  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = SVG_H - PAD.top - PAD.bottom;
  const svgNS = 'http://www.w3.org/2000/svg';

  let points = [
    [1,45],[2,52],[3,61],[4,58],[5,72],
    [6,78],[7,75],[8,85],[9,88],[10,95]
  ];

  container.innerHTML = '';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.cssText = 'display:block;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;touch-action:none;cursor:crosshair;';
  container.appendChild(svg);

  const eqDiv = document.createElement('div');
  eqDiv.style.cssText = 'margin-top:8px;padding:8px 12px;background:#E6F0FF;border-radius:6px;font-size:13px;font-weight:600;color:#2F3B4C;';
  container.appendChild(eqDiv);

  const hintDiv = document.createElement('div');
  hintDiv.style.cssText = 'margin-top:5px;font-size:11px;color:#888;text-align:center;';
  hintDiv.textContent = 'Drag any point to update the regression line in real time';
  container.appendChild(hintDiv);

  function getDataBounds() {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    return {
      xMin: Math.min(...xs) - 0.5, xMax: Math.max(...xs) + 0.5,
      yMin: Math.max(0, Math.min(...ys) - 10), yMax: Math.max(...ys) + 10
    };
  }

  function toSvgX(x, b) { return PAD.left + ((x - b.xMin) / (b.xMax - b.xMin)) * plotW; }
  function toSvgY(y, b) { return PAD.top + plotH - ((y - b.yMin) / (b.yMax - b.yMin)) * plotH; }
  function fromSvgX(sx, b) { return b.xMin + ((sx - PAD.left) / plotW) * (b.xMax - b.xMin); }
  function fromSvgY(sy, b) { return b.yMin + ((PAD.top + plotH - sy) / plotH) * (b.yMax - b.yMin); }

  function calcRegression() {
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p[0], 0);
    const sumY = points.reduce((s, p) => s + p[1], 0);
    const meanX = sumX / n;
    const meanY = sumY / n;
    const Sxx = points.reduce((s, p) => s + p[0] ** 2, 0) - n * meanX ** 2;
    const Syy = points.reduce((s, p) => s + p[1] ** 2, 0) - n * meanY ** 2;
    const Sxy = points.reduce((s, p) => s + p[0] * p[1], 0) - n * meanX * meanY;
    const b = Sxy / Sxx;
    const a = meanY - b * meanX;
    const r = Sxy / Math.sqrt(Sxx * Syy);
    return { a, b, r, meanX, meanY };
  }

  let dragging = null;

  function getSvgPoint(e) {
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function render() {
    svg.innerHTML = '';
    const b = getDataBounds();
    const reg = calcRegression();

    // Axes
    const axisColor = '#2F3B4C';
    // Y axis
    const yAxis = document.createElementNS(svgNS, 'line');
    yAxis.setAttribute('x1', PAD.left); yAxis.setAttribute('y1', PAD.top);
    yAxis.setAttribute('x2', PAD.left); yAxis.setAttribute('y2', PAD.top + plotH);
    yAxis.setAttribute('stroke', axisColor); yAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(yAxis);
    // X axis
    const xAxis = document.createElementNS(svgNS, 'line');
    xAxis.setAttribute('x1', PAD.left); xAxis.setAttribute('y1', PAD.top + plotH);
    xAxis.setAttribute('x2', PAD.left + plotW); xAxis.setAttribute('y2', PAD.top + plotH);
    xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', '1.5');
    svg.appendChild(xAxis);

    // Axis ticks
    for (let xi = Math.ceil(b.xMin); xi <= Math.floor(b.xMax); xi++) {
      const tx = toSvgX(xi, b);
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', tx); tick.setAttribute('y1', PAD.top + plotH);
      tick.setAttribute('x2', tx); tick.setAttribute('y2', PAD.top + plotH + 4);
      tick.setAttribute('stroke', axisColor); tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', tx); t.setAttribute('y', PAD.top + plotH + 14);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '9');
      t.setAttribute('fill', '#555');
      t.textContent = xi;
      svg.appendChild(t);
    }
    const yStep = Math.ceil((b.yMax - b.yMin) / 5 / 10) * 10;
    for (let yi = Math.ceil(b.yMin / yStep) * yStep; yi <= b.yMax; yi += yStep) {
      const ty = toSvgY(yi, b);
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', PAD.left - 4); tick.setAttribute('y1', ty);
      tick.setAttribute('x2', PAD.left); tick.setAttribute('y2', ty);
      tick.setAttribute('stroke', axisColor); tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', PAD.left - 6); t.setAttribute('y', ty + 3);
      t.setAttribute('text-anchor', 'end'); t.setAttribute('font-size', '9');
      t.setAttribute('fill', '#555');
      t.textContent = yi;
      svg.appendChild(t);
    }

    // Axis labels
    const xLbl = document.createElementNS(svgNS, 'text');
    xLbl.setAttribute('x', PAD.left + plotW / 2);
    xLbl.setAttribute('y', SVG_H - 4);
    xLbl.setAttribute('text-anchor', 'middle'); xLbl.setAttribute('font-size', '10');
    xLbl.setAttribute('fill', '#2F3B4C'); xLbl.textContent = 'Study Hours';
    svg.appendChild(xLbl);
    const yLbl = document.createElementNS(svgNS, 'text');
    yLbl.setAttribute('transform', `translate(11,${PAD.top + plotH / 2}) rotate(-90)`);
    yLbl.setAttribute('text-anchor', 'middle'); yLbl.setAttribute('font-size', '10');
    yLbl.setAttribute('fill', '#2F3B4C'); yLbl.textContent = 'Test Score';
    svg.appendChild(yLbl);

    // Regression line
    const x1r = b.xMin, x2r = b.xMax;
    const y1r = reg.a + reg.b * x1r;
    const y2r = reg.a + reg.b * x2r;
    const regLine = document.createElementNS(svgNS, 'line');
    regLine.setAttribute('x1', toSvgX(x1r, b)); regLine.setAttribute('y1', toSvgY(y1r, b));
    regLine.setAttribute('x2', toSvgX(x2r, b)); regLine.setAttribute('y2', toSvgY(y2r, b));
    regLine.setAttribute('stroke', '#16A34A'); regLine.setAttribute('stroke-width', '2');
    regLine.setAttribute('stroke-dasharray', '6,3');
    svg.appendChild(regLine);

    // Data points
    points.forEach((p, i) => {
      const cx = toSvgX(p[0], b), cy = toSvgY(p[1], b);
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', dragging === i ? '#D97706' : '#0A5CFF');
      circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1.5');
      circle.style.cursor = 'grab';
      svg.appendChild(circle);
    });

    // Mean point (open square)
    const mx = toSvgX(reg.meanX, b), my = toSvgY(reg.meanY, b);
    const sq = document.createElementNS(svgNS, 'rect');
    sq.setAttribute('x', mx - 6); sq.setAttribute('y', my - 6);
    sq.setAttribute('width', '12'); sq.setAttribute('height', '12');
    sq.setAttribute('fill', 'none');
    sq.setAttribute('stroke', '#D97706'); sq.setAttribute('stroke-width', '2.5');
    svg.appendChild(sq);
    const meanLbl = document.createElementNS(svgNS, 'text');
    meanLbl.setAttribute('x', mx + 10); meanLbl.setAttribute('y', my - 6);
    meanLbl.setAttribute('font-size', '9'); meanLbl.setAttribute('fill', '#D97706');
    meanLbl.setAttribute('font-weight', '700');
    meanLbl.textContent = '(x̄,ȳ)';
    svg.appendChild(meanLbl);

    // Equation
    const sign = reg.b >= 0 ? '+' : '−';
    const aFmt = reg.a.toFixed(2), bFmt = Math.abs(reg.b).toFixed(3), rFmt = reg.r.toFixed(4);
    eqDiv.innerHTML = `ŷ = <b>${aFmt}</b> ${sign} <b>${bFmt}</b>x &nbsp;&nbsp;|&nbsp;&nbsp; r = <b style="color:${Math.abs(reg.r) > 0.8 ? '#16A34A' : '#D97706'}">${rFmt}</b>`;
  }

  // Mouse/touch events
  function onPointerDown(e) {
    if (e.target.tagName !== 'circle') return;
    const b = getDataBounds();
    const pt = getSvgPoint(e);
    let closest = -1, minDist = 15;
    points.forEach((p, i) => {
      const dx = toSvgX(p[0], b) - pt.x, dy = toSvgY(p[1], b) - pt.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; closest = i; }
    });
    if (closest >= 0) { dragging = closest; e.preventDefault(); }
  }

  function onPointerMove(e) {
    if (dragging === null) return;
    e.preventDefault();
    const b = getDataBounds();
    const pt = getSvgPoint(e);
    const newX = Math.round(Math.max(b.xMin + 0.5, Math.min(b.xMax - 0.5, fromSvgX(pt.x, b))) * 10) / 10;
    const newY = Math.round(Math.max(b.yMin, Math.min(b.yMax, fromSvgY(pt.y, b))) * 10) / 10;
    points[dragging] = [newX, newY];
    render();
  }

  function onPointerUp() {
    dragging = null;
    render();
  }

  svg.addEventListener('mousedown', onPointerDown);
  svg.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);

  render();
}

// ============================================================
// WIDGET 4: Probability Tree Diagram
// ============================================================

function initProbTree(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.color = '#2F3B4C';

  const SVG_W = 480, SVG_H = 260;
  const svgNS = 'http://www.w3.org/2000/svg';

  const tree = {
    root: { x: 40, y: 130 },
    stage1: [
      { label: 'Rain', prob: 0.3, x: 160, y: 70, id: 'rain' },
      { label: 'No Rain', prob: 0.7, x: 160, y: 200, id: 'norain' },
    ],
    stage2: {
      rain: [
        { label: 'Late', prob: 0.6, x: 310, y: 40, outcome: 'Rain ∩ Late', outProb: 0.18 },
        { label: 'On Time', prob: 0.4, x: 310, y: 100, outcome: 'Rain ∩ On Time', outProb: 0.12 },
      ],
      norain: [
        { label: 'Late', prob: 0.1, x: 310, y: 170, outcome: 'No Rain ∩ Late', outProb: 0.07 },
        { label: 'On Time', prob: 0.9, x: 310, y: 230, outcome: 'No Rain ∩ On Time', outProb: 0.63 },
      ],
    },
    outcomes: [
      { x: 430, y: 40, label: 'P = 0.18' },
      { x: 430, y: 100, label: 'P = 0.12' },
      { x: 430, y: 170, label: 'P = 0.07' },
      { x: 430, y: 230, label: 'P = 0.63' },
    ],
  };

  // Reveal state: 0 = stage1 only, 1 = + rain branches, 2 = + norain branches, 3 = + outcomes
  let revealState = 0;

  container.innerHTML = '';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.cssText = 'display:block;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;cursor:pointer;';
  container.appendChild(svg);

  const hintDiv = document.createElement('div');
  hintDiv.style.cssText = 'margin-top:8px;text-align:center;font-size:12px;color:#0A5CFF;font-weight:600;transition:opacity 0.5s;';
  hintDiv.textContent = 'Click to reveal next branches →';
  container.appendChild(hintDiv);

  function makeLine(x1, y1, x2, y2, color) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color || '#2F3B4C');
    line.setAttribute('stroke-width', '2');
    return line;
  }

  function makeText(x, y, text, options) {
    const t = document.createElementNS(svgNS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('text-anchor', options.anchor || 'middle');
    t.setAttribute('font-size', options.size || '12');
    t.setAttribute('fill', options.fill || '#2F3B4C');
    if (options.weight) t.setAttribute('font-weight', options.weight);
    t.textContent = text;
    return t;
  }

  function makeNode(x, y, label, probStr, color) {
    const g = document.createElementNS(svgNS, 'g');
    const circ = document.createElementNS(svgNS, 'circle');
    circ.setAttribute('cx', x); circ.setAttribute('cy', y);
    circ.setAttribute('r', '5');
    circ.setAttribute('fill', color || '#0A5CFF');
    circ.setAttribute('stroke', '#fff'); circ.setAttribute('stroke-width', '1.5');
    g.appendChild(circ);
    if (label) {
      const lbl = makeText(x + 9, y - 6, label, { anchor: 'start', size: '11', weight: '700', fill: color || '#0A5CFF' });
      g.appendChild(lbl);
    }
    if (probStr) {
      const plbl = makeText(x + 9, y + 8, probStr, { anchor: 'start', size: '10', fill: '#2F3B4C' });
      g.appendChild(plbl);
    }
    return g;
  }

  function render() {
    svg.innerHTML = '';
    const root = tree.root;

    // Root dot
    const rootDot = document.createElementNS(svgNS, 'circle');
    rootDot.setAttribute('cx', root.x); rootDot.setAttribute('cy', root.y);
    rootDot.setAttribute('r', '5'); rootDot.setAttribute('fill', '#2F3B4C');
    svg.appendChild(rootDot);

    // Stage 1 branches (always shown)
    tree.stage1.forEach(node => {
      const line = makeLine(root.x, root.y, node.x, node.y, '#2F3B4C');
      svg.appendChild(line);
      // Prob label on branch midpoint
      const midX = (root.x + node.x) / 2;
      const midY = (root.y + node.y) / 2;
      const offset = node.y < root.y ? -7 : 14;
      svg.appendChild(makeText(midX, midY + offset, node.prob.toString(), { size: '11', fill: '#0A5CFF', weight: '700' }));
      svg.appendChild(makeNode(node.x, node.y, node.label, null, node.id === 'rain' ? '#0A5CFF' : '#16A34A'));
    });

    // Stage 2 — Rain
    if (revealState >= 1) {
      const parent = tree.stage1[0];
      tree.stage2.rain.forEach(node => {
        svg.appendChild(makeLine(parent.x, parent.y, node.x, node.y, '#0A5CFF'));
        const midX = (parent.x + node.x) / 2;
        const midY = (parent.y + node.y) / 2;
        const off = node.y < parent.y ? -7 : 14;
        svg.appendChild(makeText(midX, midY + off, node.prob.toString(), { size: '11', fill: '#0A5CFF', weight: '700' }));
        svg.appendChild(makeNode(node.x, node.y, node.label, null, '#0A5CFF'));
      });
    }

    // Stage 2 — No Rain
    if (revealState >= 2) {
      const parent = tree.stage1[1];
      tree.stage2.norain.forEach(node => {
        svg.appendChild(makeLine(parent.x, parent.y, node.x, node.y, '#16A34A'));
        const midX = (parent.x + node.x) / 2;
        const midY = (parent.y + node.y) / 2;
        const off = node.y < parent.y ? -7 : 14;
        svg.appendChild(makeText(midX, midY + off, node.prob.toString(), { size: '11', fill: '#16A34A', weight: '700' }));
        svg.appendChild(makeNode(node.x, node.y, node.label, null, '#16A34A'));
      });
    }

    // Outcomes
    if (revealState >= 3) {
      const allNodes = [...tree.stage2.rain, ...tree.stage2.norain];
      allNodes.forEach((node, i) => {
        const out = tree.outcomes[i];
        // Connecting line
        svg.appendChild(makeLine(node.x, node.y, out.x - 30, out.y, '#888'));
        // Outcome box
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', out.x - 30); rect.setAttribute('y', out.y - 10);
        rect.setAttribute('width', '75'); rect.setAttribute('height', '20');
        rect.setAttribute('rx', '4'); rect.setAttribute('fill', '#E6F0FF');
        rect.setAttribute('stroke', '#0A5CFF'); rect.setAttribute('stroke-width', '1');
        svg.appendChild(rect);
        svg.appendChild(makeText(out.x + 7, out.y + 4, out.label, { size: '10', fill: '#0A5CFF', weight: '700' }));
      });
    }

    // Hint
    if (revealState === 0) {
      hintDiv.textContent = 'Click to reveal Rain branches →';
      hintDiv.style.opacity = '1';
    } else if (revealState === 1) {
      hintDiv.textContent = 'Click to reveal No Rain branches →';
    } else if (revealState === 2) {
      hintDiv.textContent = 'Click to reveal outcome probabilities →';
    } else {
      hintDiv.textContent = 'All branches revealed. P(Late) = 0.18 + 0.07 = 0.25';
      hintDiv.style.opacity = '0.5';
    }
  }

  svg.addEventListener('click', () => {
    if (revealState < 3) { revealState++; render(); }
  });

  render();
}

// ============================================================
// WIDGET 5: Venn Diagram (Interactive Regions)
// ============================================================

function initVennDiagram(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.color = '#2F3B4C';

  const SVG_W = 380, SVG_H = 220;
  const svgNS = 'http://www.w3.org/2000/svg';

  const probs = {
    pA: 0.40, pB: 0.35, pAB: 0.15,
    pAonly: 0.25, pBonly: 0.20, pNeither: 0.40,
  };

  // Circle centres and radius
  const cx1 = 155, cy1 = 110, r = 80;
  const cx2 = 225, cy2 = 110;

  container.innerHTML = '';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W);
  svg.setAttribute('height', SVG_H);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.cssText = 'display:block;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;cursor:pointer;';
  container.appendChild(svg);

  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = 'margin-top:8px;padding:10px 14px;background:#E6F0FF;border-radius:6px;font-size:13px;line-height:1.8;min-height:52px;color:#2F3B4C;';
  infoDiv.textContent = 'Click a region to see probability details';
  container.appendChild(infoDiv);

  let selected = null;

  // Clip paths for regions
  function buildDefs() {
    const defs = document.createElementNS(svgNS, 'defs');

    // Clip A
    const clipA = document.createElementNS(svgNS, 'clipPath');
    clipA.setAttribute('id', `${containerId}-clipA`);
    const cA = document.createElementNS(svgNS, 'circle');
    cA.setAttribute('cx', cx1); cA.setAttribute('cy', cy1); cA.setAttribute('r', r);
    clipA.appendChild(cA);
    defs.appendChild(clipA);

    // Clip B
    const clipB = document.createElementNS(svgNS, 'clipPath');
    clipB.setAttribute('id', `${containerId}-clipB`);
    const cB = document.createElementNS(svgNS, 'circle');
    cB.setAttribute('cx', cx2); cB.setAttribute('cy', cy2); cB.setAttribute('r', r);
    clipB.appendChild(cB);
    defs.appendChild(clipB);

    return defs;
  }

  function makeCircle(cx, cy, r2, fill, opacity, id) {
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r2);
    c.setAttribute('fill', fill); c.setAttribute('fill-opacity', opacity);
    c.setAttribute('stroke', '#0A5CFF'); c.setAttribute('stroke-width', '2');
    if (id) c.setAttribute('id', id);
    return c;
  }

  function isInCircle(px, py, cx2, cy2, r2) {
    return (px - cx2) ** 2 + (py - cy2) ** 2 <= r2 * r2;
  }

  function getRegion(px, py) {
    const inA = isInCircle(px, py, cx1, cy1, r);
    const inB = isInCircle(px, py, cx2, cy2, r);
    // Bounding rect check
    const inRect = px >= 10 && px <= SVG_W - 10 && py >= 10 && py <= SVG_H - 10;
    if (inA && inB) return 'AB';
    if (inA) return 'A';
    if (inB) return 'B';
    if (inRect) return 'neither';
    return null;
  }

  function render() {
    svg.innerHTML = '';
    svg.appendChild(buildDefs());

    // Sample space rectangle
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', '5'); rect.setAttribute('y', '5');
    rect.setAttribute('width', SVG_W - 10); rect.setAttribute('height', SVG_H - 10);
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', selected === 'neither' ? '#E6F0FF' : '#F9FAFB');
    rect.setAttribute('stroke', '#E5E7EB'); rect.setAttribute('stroke-width', '2');
    svg.appendChild(rect);

    // Neither label
    const nLbl = document.createElementNS(svgNS, 'text');
    nLbl.setAttribute('x', '22'); nLbl.setAttribute('y', '26');
    nLbl.setAttribute('font-size', '11'); nLbl.setAttribute('fill', '#888');
    nLbl.setAttribute('font-weight', '600');
    nLbl.textContent = `Ω   P(neither) = ${probs.pNeither}`;
    svg.appendChild(nLbl);

    // Circle A background
    const bgA = makeCircle(cx1, cy1, r, selected === 'A' ? '#0A5CFF' : '#E6F0FF', selected === 'A' ? 0.25 : 0.5);
    svg.appendChild(bgA);

    // Circle B background
    const bgB = makeCircle(cx2, cy2, r, selected === 'B' ? '#0A5CFF' : '#E6F0FF', selected === 'B' ? 0.25 : 0.5);
    svg.appendChild(bgB);

    // Intersection highlight
    if (selected === 'AB') {
      // Draw A clipped to B to get intersection fill
      const intFill = document.createElementNS(svgNS, 'circle');
      intFill.setAttribute('cx', cx1); intFill.setAttribute('cy', cy1); intFill.setAttribute('r', r);
      intFill.setAttribute('fill', '#0A5CFF'); intFill.setAttribute('fill-opacity', '0.35');
      intFill.setAttribute('clip-path', `url(#${containerId}-clipB)`);
      svg.appendChild(intFill);
    }

    // Circle A outline
    const outA = makeCircle(cx1, cy1, r, 'none', 0);
    svg.appendChild(outA);

    // Circle B outline
    const outB = makeCircle(cx2, cy2, r, 'none', 0);
    svg.appendChild(outB);

    // Labels — A, B
    const lblA = document.createElementNS(svgNS, 'text');
    lblA.setAttribute('x', cx1 - 34); lblA.setAttribute('y', cy1 - r + 18);
    lblA.setAttribute('font-size', '15'); lblA.setAttribute('font-weight', '700');
    lblA.setAttribute('fill', '#0A5CFF'); lblA.textContent = 'A';
    svg.appendChild(lblA);

    const lblB = document.createElementNS(svgNS, 'text');
    lblB.setAttribute('x', cx2 + 24); lblB.setAttribute('y', cy2 - r + 18);
    lblB.setAttribute('font-size', '15'); lblB.setAttribute('font-weight', '700');
    lblB.setAttribute('fill', '#0A5CFF'); lblB.textContent = 'B';
    svg.appendChild(lblB);

    // Region probability labels
    function makeRegionLabel(x, y, text) {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '13'); t.setAttribute('font-weight', '700');
      t.setAttribute('fill', '#2F3B4C');
      t.textContent = text;
      svg.appendChild(t);
    }

    makeRegionLabel(cx1 - 38, cy1 + 5, probs.pAonly.toString());
    makeRegionLabel((cx1 + cx2) / 2, cy1 + 5, probs.pAB.toString());
    makeRegionLabel(cx2 + 38, cy2 + 5, probs.pBonly.toString());

    // Info panel
    if (selected === null) {
      infoDiv.textContent = 'Click a region to see probability details';
    } else if (selected === 'A') {
      infoDiv.innerHTML =
        `<b>Region: A only</b><br>` +
        `P(A only) = P(A) − P(A∩B) = ${probs.pA} − ${probs.pAB} = <b>${probs.pAonly}</b><br>` +
        `P(A|B) = P(A∩B) / P(B) = ${probs.pAB} / ${probs.pB} = <b>${(probs.pAB / probs.pB).toFixed(2)}</b>`;
    } else if (selected === 'B') {
      infoDiv.innerHTML =
        `<b>Region: B only</b><br>` +
        `P(B only) = P(B) − P(A∩B) = ${probs.pB} − ${probs.pAB} = <b>${probs.pBonly}</b><br>` +
        `P(B|A) = P(A∩B) / P(A) = ${probs.pAB} / ${probs.pA} = <b>${(probs.pAB / probs.pA).toFixed(2)}</b>`;
    } else if (selected === 'AB') {
      infoDiv.innerHTML =
        `<b>Region: A ∩ B</b> &nbsp; P(A∩B) = <b>${probs.pAB}</b><br>` +
        `P(A|B) = P(A∩B) / P(B) = ${probs.pAB} / ${probs.pB} = <b>${(probs.pAB / probs.pB).toFixed(2)}</b><br>` +
        `P(B|A) = P(A∩B) / P(A) = ${probs.pAB} / ${probs.pA} = <b>${(probs.pAB / probs.pA).toFixed(2)}</b>`;
    } else if (selected === 'neither') {
      infoDiv.innerHTML =
        `<b>Region: Neither A nor B</b><br>` +
        `P(neither) = 1 − P(A) − P(B) + P(A∩B) = 1 − ${probs.pA} − ${probs.pB} + ${probs.pAB} = <b>${probs.pNeither}</b>`;
    }
  }

  svg.addEventListener('click', (e) => {
    const rect2 = svg.getBoundingClientRect();
    const px = e.clientX - rect2.left;
    const py = e.clientY - rect2.top;
    const region = getRegion(px, py);
    selected = (selected === region) ? null : region;
    render();
  });

  render();
}

// ============================================================
// Auto-init: elements with data-widget attribute
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-widget]').forEach(el => {
    const fn = {
      'normal-dist': initNormalDist,
      'histogram': initHistogram,
      'scatter': initScatterRegression,
      'prob-tree': initProbTree,
      'venn': initVennDiagram,
    }[el.dataset.widget];
    if (fn) fn(el.id);
  });
});

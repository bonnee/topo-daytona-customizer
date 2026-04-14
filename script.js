const config = {
    dialMaterials: [
        { label: 'Aluminium - Gold Anodization', value: 'gold.png' },
        { label: 'Aluminium - Black Anodization', value: 'black.png' },
        { label: 'Aluminium - Blue Anodization', value: 'blue.png' },
        { label: 'Aluminium - Champagne Anodization', value: 'champagne.png' },
        { label: 'Aluminium - Gray Anodization', value: 'gray.png' },
        { label: 'Aluminium - Green Anodization', value: 'green.png' },
        { label: 'Aluminium - Natural Anodization', value: 'natural.png' },
        { label: 'Aluminium - Orange Anodization', value: 'orange.png' },
        { label: 'Aluminium - Purple Anodization', value: 'purple.png' },
        { label: 'Aluminium - Rose Gold Anodization', value: 'rosegold.png' },
        { label: 'Carbon Fiber', value: 'carbon.png' },
        { label: 'Marble', value: 'marble.png' },
    ],
    capMaterials: [
        { label: 'Paint Finish', value: 'none' },
        { label: 'Brass', value: 'export/needle_cap/brass.png' },
        { label: 'Copper', value: 'export/needle_cap/copper.png' },
        { label: 'Steel', value: 'export/needle_cap/steel.png' },
    ],
    embossingMaterials: [
        { label: 'Paint Finish', value: 'none' },
        { label: 'Gray Metallic', value: 'gray_metallic' },
    ],
    gauges: [
        {
            id: 'water-temp',
            type: 'small',
            silk: 'export/silkscreen/water.svg',
            embossing: 'export/embossing/water.svg',
            embossingKey: 'water',
            decoration: 'export/decorations/water.svg',
            needleTemplate: 'export/needle/left_template.svg',
            capTemplate: 'export/needle_cap/left_template.svg',
            pivot: 'offset-right'
        },
        {
            id: 'fuel',
            type: 'small',
            silk: 'export/silkscreen/fuel.svg',
            embossing: 'export/embossing/fuel.svg',
            embossingKey: 'fuel',
            decoration: 'export/decorations/fuel.svg',
            needleTemplate: 'export/needle/left_template.svg',
            capTemplate: 'export/needle_cap/left_template.svg',
            pivot: 'offset-right'
        },
        {
            id: 'speedo',
            type: 'big',
            silk: 'export/silkscreen/speedo.svg',
            embossing: 'export/embossing/speedo.svg',
            embossingKey: 'speedo',
            decoration: 'export/decorations/speedo.svg',
            needleTemplate: 'export/needle/big_template.svg',
            capTemplate: 'export/needle_cap/big_template.svg',
            pivot: 'center'
        },
        {
            id: 'tacho',
            type: 'big',
            silk: 'export/silkscreen/tacho.svg',
            embossing: 'export/embossing/tacho.svg',
            embossingKey: 'tacho',
            decoration: 'export/decorations/tacho.svg',
            needleTemplate: 'export/needle/big_template.svg',
            capTemplate: 'export/needle_cap/big_template.svg',
            pivot: 'center'
        },
        {
            id: 'oil-press',
            type: 'small',
            silk: 'export/silkscreen/oilpress.svg',
            embossing: 'export/embossing/oilpress.svg',
            embossingKey: 'oilpress',
            decoration: 'export/decorations/oilpress.svg',
            needleTemplate: 'export/needle/right_template.svg',
            capTemplate: 'export/needle_cap/right_template.svg',
            pivot: 'offset-left'
        },
        {
            id: 'oil-temp',
            type: 'small',
            silk: 'export/silkscreen/oiltemp.svg',
            embossing: 'export/embossing/oiltemp.svg',
            embossingKey: 'oiltemp',
            decoration: 'export/decorations/oiltemp.svg',
            needleTemplate: 'export/needle/right_template.svg',
            capTemplate: 'export/needle_cap/right_template.svg',
            pivot: 'offset-left'
        },
    ]
};

const clusterContainer = document.getElementById('gauge-cluster');
const missingAssetLog = new Set();
const embossingSizeCache = new Map();

function logMissingAssetOnce(kind, assetPath) {
    const key = `${kind}:${assetPath}`;
    if (missingAssetLog.has(key)) return;
    missingAssetLog.add(key);
    console.warn(`Missing ${kind} asset: ${assetPath}`);
}

function parseSvgLength(value) {
    if (!value) return null;
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
}

function getFallbackGaugeSize(type) {
    return type === 'big'
        ? { width: 430, height: 430 }
        : { width: 210, height: 210 };
}

async function getEmbossingSize(url, gaugeType) {
    const fallback = getFallbackGaugeSize(gaugeType);
    if (!url) return fallback;
    if (embossingSizeCache.has(url)) return embossingSizeCache.get(url);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) throw new Error('SVG root not found');

        const widthAttr = parseSvgLength(svg.getAttribute('width'));
        const heightAttr = parseSvgLength(svg.getAttribute('height'));
        let width = widthAttr;
        let height = heightAttr;

        if (!(width && height)) {
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.trim().split(/\s+/).map(Number.parseFloat);
                if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
                    width = parts[2];
                    height = parts[3];
                }
            }
        }

        const size = (width && height)
            ? { width, height }
            : fallback;

        embossingSizeCache.set(url, size);
        return size;
    } catch (e) {
        logMissingAssetOnce('embossing size', url);
        embossingSizeCache.set(url, fallback);
        return fallback;
    }
}

async function loadSVG(url, silent = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (svg) {
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        return svg;
    } catch (e) {
        if (!silent) {
            console.error(`Failed to load SVG: ${url}`, e);
        }
        return null;
    }
}

function applyEmbossingColorToSvg(svg) {
    const fillElements = svg.querySelectorAll('path, polygon, circle, ellipse, rect, text, tspan');
    fillElements.forEach(el => {
        const style = (el.getAttribute('style') || '').toLowerCase();
        const fillAttr = (el.getAttribute('fill') || '').toLowerCase();
        if (fillAttr === 'none' || style.includes('fill:none')) {
            return;
        }
        el.style.fill = 'var(--embossing-color)';
    });

    const strokeElements = svg.querySelectorAll('line, polyline');
    strokeElements.forEach(el => {
        const style = (el.getAttribute('style') || '').toLowerCase();
        const hasStrokeAttr = el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none';
        const hasStrokeStyle = style.includes('stroke:') && !style.includes('stroke:none');
        if (hasStrokeAttr || hasStrokeStyle) {
            el.style.stroke = 'var(--embossing-color)';
        }
    });
}

function getCapTextureOffsetX(gaugeConfig) {
    if (gaugeConfig.type === 'big') return 0;
    if (gaugeConfig.pivot === 'offset-right') return 68;
    if (gaugeConfig.pivot === 'offset-left') return -68;
    return 0;
}

function getCapTextureScale(gaugeConfig) {
    return gaugeConfig.type === 'big' ? '10%' : '20%';
}

async function createGauge(gaugeConfig) {
    const gaugeDiv = document.createElement('div');
    gaugeDiv.className = `gauge ${gaugeConfig.type} pivot-${gaugeConfig.pivot}`;
    gaugeDiv.id = `gauge-${gaugeConfig.id}`;

    const gaugeSize = await getEmbossingSize(gaugeConfig.embossing, gaugeConfig.type);
    gaugeDiv.style.setProperty('--gauge-width', `${gaugeSize.width}px`);
    gaugeDiv.style.setProperty('--gauge-height', `${gaugeSize.height}px`);
    gaugeDiv.style.setProperty('--cap-material-size-local', getCapTextureScale(gaugeConfig));
    gaugeDiv.style.setProperty('--cap-texture-offset-x-local', `${getCapTextureOffsetX(gaugeConfig)}px`);
    gaugeDiv.style.setProperty('--cap-texture-offset-y-local', '0px');

    // 1. Material Background Layer
    const materialLayer = document.createElement('div');
    materialLayer.className = 'gauge-layer layer-material';
    gaugeDiv.appendChild(materialLayer);

    // 2. Embossing Layers
    const embossingColorLayer = document.createElement('div');
    embossingColorLayer.className = 'gauge-layer layer-svg layer-embossing-color';
    const embossingSvg = await loadSVG(gaugeConfig.embossing, true);
    if (embossingSvg) {
        applyEmbossingColorToSvg(embossingSvg);
        embossingColorLayer.appendChild(embossingSvg);
    } else {
        logMissingAssetOnce('embossing', gaugeConfig.embossing);
        embossingColorLayer.style.display = 'none';
    }
    gaugeDiv.appendChild(embossingColorLayer);

    const embossingMaterialLayer = document.createElement('div');
    embossingMaterialLayer.className = 'gauge-layer layer-embossing-material';
    if (gaugeConfig.embossing) {
        embossingMaterialLayer.style.webkitMaskImage = `url('${gaugeConfig.embossing}')`;
        embossingMaterialLayer.style.maskImage = `url('${gaugeConfig.embossing}')`;
        embossingMaterialLayer.dataset.embossingKey = gaugeConfig.embossingKey || '';
    } else {
        embossingMaterialLayer.style.display = 'none';
    }
    gaugeDiv.appendChild(embossingMaterialLayer);

    // 3. Markings Layer (Silkscreen)
    const silkLayer = document.createElement('div');
    silkLayer.className = 'gauge-layer layer-svg layer-silkscreen';
    const silkSvg = await loadSVG(gaugeConfig.silk);
    if (silkSvg) silkLayer.appendChild(silkSvg);
    gaugeDiv.appendChild(silkLayer);

    // 4. Decorations Layer (static top overlay)
    const decorationPath = gaugeConfig.decoration;
    if (decorationPath) {
        const decorationLayer = document.createElement('div');
        decorationLayer.className = 'gauge-layer layer-svg layer-decoration';
        const decorationSvg = await loadSVG(decorationPath);
        if (decorationSvg) {
            decorationLayer.appendChild(decorationSvg);
            gaugeDiv.appendChild(decorationLayer);
        }
    }

    // 5. Needle Layer
    const needleLayer = document.createElement('div');
    needleLayer.className = 'gauge-layer layer-svg layer-needle';
    const needlePath = gaugeConfig.needleTemplate;
    const needleSvg = await loadSVG(needlePath);
    if (needleSvg) {
        needleLayer.appendChild(needleSvg);
    } else {
        logMissingAssetOnce('needle template', needlePath);
        needleLayer.style.display = 'none';
    }
    gaugeDiv.appendChild(needleLayer);

    // 6. Cap Layer (Template-as-Mask)
    const capLayer = document.createElement('div');
    capLayer.className = 'gauge-layer layer-cap-masked';
    if (gaugeConfig.capTemplate) {
        capLayer.style.webkitMaskImage = `url('${gaugeConfig.capTemplate}')`;
        capLayer.style.maskImage = `url('${gaugeConfig.capTemplate}')`;
    } else {
        logMissingAssetOnce('cap template', gaugeConfig.id);
        capLayer.style.display = 'none';
    }
    gaugeDiv.appendChild(capLayer);

    return gaugeDiv;
}

function updateUI() {
    const materialSelect = document.getElementById('dial-material');
    materialSelect.innerHTML = config.dialMaterials.map(m => `<option value="${m.value}">${m.label}</option>`).join('');

    const capSelect = document.getElementById('cap-material');
    capSelect.innerHTML = config.capMaterials.map(m => `<option value="${m.value}">${m.label}</option>`).join('');

    const embossingSelect = document.getElementById('embossing-material');
    embossingSelect.innerHTML = config.embossingMaterials.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
}

function applyCapMaterialState(materialPath) {
    if (materialPath === 'none') {
        document.documentElement.style.setProperty('--cap-material-img', 'none');
        document.querySelectorAll('.gauge').forEach(g => g.classList.remove('has-cap-material'));
        return;
    }

    document.documentElement.style.setProperty('--cap-material-img', `url('${materialPath}')`);
    document.querySelectorAll('.gauge').forEach(g => g.classList.add('has-cap-material'));
}

function applyEmbossingState(materialKey) {
    const materialLayers = document.querySelectorAll('.layer-embossing-material');
    const gauges = document.querySelectorAll('.gauge');

    if (materialKey === 'none') {
        materialLayers.forEach(layer => {
            layer.style.backgroundImage = 'none';
        });
        gauges.forEach(g => g.classList.remove('has-embossing-material'));
        return;
    }

    gauges.forEach(g => g.classList.add('has-embossing-material'));
    materialLayers.forEach(layer => {
        const embossingKey = layer.dataset.embossingKey;
        if (!embossingKey) return;
        const pngPath = `export/embossing/${embossingKey}_${materialKey}.png`;
        layer.style.backgroundImage = `url('${pngPath}')`;
    });
}

function applyCurrentSelections() {
    const dialMaterial = document.getElementById('dial-material').value;
    const capMaterial = document.getElementById('cap-material').value;
    const needleColor = document.getElementById('needle-color').value;
    const capColor = document.getElementById('cap-color').value;
    const silkscreenColor = document.getElementById('silkscreen-color').value;
    const embossingMaterial = document.getElementById('embossing-material').value;
    const embossingColor = document.getElementById('embossing-color').value;

    document.documentElement.style.setProperty('--dial-material-big', `url('export/dial_big/${dialMaterial}')`);
    document.documentElement.style.setProperty('--dial-material-small', `url('export/dial_small/${dialMaterial}')`);
    document.documentElement.style.setProperty('--needle-color', needleColor);
    document.documentElement.style.setProperty('--cap-color', capColor);
    document.documentElement.style.setProperty('--silkscreen-color', silkscreenColor);
    document.documentElement.style.setProperty('--embossing-color', embossingColor);

    applyCapMaterialState(capMaterial);
    applyEmbossingState(embossingMaterial);
}

function getCurrentSelectionState() {
    return {
        dialMaterial: document.getElementById('dial-material').value,
        capMaterial: document.getElementById('cap-material').value,
        capColor: document.getElementById('cap-color').value,
        needleColor: document.getElementById('needle-color').value,
        silkscreenColor: document.getElementById('silkscreen-color').value,
        embossingMaterial: document.getElementById('embossing-material').value,
        embossingColor: document.getElementById('embossing-color').value,
    };
}

function buildExportPayload() {
    const selected = getCurrentSelectionState();
    const isCapMaterial = selected.capMaterial !== 'none';
    const isEmbossingMaterial = selected.embossingMaterial !== 'none';

    return {
        exportedAt: new Date().toISOString(),
        formatVersion: 1,
        selections: selected,
        resolvedLayers: {
            dialBig: `export/dial_big/${selected.dialMaterial}`,
            dialSmall: `export/dial_small/${selected.dialMaterial}`,
            cap: {
                mode: isCapMaterial ? 'material' : 'color',
                material: isCapMaterial ? selected.capMaterial : null,
                color: isCapMaterial ? null : selected.capColor,
            },
            embossing: {
                mode: isEmbossingMaterial ? 'material' : 'color',
                materialKey: isEmbossingMaterial ? selected.embossingMaterial : null,
                color: isEmbossingMaterial ? null : selected.embossingColor,
            },
            needleColor: selected.needleColor,
            silkscreenColor: selected.silkscreenColor,
        },
        gauges: config.gauges.map(g => ({
            id: g.id,
            type: g.type,
            pivot: g.pivot,
            assets: {
                silk: g.silk,
                embossing: g.embossing,
                embossingMaterial: selected.embossingMaterial === 'none'
                    ? null
                    : `export/embossing/${g.embossingKey}_${selected.embossingMaterial}.png`,
                decoration: g.decoration,
                needleTemplate: g.needleTemplate,
                capTemplate: g.capTemplate,
            }
        }))
    };
}

function exportConfigToFile() {
    const payload = buildExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gauge-config-${timestamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

async function exportClusterImage() {
    const cluster = document.getElementById('gauge-cluster');
    if (!cluster) return;

    if (!window.htmlToImage || !window.htmlToImage.toPng) {
        alert('Image export library did not load.');
        return;
    }

    try {
        const dataUrl = await window.htmlToImage.toPng(cluster, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: null,
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = `gauge-cluster-${timestamp}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } catch (e) {
        console.error('Failed to export image', e);
        alert('Failed to export PNG. Open the page via a local web server and try again.');
    }
}

async function init() {
    clusterContainer.innerHTML = 'Loading gauges...';
    updateUI();

    const columnConfigs = [
        [config.gauges[0], config.gauges[1]], // Left small column (Water, Fuel)
        [config.gauges[2]],                   // Big speedo column
        [config.gauges[3]],                   // Big tacho column
        [config.gauges[4], config.gauges[5]], // Right small column (Oil Press, Oil Temp)
    ];

    const fragment = document.createDocumentFragment();
    for (const gaugesInCol of columnConfigs) {
        const colDiv = document.createElement('div');
        colDiv.className = 'gauge-column';
        for (const gaugeConfig of gaugesInCol) {
            const gaugeElement = await createGauge(gaugeConfig);
            colDiv.appendChild(gaugeElement);
        }
        fragment.appendChild(colDiv);
    }
    clusterContainer.innerHTML = '';
    clusterContainer.appendChild(fragment);
    applyCurrentSelections();
}

function setupEventListeners() {
    if (window.listenersSet) return;
    window.listenersSet = true;

    document.getElementById('refresh-gauges').addEventListener('click', init);
    document.getElementById('export-config').addEventListener('click', exportConfigToFile);
    document.getElementById('export-image').addEventListener('click', exportClusterImage);

    document.getElementById('dial-material').addEventListener('change', (e) => {
        const material = e.target.value;
        document.documentElement.style.setProperty('--dial-material-big', `url('export/dial_big/${material}')`);
        document.documentElement.style.setProperty('--dial-material-small', `url('export/dial_small/${material}')`);
    });

    document.getElementById('needle-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--needle-color', e.target.value);
    });

    document.getElementById('cap-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--cap-color', e.target.value);
    });

    document.getElementById('cap-material').addEventListener('change', (e) => {
        applyCapMaterialState(e.target.value);
    });

    document.getElementById('silkscreen-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--silkscreen-color', e.target.value);
    });

    document.getElementById('embossing-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--embossing-color', e.target.value);
    });

    document.getElementById('embossing-material').addEventListener('change', (e) => {
        applyEmbossingState(e.target.value);
    });
}

init().then(setupEventListeners);

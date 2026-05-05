// =============================================
// NIGHT MODE TOGGLE
// =============================================
function initNightMode() {
    const savedMode = localStorage.getItem('nightMode');
    if (savedMode === 'enabled') {
        document.documentElement.classList.add('night-mode');
    }
}

function toggleNightMode() {
    const root = document.documentElement;
    root.classList.toggle('night-mode');
    
    const isNightMode = root.classList.contains('night-mode');
    localStorage.setItem('nightMode', isNightMode ? 'enabled' : 'disabled');
}

// =============================================
// LIGHTBOX STATE
// =============================================
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;

// Pinch-to-zoom state
let lastPinchDist = null;

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.15;

// =============================================
// OPEN / CLOSE
// =============================================
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lightbox || !img) return;

    img.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetZoom();
    updateHint();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetZoom();
}

function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    lastTranslateX = 0;
    lastTranslateY = 0;
    applyTransform();
    updateZoomBadge();
}

// =============================================
// TRANSFORM HELPER
// =============================================
function applyTransform() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
}

function clampTranslate() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const lbRect = document.getElementById('lightbox').getBoundingClientRect();

    const maxX = Math.max(0, (rect.width - lbRect.width) / 2);
    const maxY = Math.max(0, (rect.height - lbRect.height) / 2);

    translateX = Math.min(maxX, Math.max(-maxX, translateX));
    translateY = Math.min(maxY, Math.max(-maxY, translateY));
}

// =============================================
// ZOOM (MOUSE WHEEL)
// =============================================
function handleWheel(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;
    e.preventDefault();

    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));

    // Zoom toward mouse cursor position
    const lbRect = lightbox.getBoundingClientRect();
    const mouseX = e.clientX - lbRect.left - lbRect.width / 2;
    const mouseY = e.clientY - lbRect.top - lbRect.height / 2;

    const scaleRatio = newScale / scale;
    translateX = mouseX - scaleRatio * (mouseX - translateX);
    translateY = mouseY - scaleRatio * (mouseY - translateY);

    scale = newScale;
    clampTranslate();
    applyTransform();
    updateZoomBadge();
    updateHint();
}

// =============================================
// PAN (MOUSE DRAG)
// =============================================
function handleMouseDown(e) {
    if (e.target.id !== 'lightbox-img') return;
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX - lastTranslateX;
    dragStartY = e.clientY - lastTranslateY;
    applyTransform();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;
    clampTranslate();
    applyTransform();
}

function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    lastTranslateX = translateX;
    lastTranslateY = translateY;
    applyTransform();
}

// =============================================
// PINCH TO ZOOM (TOUCH)
// =============================================
function getPinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        lastPinchDist = getPinchDist(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
        isDragging = true;
        dragStartX = e.touches[0].clientX - lastTranslateX;
        dragStartY = e.touches[0].clientY - lastTranslateY;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
        const dist = getPinchDist(e.touches);
        if (lastPinchDist !== null) {
            const delta = (dist - lastPinchDist) * 0.01;
            scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
            clampTranslate();
            applyTransform();
            updateZoomBadge();
        }
        lastPinchDist = dist;
    } else if (e.touches.length === 1 && isDragging) {
        translateX = e.touches[0].clientX - dragStartX;
        translateY = e.touches[0].clientY - dragStartY;
        clampTranslate();
        applyTransform();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length < 2) lastPinchDist = null;
    if (e.touches.length === 0) {
        isDragging = false;
        lastTranslateX = translateX;
        lastTranslateY = translateY;
        if (scale < 1.05) resetZoom();
        updateHint();
    }
}

// =============================================
// DOUBLE CLICK / TAP TO TOGGLE ZOOM
// =============================================
let lastTapTime = 0;

function handleDoubleClick(e) {
    if (e.target.id !== 'lightbox-img') return;
    
    if (scale > 1) {
        resetZoom();
    } else {
        scale = 2.5;
        translateX = 0;
        translateY = 0;
        applyTransform();
        updateZoomBadge();
        updateHint();
    }
}

function handleTouchTap(e) {
    const now = Date.now();
    if (now - lastTapTime < 300) {
        handleDoubleClick({ target: e.target });
    }
    lastTapTime = now;
}

// =============================================
// UI FEEDBACK
// =============================================
function updateZoomBadge() {
    const badge = document.getElementById('zoom-badge');
    if (!badge) return;
    badge.textContent = Math.round(scale * 100) + '%';
    badge.style.opacity = scale === 1 ? '0' : '1';
}

function updateHint() {
    const zoomHintElement = document.getElementById('zoom-hint');
    if (!zoomHintElement) return;

    if (scale === 1) {
        zoomHintElement.textContent = 'Scroll untuk zoom | Klik 2x untuk zoom in';
    } else {
        zoomHintElement.textContent = 'Drag untuk geser | Klik 2x untuk reset zoom';
    }

    zoomHintElement.style.opacity = '1';

    clearTimeout(window.hideHintTimeoutId);
    window.hideHintTimeoutId = setTimeout(() => {
        if (zoomHintElement) {
            zoomHintElement.style.opacity = '0';
        }
    }, 5000);
}

// =============================================
// CLOSE ON BACKDROP CLICK
// =============================================
function handleLightboxClick(e) {
    if (e.target.id === 'lightbox') closeLightbox();
}

// =============================================
// KEYBOARD
// =============================================
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === '+' || e.key === '=') {
        scale = Math.min(MAX_SCALE, scale + ZOOM_STEP * 2);
        clampTranslate(); applyTransform(); updateZoomBadge(); updateHint();
    }
    if (e.key === '-') {
        scale = Math.max(MIN_SCALE, scale - ZOOM_STEP * 2);
        if (scale <= 1) resetZoom();
        else { clampTranslate(); applyTransform(); updateZoomBadge(); updateHint(); }
    }
    if (e.key === '0') resetZoom();
});

// =============================================
// INIT EVENT LISTENERS (run after DOM ready)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lightbox || !img) return;

    // Wheel zoom
    lightbox.addEventListener('wheel', handleWheel, { passive: false });

    // Middle click (klik scroll wheel) = reset zoom
    lightbox.addEventListener('mousedown', function(e) {
        if (e.button === 1) { e.preventDefault(); resetZoom(); }
    });

    // Mouse pan
    img.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Double click toggle
    lightbox.addEventListener('dblclick', handleDoubleClick);

    // Touch
    lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    lightbox.addEventListener('touchmove', handleTouchMove, { passive: false });
    lightbox.addEventListener('touchend', handleTouchEnd);
    img.addEventListener('touchend', handleTouchTap);

    // Backdrop close
    lightbox.addEventListener('click', handleLightboxClick);

    // Jalankan pengecekan tema saat awal load
    initNightMode();

    // Prevent image drag messing with pan
    img.addEventListener('dragstart', e => e.preventDefault());
});

// Back button closes lightbox
window.addEventListener('popstate', function () {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) closeLightbox();
});
(function () {
    const canvas = document.getElementById("atomic-hero-particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let start = performance.now();

    function resize() {
        const rect = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawParticle(x, y, size, alpha) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 0, ${alpha})`;
        ctx.fill();
    }

    function drawLine(x1, y1, x2, y2, alpha) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 107, 0, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function render(now) {
        const t = reduceMotion ? 0.6 : (now - start) * 0.00032;
        ctx.clearRect(0, 0, width, height);

        const cx = width * 0.64;
        const cy = height * 0.5;
        const rx = Math.min(width, height) * 0.29;
        const ry = Math.min(width, height) * 0.17;
        const rings = [
            { tilt: 0, speed: 1, alpha: 0.45 },
            { tilt: Math.PI / 3, speed: -0.8, alpha: 0.35 },
            { tilt: -Math.PI / 3, speed: 0.7, alpha: 0.3 }
        ];

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        rings.forEach((ring, ringIndex) => {
            const points = [];
            for (let i = 0; i < 74; i += 1) {
                const angle = (i / 74) * Math.PI * 2 + t * ring.speed;
                const wobble = Math.sin(angle * 3 + t * 4 + ringIndex) * 4;
                const x = Math.cos(angle) * (rx + wobble);
                const y = Math.sin(angle) * (ry + wobble * 0.35);
                const rotX = x * Math.cos(ring.tilt) - y * Math.sin(ring.tilt);
                const rotY = x * Math.sin(ring.tilt) + y * Math.cos(ring.tilt);
                points.push({ x: cx + rotX, y: cy + rotY });
            }

            for (let i = 0; i < points.length; i += 1) {
                const point = points[i];
                const next = points[(i + 1) % points.length];
                drawLine(point.x, point.y, next.x, next.y, ring.alpha * 0.32);
                if (i % 2 === 0) {
                    const pulse = 0.45 + Math.sin(t * 10 + i) * 0.25;
                    drawParticle(point.x, point.y, 1.35 + pulse, ring.alpha);
                }
            }
        });

        const nucleusPulse = 0.8 + Math.sin(t * 10) * 0.2;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.16);
        gradient.addColorStop(0, "rgba(255, 138, 61, 0.9)");
        gradient.addColorStop(0.35, "rgba(255, 107, 0, 0.32)");
        gradient.addColorStop(1, "rgba(255, 107, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(width, height) * 0.16 * nucleusPulse, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 90; i += 1) {
            const seed = i * 77.17;
            const x = (Math.sin(seed) * 0.5 + 0.5) * width;
            const y = (Math.cos(seed * 1.8) * 0.5 + 0.5) * height;
            const drift = Math.sin(t * 2 + i) * 10;
            drawParticle(x + drift, y, 0.7, 0.08);
        }

        ctx.restore();
        if (!reduceMotion) raf = requestAnimationFrame(render);
    }

    function animateCounters() {
        document.querySelectorAll("[data-atomic-counter]").forEach((node) => {
            const target = Number(node.getAttribute("data-atomic-counter") || 0);
            const startTime = performance.now();
            const duration = 1300;
            function tick(now) {
                const progress = Math.min(1, (now - startTime) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                node.textContent = String(Math.round(target * eased));
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(render);
    animateCounters();
})();

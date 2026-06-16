(function () {
    const stage = document.querySelector("[data-hero-frame-animation]");
    if (!stage) return;

    const hero = document.querySelector("#home-hero") || stage;
    const canvas = stage.querySelector("canvas");
    const fallback = stage.querySelector(".hero-frame-fallback");
    const ctx = canvas && canvas.getContext("2d", { alpha: false });
    const frameCount = Number(stage.dataset.frameCount || 0);
    const framePath = stage.dataset.framePath || "/public/frames/frame_";
    const frameExt = stage.dataset.frameExt || ".jpg";

    if (!canvas || !ctx || !frameCount) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    let frames = [];
    let renderedFrame = 0;
    let progress = 0;
    let touchStartY = 0;
    const playhead = { frame: 0 };

    function frameUrl(index) {
        return `${framePath}${String(index).padStart(4, "0")}${frameExt}`;
    }

    function resizeCanvas() {
        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            renderFrame(Math.round(renderedFrame));
        }
    }

    function drawFrame(image) {
        if (!image || !image.naturalWidth || !image.naturalHeight) return;

        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = image.naturalWidth / image.naturalHeight;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;

        if (imageRatio > canvasRatio) {
            sourceWidth = image.naturalHeight * canvasRatio;
            sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
            sourceHeight = image.naturalWidth / canvasRatio;
            sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    function renderFrame(index) {
        if (!frames.length) return;
        const frameIndex = Math.min(frames.length - 1, Math.max(0, index));
        renderedFrame = frameIndex;
        stage.dataset.currentFrame = String(frameIndex + 1);
        drawFrame(frames[frameIndex]);
    }

    function heroIsActive() {
        const rect = hero.getBoundingClientRect();
        return rect.top <= 2 && rect.bottom >= window.innerHeight * 0.45;
    }

    function setProgress(nextProgress) {
        progress = window.gsap.utils.clamp(0, 1, nextProgress);
        stage.dataset.progress = progress.toFixed(4);
        window.gsap.to(playhead, {
            frame: progress * (frameCount - 1),
            duration: 0.08,
            ease: "none",
            overwrite: true,
            onUpdate: () => renderFrame(Math.round(playhead.frame))
        });
    }

    function handleScrollDelta(deltaY) {
        if (!frames.length || !heroIsActive()) return false;

        const nextProgress = progress + deltaY / (window.innerHeight * 2.25);
        const shouldScrubForward = deltaY > 0 && progress < 1;
        const shouldScrubBackward = deltaY < 0 && progress > 0;

        if (!shouldScrubForward && !shouldScrubBackward) return false;
        setProgress(nextProgress);
        return true;
    }

    function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }

    async function preloadFrames() {
        stage.dataset.loading = "true";

        const firstFrame = await preloadImage(frameUrl(1));
        frames = [firstFrame];
        resizeCanvas();
        renderFrame(0);

        const remainingFrames = [];
        for (let index = 2; index <= frameCount; index += 1) {
            remainingFrames.push(preloadImage(frameUrl(index)));
        }

        frames = [firstFrame, ...(await Promise.all(remainingFrames))];
        stage.dataset.loaded = "true";
        delete stage.dataset.loading;
        if (fallback) fallback.style.opacity = "0";
        renderFrame(0);

        window.ScrollTrigger.create({
            trigger: hero,
            start: "top top",
            end: () => `+=${Math.max(window.innerHeight * 2.25, frameCount * 12)}`,
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true
        });

        window.ScrollTrigger.refresh();
    }

    preloadFrames().catch(() => {
        stage.dataset.error = "true";
    });

    window.addEventListener("resize", () => {
        resizeCanvas();
        window.ScrollTrigger.refresh();
    }, { passive: true });

    window.addEventListener("wheel", (event) => {
        if (handleScrollDelta(event.deltaY)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, { capture: true, passive: false });

    window.addEventListener("touchstart", (event) => {
        touchStartY = event.touches[0] ? event.touches[0].clientY : 0;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        const nextY = event.touches[0] ? event.touches[0].clientY : touchStartY;
        const deltaY = touchStartY - nextY;
        touchStartY = nextY;

        if (handleScrollDelta(deltaY)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, { capture: true, passive: false });
})();

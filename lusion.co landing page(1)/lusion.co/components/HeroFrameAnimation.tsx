import { useEffect, useRef, useState } from "react";

type HeroFrameAnimationProps = {
  frameCount?: number;
  framePath?: string;
  scrollTargetSelector?: string;
  className?: string;
};

export default function HeroFrameAnimation({
  frameCount = 133,
  framePath = "/public/hero-frames/frame_",
  scrollTargetSelector = "#home-hero",
  className = "",
}: HeroFrameAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const renderedFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const virtualProgressRef = useRef(0);
  const touchStartYRef = useRef(0);
  const [firstFrame, setFirstFrame] = useState(`${framePath}0001.webp`);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !shell || !context) return;

    let cancelled = false;
    const frameUrl = (index: number) => `${framePath}${String(index).padStart(4, "0")}.webp`;

    const drawFrame = (image?: HTMLImageElement) => {
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

      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      const rect = shell.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      drawFrame(framesRef.current[Math.round(renderedFrameRef.current)] || framesRef.current[0]);
    };

    const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    const isShellVisible = () => {
      const rect = shell.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    const updateTargetFrame = () => {
      targetFrameRef.current = virtualProgressRef.current * (framesRef.current.length - 1);
    };

    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };

    const tick = () => {
      if (!runningRef.current || cancelled || document.hidden || !framesRef.current.length) return;
      updateTargetFrame();
      renderedFrameRef.current += (targetFrameRef.current - renderedFrameRef.current) * 0.16;

      if (Math.abs(targetFrameRef.current - renderedFrameRef.current) < 0.035) {
        renderedFrameRef.current = targetFrameRef.current;
      }

      drawFrame(framesRef.current[Math.round(renderedFrameRef.current)]);
      rafRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (runningRef.current || document.hidden || !framesRef.current.length) return;
      runningRef.current = true;
      updateTargetFrame();
      rafRef.current = requestAnimationFrame(tick);
    };

    const scrubBy = (deltaY: number) => {
      if (!framesRef.current.length || !isShellVisible()) return;
      virtualProgressRef.current = clamp(virtualProgressRef.current + deltaY / (window.innerHeight * 2.1));
      updateTargetFrame();
      start();
    };

    const preloadImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });

    const preloadFrames = async () => {
      const first = await preloadImage(frameUrl(1));
      if (cancelled) return;
      setFirstFrame(first.src);
      framesRef.current = [first];
      resizeCanvas();
      drawFrame(first);

      const rest = await Promise.all(
        Array.from({ length: frameCount - 1 }, (_, index) => preloadImage(frameUrl(index + 2)))
      );
      if (cancelled) return;
      framesRef.current = [first, ...rest];
      setLoaded(true);
      start();
    };

    const visibilityHandler = () => {
      if (document.hidden) stop();
      else start();
    };

    const wheelHandler = (event: WheelEvent) => {
      if (isShellVisible()) {
        event.preventDefault();
        scrubBy(event.deltaY);
      }
    };

    const touchStartHandler = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY || 0;
    };

    const touchMoveHandler = (event: TouchEvent) => {
      if (!isShellVisible()) return;
      const nextY = event.touches[0]?.clientY || touchStartYRef.current;
      const deltaY = touchStartYRef.current - nextY;
      touchStartYRef.current = nextY;
      event.preventDefault();
      scrubBy(deltaY);
    };

    preloadFrames();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("scroll", updateTargetFrame, { passive: true });
    window.addEventListener("wheel", wheelHandler, { passive: false });
    window.addEventListener("touchstart", touchStartHandler, { passive: true });
    window.addEventListener("touchmove", touchMoveHandler, { passive: false });
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      cancelled = true;
      stop();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", updateTargetFrame);
      window.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("touchstart", touchStartHandler);
      window.removeEventListener("touchmove", touchMoveHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [frameCount, framePath, scrollTargetSelector]);

  return (
    <div ref={shellRef} className={`hero-frame-animation ${className}`} data-loaded={loaded}>
      <canvas ref={canvasRef} aria-label="Robot transforms into hypercar scroll animation" />
      <img src={firstFrame} alt="" aria-hidden="true" />
    </div>
  );
}

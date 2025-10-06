// Computes average luminance of an image to help pick contrasting text color.
import { useEffect, useState } from "react";

export function useImageLuminance(url) {
  const [luma, setLuma] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      try {
        const w = 24, h = 24; // small sample for performance
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let sum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // perceived luminance
          const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += y; count++;
        }
        if (!cancelled) setLuma(sum / Math.max(count, 1));
      } catch (e) {
        if (!cancelled) setLuma(null);
      }
    };
    img.onerror = () => { if (!cancelled) setLuma(null); };
    return () => { cancelled = true; };
  }, [url]);

  const isDark = luma !== null ? luma < 140 : null; // heuristic threshold
  return { luminance: luma, isDark };
}
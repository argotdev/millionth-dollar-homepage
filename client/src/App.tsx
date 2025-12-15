import { useEffect, useState, useRef, useCallback } from "react";

const SERVER_URL = "http://localhost:4021";

interface Pixel {
  x: number;
  y: number;
  color: string;
  owner: string;
  adId?: string;
}

interface Ad {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  linkUrl: string;
  title: string;
  owner: string;
  pixels: number;
  totalCost: string;
}

interface CanvasData {
  width: number;
  height: number;
  pixels: Pixel[];
  totalPixels: number;
}

interface AdsData {
  placements: Ad[];
  total: number;
}

interface Stats {
  pixelsSold: number;
  pixelsRemaining: number;
  percentageSold: string;
  totalRevenue: string;
  adPlacements: number;
}

interface InfoData {
  stats: Stats;
  canvas: {
    width: number;
    height: number;
    totalPixels: number;
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [info, setInfo] = useState<InfoData | null>(null);
  const [hoveredAd, setHoveredAd] = useState<Ad | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch canvas data
  const fetchCanvas = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/canvas`);
      const data = await res.json();
      setCanvasData(data);
    } catch (err) {
      console.error("Failed to fetch canvas:", err);
    }
  }, []);

  // Fetch ads
  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/ads`);
      const data: AdsData = await res.json();
      setAds(data.placements);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    }
  }, []);

  // Fetch info/stats
  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/info`);
      const data = await res.json();
      setInfo(data);
    } catch (err) {
      console.error("Failed to fetch info:", err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchCanvas();
    fetchAds();
    fetchInfo();
    const interval = setInterval(() => {
      fetchCanvas();
      fetchAds();
      fetchInfo();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchCanvas, fetchAds, fetchInfo]);

  // Render canvas (just the background grid and non-ad pixels)
  useEffect(() => {
    if (!canvasRef.current || !canvasData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern (10x10 blocks like the original)
    ctx.strokeStyle = "#252540";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvasData.width; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasData.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasData.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasData.width, y);
      ctx.stroke();
    }

    // Draw individual pixels (non-ad pixels only)
    for (const pixel of canvasData.pixels) {
      if (!pixel.adId) {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, 1, 1);
      }
    }
  }, [canvasData]);

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !canvasData) return;

    const rect = containerRef.current.getBoundingClientRect();
    const displayScale = 800 / canvasData.width; // Canvas is displayed at 800px

    // Calculate pixel coordinates
    const mouseX = (e.clientX - rect.left) / displayScale / scale - offset.x / scale;
    const mouseY = (e.clientY - rect.top) / displayScale / scale - offset.y / scale;

    const pixelX = Math.floor(mouseX);
    const pixelY = Math.floor(mouseY);

    setMousePos({ x: pixelX, y: pixelY });
    setTooltipPos({ x: e.clientX, y: e.clientY });

    // Check if hovering over an ad
    const ad = ads.find(
      (a) =>
        pixelX >= a.x &&
        pixelX < a.x + a.width &&
        pixelY >= a.y &&
        pixelY < a.y + a.height
    );
    setHoveredAd(ad || null);

    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset((prev) => ({
        x: prev.x + dx / displayScale,
        y: prev.y + dy / displayScale,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(10, prev * delta)));
  };

  // Handle mouse down/up for drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle click on ad
  const handleAdClick = (ad: Ad) => {
    window.open(ad.linkUrl, "_blank");
  };

  // Calculate display scale
  const displayScale = canvasData ? 800 / canvasData.width : 1;

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
          The Millionth Dollar Homepage
        </h1>
        <p style={{ color: "#888", fontSize: "1.1rem" }}>
          1,000,000 pixels. $0.0001 each. Powered by x402 micropayments.
        </p>
        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "5px" }}>
          Like the original - ads are sold in 10x10 pixel blocks with images, links, and hover tooltips.
        </p>
      </header>

      {/* Stats Bar */}
      {info && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginBottom: "20px",
            padding: "15px",
            background: "#16213e",
            borderRadius: "8px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#00d4ff" }}>
              {info.stats.pixelsSold.toLocaleString()}
            </div>
            <div style={{ color: "#888", fontSize: "0.9rem" }}>Pixels Sold</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#00ff88" }}>
              {info.stats.totalRevenue}
            </div>
            <div style={{ color: "#888", fontSize: "0.9rem" }}>Total Revenue</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ff6b6b" }}>
              {info.stats.percentageSold}%
            </div>
            <div style={{ color: "#888", fontSize: "0.9rem" }}>Sold</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffd93d" }}>
              {info.stats.adPlacements}
            </div>
            <div style={{ color: "#888", fontSize: "0.9rem" }}>Ad Placements</div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "800px",
            height: "800px",
            border: "2px solid #333",
            borderRadius: "4px",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : hoveredAd ? "pointer" : "crosshair",
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Single transformed container for canvas + ads */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "800px",
              height: "800px",
              transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
              transformOrigin: "top left",
            }}
          >
            {/* Base Canvas */}
            <canvas
              ref={canvasRef}
              width={1000}
              height={1000}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "800px",
                height: "800px",
                imageRendering: "pixelated",
              }}
            />

            {/* Ad Images Overlay */}
            {ads.map((ad) => (
              <img
                key={ad.id}
                src={ad.imageUrl}
                alt={ad.title}
                onClick={() => handleAdClick(ad)}
                style={{
                  position: "absolute",
                  left: `${ad.x * displayScale}px`,
                  top: `${ad.y * displayScale}px`,
                  width: `${ad.width * displayScale}px`,
                  height: `${ad.height * displayScale}px`,
                  imageRendering: "pixelated",
                  cursor: "pointer",
                  border: hoveredAd?.id === ad.id ? "2px solid #00d4ff" : "none",
                  boxSizing: "border-box",
                  transition: "border 0.1s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredAd && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            background: "rgba(22, 33, 62, 0.95)",
            border: "1px solid #00d4ff",
            borderRadius: "8px",
            padding: "12px",
            maxWidth: "300px",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#fff" }}>
            {hoveredAd.title}
          </div>
          <div style={{ color: "#00d4ff", marginBottom: "4px", fontSize: "0.9rem" }}>
            {hoveredAd.linkUrl}
          </div>
          <div style={{ color: "#888", fontSize: "0.8rem" }}>
            {hoveredAd.width}x{hoveredAd.height} pixels • {hoveredAd.totalCost}
          </div>
          <div style={{ color: "#666", fontSize: "0.8rem", marginTop: "4px" }}>
            Click to visit
          </div>
        </div>
      )}

      {/* Info Bar */}
      <div
        style={{
          textAlign: "center",
          padding: "10px",
          background: "#16213e",
          borderRadius: "8px",
          minHeight: "60px",
        }}
      >
        <div style={{ color: "#888", marginBottom: "5px" }}>
          Position: ({mousePos.x}, {mousePos.y}) | Zoom: {scale.toFixed(1)}x | Ads: {ads.length}
        </div>
        {hoveredAd ? (
          <div style={{ color: "#00d4ff" }}>
            Hovering: <strong>{hoveredAd.title}</strong> - Click to visit
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            Hover over ads to see details. Scroll to zoom, drag to pan.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", marginTop: "30px", color: "#666" }}>
        <p>
          Payments processed via{" "}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00d4ff" }}
          >
            x402 Protocol
          </a>{" "}
          on Base Sepolia • Images generated by GPT-5.2
        </p>
      </footer>
    </div>
  );
}

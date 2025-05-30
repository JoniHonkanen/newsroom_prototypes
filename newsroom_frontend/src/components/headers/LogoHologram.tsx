import { useRef, useState } from "react";
import styles from "./LogoHologram.module.css";

export default function LogoHologram() {
  const [active, setActive] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!active || !svgRef.current) return;
    const svgElement = svgRef.current;
    const rect = svgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const shineGradient = svgElement.querySelector(
      "#shine"
    ) as SVGRadialGradientElement | null;
    if (shineGradient) {
      shineGradient.setAttribute("cx", `${x}%`);
      shineGradient.setAttribute("cy", `${y}%`);
    }
  }

  function handleMouseEnter(e: React.MouseEvent<SVGSVGElement>) {
    setActive(true);
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const rect = svgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const shineGradient = svgElement.querySelector(
      "#shine"
    ) as SVGRadialGradientElement | null;
    if (shineGradient) {
      shineGradient.setAttribute("cx", `${x}%`);
      shineGradient.setAttribute("cy", `${y}%`);
    }
  }

  function handleMouseLeave() {
    setActive(false);
    if (svgRef.current) {
      const shineGradient = svgRef.current.querySelector(
        "#shine"
      ) as SVGRadialGradientElement | null;
      if (shineGradient) {
        shineGradient.setAttribute("cx", "50%");
        shineGradient.setAttribute("cy", "50%");
      }
    }
  }

  return (
    <svg
      ref={svgRef}
      className={styles.logoSvg}
      height="110"
      viewBox="0 0 480 110"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "block",
        width: "100%",
        maxWidth: 300, // <-- MUUTETTU: Kokeile tätä tai muuta sopivaa arvoa
        height: "auto",
        cursor: "pointer",
      }}
    >
      <defs>
        <pattern
          id="logoTexture"
          patternUnits="userSpaceOnUse"
          width="120"
          height="80"
        >
          <image
            href="/gpt_logo_background.png"
            x="0"
            y="0"
            width="120"
            height="80"
          />
        </pattern>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe780" />
          <stop offset="22%" stopColor="#70f8ff" />
          <stop offset="55%" stopColor="#b89aff" />
          <stop offset="80%" stopColor="#ffb0ff" />
          <stop offset="100%" stopColor="#ffe780" />
        </linearGradient>
        <mask id="textMask">
          <text
            x="50%"
            y="75%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'UnifrakturCook', cursive"
            fontSize="86"
            fontWeight="bold"
            fill="#fff"
          >
            UutisLogo
          </text>
        </mask>
        <radialGradient id="shine" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="hologramGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur1" />
          <feFlood
            floodColor="#70f8ff"
            floodOpacity="0.7"
            result="glowColor1"
          />
          <feComposite
            in="glowColor1"
            in2="coloredBlur1"
            operator="in"
            result="softGlow1"
          />
          <feGaussianBlur stdDeviation="6" result="coloredBlur2" />
          <feFlood
            floodColor="#b89aff"
            floodOpacity="0.6"
            result="glowColor2"
          />
          <feComposite
            in="glowColor2"
            in2="coloredBlur2"
            operator="in"
            result="softGlow2"
          />
          <feMerge>
            <feMergeNode in="softGlow1" />
            <feMergeNode in="softGlow2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {!active && (
        <text
          x="50%"
          y="75%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'UnifrakturCook', cursive"
          fontSize="86"
          fontWeight="bold"
          fill="#fff"
        >
          UutisLogo
        </text>
      )}

      {active && (
        <g filter="url(#hologramGlow)">
          {/* Taustakuva-kerros */}
          <rect
            width="100%"
            height="100%"
            fill="url(#logoTexture)"
            mask="url(#textMask)"
            opacity={
              1
            } /* <-- MUUTETTU: Tekstuuri täysin läpinäkymätön (itsessään) */
            style={{ transition: "opacity 0.3s" }}
          />
          {/* Sateenkaari-kerros */}
          <rect
            width="100%"
            height="100%"
            fill="url(#rainbow)"
            mask="url(#textMask)"
            opacity={
              0.45
            } /* <-- MUUTETTU: Vähennetty läpinäkyvyyttä, kokeile 0.4 - 0.6 välillä */
            style={{ transition: "opacity 0.3s" }}
          />
          {/* Kiilto-kerros */}
          <rect
            width="100%"
            height="100%"
            fill="url(#shine)"
            mask="url(#textMask)"
            opacity={
              0.4
            } /* <-- MUUTETTU: Vähennetty läpinäkyvyyttä, kokeile 0.3 - 0.5 välillä */
            style={{ transition: "opacity 0.2s" }}
          />
        </g>
      )}
    </svg>
  );
}

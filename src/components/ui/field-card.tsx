"use client";
import React, { useRef, useEffect } from "react";
import { injectBauhausCardStyles } from "./bauhaus-card";

const FIELD_CARD_STYLES = `
.bauhaus-field-card {
  position: relative;
  z-index: 10;
  width: 100%;
  display: block !important;
  min-height: unset !important;
  max-width: 100% !important;
  text-align: left !important;
  place-content: unset !important;
  place-items: unset !important;
  box-shadow: 0 2px 10px rgba(31,44,50,0.08);
  border-radius: var(--card-radius, 1rem);
  border: var(--card-border-width, 2px) solid #D4DEE1;
  --rotation: 4.2rad;
  background: var(--card-bg, #ffffff);
  padding: 1.1rem 1.4rem 1.35rem;
  color: #2B2B2B;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bauhaus-field-card:focus-within {
  border-color: var(--card-accent, #2F6F7A);
  box-shadow: 0 4px 16px rgba(31,44,50,0.10);
}

.bauhaus-field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6C7E83;
  margin-bottom: 0.6rem;
}

.bauhaus-field-input {
  width: 100%;
  background: #E7EBED;
  border: 1.5px solid #D2DADD;
  border-radius: 0.55rem;
  padding: 0.65rem 0.9rem;
  color: #2B2B2B;
  font-size: 0.96rem;
  font-family: inherit;
  outline: none;
  resize: none;
  transition: border-color 0.2s, background 0.2s;
}

.bauhaus-field-input:focus {
  border-color: var(--card-accent, #2F6F7A);
  background: #F0F2F3;
}

.bauhaus-field-input::placeholder {
  color: #9AA9AD;
}

.bauhaus-field-input option {
  background: #ffffff;
  color: #2B2B2B;
}
`;

export function injectFieldCardStyles() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("bauhaus-field-card-styles")) {
    const s = document.createElement("style");
    s.id = "bauhaus-field-card-styles";
    s.innerHTML = FIELD_CARD_STYLES;
    document.head.appendChild(s);
  }
}

export function FieldCard({
  label,
  accentColor = "#2F6F7A",
  children,
}: {
  label: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausCardStyles();
    injectFieldCardStyles();
    const card = ref.current;
    const onMove = (e: MouseEvent) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.setProperty("--rotation", Math.atan2(-x, y) + "rad");
    };
    card?.addEventListener("mousemove", onMove);
    return () => card?.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="bauhaus-field-card"
      style={{
        "--card-bg": "#ffffff",
        "--card-accent": accentColor,
        "--card-radius": "1rem",
        "--card-border-width": "2px",
      } as React.CSSProperties}
    >
      <span className="bauhaus-field-label flex items-center gap-3">{label}</span>
      {children}
    </div>
  );
}

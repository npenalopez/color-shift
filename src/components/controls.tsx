"use client";

import { useState } from "react";
import {
  CHANNELS,
  channelGradient,
  fromChannels,
  hueIndex,
  normalizeColor,
  toChannels,
  type SliderMode,
} from "@/lib/color";
import { apcaLc, formatScore, level, nextThreshold, score, wcagRatio, type Algo } from "@/lib/contrast";

export const label = "text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400";

const segment = (on: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
    on ? "bg-neutral-100 text-neutral-950" : "text-neutral-400 hover:text-neutral-100"
  }`;

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-1 rounded-lg bg-neutral-900 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={segment(value === option)}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

interface SwatchesProps {
  bg: string;
  fg: string;
  active: "bg" | "fg";
  onSelect: (which: "bg" | "fg") => void;
  onChange: (which: "bg" | "fg", hex: string) => void;
  onSwap: () => void;
}

export function Swatches({ bg, fg, active, onSelect, onChange, onSwap }: SwatchesProps) {
  return (
    <div className="flex items-stretch gap-2">
      <Swatch
        name="Background"
        hex={bg}
        selected={active === "bg"}
        onSelect={() => onSelect("bg")}
        onChange={(hex) => onChange("bg", hex)}
      />
      <button
        type="button"
        onClick={onSwap}
        className="shrink-0 rounded-lg border border-white/10 px-2.5 text-neutral-300 transition hover:border-white/30 hover:text-white"
        aria-label="Swap background and text colors"
        title="Swap (S)"
      >
        ⇄
      </button>
      <Swatch
        name="Text"
        hex={fg}
        selected={active === "fg"}
        onSelect={() => onSelect("fg")}
        onChange={(hex) => onChange("fg", hex)}
      />
    </div>
  );
}

function Swatch({
  name,
  hex,
  selected,
  onSelect,
  onChange,
}: {
  name: string;
  hex: string;
  selected: boolean;
  onSelect: () => void;
  onChange: (hex: string) => void;
}) {
  const commit = (input: HTMLInputElement) => {
    const parsed = normalizeColor(input.value);
    if (parsed) onChange(parsed);
    else input.value = hex.toUpperCase();
  };

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg border p-2 transition ${
        selected ? "border-white/70 bg-neutral-900" : "border-white/10 hover:border-white/30"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Edit ${name.toLowerCase()} color`}
        className="size-10 shrink-0 rounded-md ring-1 ring-white/15"
        style={{ background: hex }}
      />
      <div className="min-w-0">
        <div className={label}>{name}</div>
        <input
          key={hex}
          defaultValue={hex.toUpperCase()}
          aria-label={`${name} color value`}
          spellCheck={false}
          onFocus={onSelect}
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget)}
          className="w-full bg-transparent font-mono text-sm text-neutral-100 outline-none"
        />
      </div>
    </div>
  );
}

interface SlidersProps {
  hex: string;
  mode: SliderMode;
  onModeChange: (mode: SliderMode) => void;
  onChange: (hex: string) => void;
}

export function Sliders({ hex, mode, onModeChange, onChange }: SlidersProps) {
  // Greys have no hue; remember the last one so dragging chroma back up
  // doesn't snap the color to red.
  const [lastHue, setLastHue] = useState(0);
  const hue = hueIndex(mode);
  const values = toChannels(hex, mode).map((v, i) => v ?? (i === hue ? lastHue : 0));

  const update = (index: number, value: number) => {
    const next = [...values];
    next[index] = value;
    if (hue >= 0) setLastHue(next[hue]);
    onChange(fromChannels(next, mode));
  };

  return (
    <div className="space-y-4">
      <Segmented name="Slider mode" options={["OKLCH", "HSB", "RGB"] as const} value={mode} onChange={onModeChange} />
      {CHANNELS[mode].map((channel, i) => (
        <label key={channel.key} className="block">
          <div className="mb-1.5 flex justify-between">
            <span className={label}>{channel.label}</span>
            <span className="font-mono text-xs text-neutral-300">{channel.format(values[i])}</span>
          </div>
          <input
            type="range"
            className="channel-slider"
            min={channel.min}
            max={channel.max}
            step={channel.step}
            value={values[i]}
            onChange={(e) => update(i, Number(e.target.value))}
            style={
              {
                "--track": channelGradient(values, mode, i),
                "--thumb": hex,
              } as React.CSSProperties
            }
          />
        </label>
      ))}
    </div>
  );
}

interface ContrastProps {
  bg: string;
  fg: string;
  algo: Algo;
  active: "bg" | "fg";
  onAlgoChange: (algo: Algo) => void;
  onNudge: (direction: "up" | "down") => void;
  canNudge: { up: boolean; down: boolean };
}

export function Contrast({ bg, fg, algo, active, onAlgoChange, onNudge, canNudge }: ContrastProps) {
  const value = score(bg, fg, algo);
  const current = level(value, algo);
  const up = nextThreshold(value, algo, "up");
  const down = nextThreshold(value, algo, "down");
  const ratio = wcagRatio(bg, fg);
  const lc = Math.abs(apcaLc(bg, fg));
  const target = (t: number | null) => (t === null ? "—" : formatScore(t, algo));
  const nudgeButton =
    "flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:border-white/40 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="space-y-4">
      <Segmented
        name="Contrast algorithm"
        options={["WCAG", "APCA"] as const}
        value={algo}
        onChange={onAlgoChange}
      />
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-4xl font-medium tracking-tight">{formatScore(value, algo)}</div>
          <div className="mt-1 text-sm text-neutral-300">
            <span className="font-medium text-neutral-100">{current.label}</span> · {current.description}
          </div>
        </div>
      </div>
      <div className="font-mono text-xs text-neutral-400">
        WCAG {formatScore(ratio, "WCAG")} {level(ratio, "WCAG").label} · APCA {formatScore(lc, "APCA")}
      </div>
      <div>
        <div className={`${label} mb-2`}>Nudge {active === "bg" ? "background" : "text"} lightness</div>
        <div className="flex gap-2">
          <button type="button" className={nudgeButton} disabled={!canNudge.down} onClick={() => onNudge("down")}>
            ↓ Soften to {target(down)}
          </button>
          <button type="button" className={nudgeButton} disabled={!canNudge.up} onClick={() => onNudge("up")}>
            ↑ Raise to {target(up)}
          </button>
        </div>
      </div>
    </div>
  );
}

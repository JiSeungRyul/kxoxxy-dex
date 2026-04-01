"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonCollectionCatalogEntry, PokemonTypeName } from "@/features/pokedex/types";
import { formatDexNumber, formatGenerationLabel, formatTypeLabel } from "@/features/pokedex/utils";

type DailyEncounterProps = {
  encounter: PokemonCollectionCatalogEntry | null;
  isShiny: boolean;
  capturedCount: number;
  totalCount: number;
  recentCaptures: PokemonCollectionCatalogEntry[];
  isCaptured: boolean;
  isReady: boolean;
  isSyncing: boolean;
  isTransitioning: boolean;
  onCapture: () => void;
  onResetToday: () => void;
  onRerollToday: () => void;
  canRerollToday: boolean;
};

function TypeBadge({ type }: { type: PokemonCollectionCatalogEntry["types"][number] }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.04em] ${TYPE_BADGE_STYLES[type.name]}`}
    >
      {formatTypeLabel(type.name)}
    </span>
  );
}

const ENCOUNTER_SCENE_STYLES: Record<
  PokemonTypeName,
  {
    section: string;
    text: string;
    scene: string;
    sky: string;
    ground: string;
    grass: string;
  }
> = {
  bug: {
    section:
      "border-lime-900/15 bg-[linear-gradient(180deg,rgba(247,253,231,0.95),rgba(233,246,198,0.96))] dark:border-lime-200/10 dark:bg-[linear-gradient(180deg,rgba(37,49,20,0.95),rgba(24,35,16,0.98))]",
    text: "text-lime-950/75 dark:text-lime-50/75",
    scene:
      "border-lime-950/15 bg-[linear-gradient(180deg,rgba(242,250,218,0.96),rgba(188,219,116,0.88)_55%,rgba(100,129,52,0.98))] dark:border-lime-100/10 dark:bg-[linear-gradient(180deg,rgba(42,57,22,0.95),rgba(64,88,36,0.95)_55%,rgba(28,41,18,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(180deg,rgba(238,248,204,0.95),rgba(205,232,146,0.78)_46%,rgba(132,170,79,0.3))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(76,95,45,0.95),rgba(83,110,50,0.78)_46%,rgba(33,46,18,0.2))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(126,164,80,0.18),rgba(92,128,58,0.82)_40%,rgba(64,93,38,1))] dark:bg-[linear-gradient(180deg,rgba(83,118,54,0.18),rgba(55,84,34,0.82)_40%,rgba(29,49,21,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(76,125,45,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(126,170,68,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(94,146,56,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(101,153,63,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(79,132,49,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(145,189,88,0.75),transparent_15%)]",
  },
  dark: {
    section:
      "border-slate-900/20 bg-[linear-gradient(180deg,rgba(241,242,246,0.95),rgba(223,226,234,0.96))] dark:border-slate-200/10 dark:bg-[linear-gradient(180deg,rgba(23,24,31,0.95),rgba(13,15,21,0.98))]",
    text: "text-slate-950/75 dark:text-slate-50/75",
    scene:
      "border-slate-950/15 bg-[linear-gradient(180deg,rgba(231,234,241,0.96),rgba(122,129,148,0.84)_55%,rgba(52,57,72,0.98))] dark:border-slate-100/10 dark:bg-[linear-gradient(180deg,rgba(34,38,52,0.95),rgba(32,35,48,0.95)_55%,rgba(14,16,24,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.86),transparent_28%),linear-gradient(180deg,rgba(229,233,241,0.95),rgba(169,177,193,0.72)_46%,rgba(89,98,119,0.32))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(52,58,77,0.95),rgba(44,49,66,0.74)_46%,rgba(18,20,29,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(94,102,122,0.18),rgba(63,69,87,0.82)_40%,rgba(37,41,56,1))] dark:bg-[linear-gradient(180deg,rgba(68,76,98,0.18),rgba(43,47,66,0.82)_40%,rgba(18,20,30,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(64,72,94,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(95,103,132,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(73,80,106,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(79,88,116,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(55,62,84,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(114,122,153,0.75),transparent_15%)]",
  },
  dragon: {
    section:
      "border-indigo-900/15 bg-[linear-gradient(180deg,rgba(241,243,255,0.95),rgba(226,231,255,0.96))] dark:border-indigo-200/10 dark:bg-[linear-gradient(180deg,rgba(25,29,54,0.95),rgba(14,18,39,0.98))]",
    text: "text-indigo-950/75 dark:text-indigo-50/75",
    scene:
      "border-indigo-950/15 bg-[linear-gradient(180deg,rgba(232,238,255,0.96),rgba(145,162,235,0.84)_55%,rgba(71,82,151,0.98))] dark:border-indigo-100/10 dark:bg-[linear-gradient(180deg,rgba(45,55,106,0.95),rgba(38,47,92,0.95)_55%,rgba(17,23,49,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.88),transparent_28%),linear-gradient(180deg,rgba(232,239,255,0.95),rgba(179,192,246,0.76)_46%,rgba(101,115,195,0.3))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(72,84,149,0.95),rgba(60,70,127,0.74)_46%,rgba(22,28,56,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(104,121,192,0.16),rgba(73,86,153,0.82)_40%,rgba(45,56,110,1))] dark:bg-[linear-gradient(180deg,rgba(82,98,171,0.16),rgba(46,56,105,0.82)_40%,rgba(19,26,53,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(67,84,148,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(118,136,214,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(88,105,183,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(96,114,196,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(59,74,139,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(144,160,231,0.75),transparent_15%)]",
  },
  electric: {
    section:
      "border-yellow-900/15 bg-[linear-gradient(180deg,rgba(255,252,230,0.95),rgba(255,247,203,0.96))] dark:border-yellow-200/10 dark:bg-[linear-gradient(180deg,rgba(56,46,11,0.95),rgba(33,28,8,0.98))]",
    text: "text-yellow-950/75 dark:text-yellow-50/75",
    scene:
      "border-yellow-950/15 bg-[linear-gradient(180deg,rgba(255,248,208,0.96),rgba(241,204,83,0.86)_55%,rgba(180,132,29,0.98))] dark:border-yellow-100/10 dark:bg-[linear-gradient(180deg,rgba(104,81,18,0.95),rgba(87,67,16,0.95)_55%,rgba(41,31,8,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(255,249,214,0.95),rgba(250,225,127,0.74)_46%,rgba(223,175,44,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(141,110,26,0.95),rgba(117,89,20,0.72)_46%,rgba(46,34,9,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(215,178,59,0.15),rgba(185,138,31,0.82)_40%,rgba(126,87,17,1))] dark:bg-[linear-gradient(180deg,rgba(167,127,31,0.15),rgba(113,82,18,0.82)_40%,rgba(41,30,8,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(170,123,28,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(236,196,65,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(203,156,39,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(216,168,44,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(157,112,26,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(248,214,89,0.75),transparent_15%)]",
  },
  fairy: {
    section:
      "border-pink-900/10 bg-[linear-gradient(180deg,rgba(255,244,249,0.95),rgba(253,235,244,0.96))] dark:border-pink-200/10 dark:bg-[linear-gradient(180deg,rgba(55,24,39,0.95),rgba(31,14,23,0.98))]",
    text: "text-pink-950/75 dark:text-pink-50/75",
    scene:
      "border-pink-950/10 bg-[linear-gradient(180deg,rgba(255,240,247,0.96),rgba(243,176,207,0.84)_55%,rgba(191,112,153,0.98))] dark:border-pink-100/10 dark:bg-[linear-gradient(180deg,rgba(112,50,82,0.95),rgba(91,42,68,0.95)_55%,rgba(44,18,31,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(180deg,rgba(255,238,247,0.95),rgba(247,195,223,0.76)_46%,rgba(221,142,183,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(148,71,110,0.95),rgba(115,57,87,0.74)_46%,rgba(52,20,37,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(216,137,176,0.14),rgba(182,97,139,0.82)_40%,rgba(128,63,100,1))] dark:bg-[linear-gradient(180deg,rgba(166,85,125,0.14),rgba(104,48,78,0.82)_40%,rgba(43,18,31,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(175,90,129,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(236,166,203,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(210,126,170,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(218,136,178,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(160,80,117,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(245,190,220,0.75),transparent_15%)]",
  },
  fighting: {
    section:
      "border-orange-900/15 bg-[linear-gradient(180deg,rgba(255,245,236,0.95),rgba(250,234,217,0.96))] dark:border-orange-200/10 dark:bg-[linear-gradient(180deg,rgba(61,30,14,0.95),rgba(34,18,10,0.98))]",
    text: "text-orange-950/75 dark:text-orange-50/75",
    scene:
      "border-orange-950/15 bg-[linear-gradient(180deg,rgba(252,237,222,0.96),rgba(226,149,81,0.84)_55%,rgba(154,83,35,0.98))] dark:border-orange-100/10 dark:bg-[linear-gradient(180deg,rgba(116,64,28,0.95),rgba(95,52,24,0.95)_55%,rgba(45,23,11,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(255,239,222,0.95),rgba(239,184,136,0.74)_46%,rgba(198,122,63,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(158,96,46,0.95),rgba(120,72,35,0.72)_46%,rgba(50,26,12,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(200,126,66,0.15),rgba(154,87,38,0.82)_40%,rgba(107,57,21,1))] dark:bg-[linear-gradient(180deg,rgba(163,95,42,0.15),rgba(93,52,23,0.82)_40%,rgba(43,22,10,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(151,82,31,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(226,150,83,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(190,114,47,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(205,127,58,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(137,73,28,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(238,173,114,0.75),transparent_15%)]",
  },
  fire: {
    section:
      "border-red-900/15 bg-[linear-gradient(180deg,rgba(255,244,238,0.95),rgba(255,231,219,0.96))] dark:border-red-200/10 dark:bg-[linear-gradient(180deg,rgba(58,24,17,0.95),rgba(32,14,10,0.98))]",
    text: "text-red-950/75 dark:text-red-50/75",
    scene:
      "border-red-950/15 bg-[linear-gradient(180deg,rgba(255,234,222,0.96),rgba(239,136,83,0.84)_55%,rgba(173,67,34,0.98))] dark:border-red-100/10 dark:bg-[linear-gradient(180deg,rgba(118,51,29,0.95),rgba(97,40,23,0.95)_55%,rgba(44,17,11,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(255,238,224,0.95),rgba(248,182,142,0.74)_46%,rgba(217,106,56,0.3))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(158,76,46,0.95),rgba(121,53,32,0.72)_46%,rgba(49,19,12,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(221,104,53,0.14),rgba(177,73,34,0.82)_40%,rgba(121,48,20,1))] dark:bg-[linear-gradient(180deg,rgba(173,75,36,0.14),rgba(102,40,22,0.82)_40%,rgba(44,17,11,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(161,66,30,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(239,132,80,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(203,89,43,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(216,101,53,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(145,58,28,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(248,164,120,0.75),transparent_15%)]",
  },
  flying: {
    section:
      "border-sky-900/15 bg-[linear-gradient(180deg,rgba(241,249,255,0.95),rgba(228,242,255,0.96))] dark:border-sky-200/10 dark:bg-[linear-gradient(180deg,rgba(22,41,53,0.95),rgba(12,25,35,0.98))]",
    text: "text-sky-950/75 dark:text-sky-50/75",
    scene:
      "border-sky-950/15 bg-[linear-gradient(180deg,rgba(231,244,255,0.96),rgba(151,205,241,0.84)_55%,rgba(72,136,177,0.98))] dark:border-sky-100/10 dark:bg-[linear-gradient(180deg,rgba(42,90,116,0.95),rgba(31,74,97,0.95)_55%,rgba(16,36,48,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(180deg,rgba(231,244,255,0.95),rgba(181,223,247,0.76)_46%,rgba(97,177,222,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(74,144,180,0.95),rgba(51,106,138,0.74)_46%,rgba(18,40,52,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(96,180,220,0.14),rgba(60,139,177,0.82)_40%,rgba(31,90,119,1))] dark:bg-[linear-gradient(180deg,rgba(71,140,171,0.14),rgba(36,85,112,0.82)_40%,rgba(15,36,49,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(39,97,128,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(129,192,229,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(75,147,188,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(86,160,201,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(43,107,138,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(169,219,243,0.75),transparent_15%)]",
  },
  ghost: {
    section:
      "border-violet-900/15 bg-[linear-gradient(180deg,rgba(246,243,255,0.95),rgba(234,228,255,0.96))] dark:border-violet-200/10 dark:bg-[linear-gradient(180deg,rgba(36,26,58,0.95),rgba(18,13,33,0.98))]",
    text: "text-violet-950/75 dark:text-violet-50/75",
    scene:
      "border-violet-950/15 bg-[linear-gradient(180deg,rgba(238,232,255,0.96),rgba(166,138,232,0.84)_55%,rgba(88,63,155,0.98))] dark:border-violet-100/10 dark:bg-[linear-gradient(180deg,rgba(76,56,128,0.95),rgba(58,42,101,0.95)_55%,rgba(24,18,45,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(241,236,255,0.95),rgba(200,183,247,0.74)_46%,rgba(126,101,212,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(180deg,rgba(104,80,173,0.95),rgba(76,60,127,0.72)_46%,rgba(27,20,48,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(131,107,214,0.14),rgba(94,71,169,0.82)_40%,rgba(58,40,115,1))] dark:bg-[linear-gradient(180deg,rgba(104,85,175,0.14),rgba(58,44,105,0.82)_40%,rgba(22,17,44,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(83,64,149,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(171,145,232,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(120,94,196,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(132,107,208,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(77,60,141,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(202,184,247,0.75),transparent_15%)]",
  },
  grass: {
    section:
      "border-emerald-900/20 bg-[linear-gradient(180deg,rgba(239,255,244,0.95),rgba(216,248,226,0.96))] dark:border-emerald-200/10 dark:bg-[linear-gradient(180deg,rgba(18,43,28,0.95),rgba(10,28,19,0.98))]",
    text: "text-emerald-950/75 dark:text-emerald-50/75",
    scene:
      "border-emerald-950/15 bg-[linear-gradient(180deg,rgba(223,247,228,0.96),rgba(153,214,118,0.9)_55%,rgba(82,134,66,0.98))] dark:border-emerald-100/10 dark:bg-[linear-gradient(180deg,rgba(26,51,31,0.95),rgba(42,91,47,0.95)_55%,rgba(21,57,28,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.95),transparent_28%),linear-gradient(180deg,rgba(212,244,214,0.95),rgba(170,228,153,0.8)_46%,rgba(118,177,87,0.34))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,rgba(43,80,49,0.95),rgba(46,95,54,0.78)_46%,rgba(20,51,28,0.2))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(96,152,70,0.18),rgba(69,111,55,0.8)_40%,rgba(52,79,42,1))] dark:bg-[linear-gradient(180deg,rgba(48,92,42,0.18),rgba(33,69,32,0.82)_40%,rgba(20,43,21,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(36,96,35,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(63,136,57,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(47,116,44,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(53,126,50,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(45,103,42,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(70,151,61,0.75),transparent_15%)]",
  },
  ground: {
    section:
      "border-amber-900/15 bg-[linear-gradient(180deg,rgba(255,248,236,0.95),rgba(249,239,214,0.96))] dark:border-amber-200/10 dark:bg-[linear-gradient(180deg,rgba(60,40,16,0.95),rgba(33,24,10,0.98))]",
    text: "text-amber-950/75 dark:text-amber-50/75",
    scene:
      "border-amber-950/15 bg-[linear-gradient(180deg,rgba(252,243,220,0.96),rgba(214,177,96,0.84)_55%,rgba(148,109,39,0.98))] dark:border-amber-100/10 dark:bg-[linear-gradient(180deg,rgba(115,84,27,0.95),rgba(94,67,22,0.95)_55%,rgba(44,31,10,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(254,244,219,0.95),rgba(233,205,140,0.74)_46%,rgba(188,148,71,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(154,116,41,0.95),rgba(122,90,31,0.72)_46%,rgba(49,35,11,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(194,150,62,0.15),rgba(153,112,37,0.82)_40%,rgba(103,72,21,1))] dark:bg-[linear-gradient(180deg,rgba(155,113,34,0.15),rgba(95,67,20,0.82)_40%,rgba(42,29,10,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(142,100,29,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(220,181,94,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(185,142,50,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(197,153,58,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(131,91,26,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(237,206,126,0.75),transparent_15%)]",
  },
  ice: {
    section:
      "border-cyan-900/10 bg-[linear-gradient(180deg,rgba(241,253,255,0.95),rgba(224,247,252,0.96))] dark:border-cyan-200/10 dark:bg-[linear-gradient(180deg,rgba(18,46,54,0.95),rgba(10,27,31,0.98))]",
    text: "text-cyan-950/75 dark:text-cyan-50/75",
    scene:
      "border-cyan-950/10 bg-[linear-gradient(180deg,rgba(229,251,255,0.96),rgba(141,223,235,0.84)_55%,rgba(58,160,179,0.98))] dark:border-cyan-100/10 dark:bg-[linear-gradient(180deg,rgba(38,101,116,0.95),rgba(30,81,93,0.95)_55%,rgba(14,41,47,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.94),transparent_28%),linear-gradient(180deg,rgba(230,250,255,0.95),rgba(178,235,243,0.76)_46%,rgba(101,207,223,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(65,150,169,0.95),rgba(43,116,129,0.74)_46%,rgba(16,46,52,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(91,198,214,0.14),rgba(54,158,176,0.82)_40%,rgba(28,102,116,1))] dark:bg-[linear-gradient(180deg,rgba(61,158,174,0.14),rgba(34,93,105,0.82)_40%,rgba(13,41,47,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(40,116,131,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(142,224,236,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(88,184,201,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(98,197,214,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(43,127,142,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(187,240,247,0.75),transparent_15%)]",
  },
  normal: {
    section:
      "border-stone-900/10 bg-[linear-gradient(180deg,rgba(250,248,244,0.95),rgba(241,236,229,0.96))] dark:border-stone-200/10 dark:bg-[linear-gradient(180deg,rgba(41,36,31,0.95),rgba(23,20,18,0.98))]",
    text: "text-stone-950/75 dark:text-stone-50/75",
    scene:
      "border-stone-950/10 bg-[linear-gradient(180deg,rgba(245,239,232,0.96),rgba(196,178,161,0.84)_55%,rgba(126,108,93,0.98))] dark:border-stone-100/10 dark:bg-[linear-gradient(180deg,rgba(91,78,67,0.95),rgba(75,64,56,0.95)_55%,rgba(34,29,26,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.88),transparent_28%),linear-gradient(180deg,rgba(246,241,235,0.95),rgba(220,206,194,0.76)_46%,rgba(166,146,130,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(180deg,rgba(119,103,90,0.95),rgba(89,77,68,0.74)_46%,rgba(38,33,28,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(167,147,129,0.14),rgba(126,108,92,0.82)_40%,rgba(86,72,62,1))] dark:bg-[linear-gradient(180deg,rgba(137,116,101,0.14),rgba(72,62,54,0.82)_40%,rgba(31,27,24,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(109,92,79,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(190,171,156,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(150,131,118,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(160,141,127,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(96,82,70,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(218,206,196,0.75),transparent_15%)]",
  },
  poison: {
    section:
      "border-fuchsia-900/10 bg-[linear-gradient(180deg,rgba(252,243,255,0.95),rgba(243,230,252,0.96))] dark:border-fuchsia-200/10 dark:bg-[linear-gradient(180deg,rgba(49,23,58,0.95),rgba(28,13,33,0.98))]",
    text: "text-fuchsia-950/75 dark:text-fuchsia-50/75",
    scene:
      "border-fuchsia-950/10 bg-[linear-gradient(180deg,rgba(246,234,255,0.96),rgba(193,129,227,0.84)_55%,rgba(132,69,164,0.98))] dark:border-fuchsia-100/10 dark:bg-[linear-gradient(180deg,rgba(94,48,120,0.95),rgba(78,39,101,0.95)_55%,rgba(38,17,45,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(248,236,255,0.95),rgba(219,179,243,0.76)_46%,rgba(164,96,210,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(180deg,rgba(126,72,160,0.95),rgba(98,52,126,0.74)_46%,rgba(40,18,48,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(171,101,216,0.14),rgba(128,67,165,0.82)_40%,rgba(86,41,115,1))] dark:bg-[linear-gradient(180deg,rgba(138,76,176,0.14),rgba(78,39,104,0.82)_40%,rgba(35,16,45,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(115,53,149,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(198,132,230,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(155,84,198,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(166,96,210,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(103,46,137,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(224,183,245,0.75),transparent_15%)]",
  },
  psychic: {
    section:
      "border-rose-900/10 bg-[linear-gradient(180deg,rgba(255,242,246,0.95),rgba(252,230,239,0.96))] dark:border-rose-200/10 dark:bg-[linear-gradient(180deg,rgba(58,24,36,0.95),rgba(31,14,20,0.98))]",
    text: "text-rose-950/75 dark:text-rose-50/75",
    scene:
      "border-rose-950/10 bg-[linear-gradient(180deg,rgba(255,232,239,0.96),rgba(236,142,172,0.84)_55%,rgba(181,76,113,0.98))] dark:border-rose-100/10 dark:bg-[linear-gradient(180deg,rgba(116,51,74,0.95),rgba(92,42,61,0.95)_55%,rgba(43,17,27,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(255,236,243,0.95),rgba(244,182,202,0.76)_46%,rgba(215,101,139,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(180deg,rgba(150,71,98,0.95),rgba(116,57,81,0.74)_46%,rgba(48,19,30,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(222,106,143,0.14),rgba(178,73,107,0.82)_40%,rgba(123,42,71,1))] dark:bg-[linear-gradient(180deg,rgba(173,78,111,0.14),rgba(103,43,67,0.82)_40%,rgba(43,17,28,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(158,57,94,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(239,145,177,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(202,86,125,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(214,98,136,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(143,48,84,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(247,184,206,0.75),transparent_15%)]",
  },
  rock: {
    section:
      "border-stone-900/15 bg-[linear-gradient(180deg,rgba(250,247,239,0.95),rgba(240,233,217,0.96))] dark:border-stone-200/10 dark:bg-[linear-gradient(180deg,rgba(49,43,34,0.95),rgba(28,24,19,0.98))]",
    text: "text-stone-950/75 dark:text-stone-50/75",
    scene:
      "border-stone-950/15 bg-[linear-gradient(180deg,rgba(243,236,219,0.96),rgba(185,163,116,0.84)_55%,rgba(123,98,60,0.98))] dark:border-stone-100/10 dark:bg-[linear-gradient(180deg,rgba(95,79,49,0.95),rgba(75,62,38,0.95)_55%,rgba(37,30,20,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.88),transparent_28%),linear-gradient(180deg,rgba(245,240,224,0.95),rgba(218,202,163,0.74)_46%,rgba(164,139,90,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(127,109,72,0.95),rgba(95,79,51,0.72)_46%,rgba(40,32,22,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(170,143,89,0.15),rgba(127,102,60,0.82)_40%,rgba(85,66,37,1))] dark:bg-[linear-gradient(180deg,rgba(137,111,65,0.15),rgba(78,61,35,0.82)_40%,rgba(34,27,18,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(117,91,50,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(196,174,124,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(156,130,82,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(168,142,94,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(109,85,46,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(223,207,171,0.75),transparent_15%)]",
  },
  steel: {
    section:
      "border-slate-900/10 bg-[linear-gradient(180deg,rgba(245,248,250,0.95),rgba(232,238,242,0.96))] dark:border-slate-200/10 dark:bg-[linear-gradient(180deg,rgba(28,35,41,0.95),rgba(16,21,26,0.98))]",
    text: "text-slate-950/75 dark:text-slate-50/75",
    scene:
      "border-slate-950/10 bg-[linear-gradient(180deg,rgba(235,241,245,0.96),rgba(160,180,194,0.84)_55%,rgba(88,108,122,0.98))] dark:border-slate-100/10 dark:bg-[linear-gradient(180deg,rgba(63,86,102,0.95),rgba(46,67,80,0.95)_55%,rgba(21,31,38,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(237,242,245,0.95),rgba(192,209,220,0.76)_46%,rgba(120,153,173,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(86,117,136,0.95),rgba(58,82,97,0.74)_46%,rgba(23,34,41,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(126,157,176,0.14),rgba(87,116,133,0.82)_40%,rgba(52,74,87,1))] dark:bg-[linear-gradient(180deg,rgba(90,119,137,0.14),rgba(49,71,84,0.82)_40%,rgba(20,30,37,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(61,90,106,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(167,188,202,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(106,136,154,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(117,147,165,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(68,99,116,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(207,220,228,0.75),transparent_15%)]",
  },
  water: {
    section:
      "border-blue-900/10 bg-[linear-gradient(180deg,rgba(241,248,255,0.95),rgba(226,239,255,0.96))] dark:border-blue-200/10 dark:bg-[linear-gradient(180deg,rgba(20,35,58,0.95),rgba(11,20,35,0.98))]",
    text: "text-blue-950/75 dark:text-blue-50/75",
    scene:
      "border-blue-950/10 bg-[linear-gradient(180deg,rgba(231,241,255,0.96),rgba(133,177,239,0.84)_55%,rgba(62,108,186,0.98))] dark:border-blue-100/10 dark:bg-[linear-gradient(180deg,rgba(45,83,146,0.95),rgba(35,66,116,0.95)_55%,rgba(17,31,58,0.98))]",
    sky:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.92),transparent_28%),linear-gradient(180deg,rgba(234,243,255,0.95),rgba(180,209,247,0.76)_46%,rgba(95,148,226,0.28))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(69,115,191,0.95),rgba(48,85,146,0.74)_46%,rgba(20,35,62,0.22))]",
    ground:
      "bg-[linear-gradient(180deg,rgba(90,141,221,0.14),rgba(53,101,180,0.82)_40%,rgba(30,69,127,1))] dark:bg-[linear-gradient(180deg,rgba(67,108,178,0.14),rgba(32,64,116,0.82)_40%,rgba(14,28,54,1))]",
    grass:
      "bg-[radial-gradient(circle_at_10%_100%,rgba(43,77,145,0.7),transparent_20%),radial-gradient(circle_at_22%_100%,rgba(136,182,240,0.8),transparent_16%),radial-gradient(circle_at_35%_100%,rgba(74,122,204,0.85),transparent_17%),radial-gradient(circle_at_52%_100%,rgba(86,135,216,0.8),transparent_16%),radial-gradient(circle_at_69%_100%,rgba(42,80,153,0.75),transparent_16%),radial-gradient(circle_at_85%_100%,rgba(185,214,247,0.75),transparent_15%)]",
  },
};

type EncounterScalePreset = {
  label: string;
  wrapperClass: string;
  imageClass: string;
  auraClass: string;
  imageWidth: number;
  imageHeight: number;
  sizes: string;
};

const ENCOUNTER_SCALE_PRESETS: Record<"tiny" | "small" | "medium" | "large" | "giant", EncounterScalePreset> = {
  tiny: {
    label: "초소형 체급",
    wrapperClass: "h-[5.75rem] w-[5.75rem] sm:h-[6.5rem] sm:w-[6.5rem]",
    imageClass: "h-[3.9rem] w-[3.9rem] sm:h-[4.6rem] sm:w-[4.6rem]",
    auraClass: "h-20 w-20 sm:h-24 sm:w-24",
    imageWidth: 80,
    imageHeight: 80,
    sizes: "(max-width: 640px) 64px, 80px",
  },
  small: {
    label: "소형 체급",
    wrapperClass: "h-[8rem] w-[8rem] sm:h-[9rem] sm:w-[9rem]",
    imageClass: "h-[5.75rem] w-[5.75rem] sm:h-[6.75rem] sm:w-[6.75rem]",
    auraClass: "h-28 w-28 sm:h-36 sm:w-36",
    imageWidth: 112,
    imageHeight: 112,
    sizes: "(max-width: 640px) 92px, 112px",
  },
  medium: {
    label: "중형 체급",
    wrapperClass: "h-[11rem] w-[11rem] sm:h-[12rem] sm:w-[12rem]",
    imageClass: "h-[8.25rem] w-[8.25rem] sm:h-[9.25rem] sm:w-[9.25rem]",
    auraClass: "h-40 w-40 sm:h-52 sm:w-52",
    imageWidth: 160,
    imageHeight: 160,
    sizes: "(max-width: 640px) 144px, 160px",
  },
  large: {
    label: "대형 체급",
    wrapperClass: "h-[14.5rem] w-[14.5rem] sm:h-[16rem] sm:w-[16rem]",
    imageClass: "h-[11rem] w-[11rem] sm:h-[12.5rem] sm:w-[12.5rem]",
    auraClass: "h-60 w-60 sm:h-72 sm:w-72",
    imageWidth: 208,
    imageHeight: 208,
    sizes: "(max-width: 640px) 188px, 208px",
  },
  giant: {
    label: "초대형 체급",
    wrapperClass: "h-[19rem] w-[19rem] sm:h-[21rem] sm:w-[21rem]",
    imageClass: "h-[15rem] w-[15rem] sm:h-[17rem] sm:w-[17rem]",
    auraClass: "h-72 w-72 sm:h-[22rem] sm:w-[22rem]",
    imageWidth: 256,
    imageHeight: 256,
    sizes: "(max-width: 640px) 224px, 256px",
  },
};

function getEncounterScalePreset(encounter: PokemonCollectionCatalogEntry | null): EncounterScalePreset {
  if (!encounter) {
    return ENCOUNTER_SCALE_PRESETS.medium;
  }

  const { height, weight } = encounter;

  if (height <= 6) {
    return ENCOUNTER_SCALE_PRESETS.tiny;
  }

  if (height <= 12) {
    return ENCOUNTER_SCALE_PRESETS.small;
  }

  if (height <= 20) {
    return ENCOUNTER_SCALE_PRESETS.medium;
  }

  if (height <= 32) {
    return ENCOUNTER_SCALE_PRESETS.large;
  }

  return ENCOUNTER_SCALE_PRESETS.giant;
}

function formatEncounterMetric(value: number) {
  return Number((value / 10).toFixed(1)).toString();
}

export function DailyEncounter({
  encounter,
  isShiny,
  capturedCount,
  totalCount,
  recentCaptures,
  isCaptured,
  isReady,
  isSyncing,
  isTransitioning,
  onCapture,
  onResetToday,
  onRerollToday,
  canRerollToday,
}: DailyEncounterProps) {
  const completionRate = totalCount === 0 ? 0 : Math.round((capturedCount / totalCount) * 100);
  const mainType = encounter?.types[0]?.name ?? "grass";
  const sceneStyle = ENCOUNTER_SCENE_STYLES[mainType];
  const encounterDisplayImageUrl = encounter
    ? isShiny
      ? encounter.defaultShinyArtworkImageUrl ?? encounter.artworkImageUrl
      : encounter.imageUrl
    : null;
  const captureTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const encounterScalePreset = getEncounterScalePreset(encounter);
  const encounterScaleLabel = encounter
    ? [formatEncounterMetric(encounter.height) + "m", formatEncounterMetric(encounter.weight) + "kg", encounterScalePreset.label].join(" · ")
    : null;
  const [isThrowingBall, setIsThrowingBall] = useState(false);

  useEffect(() => {
    if (!isCaptured) {
      return;
    }

    setIsThrowingBall(false);
  }, [isCaptured]);

  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) {
        window.clearTimeout(captureTimeoutRef.current);
      }

      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  function throwPokeball() {
    if (!encounter || isCaptured || isThrowingBall || isSyncing || isTransitioning) {
      return;
    }

    setIsThrowingBall(true);

    captureTimeoutRef.current = window.setTimeout(() => {
      onCapture();
    }, 850);

    resetTimeoutRef.current = window.setTimeout(() => {
      setIsThrowingBall(false);
    }, 1450);
  }

  return (
    <section className={`relative overflow-hidden rounded-[2rem] shadow-card ${sceneStyle.section}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(circle_at_15%_100%,rgba(34,197,94,0.42),transparent_28%),radial-gradient(circle_at_40%_100%,rgba(22,163,74,0.38),transparent_24%),radial-gradient(circle_at_72%_100%,rgba(74,222,128,0.35),transparent_24%),linear-gradient(180deg,transparent,rgba(21,128,61,0.08)_46%,rgba(20,83,45,0.24))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.72),transparent_16%),radial-gradient(circle_at_65%_5%,rgba(255,255,255,0.56),transparent_18%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.4),transparent_14%)]"
      />

      <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${sceneStyle.text}`}>
              Daily Encounter
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
                오늘의 포켓몬
              </h2>
              <p className={`max-w-2xl text-sm leading-6 ${sceneStyle.text}`}>
                풀숲에 하루 한 번 포켓몬이 출현합니다. 화면을 클릭하면 포켓볼이 날아가고, 포획에 성공하면 내 도감에
                등록됩니다.
              </p>
            </div>
          </div>

          {!isReady ? (
            <div className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:p-5">
              <div className={`relative min-h-[440px] w-full overflow-hidden rounded-[1.75rem] border ${sceneStyle.scene} sm:min-h-[480px]`}>
                <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-[60%] ${sceneStyle.sky}`} />
                <div aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[46%] ${sceneStyle.ground}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className={`text-sm font-semibold ${sceneStyle.text}`}>오늘의 포켓몬을 불러오는 중...</p>
                </div>
              </div>
            </div>
          ) : encounter ? (
            <div className="w-full space-y-4 rounded-[1.75rem] border border-white/60 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:p-5">
              <div className="w-full">
                <button
                  type="button"
                  onClick={throwPokeball}
                  disabled={isCaptured || isThrowingBall || isSyncing || isTransitioning}
                  className={`relative block min-h-[440px] w-full overflow-hidden rounded-[1.75rem] border text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-[1.02] disabled:cursor-default disabled:hover:brightness-100 ${sceneStyle.scene} sm:min-h-[480px]`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-[60%] ${sceneStyle.sky}`}
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-[46%] ${sceneStyle.ground}`}
                  />
                  <div aria-hidden="true" className="absolute inset-x-0 top-[50%] h-[20%] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_28%,rgba(34,84,39,0.16)_72%,rgba(22,58,27,0.32))] blur-xl" />
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_38%),linear-gradient(180deg,rgba(41,89,40,0)_0%,rgba(43,91,39,0.18)_24%,rgba(38,84,36,0.62)_68%,rgba(24,58,27,0.92)_100%)]" />
                  <div aria-hidden="true" className={`absolute inset-x-0 bottom-8 h-28 wild-grass-sway opacity-70 blur-[1px] ${sceneStyle.grass}`} />
                  <div aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-24 wild-grass-sway opacity-95 ${sceneStyle.grass}`} />
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(16,40,19,0),rgba(18,46,22,0.24)_34%,rgba(18,44,22,0.78)_100%)]" />

                  <div className="absolute left-6 top-6 rounded-full bg-black/25 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/90 backdrop-blur-md">
                    야생의 {encounter.name}
                  </div>

                  {isShiny ? (
                    <div className="absolute right-6 top-6 rounded-full bg-amber-300/90 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-amber-950 shadow-[0_10px_20px_rgba(245,158,11,0.25)]">
                      Shiny
                    </div>
                  ) : null}

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-[14%] h-40 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_58%)] blur-3xl sm:h-48"
                  />
                  <div className="absolute inset-x-0 top-[18%] flex justify-center sm:top-[16%]">
                    <div className={`relative flex items-end justify-center ${encounterScalePreset.wrapperClass} ${isCaptured ? "capture-ring-pulse" : ""}`}>
                      <div
                        aria-hidden="true"
                        className={`absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 blur-3xl ${encounterScalePreset.auraClass}`}
                      />
                      <div aria-hidden="true" className="absolute inset-x-5 bottom-4 h-8 rounded-full bg-black/25 blur-2xl sm:h-10" />
                      <Image
                        src={encounterDisplayImageUrl ?? encounter.imageUrl}
                        alt={encounter.name}
                        width={encounterScalePreset.imageWidth}
                        height={encounterScalePreset.imageHeight}
                        sizes={encounterScalePreset.sizes}
                        className={`object-contain drop-shadow-[0_28px_30px_rgba(16,48,20,0.34)] ${encounterScalePreset.imageClass} ${
                          isCaptured ? "" : "wild-pokemon-float"
                        }`}
                        unoptimized
                      />
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-4 flex justify-center">
                    <div
                      className={`relative h-16 w-16 rounded-full border-4 border-zinc-900 bg-[linear-gradient(180deg,#ff6a6a_0%,#d91f1f_48%,#f4f4f5_49%,#ffffff_100%)] shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${
                        isThrowingBall ? "pokeball-throw" : ""
                      }`}
                    >
                      <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-zinc-900" />
                      <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-zinc-900 bg-white" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 rounded-2xl bg-black/20 px-4 py-3 text-xs leading-5 text-white/90 backdrop-blur-md">
                    <p className="font-semibold tracking-[0.12em] text-white/95">조우 체급</p>
                    <p>{encounterScaleLabel}</p>
                  </div>

                  <div className="absolute bottom-6 right-6 rounded-2xl bg-black/25 px-4 py-3 text-xs leading-5 text-white/90 backdrop-blur-md">
                    {isCaptured
                      ? "오늘의 포획 완료"
                      : isTransitioning
                        ? "새 포켓몬을 불러오는 중..."
                        : isThrowingBall || isSyncing
                          ? "포켓볼이 날아갑니다..."
                          : "화면을 클릭해 포켓볼을 던져 보세요"}
                  </div>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={throwPokeball}
                    disabled={isCaptured || isThrowingBall || isSyncing || isTransitioning}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-950 px-5 text-sm font-semibold text-emerald-50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-emerald-950/35 disabled:text-emerald-50/70 dark:bg-emerald-100 dark:text-emerald-950 dark:disabled:bg-emerald-100/30 dark:disabled:text-emerald-950/60"
                  >
                    {isCaptured ? "포획 완료" : isTransitioning ? "새 포켓몬 불러오는 중" : isThrowingBall ? "포획 시도 중" : "포켓볼 던지기"}
                  </button>
                  <button
                    type="button"
                    onClick={onResetToday}
                    disabled={isSyncing}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-emerald-950/15 bg-white/80 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-emerald-50 dark:hover:bg-white/15"
                  >
                    오늘 상태 초기화
                  </button>
                  <button
                    type="button"
                    onClick={onRerollToday}
                    disabled={!canRerollToday || isTransitioning}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-emerald-950/15 bg-white/80 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/10 dark:text-emerald-50 dark:hover:bg-white/15"
                  >
                    포켓몬 바꾸기
                  </button>
                </div>
                <p className="text-sm text-emerald-950/75 dark:text-emerald-50/75">
                  {isCaptured
                    ? "오늘의 포켓몬이 내 도감에 등록되었습니다."
                    : "조우 화면 아무 곳이나 눌러도 포켓볼을 던질 수 있습니다."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 px-5 py-6 text-sm leading-6 text-emerald-950/75 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-emerald-50/80">
              더 이상 출현할 야생 포켓몬이 없습니다. 현재 도감을 모두 채웠습니다.
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/72 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/70 dark:text-emerald-100/70">
                Encounter Data
              </p>
              <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
                {encounter?.name ?? "완료"}
              </h3>
            </div>

            {encounter ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-emerald-900/15 bg-emerald-950 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-50 dark:border-emerald-100/10 dark:bg-emerald-100 dark:text-emerald-950">
                    {formatDexNumber(encounter.nationalDexNumber)}
                  </span>
                  <span className="inline-flex rounded-full border border-emerald-900/15 bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-950 dark:border-white/10 dark:bg-white/10 dark:text-emerald-50">
                    {formatGenerationLabel(encounter.generation.id)}
                  </span>
                  {isCaptured ? (
                    <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-900 dark:text-emerald-100">
                      포획 완료
                    </span>
                  ) : null}
                  {isShiny ? (
                    <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-300/20 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-amber-900 dark:text-amber-100">
                      Shiny
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1 text-sm leading-6 text-emerald-950/75 dark:text-emerald-50/75">
                  <p>능력치 총합 {Object.values(encounter.stats).reduce((sum, value) => sum + value, 0)}</p>
                  <p>{encounterScaleLabel}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {encounter.types.map((type) => (
                    <TypeBadge key={`${encounter.nationalDexNumber}-${type.name}`} type={type} />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/70 dark:text-emerald-100/70">
              My Pokedex
            </p>
            <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
              {capturedCount}
              <span className="ml-2 text-lg text-muted-foreground">/ {totalCount}</span>
            </h3>
            <p className="text-sm text-emerald-950/75 dark:text-emerald-50/75">도감 완성도 {completionRate}%</p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-emerald-950/10 dark:bg-emerald-50/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(22,163,74,0.9),rgba(34,197,94,0.75))]"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/70 dark:text-emerald-100/70">
              최근 등록
            </p>
            {recentCaptures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentCaptures.map((pokemon) => (
                  <span
                    key={pokemon.nationalDexNumber}
                    className="inline-flex rounded-full border border-emerald-900/15 bg-background px-3 py-1 text-xs font-semibold text-foreground dark:border-emerald-100/10"
                  >
                    {pokemon.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-emerald-950/75 dark:text-emerald-50/75">
                아직 포획한 포켓몬이 없습니다. 오늘의 야생 포켓몬부터 잡아 보세요.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}



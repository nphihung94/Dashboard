# Color Reference — Base.vn Design System V0.2

## How to use this file
Always reference colors via CSS custom properties defined in `tokens.css`.
Never hardcode hex values in component CSS files.

---

## Neutral — Text

| State | Token | Hex |
|---|---|---|
| Text 1 default | `--color-neutral-text-1-default` | #343434 |
| Text 2 default | `--color-neutral-text-2-default` | #5B5B5B |
| Text 3 default | `--color-neutral-text-3-default` | #757575 |
| Text 4 default | `--color-neutral-text-4-default` | #8F8F8F |
| Brand default | `--color-neutral-text-brand-default` | #1E88E5 |
| Brand hover | `--color-neutral-text-brand-hover` | #186DB7 |
| Brand pressed | `--color-neutral-text-brand-pressed` | #0C365C |
| Brand selected | `--color-neutral-text-brand-selected` | #125289 |
| Disabled | `--color-neutral-text-disable` | #C2C2C2 |
| Inverted | `--color-neutral-text-inverted` | #FFFFFF |

## Neutral — Background

| State | Token | Hex |
|---|---|---|
| Default | `--color-neutral-background-1-default` | #FFFFFF |
| Disabled | `--color-neutral-background-disable` | #F0F0F0 |
| Inverted | `--color-neutral-background-inverted` | #3A3A3A |
| Static | `--color-neutral-background-static` | #484848 |

## Brand Blue — Background

| State | Token | Hex |
|---|---|---|
| Primary default | `--color-brand-background-1-default` | #1E88E5 |
| Primary hover | `--color-brand-background-1-hover` | #186DB7 |
| Primary pressed | `--color-brand-background-1-pressed` | #0C365C |
| Primary selected | `--color-brand-background-1-selected` | #125289 |
| Subtle default | `--color-brand-background-2-default` | #F1F8FE |
| Subtle hover | `--color-brand-background-2-hover` | #E3F0FC |
| Subtle pressed | `--color-brand-background-2-pressed` | #C6E1F8 |
| Disabled | `--color-brand-background-disable` | #F0F0F0 |

## Brand Blue — Text

| State | Token | Hex |
|---|---|---|
| On brand (white) | `--color-brand-text-1-default` | #FFFFFF |
| On brand disabled | `--color-brand-text-1-disable` | #8EC3F2 |
| Brand text default | `--color-brand-text-2-default` | #1E88E5 |
| Brand text hover | `--color-brand-text-2-hover` | #186DB7 |
| Brand text pressed | `--color-brand-text-2-pressed` | #125289 |

## Status — Critical (Red)

| Usage | Token | Hex |
|---|---|---|
| BG subtle | `--color-status-critical-background-2-default` | #FFECEB |
| BG solid default | `--color-status-critical-background-3-default` | #FF473D |
| BG solid hover | `--color-status-critical-background-3-hover` | #ED1307 |
| Text | `--color-status-critical-text-1-default` | #FF473D |
| Icon | `--color-status-critical-icon-1-default` | #FF473D |
| Stroke | `--color-status-critical-stroke-1-default` | #ED1307 |

## Status — Success (Green)

| Usage | Token | Hex |
|---|---|---|
| BG subtle | `--color-status-success-background-2-default` | #EEFCF5 |
| BG solid default | `--color-status-success-background-3-default` | #21B66B |
| BG solid hover | `--color-status-success-background-3-hover` | #1DA461 |
| Text | `--color-status-success-text-1-default` | #21B66B |
| Icon | `--color-status-success-icon-1-default` | #21B66B |
| Stroke | `--color-status-success-stroke-1-default` | #1DA461 |

## Status — Warning (Orange)

| Usage | Token | Hex |
|---|---|---|
| BG subtle | `--color-status-warning-background-2-default` | #FFEDD6 |
| BG solid default | `--color-status-warning-background-3-default` | #FFA229 |
| Text | `--color-status-warning-text-1-default` | #E07F00 |
| Icon | `--color-status-warning-icon-1-default` | #E07F00 |
| Stroke | `--color-status-warning-stroke-1-default` | #E07F00 |

## Status — Attention (Yellow)

| Usage | Token | Hex |
|---|---|---|
| BG subtle | `--color-status-attention-background-2-default` | #FFFBE0 |
| BG solid default | `--color-status-attention-background-3-default` | #FFE419 |
| Text | `--color-status-attention-text-1-default` | #F0D400 |
| Icon | `--color-status-attention-icon-1-default` | #F0D400 |
| Stroke | `--color-status-attention-stroke-1-default` | #F0D400 |

## Status — Info (Blue)

| Usage | Token | Hex |
|---|---|---|
| BG subtle | `--color-status-info-background-2-default` | #DDEBF8 |
| BG solid default | `--color-status-info-background-3-default` | #2773BE |
| Text | `--color-status-info-text-1-default` | #2179AB |
| Icon | `--color-status-info-icon-1-default` | #2179AB |
| Stroke | `--color-status-info-stroke-1-default` | #2366A9 |

---

## Decision Guide: Which color to use?

| Situation | Use |
|---|---|
| Main text on white | `--color-neutral-text-1-default` |
| Supporting text | `--color-neutral-text-2-default` |
| Helper/metadata text | `--color-neutral-text-3-default` |
| Placeholder text | `--color-neutral-text-4-default` |
| Clickable link | `--color-neutral-text-brand-default` |
| Disabled element | `--color-neutral-text-disable` + `--color-neutral-background-disable` |
| Primary button background | `--color-brand-background-1-default` |
| Primary button text | `--color-brand-text-1-default` |
| Error/validation message | `--color-status-critical-text-1-default` |
| Success toast/badge | `--color-status-success-background-3-default` |
| Warning banner | `--color-status-warning-background-2-default` |
| Info notice | `--color-status-info-background-2-default` |

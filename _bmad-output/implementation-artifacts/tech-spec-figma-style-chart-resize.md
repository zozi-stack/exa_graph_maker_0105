---
title: 'Figma-Style Proportional Chart Resize'
slug: 'figma-style-chart-resize'
created: '2026-01-04'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - React 18
  - TypeScript
  - D3.js
  - CSS Modules
  - Vite
  - dom-to-image-more
files_to_modify:
  - src/App.tsx
  - src/App.css
  - src/components/EvalChart.tsx
  - src/components/EvalChart.module.css
code_patterns:
  - useCallback + useRef for drag handlers
  - Mouse events on parent container
  - GraphWithPosition extends EvalData with position state
  - Hardcoded chart dimensions (640x300)
  - CSS Modules with warm aesthetic
test_patterns:
  - None (no tests in codebase)
---

# Tech-Spec: Figma-Style Proportional Chart Resize

**Created:** 2026-01-04

## Overview

### Problem Statement

Charts are fixed at 640×300px with no way to resize them. Users need to adjust chart sizes for different presentation contexts without losing visual quality.

### Solution

Add a draggable resize handle at the bottom-right corner of each chart. Dragging resizes the chart proportionally (maintains aspect ratio) by re-rendering at the new dimensions. Handle appears on hover with a warm, subtle aesthetic matching the existing UI.

### Scope

**In Scope:**
- Bottom-right resize handle per chart
- Proportional (aspect-ratio locked) resize via drag
- Re-render chart at new dimensions (D3 redraws, stays crisp)
- Min/max size constraints (320px min width, ~1280px max)
- Hover-reveal handle with warm aesthetic
- Persist scale state per chart in `GraphWithPosition`

**Out of Scope:**
- Free-form resize (independent width/height)
- Resize from other edges/corners
- Animation during resize (keep it snappy)
- Touch/mobile gestures

## Context for Development

### Codebase Patterns

- Charts use D3.js for rendering with hardcoded dimensions (640×300)
- Position state managed in App.tsx via `GraphWithPosition` interface extending `EvalData`
- Existing drag-to-move uses `useCallback` + `useRef` pattern with mousedown/mousemove/mouseup
- Mouse events attached to canvas container, per-chart `onMouseDown` initiates drag
- Button clicks excluded from drag via `closest('button')` check
- CSS Modules for component styling with warm aesthetic (#FAF9F7 background, warm shadows)
- Transitions use `0.15s ease` timing
- Export button positioned absolutely at bottom-right of chart

### Files to Reference

| File | Purpose |
| ---- | ------- |
| src/App.tsx | Main app, `GraphWithPosition` interface, drag handlers, graph state |
| src/App.css | Canvas styles, `.chart-wrapper` positioning and states |
| src/components/EvalChart.tsx | D3 chart rendering, hardcoded `width=640` `height=300`, margin config |
| src/components/EvalChart.module.css | Chart container, export button, warm aesthetic styles |
| src/types/eval.types.ts | `EvalData` interface (no changes needed) |

### Technical Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Resize Approach | Re-render D3 at new dimensions | Crisp visuals at any size |
| Aspect Ratio | 640:300 (=\(640/300 \approx 2.1333\)) | Maintain original proportions |
| Min Width | 320px (height: 150px) | Readable minimum |
| Max Width | 1280px (height: 600px) | 2x original, practical max |
| State Property | `chartWidth` per graph | Simpler than storing scale factor |
| Performance | Throttle resize drag to ~60fps | Smooth without overwhelming D3 |
| Handle Position | Bottom-right corner | Classic Figma-style affordance |
| Handle Visibility | Hover-reveal | Clean default, discoverable on interaction |

## Implementation Plan

### Tasks

- [ ] **Task 1: Extend GraphWithPosition interface**
  - File: `src/App.tsx`
  - Action: Add `chartWidth: number` property to `GraphWithPosition` interface
  - Notes: Default value should be `640` (original width). Height is always derived via aspect ratio.

- [ ] **Task 2: Initialize chartWidth in graph state**
  - File: `src/App.tsx`
  - Action: Update initial graph creation and `addGraph` function to include `chartWidth: 640`
  - Notes: Ensure existing graph in state gets default `chartWidth`, and ensure `updateActiveGraph` preserves the current graph’s `chartWidth` (ControlPanel edits should not reset sizing).

- [ ] **Task 3: Update EvalChart to accept width prop**
  - File: `src/components/EvalChart.tsx`
  - Action: 
    - Add `width?: number` to `EvalChartProps` interface
    - Replace hardcoded `width = 640` with `width = props.width ?? 640`
    - Derive `height` from width using exact original ratio: `height = Math.round(width * 300 / 640)`
    - Keep margins fixed (they scale with content, not container)
  - Notes: D3 scales will automatically adapt since they use `innerWidth`/`innerHeight`

- [ ] **Task 4: Pass chartWidth from App to EvalChart**
  - File: `src/App.tsx`
  - Action: Update `<EvalChart data={graph} />` to `<EvalChart data={graph} width={graph.chartWidth} />`
  - Notes: This connects the state to the rendering

- [ ] **Task 5: Add resize handle element**
  - File: `src/App.tsx`
  - Action: Add a resize handle `<div>` inside each `.chart-wrapper`, positioned at bottom-right
  - Notes: 
    - Use className `resize-handle`
    - Add `onMouseDown` handler to initiate resize (separate from drag-to-move)
    - Prevent event propagation to avoid triggering chart drag

- [ ] **Task 6: Add resize handle styles**
  - File: `src/App.css`
  - Action: Add styles for `.resize-handle`:
    - Position: `absolute`, `bottom: -8px`, `right: -8px`
    - Size: `16px × 16px`
    - Appearance: subtle corner indicator (two short lines or dots)
    - Default: `opacity: 0`
    - On `.chart-wrapper:hover`: `opacity: 0.5`
    - On handle hover: `opacity: 1`, cursor `nwse-resize`
    - Transition: `opacity 0.15s ease`
    - Color: warm tone matching existing aesthetic
  - Notes: Handle should feel like part of the Figma-style UI

- [ ] **Task 7: Implement resize state tracking**
  - File: `src/App.tsx`
  - Action: Add state and ref for resize tracking:
    - `const [resizingIndex, setResizingIndex] = useState<number | null>(null)`
    - `const resizeStartWidth = useRef<number>(0)`
    - `const resizeStartX = useRef<number>(0)`
  - Notes: Similar pattern to existing drag implementation

- [ ] **Task 8: Implement resize mouse handlers**
  - File: `src/App.tsx`
  - Action: Add resize handlers:
    - `handleResizeStart`: Store initial width and mouse X position
    - Update `handleMouseMove`: If `resizingIndex !== null`, calculate new width from mouse delta, apply aspect ratio, clamp to min/max, update graph state
    - Update `handleMouseUp`: Reset `resizingIndex` to null
  - Notes: 
    - New width = startWidth + (currentX - startX)
    - Clamp: `Math.max(320, Math.min(1280, newWidth))`
    - Performance: implement `requestAnimationFrame` throttling so rapid `mousemove` doesn’t spam `setGraphs` + D3 re-render.
    - Precedence: if resizing is active, skip drag-to-move updates (resize wins).

- [ ] **Task 9: Add resizing visual state**
  - File: `src/App.css`
  - Action: Add `.chart-wrapper.resizing` class with:
    - `cursor: nwse-resize`
    - Subtle visual feedback (e.g., slight border highlight)
  - Notes: Mirrors existing `.dragging` class pattern

- [ ] **Task 10: Verify export works at new dimensions**
  - File: `src/components/EvalChart.tsx`
  - Action: Verify `exportToPng` function uses the current rendered dimensions (it should, since it captures the DOM element)
  - Notes: No changes expected, just verification that dynamic sizing exports correctly

### Acceptance Criteria

- [ ] **AC 1:** Given a chart at default size (640×300), when user hovers over the chart wrapper, then a resize handle becomes visible at the bottom-right corner with subtle opacity
- [ ] **AC 2:** Given a visible resize handle, when user hovers directly over the handle, then the handle becomes fully opaque and cursor changes to `nwse-resize`
- [ ] **AC 3:** Given user mousedown on resize handle, when user drags horizontally, then the chart resizes proportionally maintaining the original 640×300 aspect ratio
- [ ] **AC 4:** Given resize in progress, when user releases mouse button, then the chart remains at the new size
- [ ] **AC 5:** Given chart width at 320px (minimum), when user attempts to drag smaller, then width stays at 320px
- [ ] **AC 6:** Given chart width at 1280px (maximum), when user attempts to drag larger, then width stays at 1280px
- [ ] **AC 7:** Given a resized chart, when user clicks Export, then the PNG reflects the current chart dimensions (not original 640×300)
- [ ] **AC 8:** Given user clicks and drags on chart body (not resize handle), when dragging, then chart moves position (existing drag behavior preserved)
- [ ] **AC 9:** Given multiple charts on canvas, when one is resized, then other charts are unaffected

## Additional Context

### Dependencies

No new dependencies required. Implementation uses:
- Existing React event handling patterns
- Existing D3 re-render on prop change
- Existing CSS Modules infrastructure

### Testing Strategy

**Manual Testing:**
1. Hover over chart → verify handle appears
2. Drag handle right → verify chart grows proportionally
3. Drag handle left → verify chart shrinks proportionally
4. Drag to minimum → verify stops at 320px wide
5. Drag to maximum → verify stops at 1280px wide
6. Export resized chart → verify PNG matches displayed size
7. Drag chart body → verify move still works
8. Resize one chart → verify others unchanged

**No automated tests** (consistent with existing codebase pattern)

### Notes

- **Performance:** If D3 re-renders feel sluggish during drag, add `requestAnimationFrame` throttling to the resize handler
- **Handle z-index:** Ensure resize handle doesn't conflict with export button (export is at `bottom: -35px`, handle at `bottom: -8px`)
- **Future consideration:** Could add keyboard resize (arrow keys when handle focused) — out of scope for now
- **Future consideration:** Could persist chart sizes to localStorage — out of scope for now


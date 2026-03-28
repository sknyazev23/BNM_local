import { useState, useCallback, useRef } from "react";

/**
 * Returns props for an overlay and a draggable panel inside it.
 * Usage:
 *   const { overlayProps, panelStyle, handleProps } = useDraggableModal();
 *   <div {...overlayProps}>
 *     <div style={panelStyle}>
 *       <div {...handleProps} />  ← drag handle (e.g. the title bar)
 *     </div>
 *   </div>
 */
export default function useDraggableModal() {
  const [pos, setPos] = useState(null); // null = CSS-centered
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    // Ignore interactive elements
    const interactiveTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "LABEL"];
    if (interactiveTags.includes(e.target.tagName)) return;
    if (e.target.closest("button, input, textarea, select, a, label")) return;

    e.preventDefault();
    const el = e.currentTarget.closest(".modal-content");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x: rect.left, y: rect.top };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const dx = ev.clientX - startMouse.current.x;
      const dy = ev.clientY - startMouse.current.y;
      
      let newX = startPos.current.x + dx;
      let newY = startPos.current.y + dy;

      // Boundary constraints so it can't be dragged completely off-screen
      const minX = 100 - el.offsetWidth;
      const maxX = window.innerWidth - 100;
      const minY = 0; // Title bar cannot go above top of screen
      const maxY = window.innerHeight - 40; // Title bar cannot go below bottom of screen

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // When dragged: overlay becomes pointer-passthrough, panel is fixed at pos
  const panelStyle = pos
    ? { position: "fixed", left: pos.x, top: pos.y, transform: "none", margin: 0 }
    : {};

  const overlayProps = pos
    ? { style: { pointerEvents: "none" } }
    : {};

  // Only apply styles when the modal has been moved
  const panelProps = {
    onMouseDown,
    style: {
      ...(pos ? panelStyle : {}),
      pointerEvents: pos ? "auto" : undefined,
      cursor: dragging.current ? "grabbing" : "auto"
    }
  };

  return { overlayProps, panelProps };
}

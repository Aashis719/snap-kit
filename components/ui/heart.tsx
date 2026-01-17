import { useRef, useState } from "react";

export default function ThrowableHeart({ Icon }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    setDragging(true);
    ref.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    velocity.current = {
      x: e.movementX,
      y: e.movementY,
    };

    pos.current.x += e.movementX;
    pos.current.y += e.movementY;

    ref.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) scale(1.2)`;
  };

  const onPointerUp = () => {
    setDragging(false);

    // Throw effect
    pos.current.x += velocity.current.x * 10;
    pos.current.y += velocity.current.y * 10;

    ref.current.style.transition =
      "transform 0.6s cubic-bezier(.22,1,.36,1)";
    ref.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;

    // Snap back
    setTimeout(() => {
      pos.current = { x: 0, y: 0 };
      ref.current.style.transform = "translate(0, 0) scale(1)";
    }, 600);
  };

  return (
    <Icon
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="
        w-3.5 h-3.5
        text-red-500
        cursor-grab active:cursor-grabbing
        drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]
        select-none
        touch-none
      "
    />
  );
}

/**
 * Two very faint floating shapes restored from the ref mockup
 * (fs-4 yellow + fs-7 teal). All other ref shapes are intentionally omitted
 * to keep the "AI vibe" low.
 *
 * Opacity is well below the ref values (0.06 / 0.04 vs ref 0.08 / 0.04)
 * so the shapes act as background depth rather than decoration.
 */
export function FloatingShapes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute size-[300px] rounded-full"
        style={{
          bottom: -150,
          left: -80,
          background: "#63d9d1",
          opacity: 0.04,
        }}
      />
      <div
        className="absolute size-[120px] rounded-full"
        style={{
          bottom: "20%",
          right: "4%",
          background: "#f0c040",
          opacity: 0.06,
        }}
      />
    </div>
  );
}

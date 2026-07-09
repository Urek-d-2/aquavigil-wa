// Jeu d'icônes SVG inline — pas d'emoji dans le contenu.
const P = {
  upload: "M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3 M12 3v12 M8 7l4-4 4 4",
  download: "M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3 M12 3v12 M8 11l4 4 4-4",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  info: "M12 3a9 9 0 100 18 9 9 0 000-18 M12 11v5 M12 8h.01",
  droplet: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  dna: "M5 3c0 5 14 6 14 9 M19 3c0 5-14 6-14 9 M5 21c0-5 14-6 14-9 M19 21c0-5-14-6-14-9 M8 6h8 M8 18h8",
  flask: "M9 3h6 M10 3v6l-5 8.5A2 2 0 006.7 21h10.6a2 2 0 001.7-3.5L14 9V3 M7.5 14h9",
  play: "M7 4l13 8-13 8z",
  activity: "M3 12h4l3 8 4-16 3 8h4",
  trendUp: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  trendDown: "M3 7l6 6 4-4 8 8 M15 17h6v-6",
  trendFlat: "M4 12h16",
  check: "M5 12l4 4L19 7",
  alert: "M12 3l9 16H3z M12 10v4 M12 17h.01",
  cube: "M12 2l9 5v10l-9 5-9-5V7z M12 2v20 M3 7l9 5 9-5",
};

export default function Icon({ name, size = 16, className = "" }) {
  const d = P[name] || "";
  return (
    <svg
      className={"ic " + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? seg : "M" + seg)} />
      ))}
    </svg>
  );
}

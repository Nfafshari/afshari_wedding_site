export default function LogoSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 210 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Piper & Nathen monogram"
      {...props}
    >
      <path
        d="M105 1.5C162.135 1.5 208.5 48.7072 208.5 107C208.5 165.293 162.135 212.5 105 212.5C47.8651 212.5 1.5 165.293 1.5 107C1.5 48.7072 47.8651 1.5 105 1.5Z"
        stroke="#C5A253"
        strokeWidth="3"
      />
      <path
        d="M105 16.5C153.867 16.5 193.5 57.0077 193.5 107C193.5 156.992 153.867 197.5 105 197.5C56.1332 197.5 16.5 156.992 16.5 107C16.5 57.0077 56.1332 16.5 105 16.5Z"
        stroke="#C5A253"
      />
      <text
        fill="#C5A253"
        style={{ whiteSpace: "pre", fontFamily: "times", letterSpacing: '0.1em'}}
        xmlSpace="preserve"
        fontSize={68}
      >
        <tspan x="46" y="130.416">{"P "}</tspan>
        <tspan x="99.7394" y="130.416">{" N"}</tspan>
      </text>
      <text
        fill="#C5A253"
        style={{ whiteSpace: "pre", fontFamily: "var(--font-herr-von)", letterSpacing: '0.1em' }}
        xmlSpace="preserve"
        fontSize={50}
      >
        <tspan x="85.0775" y="124.416">{"&"}</tspan>
      </text>
      <path d="M18 226H84" stroke="#C5A253" strokeWidth="3" />
      <path d="M126 226H192" stroke="#C5A253" strokeWidth="3" />
      <ellipse cx="104" cy="226" rx="3" ry="4" fill="#C5A253" />
    </svg>
  );
}

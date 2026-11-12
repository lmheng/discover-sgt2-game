import type { SVGProps } from "react";

const paths = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  cross: "M6 6l12 12M18 6L6 18",
  alert: "M12 3l10 18H2L12 3zm0 6v5m0 3.5v.5",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  sound: "M4 9v6h4l5 4V5L8 9H4zm12.5-1.5a6 6 0 010 9M19 5a9.5 9.5 0 010 14",
  mute: "M4 9v6h4l5 4V5L8 9H4zm12 0l5 6m0-6l-5 6",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  replay: "M4 12a8 8 0 108-8H8m0 0l3-3M8 4l3 3",
  search: "M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L21 21",
  chat: "M4 5h16v11H9l-5 4V5z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zm-9-9h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z",
  code: "M8 7l-5 5 5 5m8-10l5 5-5 5M14 4l-4 16",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0",
  rocket: "M12 15l-3-3c1.5-4.5 4.5-8 10-9-1 5.5-4.5 8.5-9 10zM9 12l-4 1-2 3 5-1m4 0l-1 5 3-2 1-4",
  stamp: "M9 4h6l-1 7h4l2 4H4l2-4h4L9 4zM4 19h16",
  lock: "M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z",
  exit: "M10 4H5v16h5m4-12l4 4-4 4m4-4H9",
  gift: "M4 10h16v10H4V10zm-1-4h18v4H3V6zm9 0v14M12 6c-1.5-3-5-3-5-1s3 1 5 1zm0 0c1.5-3 5-3 5-1s-3 1-5 1z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  sparkle: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-10v6m0-9v.5",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}

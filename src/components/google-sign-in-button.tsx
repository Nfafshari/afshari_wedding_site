import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Google's branding guidelines are strict about this button: the mark, the colors, the
 * 40px height and the "Sign in with Google" wording are all specified, so the values
 * below are hardcoded hex rather than pulled from our theme tokens. Don't swap them for
 * --burg/--gold — a restyled Google button is a branding violation.
 * @see https://developers.google.com/identity/branding-guidelines
 */
const googleSignInButtonVariants = cva(
  [
    "group relative box-border inline-flex min-w-min cursor-pointer items-center",
    "overflow-hidden border bg-clip-padding px-3 font-[Roboto,arial,sans-serif] tracking-[0.25px]",
    "whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-[218ms] outline-none select-none",
    // Google's spec calls for a state overlay that tints the whole button on hover/focus.
    // A pseudo-element gets us that without an extra layout div inside the button.
    "before:absolute before:inset-0 before:bg-[#001d35] before:opacity-0 before:transition-opacity before:duration-[218ms]",
    "enabled:hover:shadow-[0_1px_2px_0_rgba(60,64,67,.30),0_1px_3px_1px_rgba(60,64,67,.15)]",
    "enabled:hover:before:opacity-[0.08] enabled:focus:before:opacity-[0.12] enabled:active:before:opacity-[0.12]",
    "disabled:cursor-default disabled:bg-[#ffffff61]",
  ],
  {
    variants: {
      theme: {
        light: "border-transparent bg-[#f2f2f2] text-[#1f1f1f]",
        neutral: "border-[#747775] bg-white text-[#1f1f1f]",
        // On a dark button the dark tint is invisible, so the overlay flips to white.
        dark: "border-[#8e918f] bg-[#131314] text-[#e3e3e3] before:bg-white",
      },
      shape: {
        rectangular: "rounded",
        square: "rounded",
        pill: "rounded-[20px]",
        circle: "rounded-full",
      },
      size: {
        sm: "h-8 text-sm [&_svg]:size-4",
        md: "h-10 text-sm [&_svg]:size-5",
        lg: "h-12 text-base [&_svg]:size-6",
      },
    },
    compoundVariants: [
      // The icon-only shapes drop their padding and take their width from their height,
      // so they stay square/round at every size without a width per size.
      { shape: "square", class: "aspect-square px-0" },
      { shape: "circle", class: "aspect-square px-0" },
    ],
    defaultVariants: {
      theme: "light",
      shape: "rectangular",
      size: "md",
    },
  }
);

export interface GoogleSignInButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof googleSignInButtonVariants> {
  label?: string;
  logoAlign?: "left" | "center";
}

/** The Google "G" mark. Sized by the parent button's `[&_svg]:size-*` variant. */
export function GoogleIcon () {
  return (
    <svg viewBox="0 0 48 48" className="block shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export default function GoogleSignInButton ({
  label = "Sign in with Google",
  theme,
  shape,
  size,
  logoAlign = "left",
  className,
  ...props
}: GoogleSignInButtonProps) {
  // The icon-only shapes have nowhere to put text, so the label becomes the a11y name.
  const showLabel = label.length > 0 && shape !== "circle" && shape !== "square";

  return (
    <button
      className={cn(googleSignInButtonVariants({ theme, shape, size }), className)}
      aria-label={showLabel ? undefined : label}
      {...props}
    >
      <span
        className={cn(
          "relative flex h-full w-full flex-row flex-nowrap items-center gap-2.5 group-disabled:opacity-[0.38]",
          showLabel && logoAlign === "left" ? "justify-start" : "justify-center"
        )}
      >
        <GoogleIcon />
        {showLabel && (
          // With the logo left-aligned, the label grows to fill the space after it and
          // centers its own text — Google's "left" layout — rather than being pinned
          // beside the icon. Truncates with an ellipsis if the button is ever too narrow.
          <span
            className={cn(
              "overflow-hidden font-medium text-ellipsis whitespace-nowrap",
              logoAlign === "left" && "grow text-left"
            )}
          >
            {label}
          </span>
        )}
      </span>
    </button>
  );
}

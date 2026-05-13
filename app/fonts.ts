import localFont from "next/font/local";

// Satoshi font with all weights
export const satoshi = localFont({
  src: [
    {
      path: "../assets/fonts/satoshi/Satoshi-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../assets/fonts/satoshi/Satoshi-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Times New Roman font - can be used in both server and client components
export const timesRoman = localFont({
  src: "../assets/fonts/times-new-roman/times.ttf",
  variable: "--font-times-roman",
  display: "swap",
});

// Unbounded font with all weights
export const unbounded = localFont({
  src: [
    {
      path: "../assets/fonts/unbounded/Unbounded-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../assets/fonts/unbounded/Unbounded-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-unbounded",
  display: "swap",
});

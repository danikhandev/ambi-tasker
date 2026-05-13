import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nearby Providers | AmbiTasker",
  description:
    "Find trusted service providers near you — electricians, plumbers, mechanics and more. Powered by OpenStreetMap.",
};

export default function NearbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

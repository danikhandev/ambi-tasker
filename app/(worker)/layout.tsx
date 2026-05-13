import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Provider - AmbiTasker",
  description: "Provider section of AmbiTasker.",
};

export default function WorkerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "AmbiTasker - Authentication",
  description:
    "Secure access to AmbiTasker. Connect with verified home service professionals or manage your service provider account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

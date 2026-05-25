import type { Metadata } from "next";
import "./globals.css";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/auth-provider";
import { DataRealtimeBridge } from "@/components/data-realtime-bridge";
import { StoreProvider } from "@/components/store-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistHeading = Geist({ subsets: ['latin'], variable: '--font-heading' });

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏔️</text></svg>`;

export const metadata: Metadata = {
  title: "ChatPT",
  description:
    "Track rehab and strength qualities, maintain progress, and catch gaps before injuries.",
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, geistHeading.variable)}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <StoreProvider>
              <AuthProvider>
                <DataRealtimeBridge />
                {children}
              </AuthProvider>
            </StoreProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

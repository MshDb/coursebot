import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/Provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CourseBot",
  description: "CourseBot Platform Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

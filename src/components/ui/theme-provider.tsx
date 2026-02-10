import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: unknown; // Allow any additional props
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

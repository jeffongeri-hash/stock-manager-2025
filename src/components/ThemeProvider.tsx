import { ThemeProvider as NextThemesProvider } from "next-themes"
import * as React from "react"

type Attribute = 'class' | 'data-theme' | 'data-mode'

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: Attribute | Attribute[]
  defaultTheme?: string
  enableSystem?: boolean
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

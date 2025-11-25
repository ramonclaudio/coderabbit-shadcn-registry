/**
 * CodeRabbit Branding Components
 * Framework-agnostic theme-aware logos and icons
 */

interface CodeRabbitIconProps {
  className?: string
  /**
   * Theme mode: 'light' or 'dark'
   * @default 'light'
   */
  theme?: 'light' | 'dark'
}

/**
 * CodeRabbit icon (square logo)
 *
 * @example Basic usage (framework-agnostic)
 * ```tsx
 * <CodeRabbitIcon className="h-6 w-6" theme="dark" />
 * ```
 *
 * @example With Next.js theme detection
 * ```tsx
 * import { useTheme } from 'next-themes'
 *
 * function MyComponent() {
 *   const { resolvedTheme } = useTheme()
 *   return <CodeRabbitIcon theme={resolvedTheme as 'light' | 'dark'} />
 * }
 * ```
 *
 * @example With React state
 * ```tsx
 * const [isDark, setIsDark] = useState(false)
 * return <CodeRabbitIcon theme={isDark ? 'dark' : 'light'} />
 * ```
 */
export function CodeRabbitIcon({
  className = 'h-4 w-4',
  theme = 'light',
}: CodeRabbitIconProps) {
  const isDark = theme === 'dark'

  return (
    <img
      src={
        isDark
          ? '/coderabbit/coderabbit-dark-icon.svg'
          : '/coderabbit/coderabbit-light-icon.svg'
      }
      alt="CodeRabbit"
      className={className}
    />
  )
}

interface CodeRabbitLogoProps {
  className?: string
  /**
   * Theme mode: 'light' or 'dark'
   * @default 'light'
   */
  theme?: 'light' | 'dark'
}

/**
 * CodeRabbit logo (full wordmark)
 *
 * @example Basic usage (framework-agnostic)
 * ```tsx
 * <CodeRabbitLogo className="h-6" theme="dark" />
 * ```
 *
 * @example With Next.js theme detection
 * ```tsx
 * import { useTheme } from 'next-themes'
 *
 * function MyComponent() {
 *   const { resolvedTheme } = useTheme()
 *   return <CodeRabbitLogo theme={resolvedTheme as 'light' | 'dark'} />
 * }
 * ```
 *
 * @example With React state
 * ```tsx
 * const [isDark, setIsDark] = useState(false)
 * return <CodeRabbitLogo theme={isDark ? 'dark' : 'light'} />
 * ```
 */
export function CodeRabbitLogo({
  className = 'h-4',
  theme = 'light',
}: CodeRabbitLogoProps) {
  const isDark = theme === 'dark'

  return (
    <img
      src={
        isDark
          ? '/coderabbit/coderabbit-dark-logo.svg'
          : '/coderabbit/coderabbit-light-logo.svg'
      }
      alt="CodeRabbit"
      className={className}
    />
  )
}

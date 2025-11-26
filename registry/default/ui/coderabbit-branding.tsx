interface CodeRabbitIconProps {
  className?: string
  theme?: 'light' | 'dark'
}

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
  theme?: 'light' | 'dark'
}

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

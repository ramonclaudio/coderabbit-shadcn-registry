'use client'

import { useState, useEffect } from 'react'
import coderabbitDarkIcon from '@/registry/default/public/coderabbit-dark-icon.svg'
import coderabbitLightIcon from '@/registry/default/public/coderabbit-light-icon.svg'
import coderabbitDarkLogo from '@/registry/default/public/coderabbit-dark-logo.svg'
import coderabbitLightLogo from '@/registry/default/public/coderabbit-light-logo.svg'

/**
 * Detect dark mode using DOM/CSS (framework-agnostic)
 * Checks for .dark class on html/body or prefers-color-scheme media query
 * Returns null during SSR to prevent hydration mismatch
 */
function useDetectTheme(themeProp?: 'light' | 'dark'): 'light' | 'dark' | null {
  const [mounted, setMounted] = useState(false)
  const [detectedTheme, setDetectedTheme] = useState<'light' | 'dark'>(
    themeProp ?? 'light'
  )

  // Handle mount and auto-detection (only when no themeProp)
  useEffect(() => {
    // Using RAF to avoid synchronous setState warning while still setting mounted state
    requestAnimationFrame(() => {
      setMounted(true)
    })

    // If theme prop is provided, sync it
    if (themeProp) {
      requestAnimationFrame(() => {
        setDetectedTheme(themeProp)
      })
      return
    }

    // Check for .dark or .light class on html or body
    const getThemeFromClass = (): 'dark' | 'light' | null => {
      const html = document.documentElement
      const body = document.body
      if (html.classList.contains('dark') || body.classList.contains('dark')) {
        return 'dark'
      }
      if (html.classList.contains('light') || body.classList.contains('light')) {
        return 'light'
      }
      return null
    }

    // Check prefers-color-scheme media query (fallback)
    const getThemeFromMediaQuery = (): 'dark' | 'light' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }

    const updateTheme = () => {
      // Prioritize explicit class, fallback to media query
      const themeFromClass = getThemeFromClass()
      const theme = themeFromClass ?? getThemeFromMediaQuery()
      // Using RAF to avoid synchronous setState warning in effect
      requestAnimationFrame(() => {
        setDetectedTheme(theme)
      })
    }

    // Initial check
    updateTheme()

    // Listen for class changes on html element
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Listen for media query changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [themeProp])

  // Return null during SSR to indicate "not ready"
  if (!mounted) return null

  return detectedTheme
}

interface CodeRabbitIconProps {
  className?: string
  theme?: 'light' | 'dark'
}

export function CodeRabbitIcon({
  className = 'h-4 w-4',
  theme: themeProp,
}: CodeRabbitIconProps) {
  const theme = useDetectTheme(themeProp)

  // Render placeholder during SSR to avoid hydration mismatch
  if (theme === null) {
    return (
      <span
        className={className}
        style={{ display: 'inline-block', visibility: 'hidden' }}
      />
    )
  }

  const isDark = theme === 'dark'

  // dark-icon = white bg, for dark mode
  // light-icon = orange bg, for light mode
  return (
    // Using <img> intentionally for framework-agnostic registry component
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isDark ? coderabbitDarkIcon.src : coderabbitLightIcon.src}
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
  theme: themeProp,
}: CodeRabbitLogoProps) {
  const theme = useDetectTheme(themeProp)

  // Render placeholder during SSR to avoid hydration mismatch
  if (theme === null) {
    return (
      <span
        className={className}
        style={{ display: 'inline-block', visibility: 'hidden' }}
      />
    )
  }

  const isDark = theme === 'dark'

  // dark-logo = for dark mode
  // light-logo = for light mode
  return (
    // Using <img> intentionally for framework-agnostic registry component
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isDark ? coderabbitDarkLogo.src : coderabbitLightLogo.src}
      alt="CodeRabbit"
      className={className}
    />
  )
}

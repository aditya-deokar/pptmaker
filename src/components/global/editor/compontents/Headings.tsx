'use client';

import { cn } from '@/lib/utils';
import { useSlideStore } from '@/store/useSlideStore';
import { resolveThemeTokens } from '@/lib/themeUtils';
import React, { useEffect, useRef } from 'react';

interface HeadingProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

/**
 * Creates a premium heading component with:
 * - Accent-colored gradient underline decoration (for Title & H1)
 * - Responsive typography using clamp()
 * - Theme-aware coloring with accentColor support
 * - Subtle text-shadow for depth in dark themes
 */
const createHeading = (
  displayName: string,
  defaultClassName: string,
  options: {
    useAccentColor?: boolean;
    showAccentLine?: boolean;
    accentLineWidth?: string;
    accentLineHeight?: string;
  } = {}
) => {
  const {
    useAccentColor = false,
    showAccentLine = false,
    accentLineWidth = '60px',
    accentLineHeight = '3px',
  } = options;

  const Heading = React.forwardRef<HTMLTextAreaElement, HeadingProps>(
    ({ children, styles, isPreview = false, className, ...props }, ref) => {
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      const { currentTheme } = useSlideStore();

      useEffect(() => {
        const textarea = textareaRef.current;

        if (textarea && !isPreview) {
          const adjustHeight = () => {
            textarea.style.height = '0'
            textarea.style.height = `${textarea.scrollHeight}px`
          }


          textarea.addEventListener('input', adjustHeight);
          adjustHeight();
          return () => textarea.removeEventListener('input', adjustHeight);
        }
      }, [isPreview])

      const { color, ...restStyles } = styles || {};
      const finalColor = color || (useAccentColor ? currentTheme.accentColor : 'inherit');
      const isDark = currentTheme.type === 'dark';
      const tokens = resolveThemeTokens(currentTheme);

      return (
        <div className="relative w-full">
          <textarea
            className={cn(
              `w-full bg-transparent ${defaultClassName} placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/10 focus:outline-hidden transition-colors duration-200 resize-none leading-[1.2] tracking-tight hover:bg-black/5 dark:hover:bg-white/5 focus:bg-transparent rounded-md overflow-hidden`,
              isPreview ? 'cursor-default pointer-events-none hover:bg-transparent dark:hover:bg-transparent' : '',
              className
            )}
            style={{
              padding: 0,
              margin: 0,
              color: finalColor,
              boxSizing: 'border-box',
              lineHeight: '1.2em',
              minHeight: '1.2em',
              textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              fontFamily: tokens.headingFontFamily,
              ...restStyles,
            }}
            ref={(el) => {
              (textareaRef.current as HTMLTextAreaElement | null) = el
              if (typeof ref === 'function') ref(el)
              else if (ref) ref.current = el
            }}
            readOnly={isPreview}
            {...props}
          ></textarea>

          {/* Accent gradient underline decoration */}
          {showAccentLine && (
            <div
              className="mt-3 rounded-full transition-all duration-500"
              style={{
                width: accentLineWidth,
                height: accentLineHeight,
                background: tokens.accentGradient || `linear-gradient(90deg, ${currentTheme.accentColor}, ${currentTheme.accentColor}80, transparent)`,
              }}
            />
          )}
        </div>
      );
    }
  );


  Heading.displayName = displayName;
  return Heading;
};

const Heading1 = createHeading(
  'Heading1',
  'text-[clamp(1.5rem,4cqw,2.5rem)] font-extrabold mb-4 tracking-[-0.02em]',
  {
    useAccentColor: true,
    showAccentLine: true,
    accentLineWidth: '48px',
    accentLineHeight: '3px',
  }
)

const Heading2 = createHeading(
  'Heading2',
  'text-[clamp(1.25rem,3cqw,2rem)] font-bold mb-3 tracking-[-0.015em]',
  { useAccentColor: false }
)

const Heading3 = createHeading(
  'Heading3',
  'text-[clamp(1rem,2.5cqw,1.5rem)] font-semibold mb-2 tracking-[-0.01em]',
  { useAccentColor: false }
)

const Heading4 = createHeading(
  'Heading4',
  'text-[clamp(0.875rem,2cqw,1.25rem)] font-medium mb-2 tracking-normal',
  { useAccentColor: false }
)

const Title = createHeading(
  'Title',
  'text-[clamp(1.75rem,5cqw,3rem)] font-black mb-6 tracking-[-0.03em]',
  {
    useAccentColor: true,
    showAccentLine: true,
    accentLineWidth: '80px',
    accentLineHeight: '4px',
  }
)

export { Heading1, Heading2, Heading3, Heading4, Title }
import React from 'react';

type HighlightedTitleProps = {
  text?: string | null;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';
  className?: string;
  highlightClassName?: string;
};

export default function HighlightedTitle({
  text,
  as: Component = 'h2',
  className = '',
  highlightClassName = 'text-[#e9c349]',
}: HighlightedTitleProps) {
  if (!text) return null;

  const lines = text.split(/\r?\n|<br\s*\/?>/gi);

  return (
    <Component className={className}>
      {lines.map((line, lineIndex) => {
        const parts = line.split('*');

        return (
          <React.Fragment key={`${line}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {parts.map((part, index) =>
              index % 2 === 1 ? (
                <span key={`${part}-${index}`} className={highlightClassName}>
                  {part}
                </span>
              ) : (
                <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
              )
            )}
          </React.Fragment>
        );
      })}
    </Component>
  );
}

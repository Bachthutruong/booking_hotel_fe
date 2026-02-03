interface HtmlContentProps {
  html: string;
  className?: string;
  compact?: boolean;
}

/**
 * Component to safely render HTML content from rich text editors
 * Uses custom .rich-text-content styles defined in index.css
 */
export function HtmlContent({ 
  html, 
  className = '', 
  compact = false,
}: HtmlContentProps) {
  if (!html) {
    return null;
  }

  const baseClass = compact ? 'rich-text-content compact' : 'rich-text-content';

  return (
    <div 
      className={`${baseClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default HtmlContent;

import React, { Component, ErrorInfo, ReactNode, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SafeMarkdownProps {
  content: string;
}

/**
 * Error Boundary for SafeMarkdown component
 * Catches any React errors during markdown rendering
 */
class SafeMarkdownErrorBoundary extends Component<
  { children: ReactNode; content: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; content: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SafeMarkdown rendering error:', error);
    console.error('Error info:', errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Fallback: display raw content
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-[#595657] dark:text-[#9ca3af] bg-[#F9FAFD] dark:bg-[#1a1f2e] p-4 rounded">
            {this.props.content.substring(0, 10000)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Pre-process markdown content to fix formatting issues
 * Only fixes critical issues without breaking valid markdown
 */
const preprocessMarkdown = (content: string): string => {
  let processed = content;
  
  // 1. Fix inline bullets in paragraphs - ensure each bullet is on its own line
  // Pattern: "Text. • Item 1 • Item 2" -> "Text.\n\n• Item 1\n• Item 2"
  // Only do this if bullets appear after sentence endings within a paragraph
  processed = processed.replace(/([.!?])\s+([•*-])\s+([^\n]+?)(?=\s+[•*-]|\s+\d+\.|$)/g, (match, punct, bullet, text) => {
    // Check if this is already on its own line (has newline before)
    const beforeMatch = processed.substring(Math.max(0, processed.indexOf(match) - 10), processed.indexOf(match));
    if (beforeMatch.includes('\n')) {
      return match; // Already on its own line
    }
    return `${punct}\n\n${bullet} ${text}`;
  });
  
  // 2. Fix inline numbered lists in paragraphs
  processed = processed.replace(/([.!?])\s+(\d+\.)\s+([^\n]+?)(?=\s+\d+\.|$)/g, (match, punct, number, text) => {
    const beforeMatch = processed.substring(Math.max(0, processed.indexOf(match) - 10), processed.indexOf(match));
    if (beforeMatch.includes('\n')) {
      return match;
    }
    return `${punct}\n\n${number} ${text}`;
  });
  
  // 3. Ensure bullets at start of lines have proper spacing (but don't break existing lists)
  // Only add spacing if there's no blank line before
  processed = processed.replace(/([^\n])\n([•*-])\s/g, '$1\n\n$2 ');
  
  // 4. Ensure numbered lists at start of lines have proper spacing
  processed = processed.replace(/([^\n])\n(\d+\.)\s/g, '$1\n\n$2 ');
  
  return processed;
};

/**
 * Format list item to bold the first few words
 * Handles both string content and React elements
 */
const formatListItem = (item: string | ReactNode): ReactNode => {
  // If it's already a React element, check if it needs formatting
  if (typeof item !== 'string') {
    // If it's already formatted (contains strong tags), return as-is
    return item;
  }
  
  // Remove leading bullet/number if present
  const cleaned = item.replace(/^[•*-]\s+/, '').replace(/^\d+\.\s+/, '').trim();
  
  // Check if item already has bold markdown formatting
  if (cleaned.includes('**') && cleaned.match(/\*\*[^*]+\*\*/)) {
    // Already has bold formatting, return as-is (will be processed by markdown parser)
    return <>{cleaned}</>;
  }
  
  // Split into words
  const words = cleaned.split(/\s+/);
  
  // Bold first 3-5 words if they form a meaningful phrase (up to 30 chars)
  if (words.length >= 3) {
    let boldLength = 0;
    let boldWords: string[] = [];
    
    for (let i = 0; i < Math.min(words.length, 5); i++) {
      const testPhrase = boldWords.concat(words[i]).join(' ');
      if (testPhrase.length <= 30) {
        boldWords.push(words[i]);
        boldLength = testPhrase.length;
      } else {
        break;
      }
    }
    
    if (boldWords.length >= 2 && boldLength > 0) {
      const boldText = boldWords.join(' ');
      const restText = words.slice(boldWords.length).join(' ');
      return (
        <>
          <strong className="font-bold text-[#221E1F] dark:text-[#f3f4f6]">{boldText}</strong>
          {restText && ` ${restText}`}
        </>
      );
    }
  }
  
  return <>{cleaned}</>;
};

/**
 * Process table cell content - handle lists, bold text, and line breaks
 */
const processTableCellContent = (content: string): ReactNode => {
  if (!content || typeof content !== 'string') return null;
  
  // Check if content contains bullet points or numbered lists
  const hasBullets = /^[•*-]\s+/m.test(content) || /\n[•*-]\s+/m.test(content);
  const hasNumbers = /^\d+\.\s+/m.test(content) || /\n\d+\.\s+/m.test(content);
  
  if (hasBullets || hasNumbers) {
    // Split into list items
    const items = content.split(/\n(?=[•*-]\s+|\d+\.\s+)/).filter(item => item.trim());
    
    if (items.length > 0) {
      const isNumbered = /^\d+\.\s+/.test(items[0]);
      
      if (isNumbered) {
        return (
          <ol className="list-decimal space-y-2 my-2 text-[#595657] dark:text-[#9ca3af] pl-5">
            {items.map((item, idx) => (
              <li key={idx} className="mb-2 leading-relaxed block">
                {formatListItem(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        return (
          <ul className="list-disc space-y-2 my-2 text-[#595657] dark:text-[#9ca3af] pl-5">
            {items.map((item, idx) => (
              <li key={idx} className="mb-2 leading-relaxed block">
                {formatListItem(item)}
              </li>
            ))}
          </ul>
        );
      }
    }
  }
  
  // Handle line breaks
  if (content.includes('<br>') || content.includes('<br />')) {
    return (
      <>
        {content.split(/<br\s*\/?>/).map((part, idx, arr) => (
          <React.Fragment key={idx}>
            {part || ''}
            {idx < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  }
  
  // Handle bold text - if entire cell is bold, remove excessive bold
  // But preserve intentional bold formatting
  const boldMatches = content.match(/\*\*(.+?)\*\*/g);
  if (boldMatches && boldMatches.length > 0) {
    // If more than 50% of content is bold, it's likely over-bolded
    const boldLength = boldMatches.reduce((sum, match) => sum + match.length, 0);
    if (boldLength > content.length * 0.5) {
      // Remove excessive bold, keep only strategic bold
      return <>{content.replace(/\*\*/g, '')}</>;
    }
  }
  
  return <>{content}</>;
};

/**
 * Safe wrapper around ReactMarkdown that catches any rendering errors
 * and displays a fallback instead of crashing the app
 */
const SafeMarkdown: React.FC<SafeMarkdownProps> = memo(({ content }) => {
  // Wrap everything in React error boundary pattern
  try {
    // Validate input
    if (!content) {
      return <div className="text-[#595657] dark:text-[#9ca3af]">No content to display</div>;
    }
    
    if (typeof content !== 'string') {
      console.warn('SafeMarkdown received non-string content:', typeof content);
      return <div className="text-[#595657] dark:text-[#9ca3af]">Invalid content format</div>;
    }

    // Sanitize content to prevent rendering issues
    let sanitizedContent = '';
    try {
      sanitizedContent = String(content)
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    } catch (sanitizeError) {
      console.error('Error sanitizing content:', sanitizeError);
      sanitizedContent = String(content).substring(0, 10000);
    }
    
    // Additional safety: limit content length to prevent memory issues
    if (sanitizedContent.length > 1000000) {
      sanitizedContent = sanitizedContent.substring(0, 1000000) + '\n\n... (content truncated)';
    }
    
    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return <div className="text-[#595657] dark:text-[#9ca3af]">No content to display</div>;
    }
    
    // Pre-process content to fix formatting issues
    sanitizedContent = preprocessMarkdown(sanitizedContent);
    
    // Wrap ReactMarkdown in Error Boundary (React errors can't be caught with try-catch)
    return (
      <SafeMarkdownErrorBoundary content={sanitizedContent}>
        <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          h1: ({node, children, ...props}: any) => {
            try {
              return <h1 className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-6" {...props}>{children}</h1>;
            } catch (e) {
              return <h1 className="text-2xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-6">Section Header</h1>;
            }
          },
          h2: ({node, children, ...props}: any) => {
            try {
              return <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-8 mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151] pl-0" {...props}>{children}</h2>;
            } catch (e) {
              return <h2 className="text-xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-8 mb-4 pb-2 border-b-2 border-[#EEF2FF] dark:border-[#374151] pl-0">Subsection</h2>;
            }
          },
          h3: ({node, children, ...props}: any) => {
            try {
              // Safely extract text from children (handles React nodes, arrays, strings)
              let text = '';
              try {
                if (typeof children === 'string') {
                  text = children;
                } else if (Array.isArray(children)) {
                  text = children.map((child: any) => {
                    if (typeof child === 'string') return child;
                    if (typeof child === 'object' && child?.props?.children) {
                      return String(child.props.children);
                    }
                    return String(child || '');
                  }).join('');
                } else if (children && typeof children === 'object') {
                  // Handle React elements
                  if (children.props?.children) {
                    text = String(children.props.children);
                  } else {
                    text = String(children);
                  }
                } else {
                  text = String(children || '');
                }
              } catch (textError) {
                console.warn('Error extracting text from h3 children:', textError);
                text = 'Subsection';
              }
              
              // Check for special formatting cases
              const isRoastOrGold = text && (
                text.includes('🔥 The Roast') || 
                text.includes('🏆 The Gold') || 
                text.includes('The Roast') || 
                text.includes('The Gold')
              );
              
              if (isRoastOrGold) {
                return (
                  <h3 className="text-base font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-6 pb-4 block border-b border-[#EEF2FF] dark:border-[#374151]" {...props}>
                    {children || 'Subsection'}
                  </h3>
                );
              }
              
              // H3 styling - bold font with subtle background
              return (
                <h3 className="text-lg md:text-xl font-bold !font-bold text-[#051A53] dark:text-[#93C5FD] bg-[#F9FAFD] dark:bg-[#1a1f2e] px-4 py-3 rounded-lg mb-6 mt-8" style={{ fontWeight: 'bold' }} {...props}>
                  {children || 'Subsection'}
                </h3>
              );
            } catch (e) {
              console.error('Error rendering h3:', e);
              return (
                <h3 className="text-lg md:text-xl font-bold text-[#051A53] dark:text-[#93C5FD] bg-[#F9FAFD] dark:bg-[#1a1f2e] px-4 py-3 rounded-lg mb-6 mt-8">
                  Subsection
                </h3>
              );
            }
          },
          h4: ({node, children, ...props}: any) => {
            try {
              return <h4 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-6 mb-3" {...props}>{children}</h4>;
            } catch (e) {
              return <h4 className="text-lg font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-6 mb-3">Heading</h4>;
            }
          },
          h5: ({node, children, ...props}: any) => {
            try {
              return <h5 className="text-base font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-4 mb-2" {...props}>{children}</h5>;
            } catch (e) {
              return <h5 className="text-base font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-4 mb-2">Heading</h5>;
            }
          },
          h6: ({node, children, ...props}: any) => {
            try {
              return <h6 className="text-sm font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-3 mb-2" {...props}>{children}</h6>;
            } catch (e) {
              return <h6 className="text-sm font-bold text-[#221E1F] dark:text-[#f3f4f6] mt-3 mb-2">Heading</h6>;
            }
          },
          p: ({node, children, ...props}: any) => {
            try {
              // Safely extract content from children
              let content = '';
              try {
                if (typeof children === 'string') {
                  content = children;
                } else if (Array.isArray(children)) {
                  content = children.map((child: any) => {
                    if (typeof child === 'string') return child;
                    if (typeof child === 'object' && child?.props?.children) {
                      return String(child.props.children);
                    }
                    return String(child || '');
                  }).join('');
                } else if (children && typeof children === 'object') {
                  if (children.props?.children) {
                    content = String(children.props.children);
                  } else {
                    content = String(children);
                  }
                } else {
                  content = String(children || '');
                }
              } catch (contentError) {
                console.warn('Error extracting content from paragraph:', contentError);
                content = '';
              }
              
              // Don't process if content is empty or just whitespace
              if (!content || content.trim().length === 0) {
                return null;
              }
              
              // Break up very long paragraphs (more than 4 sentences) into smaller ones
              // Only do this if the paragraph is extremely long (safety check)
              const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
              if (sentences.length > 4 && content.length > 300) {
                // Break into smaller paragraphs of 3-4 sentences each
                const paragraphs: string[] = [];
                for (let i = 0; i < sentences.length; i += 3) {
                  const paragraphSentences = sentences.slice(i, i + 3);
                  paragraphs.push(paragraphSentences.join(' ').trim());
                }
                
                return (
                  <>
                    {paragraphs.map((para, idx) => (
                      <p key={idx} className="text-[#595657] dark:text-[#9ca3af] leading-relaxed my-4" {...props}>
                        {para}
                      </p>
                    ))}
                  </>
                );
              }
              
              // Handle <br> tags
              if (content.includes('<br>') || content.includes('<br />')) {
                return (
                  <p className="text-[#595657] dark:text-[#9ca3af] leading-relaxed my-4" {...props}>
                    {content.split(/<br\s*\/?>/).map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        {part || ''}
                        {idx < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                );
              }
              
              return <p className="text-[#595657] dark:text-[#9ca3af] leading-relaxed my-4" {...props}>{children || ''}</p>;
            } catch (e) {
              console.error('Error rendering paragraph:', e);
              return <p className="text-[#595657] dark:text-[#9ca3af] leading-relaxed my-4">{children || ''}</p>;
            }
          },
          ul: ({node, children, ...props}: any) => {
            try {
              // Ensure each bullet is on its own line with proper spacing
              return <ul className="list-disc space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6 [&>li]:block [&>li]:mb-3" {...props}>{children}</ul>;
            } catch (e) {
              return <ul className="list-disc space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6 [&>li]:block [&>li]:mb-3">{children}</ul>;
            }
          },
          ol: ({node, children, ...props}: any) => {
            try {
              return <ol className="list-decimal space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6 [&>li]:block [&>li]:mb-3" {...props}>{children}</ol>;
            } catch (e) {
              return <ol className="list-decimal space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6 [&>li]:block [&>li]:mb-3">{children}</ol>;
            }
          },
          li: ({node, children, ...props}: any) => {
            try {
              // Safely extract content from children
              let itemContent: string | ReactNode = '';
              let hasReactElements = false;
              
              try {
                if (typeof children === 'string') {
                  itemContent = children;
                } else if (Array.isArray(children)) {
                  // Check if any children are React elements
                  hasReactElements = children.some((child: any) => 
                    typeof child === 'object' && child !== null && !Array.isArray(child)
                  );
                  
                  if (hasReactElements) {
                    // Contains React elements, pass through as-is but ensure formatting
                    itemContent = children;
                  } else {
                    // All strings, join them
                    itemContent = children.map((child: any) => {
                      if (typeof child === 'string') return child;
                      return String(child || '');
                    }).join('');
                  }
                } else if (children && typeof children === 'object') {
                  // React element, pass through
                  hasReactElements = true;
                  itemContent = children;
                } else {
                  itemContent = String(children || '');
                }
              } catch (contentError) {
                itemContent = children || '';
              }
              
              // Format list item with bold beginning (only if it's a string)
              if (!hasReactElements && typeof itemContent === 'string') {
                return (
                  <li className="mb-3 leading-relaxed text-[#595657] dark:text-[#9ca3af] block" {...props}>
                    {formatListItem(itemContent)}
                  </li>
                );
              }
              
              // If it's already React elements, render as-is
              return (
                <li className="mb-3 leading-relaxed text-[#595657] dark:text-[#9ca3af] block" {...props}>
                  {children}
                </li>
              );
            } catch (e) {
              return <li className="mb-3 leading-relaxed text-[#595657] dark:text-[#9ca3af] block">{children}</li>;
            }
          },
          strong: ({node, children, ...props}: any) => {
            try {
              return <strong className="font-bold text-[#221E1F] dark:text-[#f3f4f6]" {...props}>{children}</strong>;
            } catch (e) {
              return <strong className="font-bold text-[#221E1F] dark:text-[#f3f4f6]">{children}</strong>;
            }
          },
          em: ({node, children, ...props}: any) => {
            try {
              return <em className="italic" {...props}>{children}</em>;
            } catch (e) {
              return <em className="italic">{children}</em>;
            }
          },
          hr: ({node, ...props}: any) => {
            try {
              return <hr className="my-8 border-[#EEF2FF] dark:border-[#374151]" {...props} />;
            } catch (e) {
              return <hr className="my-8 border-[#EEF2FF] dark:border-[#374151]" />;
            }
          },
          blockquote: ({node, children, ...props}: any) => {
            try {
              return <blockquote className="bg-[#EEF2FF] dark:bg-[#1a1f2e] border-l-4 border-[#577AFF] pl-4 py-2 my-6 italic rounded-r-lg text-[#595657] dark:text-[#9ca3af]" {...props}>{children}</blockquote>;
            } catch (e) {
              return <blockquote className="bg-[#EEF2FF] dark:bg-[#1a1f2e] border-l-4 border-[#577AFF] pl-4 py-2 my-6 italic rounded-r-lg text-[#595657] dark:text-[#9ca3af]">{children}</blockquote>;
            }
          },
          code: ({node, inline, children, ...props}: any) => {
            try {
              if (inline) {
                return <code className="bg-[#F9FAFD] dark:bg-[#1a1f2e] px-1 py-0.5 rounded text-sm text-[#577AFF] dark:text-[#93C5FD] font-mono" {...props}>{children}</code>;
              }
              return <code className="block bg-[#F9FAFD] dark:bg-[#1a1f2e] p-4 rounded my-4 text-sm text-[#595657] dark:text-[#9ca3af] font-mono overflow-x-auto" {...props}>{children}</code>;
            } catch (e) {
              return <code className="bg-[#F9FAFD] dark:bg-[#1a1f2e] px-1 py-0.5 rounded text-sm text-[#577AFF] dark:text-[#93C5FD] font-mono">{children}</code>;
            }
          },
          pre: ({node, children, ...props}: any) => {
            try {
              return <pre className="bg-[#F9FAFD] dark:bg-[#1a1f2e] p-4 rounded my-4 overflow-x-auto" {...props}>{children}</pre>;
            } catch (e) {
              return <pre className="bg-[#F9FAFD] dark:bg-[#1a1f2e] p-4 rounded my-4 overflow-x-auto">{children}</pre>;
            }
          },
          table: ({node, children, ...props}: any) => {
            try {
              return <table className="w-full border-collapse my-6 text-xs leading-relaxed border border-[#EEF2FF] dark:border-[#374151] bg-white dark:bg-[#111827]" {...props}>{children}</table>;
            } catch (e) {
              return <table className="w-full border-collapse my-6 text-xs leading-relaxed border border-[#EEF2FF] dark:border-[#374151] bg-white dark:bg-[#111827]">{children}</table>;
            }
          },
          thead: ({node, children, ...props}: any) => {
            try {
              return <thead className="bg-[#EEF2FF] dark:bg-[#1a1f2e]" {...props}>{children}</thead>;
            } catch (e) {
              return <thead className="bg-[#EEF2FF] dark:bg-[#1a1f2e]">{children}</thead>;
            }
          },
          tbody: ({node, children, ...props}: any) => {
            try {
              // Filter out separator rows from tbody children
              const filteredChildren = React.Children.toArray(children).filter((child: any) => {
                if (!child || typeof child !== 'object') return true;
                
                // Check if this row is a separator row by examining its cells
                try {
                  const rowChildren = child?.props?.children;
                  if (rowChildren) {
                    const rowContent = React.Children.toArray(rowChildren).map((cell: any) => {
                      if (typeof cell === 'string') return cell;
                      if (cell?.props?.children) return String(cell.props.children || '');
                      return String(cell || '');
                    }).join('');
                    
                    // Skip separator rows (only dashes, pipes, colons, spaces)
                    if (/^[\s|\-:]+$/.test(rowContent.trim()) && rowContent.trim().length > 3) {
                      return false;
                    }
                  }
                } catch (e) {
                  // If we can't check, include it to be safe
                }
                
                return true;
              });
              
              // Apply alternating row backgrounds with proper contrast
              return <tbody className="[&>tr:nth-child(odd)]:bg-white dark:[&>tr:nth-child(odd)]:bg-[#111827] [&>tr:nth-child(even)]:bg-[#F9FAFD] dark:[&>tr:nth-child(even)]:bg-[#1a1f2e]" {...props}>{filteredChildren.length > 0 ? filteredChildren : children}</tbody>;
            } catch (e) {
              return <tbody className="[&>tr:nth-child(odd)]:bg-white dark:[&>tr:nth-child(odd)]:bg-[#111827] [&>tr:nth-child(even)]:bg-[#F9FAFD] dark:[&>tr:nth-child(even)]:bg-[#1a1f2e]">{children}</tbody>;
            }
          },
          tr: ({node, children, ...props}: any) => {
            try {
              // Check if this is a separator row (table separator with dashes)
              // Extract text content from all children
              let rowContent = '';
              try {
                if (Array.isArray(children)) {
                  rowContent = children.map((child: any) => {
                    if (typeof child === 'string') return child;
                    if (typeof child === 'object' && child?.props?.children) {
                      return String(child.props.children || '');
                    }
                    return String(child || '');
                  }).join('');
                } else if (children && typeof children === 'object') {
                  if (children.props?.children) {
                    rowContent = String(children.props.children);
                  } else {
                    rowContent = String(children);
                  }
                } else {
                  rowContent = String(children || '');
                }
              } catch (e) {
                rowContent = '';
              }
              
              // Skip separator rows (rows that contain only dashes, pipes, colons, and spaces)
              // This matches markdown table separator rows like: |----------|----------|
              if (/^[\s|\-:]+$/.test(rowContent.trim()) && rowContent.trim().length > 3) {
                return null; // Don't render separator rows
              }
              
              // Ensure proper text colors for all rows (will be overridden by tbody alternating backgrounds)
              return <tr className="border-b border-[#EEF2FF] dark:border-[#374151]" {...props}>{children}</tr>;
            } catch (e) {
              return <tr className="border-b border-[#EEF2FF] dark:border-[#374151]">{children}</tr>;
            }
          },
          th: ({node, children, ...props}: any) => {
            try {
              return <th className="p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#051A53] dark:text-[#93C5FD] text-left font-bold border border-[#D5DDFF] dark:border-[#374151] break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }} {...props}>{children}</th>;
            } catch (e) {
              return <th className="p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#051A53] dark:text-[#93C5FD] text-left font-bold border border-[#D5DDFF] dark:border-[#374151] break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>{children}</th>;
            }
          },
          td: ({node, children, ...props}: any) => {
            try {
              // Safely extract content from children
              let content = '';
              try {
                if (typeof children === 'string') {
                  content = children;
                } else if (Array.isArray(children)) {
                  content = children.map((child: any) => {
                    if (typeof child === 'string') return child;
                    if (typeof child === 'object' && child?.props?.children) {
                      return String(child.props.children);
                    }
                    return String(child || '');
                  }).join('');
                } else if (children && typeof children === 'object') {
                  if (children.props?.children) {
                    content = String(children.props.children);
                  } else {
                    content = String(children);
                  }
                } else {
                  content = String(children || '');
                }
              } catch (contentError) {
                console.warn('Error extracting content from table cell:', contentError);
                content = '';
              }
              
              // Process table cell content - handle lists, bold, line breaks
              const processedContent = processTableCellContent(content);
              
              return (
                <td className="p-4 border border-[#EEF2FF] dark:border-[#374151] align-top text-[#595657] dark:text-[#9ca3af] bg-white dark:bg-[#111827] break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', maxWidth: '300px' }} {...props}>
                  {processedContent || children || ''}
                </td>
              );
            } catch (e) {
              console.error('Error rendering table cell:', e);
              return <td className="p-4 border border-[#EEF2FF] dark:border-[#374151] align-top text-[#595657] dark:text-[#9ca3af] bg-white dark:bg-[#111827]">{children || ''}</td>;
            }
          },
          a: ({node, children, ...props}: any) => {
            try {
              return <a className="text-[#577AFF] dark:text-[#93C5FD] hover:underline" {...props}>{children}</a>;
            } catch (e) {
              return <a className="text-[#577AFF] dark:text-[#93C5FD] hover:underline" href={props.href || '#'}>{children}</a>;
            }
          }
        }} 
        >{sanitizedContent}</ReactMarkdown>
      </SafeMarkdownErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Fallback: display raw content with basic formatting
    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-[#595657] dark:text-[#9ca3af] bg-[#F9FAFD] dark:bg-[#1a1f2e] p-4 rounded">
          {typeof content === 'string' ? content.substring(0, 10000) : 'Content unavailable'}
        </pre>
      </div>
    );
  }
});

SafeMarkdown.displayName = 'SafeMarkdown';

export default SafeMarkdown;

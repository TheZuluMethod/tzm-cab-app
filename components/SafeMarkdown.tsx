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
              
              if (content && (content.includes('<br>') || content.includes('<br />'))) {
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
              return <ul className="list-disc space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6" {...props}>{children}</ul>;
            } catch (e) {
              return <ul className="list-disc space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6">{children}</ul>;
            }
          },
          ol: ({node, children, ...props}: any) => {
            try {
              return <ol className="list-decimal space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6" {...props}>{children}</ol>;
            } catch (e) {
              return <ol className="list-decimal space-y-3 my-6 text-[#595657] dark:text-[#9ca3af] pl-6">{children}</ol>;
            }
          },
          li: ({node, children, ...props}: any) => {
            try {
              return <li className="mb-3 leading-relaxed text-[#595657] dark:text-[#9ca3af]" {...props}>{children}</li>;
            } catch (e) {
              return <li className="mb-3 leading-relaxed text-[#595657] dark:text-[#9ca3af]">{children}</li>;
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
              return <th className="p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#051A53] dark:text-[#93C5FD] text-left font-bold border border-[#D5DDFF] dark:border-[#374151]" {...props}>{children}</th>;
            } catch (e) {
              return <th className="p-4 bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#051A53] dark:text-[#93C5FD] text-left font-bold border border-[#D5DDFF] dark:border-[#374151] break-words overflow-wrap-anywhere word-wrap-break-word max-w-0" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: 0 }}>{children}</th>;
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
              
              if (content && (content.includes('<br>') || content.includes('<br />'))) {
                return (
                  <td className="p-4 border border-[#EEF2FF] dark:border-[#374151] align-top text-[#595657] dark:text-[#9ca3af] bg-white dark:bg-[#111827]" {...props}>
                    {content.split(/<br\s*\/?>/).map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        {part || ''}
                        {idx < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </td>
                );
              }
              return <td className="p-4 border border-[#EEF2FF] dark:border-[#374151] align-top text-[#595657] dark:text-[#9ca3af] bg-white dark:bg-[#111827] break-words overflow-wrap-anywhere word-wrap-break-word max-w-0" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: 0 }} {...props}>{children || ''}</td>;
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



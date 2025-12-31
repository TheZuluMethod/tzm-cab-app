/**
 * Type declarations for react-dom/client
 * 
 * React 19 includes its own types, but TypeScript may need explicit declaration
 */
declare module 'react-dom/client' {
  import { ReactNode } from 'react';
  
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  
  export function createRoot(container: Element | DocumentFragment): Root;
}


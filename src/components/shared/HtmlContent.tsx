"use client";

interface HtmlContentProps {
  html: string;
  className?: string;
}

export default function HtmlContent({ html, className = "" }: HtmlContentProps) {
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export function stripHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use regex to strip HTML tags
    return html.replace(/<[^>]*>?/gm, '');
  } else {
    // Client-side: use DOM parser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
} 
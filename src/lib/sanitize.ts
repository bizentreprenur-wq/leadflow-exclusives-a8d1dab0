import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content for safe rendering in email templates
 * Prevents XSS attacks from user-created email content
 */
export function sanitizeEmailHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title', 'style', 'class', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  });
}

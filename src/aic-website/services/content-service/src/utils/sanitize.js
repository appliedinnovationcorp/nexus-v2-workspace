const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html) return '';
  
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img',
      'span', 'del', 'ins', 'sup', 'sub', 'figure', 'figcaption', 'iframe'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
      div: ['class', 'id', 'style'],
      span: ['class', 'id', 'style'],
      table: ['class', 'id', 'style', 'border'],
      th: ['style', 'colspan', 'rowspan'],
      td: ['style', 'colspan', 'rowspan'],
      p: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
      h1: ['id', 'class'],
      h2: ['id', 'class'],
      h3: ['id', 'class'],
      h4: ['id', 'class'],
      h5: ['id', 'class'],
      h6: ['id', 'class'],
      figure: ['class'],
      figcaption: ['class'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'www.slideshare.net'],
    allowedStyles: {
      '*': {
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-size': [/^\d+(?:px|em|rem|%)$/],
        'font-weight': [/^normal$/, /^bold$/, /^\d+$/],
        'text-decoration': [/^none$/, /^underline$/, /^line-through$/],
        'font-style': [/^normal$/, /^italic$/],
        'width': [/^auto$/, /^[0-9]+(?:px|em|rem|%)$/],
        'height': [/^auto$/, /^[0-9]+(?:px|em|rem|%)$/],
        'margin': [/^[0-9]+(?:px|em|rem|%)$/],
        'padding': [/^[0-9]+(?:px|em|rem|%)$/],
        'border': [/^[0-9]+(?:px) solid #[0-9a-f]+$/i],
        'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      },
      table: {
        'border-collapse': [/^collapse$/],
        'width': [/^auto$/, /^[0-9]+(?:px|em|rem|%)$/],
      },
      th: {
        'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'vertical-align': [/^top$/, /^middle$/, /^bottom$/],
        'border': [/^[0-9]+(?:px) solid #[0-9a-f]+$/i],
        'padding': [/^[0-9]+(?:px|em|rem|%)$/],
      },
      td: {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'vertical-align': [/^top$/, /^middle$/, /^bottom$/],
        'border': [/^[0-9]+(?:px) solid #[0-9a-f]+$/i],
        'padding': [/^[0-9]+(?:px|em|rem|%)$/],
      },
    },
    transformTags: {
      'a': (tagName, attribs) => {
        // Add rel="noopener noreferrer" to external links
        if (attribs.href && attribs.href.startsWith('http')) {
          return {
            tagName,
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });
};

module.exports = {
  sanitizeHtml,
};

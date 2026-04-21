'use client';

import React from 'react';

interface BlastComposerPreviewProps {
  subject: string;
  body: string;
  contentMode: 'text' | 'html';
}

const BlastComposerPreview: React.FC<BlastComposerPreviewProps> = ({ subject, body, contentMode }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const isEmpty = !body || body.trim() === '' || (contentMode === 'html' && body === '<p></p>');

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sanitizeHtmlForPreview = (inputHtml: string): string => {
    if (typeof window === 'undefined') return '';

    const allowedTags = new Set([
      'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
      'H2', 'H3', 'H4',
      'UL', 'OL', 'LI',
      'A', 'BLOCKQUOTE', 'PRE', 'CODE',
      'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
      'HR', 'SPAN', 'DIV', 'MARK',
    ]);

    const parser = new DOMParser();
    const doc = parser.parseFromString(inputHtml, 'text/html');

    const elements = Array.from(doc.body.querySelectorAll('*'));
    for (const el of elements) {
      if (!allowedTags.has(el.tagName)) {
        el.replaceWith(doc.createTextNode(el.textContent ?? ''));
        continue;
      }

      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();

        const isSafeHref = name === 'href' && /^(https?:|mailto:)/i.test(value);
        const isSafeLinkAttr = name === 'target' || name === 'rel';
        const isSafeStyle = false;

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (!(isSafeHref || isSafeLinkAttr || isSafeStyle)) {
          el.removeAttribute(attr.name);
        }

        if (name === 'href' && !isSafeHref) {
          el.removeAttribute('href');
        }
      }
    }

    return doc.body.innerHTML;
  };

  const renderBodyHtml = () => {
    if (isEmpty) return '';

    if (contentMode === 'html') {
      return sanitizeHtmlForPreview(body);
    }

    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return `<p>${escaped.replace(/\n/g, '<br />')}</p>`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Simulated email client chrome */}
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium w-14">Subject:</span>
          <span className="text-slate-800 dark:text-slate-100 font-semibold">{subject || '(No subject)'}</span>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto p-6">
        {!isMounted || isEmpty ? (
          <p className="text-slate-400 italic text-sm">Email body is empty</p>
        ) : (
          <div
            className="tiptap-rendered max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: renderBodyHtml() }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 text-xs text-slate-400">
        Preview only — actual rendering may vary by email client.
      </div>
    </div>
  );
};

export default BlastComposerPreview;

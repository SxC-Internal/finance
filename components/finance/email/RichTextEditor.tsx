'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Pilcrow,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Highlighter,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
}

interface ToolbarButtonProps {
  onAction: () => void;
  isActive?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onAction, isActive, disabled, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAction}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        isActive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your email content here...',
  minRows = 10,
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Treat empty editor as empty string
      onChange(editor.isEmpty ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const normalizedIncoming = value.trim();
    const currentHtml = editor.getHTML().trim();
    const incomingContent = normalizedIncoming.length > 0 ? value : '<p></p>';

    if (currentHtml !== incomingContent.trim()) {
      editor.commands.setContent(incomingContent, { emitUpdate: false });
    }
  }, [editor, value]);

  const handleSetLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleTextColor = () => {
    if (!editor) return;
    const current = (editor.getAttributes('textStyle').color as string | undefined) ?? '#111827';
    const color = window.prompt('Text color (hex or CSS color)', current);
    if (color === null) return;
    const trimmed = color.trim();

    if (!trimmed) {
      editor.chain().focus().unsetColor().run();
      return;
    }

    if (typeof window.CSS !== 'undefined' && !window.CSS.supports('color', trimmed)) {
      window.alert('Invalid color value. Try a valid CSS color like #0f766e or teal.');
      return;
    }

    editor.chain().focus().setColor(trimmed).run();
  };

  const handleClearFormatting = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .clearNodes()
      .setParagraph()
      .run();
  };

  const handleInsertImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL', 'https://');
    if (!url) return;
    const safeUrl = url.trim();
    if (!/^https?:\/\//i.test(safeUrl)) {
      window.alert('Only http/https image URLs are allowed.');
      return;
    }

    editor.chain().focus().insertContent(`<img src="${safeUrl}" alt="" />`).run();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all bg-slate-50 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <ToolbarButton
          onAction={() => editor?.chain().focus().setParagraph().run()}
          isActive={editor?.isActive('paragraph')}
          label="Paragraph"
        >
          <Pilcrow size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor?.isActive('heading', { level: 2 })}
          label="Heading 2"
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor?.isActive('heading', { level: 3 })}
          label="Heading 3"
        >
          <Heading3 size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />

        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold')}
          label="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive('italic')}
          label="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={editor?.isActive('underline')}
          label="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleStrike().run()}
          isActive={editor?.isActive('strike')}
          label="Strikethrough"
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleHighlight().run()}
          isActive={editor?.isActive('highlight')}
          label="Highlight"
        >
          <Highlighter size={15} />
        </ToolbarButton>
        <ToolbarButton onAction={handleTextColor} label="Text color">
          <span className="inline-flex items-center justify-center">
            <span
              className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-500"
              style={{
                backgroundColor:
                  (editor?.getAttributes('textStyle').color as string | undefined) ?? '#334155',
              }}
            />
          </span>
        </ToolbarButton>
        <ToolbarButton
          onAction={handleSetLink}
          isActive={editor?.isActive('link')}
          label="Insert link"
        >
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={handleInsertImage}
          label="Insert image"
        >
          <Image size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />

        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList')}
          label="Bullet list"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive('orderedList')}
          label="Numbered list"
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />

        <ToolbarButton
          onAction={() => editor?.chain().focus().setTextAlign('left').run()}
          isActive={editor?.isActive({ textAlign: 'left' })}
          label="Align left"
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().setTextAlign('center').run()}
          isActive={editor?.isActive({ textAlign: 'center' })}
          label="Align center"
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().setTextAlign('right').run()}
          isActive={editor?.isActive({ textAlign: 'right' })}
          label="Align right"
        >
          <AlignRight size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />

        <ToolbarButton
          onAction={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          label="Undo (Ctrl+Z)"
        >
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          label="Redo (Ctrl+Y)"
        >
          <Redo size={15} />
        </ToolbarButton>
        <ToolbarButton
          onAction={handleClearFormatting}
          label="Clear formatting"
        >
          <Eraser size={15} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="px-4 py-3 text-slate-900 dark:text-white text-sm"
        style={{ minHeight: `${minRows * 1.75}rem` }}
      />
    </div>
  );
};

export default RichTextEditor;

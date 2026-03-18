// src/components/RichTextEditor.jsx
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo,
} from 'lucide-react'

// Extend Tiptap's Image to preserve data-image-id attribute
const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-image-id': {
        default: null,
        parseHTML: el => el.getAttribute('data-image-id'),
        renderHTML: attrs => ({ 'data-image-id': attrs['data-image-id'] }),
      },
    }
  },
})

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-stone-200 text-stone-900'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-stone-200 mx-1 self-center" />
}

function Toolbar({ editor, onInsertImageRequest, readTime }) {
  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL:', prev || '')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-stone-100 flex-wrap bg-white sticky top-0 z-10">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={14} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
        <LinkIcon size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onInsertImageRequest} title="Insert image">
        <ImageIcon size={14} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo size={14} />
      </ToolbarButton>
      {readTime != null && (
        <>
          <ToolbarDivider />
          <span className="text-[10px] text-stone-400 ml-1">~{readTime} min read</span>
        </>
      )}
    </div>
  )
}

const RichTextEditor = forwardRef(function RichTextEditor(
  { content, onChange, onInsertImageRequest, readTime, className },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      ArticleImage,
      Placeholder.configure({ placeholder: 'Write your story here…' }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Expose commands to parent components via ref
  useImperativeHandle(ref, () => ({
    commands: editor?.commands ?? null,
  }), [editor])

  // Sync content prop → editor when it changes externally (e.g. on article load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false)
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div className={`border border-stone-200 rounded-xl overflow-hidden bg-white ${className ?? ''}`}>
      <Toolbar editor={editor} onInsertImageRequest={onInsertImageRequest} readTime={readTime} />
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  )
})

export default RichTextEditor

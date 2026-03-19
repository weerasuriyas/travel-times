// src/components/RichTextEditor.jsx
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, Moon, Sun,
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

function ToolbarButton({ onClick, active, disabled, title, children, dark }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? dark ? 'bg-stone-600 text-white' : 'bg-stone-200 text-stone-900'
          : dark ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider({ dark }) {
  return <div className={`w-px h-4 mx-1 self-center ${dark ? 'bg-stone-700' : 'bg-stone-200'}`} />
}

function Toolbar({ editor, onInsertImageRequest, readTime, dark, onToggleDark }) {
  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL:', prev || '')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  const btn = (props) => <ToolbarButton dark={dark} {...props} />
  const div = () => <ToolbarDivider dark={dark} />

  return (
    <div className={`flex items-center gap-0.5 px-3 py-2 border-b flex-wrap sticky top-0 z-10 ${dark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100'}`}>
      {btn({ onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold', children: <Bold size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic', children: <Italic size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Underline', children: <UnderlineIcon size={14} /> })}
      {div()}
      {btn({ onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: 'Heading 2', children: <Heading2 size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: 'Heading 3', children: <Heading3 size={14} /> })}
      {div()}
      {btn({ onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), title: 'Bullet list', children: <List size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), title: 'Numbered list', children: <ListOrdered size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), title: 'Blockquote', children: <Quote size={14} /> })}
      {div()}
      {btn({ onClick: () => editor.chain().focus().setHorizontalRule().run(), title: 'Horizontal rule', children: <Minus size={14} /> })}
      {btn({ onClick: setLink, active: editor.isActive('link'), title: 'Link', children: <LinkIcon size={14} /> })}
      {btn({ onClick: onInsertImageRequest, title: 'Insert image', children: <ImageIcon size={14} /> })}
      {div()}
      {btn({ onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), title: 'Undo', children: <Undo size={14} /> })}
      {btn({ onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), title: 'Redo', children: <Redo size={14} /> })}
      {readTime != null && (
        <>
          {div()}
          <span className={`text-[10px] ml-1 ${dark ? 'text-stone-500' : 'text-stone-400'}`}>~{readTime} min read</span>
        </>
      )}
      <div className="ml-auto">
        {div()}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); onToggleDark() }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`p-1.5 rounded transition-colors ${dark ? 'text-stone-400 hover:bg-stone-700 hover:text-yellow-300' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'}`}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}

const RichTextEditor = forwardRef(function RichTextEditor(
  { content, onChange, onInsertImageRequest, readTime, className },
  ref
) {
  const [dark, setDark] = useState(() => localStorage.getItem('editor-dark') === '1')

  const toggleDark = () => setDark(d => {
    const next = !d
    localStorage.setItem('editor-dark', next ? '1' : '0')
    return next
  })

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
    <div className={`border rounded-xl overflow-hidden ${dark ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'} ${className ?? ''}`}>
      <Toolbar editor={editor} onInsertImageRequest={onInsertImageRequest} readTime={readTime} dark={dark} onToggleDark={toggleDark} />
      <EditorContent editor={editor} className={dark ? 'prose-editor-dark' : 'prose-editor'} />
    </div>
  )
})

export default RichTextEditor

'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus, Link as LinkIcon, ImagePlus,
  Undo2, Redo2, RemoveFormatting, Crop, Trash2, Palette,
} from 'lucide-react'
import { BODY_FONT_OPTIONS } from '../lib/articleStyles'

// Keeps the photo's id on the <img>, so the published page can match it
// to its caption.
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

const BLOCK_STYLES = [
  { value: 'paragraph', label: 'Normal text' },
  { value: 'h2',        label: 'Large heading' },
  { value: 'h3',        label: 'Small heading' },
  { value: 'quote',     label: 'Quote' },
]

const SIZES = [
  { value: '0.85em', label: 'Small' },
  { value: '',       label: 'Normal size' },
  { value: '1.25em', label: 'Large' },
  { value: '1.6em',  label: 'Extra large' },
]

const TEXT_COLOURS = [
  { value: '',        label: 'Black (normal)', swatch: '#292524' },
  { value: '#78716c', label: 'Grey',           swatch: '#78716c' },
  { value: '#b91c1c', label: 'Red',            swatch: '#b91c1c' },
  { value: '#c2410c', label: 'Orange',         swatch: '#c2410c' },
  { value: '#15803d', label: 'Green',          swatch: '#15803d' },
  { value: '#0369a1', label: 'Blue',           swatch: '#0369a1' },
  { value: '#7e22ce', label: 'Purple',         swatch: '#7e22ce' },
]

const SELECT_CLS = 'h-11 rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-900'

function Tool({ onClick, active, disabled, label, children, wide }) {
  return (
    <button
      type="button"
      // mousedown, so the text selection is not lost when the button is pressed
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) onClick() } }}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : !!active}
      className={`h-11 inline-flex items-center justify-center gap-2 rounded-lg text-base font-semibold transition-colors ${wide ? 'px-3' : 'w-11'} ${
        active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function Group({ label, children }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5 pr-2 mr-2 border-r border-stone-300 last:border-r-0 last:mr-0 last:pr-0">
      {children}
    </div>
  )
}

function ColourMenu({ editor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = editor.getAttributes('textStyle').color || ''

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const pick = (value) => {
    if (value) editor.chain().focus().setColor(value).run()
    else editor.chain().focus().unsetColor().run()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Tool onClick={() => setOpen(o => !o)} label="Text colour" wide>
        <Palette size={20} />
        <span className="w-5 h-5 rounded-full border border-stone-400" style={{ background: current || '#292524' }} />
      </Tool>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-lg border border-stone-300 bg-white shadow-lg py-1">
          {TEXT_COLOURS.map(c => (
            <button
              key={c.label}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(c.value) }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-base text-left text-stone-900 hover:bg-stone-100 ${current === c.value ? 'font-semibold' : ''}`}
            >
              <span className="w-5 h-5 rounded-full border border-stone-300" style={{ background: c.swatch }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toolbar({ editor, onInsertImageRequest, onEditImageRequest, readTime }) {
  const blockValue = editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : editor.isActive('blockquote') ? 'quote'
    : 'paragraph'

  const setBlock = (value) => {
    const chain = editor.chain().focus()
    if (editor.isActive('blockquote')) chain.lift('blockquote')
    if (value === 'h2') chain.setHeading({ level: 2 }).run()
    else if (value === 'h3') chain.setHeading({ level: 3 }).run()
    else if (value === 'quote') chain.setParagraph().setBlockquote().run()
    else chain.setParagraph().run()
  }

  const style = editor.getAttributes('textStyle')
  const fontValue = BODY_FONT_OPTIONS.find(o => o.css === style.fontFamily)?.value || ''
  const sizeValue = SIZES.find(s => s.value === style.fontSize)?.value || ''

  const setFont = (value) => {
    const opt = BODY_FONT_OPTIONS.find(o => o.value === value)
    if (opt) editor.chain().focus().setFontFamily(opt.css).run()
    else editor.chain().focus().unsetFontFamily().run()
  }
  const setSize = (value) => {
    if (value) editor.chain().focus().setFontSize(value).run()
    else editor.chain().focus().unsetFontSize().run()
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Paste the web address for this link.\n\nLeave it empty to remove the link.', prev || 'https://')
    if (url === null) return
    const clean = url.trim()
    if (!clean || clean === 'https://') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: clean }).run()
  }

  const imageSelected = editor.isActive('image')
  const selectedImageId = imageSelected ? editor.getAttributes('image')['data-image-id'] : null

  return (
    <div className="sticky top-0 z-10 border-b border-stone-300 bg-stone-100 px-3 py-2 rounded-t-xl">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select aria-label="Text style" value={blockValue} onChange={e => setBlock(e.target.value)} className={SELECT_CLS}>
          {BLOCK_STYLES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select aria-label="Font for the selected text" value={fontValue} onChange={e => setFont(e.target.value)} className={SELECT_CLS}>
          <option value="">Article font</option>
          {BODY_FONT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ fontFamily: o.css }}>{o.label}</option>)}
        </select>
        <select aria-label="Text size" value={sizeValue} onChange={e => setSize(e.target.value)} className={SELECT_CLS}>
          {SIZES.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
        </select>
        {readTime != null && (
          <span className="ml-auto text-sm text-stone-600">About {readTime} min to read</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-y-1">
        <Group label="Emphasis">
          <Tool onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold"><Bold size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic"><Italic size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="Underline"><UnderlineIcon size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="Strike through"><Strikethrough size={20} /></Tool>
        </Group>
        <Group label="Colour">
          <ColourMenu editor={editor} />
          <Tool onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} label="Highlight in yellow"><Highlighter size={20} /></Tool>
        </Group>
        <Group label="Alignment">
          <Tool onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label="Align left"><AlignLeft size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label="Centre"><AlignCenter size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label="Align right"><AlignRight size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} label="Justify (straight edges both sides)"><AlignJustify size={20} /></Tool>
        </Group>
        <Group label="Lists">
          <Tool onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list"><List size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Numbered list"><ListOrdered size={20} /></Tool>
        </Group>
        <Group label="Insert">
          <Tool onClick={onInsertImageRequest} label="Add a photo" wide><ImagePlus size={20} /> Photo</Tool>
          <Tool onClick={setLink} active={editor.isActive('link')} label="Add or change a link" wide><LinkIcon size={20} /> Link</Tool>
          <Tool onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Dividing line"><Minus size={20} /></Tool>
        </Group>
        <Group label="History">
          <Tool onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo" wide><Undo2 size={20} /> Undo</Tool>
          <Tool onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo"><Redo2 size={20} /></Tool>
          <Tool onClick={() => editor.chain().focus().unsetAllMarks().unsetTextAlign().run()} label="Remove formatting from the selected text"><RemoveFormatting size={20} /></Tool>
        </Group>
      </div>

      {imageSelected && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-100 px-3 py-2">
          <span className="text-base font-semibold text-amber-900 mr-auto">Photo selected</span>
          {selectedImageId && onEditImageRequest && (
            <Tool onClick={() => onEditImageRequest(selectedImageId)} label="Crop or turn this photo" wide><Crop size={20} /> Crop or turn</Tool>
          )}
          <Tool onClick={() => editor.chain().focus().deleteSelection().run()} label="Take this photo out of the text" wide><Trash2 size={20} /> Take out of text</Tool>
        </div>
      )}
    </div>
  )
}

const RichTextEditor = forwardRef(function RichTextEditor(
  { content, onChange, onInsertImageRequest, onEditImageRequest, readTime, bodyFont, className },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      ArticleImage,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing here…' }),
    ],
    content: content || '',
    immediatelyRender: false,
    // The toolbar shows what is active at the cursor, so it must redraw as the cursor moves
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useImperativeHandle(ref, () => ({
    commands: editor?.commands ?? null,
    insertImage: (attrs) => editor?.chain().focus().setImage(attrs).run(),
  }), [editor])

  // Sync content prop → editor when it changes from outside (article load, photo swap)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div
      className={`border border-stone-300 rounded-xl bg-white ${className ?? ''}`}
      style={bodyFont ? { '--body-font': bodyFont } : undefined}
    >
      <Toolbar
        editor={editor}
        onInsertImageRequest={onInsertImageRequest}
        onEditImageRequest={onEditImageRequest}
        readTime={readTime}
      />
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  )
})

export default RichTextEditor

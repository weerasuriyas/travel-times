# Rich Text Editor — Design Spec

**Goal:** Replace the plain-text textarea in both `AdminArticleEditor` and `AdminArticleWriter` with a Tiptap-based rich text editor. `AdminArticleWriter` becomes a full article creation page inside the sidebar shell. Existing plain-text articles continue to render correctly via format detection.

**Architecture:** A shared `RichTextEditor` component wraps Tiptap with a fixed toolbar. `AdminArticleWriter` auto-creates a blank draft on mount and auto-saves via PATCH. `AdminArticleEditor` replaces its textarea with `RichTextEditor`. `ArticleDetailView` detects HTML bodies (new) vs plain-text bodies (legacy) and renders each path accordingly. Body stored as HTML in the existing `body` column — no schema change needed.

**Tech Stack:** React 19, Tiptap 2, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-underline, @tiptap/extension-link, @tiptap/extension-image, Tailwind CSS v4

---

## Decisions

- **Body format:** Tiptap outputs HTML via `editor.getHTML()`. Stored in the existing `body` VARCHAR/TEXT column. No migration needed.
- **Backward compatibility:** `ArticleDetailView` checks `body.trimStart().startsWith('<')`. If true → HTML renderer. Otherwise → existing plain-text renderer (unchanged). Old articles are never touched.
- **Toolbar preset:** Standard — Bold, Italic, Underline, H2, H3, Bullet list, Ordered list, Blockquote, Horizontal rule, Link, Insert Image, Undo, Redo.
- **Image insertion:** Toolbar "Insert Image" button calls a prop callback to open the existing photo panel. After upload/select, caller passes `{ id, url, alt }` to `editor.commands.setImage(...)`. Image stored as `<img src="URL" data-image-id="ID" alt="ALT">` in HTML.
- **Auto-create on mount:** `AdminArticleWriter` POSTs `{ title: 'Untitled', status: 'draft' }` on mount to get an article ID. Photos can be uploaded immediately. If mount POST fails, an error state is shown.
- **Fonts:** Public-facing font rendering unchanged. The editor toolbar/chrome uses UI fonts; the editor content area uses `font-serif` to approximate the published look.

---

## Out of Scope

- Tiptap collaborative editing
- Image resizing handles in the editor
- Table extension
- Migrating existing plain-text articles to HTML
- `AdminArticleWriter` live preview pane (kept in `AdminArticleEditor` only)

---

## New Files

### `src/components/RichTextEditor.jsx`

Shared Tiptap editor + toolbar. Used by both `AdminArticleWriter` and `AdminArticleEditor`.

**Props:**
```js
{
  content,           // HTML string (initial value)
  onChange,          // (html: string) => void — called on every editor update
  onInsertImageRequest, // () => void — opens the photo panel
  readTime,          // number — displayed in toolbar
  className,         // optional wrapper className
}
```

**Extensions:**
- `StarterKit` — provides Bold, Italic, Strike, Code, Blockquote, HardBreak, Heading (H1–H3), HorizontalRule, BulletList, OrderedList, Paragraph, Text, History
- `Underline` from `@tiptap/extension-underline`
- `Link` from `@tiptap/extension-link` — `{ openOnClick: false, autolink: true }`
- Custom `ArticleImage` — extends `@tiptap/extension-image`, adds `data-image-id` as a custom attribute, parses it from HTML on load

**Custom ArticleImage extension:**
```js
import Image from '@tiptap/extension-image'

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-image-id': { default: null, parseHTML: el => el.getAttribute('data-image-id'), renderHTML: attrs => ({ 'data-image-id': attrs['data-image-id'] }) },
    }
  },
})
```

**Toolbar structure (left to right):**
```
[ B ] [ I ] [ U ] | [ H2 ] [ H3 ] | [ • ] [ 1. ] [ " ] | [ — ] | [ 🔗 ] [ 🖼 ] | [ ↩ ] [ ↪ ] | ~N min read
```
- Each button: `p-1.5 rounded hover:bg-stone-100 transition-colors`, active state: `bg-stone-200 text-stone-900`
- Dividers: `w-px h-4 bg-stone-200 mx-1`
- Toolbar wrapper: `flex items-center gap-0.5 px-3 py-2 border-b border-stone-100 flex-wrap bg-white sticky top-0 z-10`

**Editor content area:**
```jsx
<EditorContent
  editor={editor}
  className="min-h-[400px] px-5 py-4 prose-editor focus:outline-none"
/>
```

**`prose-editor` CSS** (added to `src/index.css`):
```css
.prose-editor .ProseMirror {
  min-height: 400px;
  outline: none;
}
.prose-editor .ProseMirror p { font-family: Georgia, serif; font-size: 1rem; line-height: 1.8; margin-bottom: 1rem; color: #292524; }
.prose-editor .ProseMirror h2 { font-size: 1.375rem; font-weight: 800; margin: 1.5rem 0 0.5rem; color: #0c0a09; }
.prose-editor .ProseMirror h3 { font-size: 1.125rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #0c0a09; }
.prose-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.prose-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
.prose-editor .ProseMirror li { font-family: Georgia, serif; line-height: 1.7; margin-bottom: 0.25rem; }
.prose-editor .ProseMirror blockquote { border-left: 3px solid #00E676; padding-left: 1rem; margin: 1.25rem 0; font-style: italic; color: #57534e; }
.prose-editor .ProseMirror hr { border: none; border-top: 2px solid #e7e5e4; margin: 1.5rem 0; }
.prose-editor .ProseMirror a { color: #00C853; text-decoration: underline; }
.prose-editor .ProseMirror img { max-width: 100%; border-radius: 12px; margin: 1rem 0; }
.prose-editor .ProseMirror p.is-editor-empty:first-child::before { color: #a8a29e; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
```

**Placeholder:** "Write your story here…" (via Tiptap Placeholder extension from `@tiptap/extension-placeholder`)

Add `@tiptap/extension-placeholder` to the packages list.

**Link button behavior:** Clicking the link button prompts for a URL via `window.prompt('URL:', editor.getAttributes('link').href)`. If value entered, sets link. If empty string entered, removes link.

**Full component structure:**
```jsx
export default function RichTextEditor({ content, onChange, onInsertImageRequest, readTime, className }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false, autolink: true }), ArticleImage, Placeholder.configure({ placeholder: 'Write your story here…' })],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Update content when prop changes (e.g., on article load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false)
    }
  }, [content]) // eslint-disable-line

  if (!editor) return null

  return (
    <div className={`border border-stone-200 rounded-xl overflow-hidden bg-white ${className ?? ''}`}>
      <Toolbar editor={editor} onInsertImageRequest={onInsertImageRequest} readTime={readTime} />
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  )
}
```

---

## Modified Files

### `src/pages/AdminArticleWriter.jsx`

Full rewrite. Article creation page living inside the sidebar shell.

**State:**
- `articleId` — null until mount POST completes
- `fields` — same shape as AdminArticleEditor (title, subtitle, subtitle_style, category, author_name, tags, status, destination_id, cover_image, read_time, article_type)
- `isFeatured`
- `saveStatus` — `'creating' | 'saved' | 'saving' | 'error'`
- `error`
- `articleImages`
- `destinations`
- `isDragOver`, `uploading`, `photoTab`, `unsplashQuery`, `unsplashResults`, `unsplashLoading`, `unsplashDownloading`
- `showImagePanel` — boolean, opens/closes the photo panel
- `editorRef` — ref to access the Tiptap editor's `insertImage` method

**Mount flow:**
```js
useEffect(() => {
  setSaveStatus('creating')
  apiPost('articles', { title: 'Untitled', status: 'draft' })
    .then(data => {
      setArticleId(data.id)
      setSaveStatus('saved')
    })
    .catch(err => setError(err.message || 'Failed to create article'))
}, [])
```

**Auto-save:** `updateField(key, value)` debounces PATCH to `articles/${articleId}` (same as AdminArticleEditor). Read time auto-calculated from HTML word count: `value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length`.

**Image insertion into Tiptap:**
```js
const handleInsertImage = (img) => {
  editorRef.current?.commands.setImage({ src: img.url, alt: img.alt_text || '', 'data-image-id': String(img.id) })
  setShowImagePanel(false)
}
```

**Layout:**
```
<div className="min-h-full">
  <AdminPageHeader title="Write Article" action={<SaveIndicator />} />
  <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-6">
    {error && <ErrorBanner />}
    {!articleId && !error && <LoadingSpinner />}
    {articleId && <>
      <ArticleInfoSection />   {/* same fields as AdminArticleEditor Article Info card */}
      <BodySection />          {/* RichTextEditor + Insert Image triggers showImagePanel */}
      <PhotosSection />        {/* shown when showImagePanel=true, same upload/Unsplash UI */}
    </>}
  </div>
</div>
```

**`SaveIndicator`** (action prop for AdminPageHeader):
```jsx
saveStatus === 'creating' && <span className="flex items-center gap-1.5 text-xs text-stone-400"><Loader2 size={11} className="animate-spin" /> Creating…</span>
saveStatus === 'saving'   && <span className="flex items-center gap-1.5 text-xs text-stone-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>
saveStatus === 'saved'    && <span className="flex items-center gap-1.5 text-xs text-[#00E676]/80"><CheckCircle2 size={11} /> Saved</span>
saveStatus === 'error'    && <span className="flex items-center gap-1.5 text-xs text-red-400"><X size={11} /> Error</span>
```

**`PhotosSection`:** Shown always (not toggled by showImagePanel). The `onInsertImageRequest` prop of RichTextEditor scrolls to the photos section. When an image is clicked in the photo grid, it's inserted into the editor via `handleInsertImage`.

**SubtitleStylePicker:** Same component and presets as AdminArticleEditor (copy or extract to a shared location if needed — for now, duplicate is acceptable).

---

### `src/pages/AdminArticleEditor.jsx`

**Replace textarea with RichTextEditor:**

Remove:
- `bodyRef`, `cursorPosRef` refs
- `insertImageAtCursor` function
- The `<textarea>` element and its `onBlur` handler
- The hint text about `"quote"` pull quotes

Add:
- `import RichTextEditor from '../components/RichTextEditor'`
- `editorRef` ref: `const editorRef = useRef(null)`
- `handleInsertImage(img)`:
  ```js
  const handleInsertImage = (img) => {
    editorRef.current?.commands.setImage({ src: img.url, alt: img.alt_text || '', 'data-image-id': String(img.id) })
  }
  ```
- Replace "Story Body" section content:
  ```jsx
  <RichTextEditor
    ref={editorRef}
    content={fields.body}
    onChange={html => updateField('body', html)}
    onInsertImageRequest={() => {/* scroll to photos section */}}
    readTime={fields.read_time}
  />
  ```
- `RichTextEditor` needs `forwardRef` to expose `editor.commands` — wrap with `forwardRef` and `useImperativeHandle` to expose `commands`.

**Read time update in `updateField`:**
```js
if (key === 'body') {
  const words = value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
  next.read_time = Math.max(1, Math.ceil(words / 200))
}
```
(Replace the existing plain-text word count with this HTML-stripped version.)

**Photo "Insert in body" button:** Change from `insertImageAtCursor(img.id)` to `handleInsertImage(img)`.

**Back button:** Change `navigate('/admin/articles')` → `navigate('/admin')` (already fixed in a prior commit, verify it's correct).

---

### `src/components/ArticleDetailView.jsx`

**HTML detection:**
```js
const isHtmlBody = typeof article?.body === 'string' && article.body.trimStart().startsWith('<')
```

**HTML segment parser** (added alongside existing `parseBodySegments`):
```js
function parseHtmlSegments(html, images) {
  const imageMap = Object.fromEntries((images || []).map(img => [String(img.id), img]))
  const parts = html.split(/(<img\b[^>]*>)/gi)
  return parts.flatMap(part => {
    if (!part.trim()) return []
    const match = part.match(/data-image-id="(\d+)"/)
    if (match) {
      const img = imageMap[match[1]]
      return img ? [{ type: 'image', image: img }] : []
    }
    return [{ type: 'html', content: part }]
  })
}
```

**HTML prose wrapper CSS** (added to `src/index.css`):
```css
.article-prose p { font-family: Georgia, serif; font-size: 1.125rem; line-height: 1.9; margin-bottom: 2rem; color: #292524; max-width: 48rem; margin-left: auto; margin-right: auto; }
.article-prose h2 { font-size: 1.5rem; font-weight: 800; margin: 2.5rem auto 1rem; max-width: 48rem; color: #0c0a09; }
.article-prose h3 { font-size: 1.25rem; font-weight: 700; margin: 2rem auto 0.75rem; max-width: 48rem; color: #0c0a09; }
.article-prose ul, .article-prose ol { max-width: 48rem; margin: 0 auto 2rem; padding-left: 2rem; font-family: Georgia, serif; font-size: 1.125rem; line-height: 1.8; }
.article-prose li { margin-bottom: 0.4rem; }
.article-prose blockquote { max-width: 48rem; margin: 2.5rem auto; padding-left: 1.5rem; border-left: 4px solid #00E676; font-style: italic; font-family: Georgia, serif; font-size: 1.25rem; color: #57534e; }
.article-prose a { color: #00C853; text-decoration: underline; }
.article-prose strong { font-weight: 700; }
.article-prose em { font-style: italic; }
.article-prose hr { max-width: 48rem; margin: 2.5rem auto; border: none; border-top: 2px solid #e7e5e4; }
```

**Rendering HTML segments:**
```jsx
// In the render loop, when isHtmlBody:
const htmlSegments = useMemo(
  () => isHtmlBody ? parseHtmlSegments(article.body, article.images) : null,
  [isHtmlBody, article.body, article.images]
)

// In JSX:
{isHtmlBody ? (
  <div className="article-prose px-6 pb-16">
    {htmlSegments.map((seg, i) =>
      seg.type === 'image'
        ? <ImagePlate key={i} image={seg.image} index={i} />
        : <div key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />
    )}
  </div>
) : (
  // existing plain-text rendering (unchanged)
)}
```

Drop cap and pull quotes apply to plain-text path only. HTML path uses blockquote for styled quotes.

---

### `server/routes/articles.js`

**POST handler — allow blank/missing title:**
Change:
```js
if (!data?.title) return res.status(400).json({ error: 'Title is required' })
```
To:
```js
const title = data?.title || 'Untitled'
```
And use `title` in the INSERT query instead of `data.title`.

Also update slug generation to handle empty title:
```js
const slug = data.slug || slugify(data.title || 'untitled') + '-' + Date.now()
```
(Append timestamp to avoid slug collisions from multiple "Untitled" articles.)

---

## Files Changed Summary

| File | Action |
|---|---|
| `src/components/RichTextEditor.jsx` | **Create** |
| `src/pages/AdminArticleWriter.jsx` | **Rewrite** |
| `src/pages/AdminArticleEditor.jsx` | Modify |
| `src/components/ArticleDetailView.jsx` | Modify |
| `src/index.css` | Modify — add `.prose-editor` and `.article-prose` CSS |
| `server/routes/articles.js` | Modify |
| `package.json` | Add Tiptap packages |

---

## Package Versions

Install as exact versions to avoid breakage:
```
@tiptap/react
@tiptap/pm
@tiptap/starter-kit
@tiptap/extension-underline
@tiptap/extension-link
@tiptap/extension-image
@tiptap/extension-placeholder
```

All from the `@tiptap` 2.x range (latest stable).

import { useState } from 'react'
import { mergeAttributes, Node } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { addBoardPost, getBoardPost, updateBoardPost } from '../lib/boardPostStorage'
import './boardPage.css'

const boardWriteConfigs = {
  free: {
    boardKey: 'freeBoard',
    backPath: '/free-board',
    eyebrow: 'community',
    title: '무적LG마당 글쓰기',
    description: '시즌 이야기, 응원, 질문 등 자유로운 글을 남겨 주세요.',
    categories: ['자유게시판', '응원', '티켓양도', '정모', '나눔'],
  },
  review: {
    boardKey: 'reviewBoard',
    backPath: '/reviews',
    eyebrow: 'win proof',
    title: '승요인증 글쓰기',
    description: '승리 순간, 직관 후기, 응원 현장 인증을 남겨 주세요.',
    categories: ['직관', '사진', '원정', '굿즈', '응원'],
  },
  stadiumTour: {
    boardKey: 'stadiumTourBoard',
    backPath: '/stadium-tour',
    eyebrow: 'stadium tour',
    title: '구장투어 글쓰기',
    description: '구장 방문 후기, 좌석 시야, 동선, 먹거리 정보를 남겨 주세요.',
    categories: ['잠실', '원정', '좌석시야', '먹거리', '교통'],
  },
}

function normalizeLinkUrl(url) {
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return ''
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`
}

function getYoutubeVideoId(url) {
  try {
    const parsedUrl = new URL(normalizeLinkUrl(url))
    if (parsedUrl.hostname.includes('youtu.be')) return parsedUrl.pathname.replace('/', '')
    if (parsedUrl.hostname.includes('youtube.com')) return parsedUrl.searchParams.get('v') ?? ''
    return ''
  }
  catch {
    return ''
  }
}

function getHomepagePreview(url) {
  try {
    const normalizedUrl = normalizeLinkUrl(url)
    if (!normalizedUrl) return null

    const parsedUrl = new URL(normalizedUrl)
    const domain = parsedUrl.hostname.replace(/^www\./, '')

    return {
      domain,
      displayUrl: normalizedUrl,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`,
      title: domain,
      description: '입력한 홈페이지 주소입니다.',
    }
  }
  catch {
    return null
  }
}

const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      kind: {
        default: 'homepage',
        parseHTML: (element) => element.dataset.linkPreview ?? 'homepage',
      },
      href: {
        default: '',
        parseHTML: (element) => element.getAttribute('href') ?? '',
      },
      imageUrl: {
        default: '',
        parseHTML: (element) => element.dataset.imageUrl ?? element.querySelector('img')?.getAttribute('src') ?? '',
      },
      title: {
        default: '',
        parseHTML: (element) => element.dataset.title ?? '',
      },
      description: {
        default: '',
        parseHTML: (element) => element.dataset.description ?? '',
      },
      displayUrl: {
        default: '',
        parseHTML: (element) => element.dataset.displayUrl ?? '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-link-preview]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const {
      kind,
      href,
      imageUrl,
      title,
      description,
      displayUrl,
    } = HTMLAttributes

    if (kind === 'youtube') {
      return [
        'a',
        mergeAttributes(HTMLAttributes, {
          class: 'boardLinkPreview boardLinkPreviewYoutube',
          href,
          target: '_blank',
          rel: 'noreferrer',
          'data-link-preview': 'youtube',
          'data-image-url': imageUrl,
          'data-title': title,
          'data-display-url': displayUrl,
        }),
        ['img', { class: 'boardLinkPreviewYoutubeImage', src: imageUrl, alt: title }],
        ['span', { class: 'boardLinkPreviewYoutubeTitle' }, title],
        ['span', { class: 'boardLinkPreviewYoutubeUrl' }, displayUrl || href],
        ['span', { class: 'boardLinkPreviewPlayIcon', 'aria-hidden': 'true' }],
      ]
    }

    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        class: 'boardLinkPreview boardLinkPreviewHomepage',
        href,
        target: '_blank',
        rel: 'noreferrer',
        'data-link-preview': 'homepage',
        'data-image-url': imageUrl,
        'data-title': title,
        'data-description': description,
        'data-display-url': displayUrl,
      }),
      [
        'span',
        { class: 'boardLinkPreviewHomepageLogo' },
        ['img', { src: imageUrl, alt: '' }],
      ],
      [
        'span',
        { class: 'boardLinkPreviewHomepageInfo' },
        ['strong', {}, title],
        ['span', { class: 'boardLinkPreviewHomepageDescription' }, description],
        ['span', { class: 'boardLinkPreviewHomepageUrl' }, displayUrl],
      ],
    ]
  },
})

export function BoardWritePage({ boardType }) {
  const config = boardWriteConfigs[boardType]
  const navigate = useNavigate()
  const { postId } = useParams()
  const { user, loading: authLoading, nickname } = useAuth()
  const editingPost = postId ? getBoardPost(config.boardKey, postId) : null
  const isEditMode = Boolean(postId)
  const [category, setCategory] = useState(editingPost?.category ?? config.categories[0])
  const [title, setTitle] = useState(editingPost?.title ?? '')
  const [content, setContent] = useState(editingPost?.content ?? '')
  const [editorFontFamily, setEditorFontFamily] = useState(editingPost?.fontFamily ?? 'default')
  const [editorFontSize, setEditorFontSize] = useState(String(editingPost?.fontSize ?? '16'))
  const [editorColor, setEditorColor] = useState('#111111')
  const [isLineMenuOpen, setIsLineMenuOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')

  const currentPath = isEditMode ? `${config.backPath}/${postId}/edit` : `${config.backPath}/write`
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(currentPath)}`
  const isFreeBoard = boardType === 'free'
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkPreview,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: isFreeBoard ? (editingPost?.htmlContent ?? '') : '',
    editorProps: {
      attributes: {
        class: 'boardBlogEditorProse',
      },
    },
    onUpdate: () => {
      setError('')
    },
  })

  if (authLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">{config.title}</h1>
          <p className="boardDescription">로그인 여부를 확인하는 중입니다.</p>
        </header>
      </article>
    )
  }

  if (!user) {
    return <Navigate to={loginRedirectHref} replace />
  }

  if (isEditMode && !editingPost) {
    return (
      <article className="boardPage">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">수정할 글을 찾을 수 없습니다</h1>
          <p className="boardDescription">삭제되었거나 현재 브라우저에 저장된 글이 아닙니다.</p>
        </header>
        <button type="button" className="boardWriteCancelBtn" onClick={() => navigate(config.backPath)}>
          목록
        </button>
      </article>
    )
  }

  const handleBlogImageChange = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0 || !editor) return

    const nextImages = await Promise.all(
      files.map((file) => new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(String(reader.result ?? ''))
        }
        reader.readAsDataURL(file)
      })),
    )

    /*
     * 사진은 별도 첨부 영역이 아니라 현재 커서 위치에 바로 삽입합니다.
     * 여러 장을 선택하면 선택 순서대로 본문에 들어가 티스토리 글쓰기와 비슷한 흐름이 됩니다.
     */
    nextImages.forEach((src) => {
      editor.chain().focus().setImage({ src }).run()
      editor.chain().focus().createParagraphNear().run()
    })
    event.target.value = ''
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const editorText = editor?.getText().trim() ?? ''
    const editorHtml = editor?.getHTML() ?? ''
    const editorHasImage = editorHtml.includes('<img')
    const editorHasLinkPreview = editorHtml.includes('data-link-preview')

    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.')
      return
    }

    if (isFreeBoard && !editorText && !editorHasImage && !editorHasLinkPreview) {
      setError('내용을 입력해 주세요.')
      return
    }

    if (!isFreeBoard && !trimmedContent) {
      setError('내용을 입력해 주세요.')
      return
    }

    const nextPost = {
      category,
      title: trimmedTitle,
      content: isFreeBoard ? editorText : trimmedContent,
      htmlContent: isFreeBoard ? editorHtml : undefined,
      fontFamily: isFreeBoard ? editorFontFamily : undefined,
      fontSize: isFreeBoard ? editorFontSize : undefined,
      author: nickname || user.email?.split('@')[0] || 'member',
    }

    /*
     * 새 글은 맨 위에 추가하고, 수정 글은 기존 id·조회수를 유지한 채 내용만 덮어씁니다.
     * 이렇게 해야 상세 페이지 URL이 바뀌지 않고 목록에서도 같은 글이 그대로 갱신됩니다.
     */
    if (isEditMode && postId) {
      updateBoardPost(config.boardKey, postId, nextPost)
      navigate(`${config.backPath}/${postId}`)
      return
    }

    addBoardPost(config.boardKey, nextPost)

    navigate(config.backPath)
  }

  const insertLineStyle = (lineClassName) => {
    editor
      ?.chain()
      .focus()
      .insertContent(`<hr class="${lineClassName}">`)
      .createParagraphNear()
      .run()
    setIsLineMenuOpen(false)
  }

  const openLinkModal = () => {
    const previousHref = editor?.getAttributes('link')?.href ?? ''
    setLinkUrl(previousHref)
    setIsLinkModalOpen(true)
  }

  const closeLinkModal = () => {
    setIsLinkModalOpen(false)
    setLinkUrl('')
  }

  const handleLinkConfirm = () => {
    const trimmedUrl = linkUrl.trim()
    if (!trimmedUrl || !editor) return

    const href = normalizeLinkUrl(trimmedUrl)
    const videoId = getYoutubeVideoId(href)
    const preview = videoId
      ? {
          kind: 'youtube',
          href,
          imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          title: 'YouTube 영상',
          description: '',
          displayUrl: href,
        }
      : getHomepagePreview(href)

    if (!preview) return

    /*
     * 링크 주소 텍스트는 본문에 따로 남기지 않고, 미리보기 카드만 삽입합니다.
     * 이렇게 해야 사용자가 여러 링크를 추가해도 상세 화면이 카드 중심으로 깔끔하게 유지됩니다.
     */
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'linkPreview',
          attrs: {
            kind: preview.kind ?? 'homepage',
            href,
            imageUrl: preview.imageUrl,
            title: preview.title,
            description: preview.description,
            displayUrl: preview.displayUrl,
          },
        },
        {
          type: 'paragraph',
        },
      ])
      .run()

    closeLinkModal()
  }

  const youtubeVideoId = getYoutubeVideoId(linkUrl.trim())
  const homepagePreview = youtubeVideoId ? null : getHomepagePreview(linkUrl.trim())

  return (
    <article className="boardPage">
      <header className="boardHeader">
        <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
        <h1 className="boardTitle">{isEditMode ? config.title.replace('글쓰기', '수정') : config.title}</h1>
        <p className="boardDescription">{config.description}</p>
      </header>

      <section className="boardPanel" aria-labelledby={`${boardType}BoardWriteHeading`}>
        <h2 id={`${boardType}BoardWriteHeading`} className="srOnly">
          {isEditMode ? '게시글 수정' : '게시글 작성'}
        </h2>

        <form className={isFreeBoard ? 'boardWriteForm boardBlogWriteForm' : 'boardWriteForm'} onSubmit={handleSubmit} noValidate>
          {isFreeBoard ? (
            <div className="boardBlogEditorField">
              <div className="boardBlogEditor">
                <div className="boardBlogToolbar" aria-label="글 편집 도구">
                  <label className="boardBlogToolbarPhotoBtn" title="사진 첨부">
                    ▧
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBlogImageChange}
                    />
                  </label>
                  <select
                    className="boardBlogToolbarSelect"
                    aria-label="글꼴"
                    value={editorFontFamily}
                    onChange={(event) => setEditorFontFamily(event.target.value)}
                  >
                    <option value="default">기본서체</option>
                    <option value="bonGothicRegular">본고딕 R</option>
                    <option value="bonGothicLight">본고딕 L</option>
                    <option value="nanumGothic">나눔고딕</option>
                    <option value="bonMyeongjo">본명조</option>
                    <option value="gungseo">궁서</option>
                  </select>
                  <select
                    className="boardBlogToolbarSelect boardBlogToolbarSize"
                    aria-label="글자 크기"
                    value={editorFontSize}
                    onChange={(event) => setEditorFontSize(event.target.value)}
                  >
                    <option value="13">13</option>
                    <option value="15">15</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                    <option value="28">28</option>
                  </select>
                  {[
                    { label: 'B', command: () => editor?.chain().focus().toggleBold().run() },
                    { label: '/', command: () => editor?.chain().focus().toggleItalic().run() },
                    { label: 'U', command: () => editor?.chain().focus().toggleUnderline().run() },
                    { label: 'T', command: () => editor?.chain().focus().toggleStrike().run() },
                    { label: 'alignLeft', ariaLabel: '왼쪽 정렬', command: () => editor?.chain().focus().setTextAlign('left').run() },
                    { label: 'alignCenter', ariaLabel: '가운데 정렬', command: () => editor?.chain().focus().setTextAlign('center').run() },
                    { label: 'alignRight', ariaLabel: '오른쪽 정렬', command: () => editor?.chain().focus().setTextAlign('right').run() },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={[
                        'boardBlogToolbarBtn',
                        item.label.startsWith('align') ? `boardBlogAlignBtn boardBlogAlignBtn-${item.label}` : '',
                      ].filter(Boolean).join(' ')}
                      aria-label={item.ariaLabel}
                      tabIndex={-1}
                      onClick={item.command}
                    >
                      {item.label.startsWith('align') ? <span aria-hidden="true" /> : item.label}
                    </button>
                  ))}
                  {[
                    { label: '•', command: () => editor?.chain().focus().toggleBulletList().run() },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="boardBlogToolbarBtn"
                      tabIndex={-1}
                      onClick={item.command}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="boardBlogLineMenuWrap">
                    <button
                      type="button"
                      className="boardBlogToolbarBtn boardBlogLineMenuBtn"
                      aria-label="라인 스타일 선택"
                      aria-expanded={isLineMenuOpen}
                      onClick={() => setIsLineMenuOpen((prev) => !prev)}
                    >
                      <span aria-hidden="true" />
                    </button>
                    {isLineMenuOpen && (
                      <div className="boardBlogLineMenu" role="menu" aria-label="라인 스타일">
                        {[
                          { className: 'boardEditorLineDots', label: '점 라인' },
                          { className: 'boardEditorLineBold', label: '굵은 라인' },
                          { className: 'boardEditorLineWave', label: '물결 라인' },
                          { className: 'boardEditorLineVertical', label: '세로 라인' },
                          { className: 'boardEditorLineThin', label: '얇은 라인' },
                          { className: 'boardEditorLineSoft', label: '연한 라인' },
                          { className: 'boardEditorLineDiamond', label: '다이아몬드 라인' },
                          { className: 'boardEditorLineCircle', label: '원 라인' },
                        ].map((line) => (
                          <button
                            key={line.className}
                            type="button"
                            role="menuitem"
                            className={`boardBlogLineOption ${line.className}`}
                            aria-label={line.label}
                            onClick={() => insertLineStyle(line.className)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {[
                    {
                      label: '🔗',
                      command: openLinkModal,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="boardBlogToolbarBtn"
                      tabIndex={-1}
                      onClick={item.command}
                    >
                      {item.label}
                    </button>
                  ))}
                  <label className="boardBlogColorPicker" title="글자색 변경">
                    <span style={{ backgroundColor: editorColor }} />
                    <input
                      type="color"
                      value={editorColor}
                      onChange={(event) => {
                        const nextColor = event.target.value
                        setEditorColor(nextColor)
                        editor?.chain().focus().setColor(nextColor).run()
                      }}
                    />
                  </label>
                </div>

                <div className="boardBlogMetaArea">
                  <label className="srOnly" htmlFor="boardBlogCategory">
                    카테고리
                  </label>
                  <select
                    id="boardBlogCategory"
                    className="boardBlogCategorySelect"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {config.categories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <label className="srOnly" htmlFor="boardWriteTitle">
                    제목
                  </label>
                  <input
                    id="boardWriteTitle"
                    className="boardBlogTitleInput"
                    value={title}
                    placeholder="제목을 입력하세요"
                    maxLength={80}
                    onChange={(event) => {
                      setTitle(event.target.value)
                      setError('')
                    }}
                    required
                  />
                </div>

                <div
                  id="boardBlogContent"
                  className={`boardBlogEditorContent boardBlogFont-${editorFontFamily}`}
                  style={{ fontSize: `${editorFontSize}px` }}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="boardWriteField">
                <label className="boardWriteLabel" htmlFor="boardWriteCategory">
                  구분
                </label>
                <select
                  id="boardWriteCategory"
                  className="boardWriteSelect"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {config.categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="boardWriteField">
                <label className="boardWriteLabel" htmlFor="boardWriteTitle">
                  제목
                </label>
                <input
                  id="boardWriteTitle"
                  className="boardWriteInput"
                  value={title}
                  placeholder="제목을 입력해 주세요"
                  maxLength={80}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setError('')
                  }}
                  required
                />
              </div>

              <div className="boardWriteField">
                <label className="boardWriteLabel" htmlFor="boardWriteContent">
                  내용
                </label>
                <textarea
                  id="boardWriteContent"
                  className="boardWriteTextarea"
                  value={content}
                  placeholder="내용을 입력해 주세요"
                  maxLength={4000}
                  onChange={(event) => {
                    setContent(event.target.value)
                    setError('')
                  }}
                  required
                />
              </div>
            </>
          )}

          {error && (
            <p className="boardWriteError" role="alert">
              {error}
            </p>
          )}

          <div className="boardWriteActions boardWriteSubmitActions">
            <button type="button" className="boardWriteCancelBtn" onClick={() => navigate(config.backPath)}>
              목록
            </button>
            <button type="submit" className="boardWriteSubmitBtn">
              {isEditMode ? '수정' : '등록'}
            </button>
          </div>
        </form>

        {isLinkModalOpen && (
          <div className="boardBlogLinkModalBackdrop" role="presentation">
            <section
              className="boardBlogLinkModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="boardBlogLinkModalTitle"
            >
              <button
                type="button"
                className="boardBlogLinkModalClose"
                aria-label="링크 창 닫기"
                onClick={closeLinkModal}
              >
                ×
              </button>
              <h3 id="boardBlogLinkModalTitle" className="boardBlogLinkModalTitle">
                링크
              </h3>

              <div className="boardBlogLinkInputWrap">
                <input
                  className="boardBlogLinkInput"
                  value={linkUrl}
                  placeholder="https://example.com"
                  onChange={(event) => setLinkUrl(event.target.value)}
                  autoFocus
                />
                <span className="boardBlogLinkSearchIcon" aria-hidden="true" />
              </div>

              {youtubeVideoId && (
                <div className="boardBlogLinkPreview">
                  <img
                    className="boardBlogLinkPreviewImg"
                    src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
                    alt="YouTube 링크 미리보기"
                  />
                  <span className="boardBlogLinkPreviewUrl">
                    {normalizeLinkUrl(linkUrl)}
                  </span>
                  <span className="boardBlogLinkPlayIcon" aria-hidden="true" />
                </div>
              )}

              {homepagePreview && (
                <div className="boardBlogHomepagePreview">
                  <div className="boardBlogHomepageLogo">
                    <img src={homepagePreview.faviconUrl} alt="" aria-hidden="true" />
                  </div>
                  <div className="boardBlogHomepageInfo">
                    <strong>{homepagePreview.title}</strong>
                    <span>{homepagePreview.description}</span>
                    <a href={normalizeLinkUrl(linkUrl)} target="_blank" rel="noreferrer">
                      {homepagePreview.displayUrl}
                    </a>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="boardBlogLinkConfirmBtn"
                disabled={!linkUrl.trim()}
                onClick={handleLinkConfirm}
              >
                <span aria-hidden="true">✓</span>
                확인
              </button>
            </section>
          </div>
        )}
      </section>
    </article>
  )
}

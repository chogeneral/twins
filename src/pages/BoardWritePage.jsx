import { useEffect, useRef, useState } from 'react'
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
import { cleanBoardHtmlContent } from '../lib/boardHtmlSanitizer'
import {
  createBoardPost,
  fetchBoardPost,
  getBoardPost,
  isSharedBoardKey,
  saveBoardPost,
} from '../lib/boardPostStorage'
import './boardPage.css'

const boardWriteConfigs = {
  free: {
    boardKey: 'freeBoard',
    backPath: '/free-board',
    eyebrow: '무적LG마당',
    title: '무적LG마당',
    description: '시즌 이야기, 응원, 질문 등 자유로운 글을 남겨 주세요.',
    categories: ['자유게시판', '응원', '티켓양도', '정모', '나눔'],
  },
  review: {
    boardKey: 'reviewBoard',
    backPath: '/reviews',
    eyebrow: '승요인증',
    title: '승요인증',
    description: '승리 순간, 직관 후기, 응원 현장 인증을 남겨 주세요.',
    defaultCategory: '승요인증',
    showCategory: false,
  },
  stadiumTour: {
    boardKey: 'stadiumTourBoard',
    backPath: '/stadium-tour',
    eyebrow: '구장투어',
    title: '구장투어',
    description: '구장 방문 후기, 좌석 시야, 동선, 먹거리 정보를 남겨 주세요.',
    categories: [
      '잠실야구장',
      '고척야구장',
      '인천 SSG 랜더스필드',
      '수원 KT 위즈파크',
      '대전 한화생명 이글스파크',
      '대구 삼성 라이온즈파크',
      '사직야구장',
      '창원 NC 파크',
      '광주 기아 챔피언스 필드',
    ],
  },
  twinsNews: {
    boardKey: 'twinsNewsBoard',
    backPath: '/twins-news',
    eyebrow: 'twins뉴스',
    title: 'twins뉴스',
    description: 'LG 트윈스 관련 뉴스, 경기 소식, 인터뷰를 공유해 주세요.',
    defaultCategory: '뉴스',
    showCategory: false,
  },
  inquiry: {
    boardKey: 'inquiryBoard',
    backPath: '/inquiry',
    eyebrow: '문의하기',
    title: '문의하기',
    description: '사이트 이용 문의나 개선 의견을 남겨 주세요.',
    defaultCategory: '문의',
    showCategory: false,
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
        /*
         * 유튜브 카드는 이미지와 재생 아이콘만 저장합니다.
         * 제목·URL 보조 텍스트를 HTML 안에 남기면 수정/상세 화면에서 이미지 로드 실패나 중복 링크 파싱 시 검은 텍스트 줄로 보일 수 있습니다.
         */
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
  const isSharedBoard = isSharedBoardKey(config.boardKey)
  const localEditingPost = postId ? getBoardPost(config.boardKey, postId) : null
  const [editingPost, setEditingPost] = useState(localEditingPost)
  const [editLoading, setEditLoading] = useState(Boolean(postId && isSharedBoard))
  const isEditMode = Boolean(postId)
  const isInquiryBoard = boardType === 'inquiry'
  const [category, setCategory] = useState(
    editingPost?.category ?? config.defaultCategory ?? config.categories?.[0] ?? '',
  )
  const [title, setTitle] = useState(editingPost?.title ?? '')
  const [content, setContent] = useState(editingPost?.content ?? '')
  const [editorFontFamily, setEditorFontFamily] = useState(editingPost?.fontFamily ?? 'default')
  const [editorFontSize, setEditorFontSize] = useState(String(editingPost?.fontSize ?? '16'))
  const [editorColor, setEditorColor] = useState('#111111')
  const [isLineMenuOpen, setIsLineMenuOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isNotice, setIsNotice] = useState(editingPost?.isNotice ?? false)
  const lineMenuRef = useRef(null)

  const currentPath = isEditMode ? `${config.backPath}/${postId}/edit` : `${config.backPath}/write`
  const loginRedirectHref = `/login?redirect=${encodeURIComponent(currentPath)}`
  const authorDisplay = nickname || user?.email?.split('@')[0] || 'member'
  const isBlogBoard = ['free', 'review', 'stadiumTour', 'twinsNews', 'inquiry'].includes(boardType)
  const shouldShowCategory = config.showCategory !== false
  const isEditingPostOwner = Boolean(
    (editingPost?.userId && editingPost.userId === user?.id)
    || (!editingPost?.userId && editingPost?.author && editingPost.author === authorDisplay),
  )
  const shouldBlockInquiryEdit = Boolean(
    isEditMode
    && isInquiryBoard
    && editingPost
    && user
    && !isEditingPostOwner,
  )
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
    content: isBlogBoard ? cleanBoardHtmlContent(editingPost?.htmlContent ?? '') : '',
    editorProps: {
      attributes: {
        class: 'boardBlogEditorProse',
      },
      handleClick: (_view, _pos, event) => {
        /*
         * 글쓰기 화면은 링크를 "편집 대상"으로 다루는 곳이라 클릭 즉시 외부 페이지로 이동하면 작성 중인 내용이 끊깁니다.
         * 저장되는 HTML의 href는 그대로 유지하되, 에디터 내부 클릭만 막아 상세페이지에서만 실제 링크 이동이 가능하게 합니다.
         */
        const clickedLink = event.target instanceof Element
          ? event.target.closest('a[href]')
          : null

        if (!clickedLink) return false

        event.preventDefault()
        return true
      },
    },
    onUpdate: () => {
      setError('')
    },
  })

  useEffect(() => {
    if (!shouldBlockInquiryEdit) return
    window.alert('글쓴이만 수정할 수 있습니다.')
  }, [shouldBlockInquiryEdit])

  useEffect(() => {
    if (!postId || !isSharedBoard) return undefined

    let ignore = false

    async function loadEditingPost() {
      setEditLoading(true)
      setError('')

      try {
        const nextPost = await fetchBoardPost(config.boardKey, postId)
        if (ignore) return

        setEditingPost(nextPost)

        if (!nextPost) return

        setCategory(nextPost.category ?? config.defaultCategory ?? config.categories?.[0] ?? '')
        setTitle(nextPost.title ?? '')
        setContent(nextPost.content ?? '')
        setEditorFontFamily(nextPost.fontFamily ?? 'default')
        setEditorFontSize(String(nextPost.fontSize ?? '16'))
        setIsNotice(nextPost.isNotice ?? false)
        editor?.commands.setContent(cleanBoardHtmlContent(nextPost.htmlContent ?? ''))
      }
      catch (loadError) {
        if (!ignore) {
          setError(loadError.message ?? '수정할 글을 불러오지 못했습니다.')
        }
      }
      finally {
        if (!ignore) setEditLoading(false)
      }
    }

    loadEditingPost()

    return () => {
      ignore = true
    }
  }, [config.boardKey, config.categories, config.defaultCategory, editor, isSharedBoard, postId])

  useEffect(() => {
    if (!isLineMenuOpen) return undefined

    const closeLineMenuOnOutsidePointerDown = (event) => {
      /*
       * 라인 선택 메뉴는 툴바 위에 떠 있는 팝업이라, 사용자가 다른 편집 영역을 누르면 즉시 닫히는 편이 자연스럽습니다.
       * 메뉴 버튼과 옵션 내부 클릭은 유지하고, 감싸는 영역 밖에서 시작된 포인터 입력만 닫힘으로 처리합니다.
       */
      if (lineMenuRef.current?.contains(event.target)) return

      setIsLineMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeLineMenuOnOutsidePointerDown)

    return () => {
      document.removeEventListener('pointerdown', closeLineMenuOnOutsidePointerDown)
    }
  }, [isLineMenuOpen])

  if (authLoading || editLoading) {
    return (
      <article className="boardPage" aria-busy="true">
        <header className="boardHeader">
          <p lang="en" className="boardEyebrow">{config.eyebrow}</p>
          <h1 className="boardTitle">{config.title}</h1>
          <p className="boardDescription">
            {authLoading ? '로그인 여부를 확인하는 중입니다.' : '수정할 글을 불러오는 중입니다.'}
          </p>
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

  if (shouldBlockInquiryEdit) {
    return <Navigate to={config.backPath} replace />
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const editorText = editor?.getText().trim() ?? ''
    const editorHtml = cleanBoardHtmlContent(editor?.getHTML() ?? '')
    const editorHasImage = editorHtml.includes('<img')
    const editorHasLinkPreview = editorHtml.includes('data-link-preview')

    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.')
      return
    }

    if (isBlogBoard && !editorText && !editorHasImage && !editorHasLinkPreview) {
      setError('내용을 입력해 주세요.')
      return
    }

    if (!isBlogBoard && !trimmedContent) {
      setError('내용을 입력해 주세요.')
      return
    }

    const nextPost = {
      category,
      title: trimmedTitle,
      content: isBlogBoard ? editorText : trimmedContent,
      htmlContent: isBlogBoard ? editorHtml : undefined,
      fontFamily: isBlogBoard ? editorFontFamily : undefined,
      fontSize: isBlogBoard ? editorFontSize : undefined,
      userId: user.id,
      author: authorDisplay,
      isNotice,
    }

    /*
     * 새 글은 맨 위에 추가하고, 수정 글은 기존 id·조회수를 유지한 채 내용만 덮어씁니다.
     * 이렇게 해야 상세 페이지 URL이 바뀌지 않고 목록에서도 같은 글이 그대로 갱신됩니다.
     */
    setSubmitting(true)

    try {
      if (isEditMode && postId) {
        const updatedPost = await saveBoardPost(config.boardKey, postId, nextPost)
        navigate(`${config.backPath}/${updatedPost?.id ?? postId}`)
        return
      }

      const createdPost = await createBoardPost(config.boardKey, nextPost)

      if (isInquiryBoard) {
        window.alert('문의가 등록되었습니다.')
        navigate(`${config.backPath}/${createdPost.id}`)
        return
      }

      navigate(config.backPath)
    }
    catch (saveError) {
      setError(saveError.message ?? '게시글을 저장하지 못했습니다.')
    }
    finally {
      setSubmitting(false)
    }
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
        <h1 className="boardTitle">{config.title}</h1>
        <p className="boardDescription">{config.description}</p>
      </header>

      <section className="boardPanel" aria-labelledby={`${boardType}BoardWriteHeading`}>
        <h2 id={`${boardType}BoardWriteHeading`} className="srOnly">
          게시글 작성
        </h2>

        <form
          className={[
            'boardWriteForm',
            isBlogBoard ? 'boardBlogWriteForm' : '',
            boardType === 'stadiumTour' ? 'stadiumTourWriteForm' : '',
          ].filter(Boolean).join(' ')}
          onSubmit={handleSubmit}
          noValidate
        >
          {isBlogBoard ? (
            <div className="boardBlogEditorField">
              <div className="boardBlogEditor">
                {/* 
                  683px 미만일 때 글 편집 도구가 자연스럽고 깔끔하게 2줄로 배치될 수 있도록
                  HTML 구조상에서 도구들을 두 개의 그룹(toolbarFirstGroup, toolbarSecondGroup)으로 나누어 감싸주었습니다.
                  이러한 그룹화를 통해 각 줄의 정렬 및 간격을 모바일 환경에서도 효율적으로 제어할 수 있습니다.
                  css 클래스명은 카멜케이스(camelCase) 규칙을 엄격히 준수하여 명명하였습니다.
                */}
                <div className="boardBlogToolbar" aria-label="글 편집 도구">
                  <div className="toolbarFirstGroup">
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
                  </div>
                  <div className="toolbarSecondGroup">
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
                    <div className="boardBlogLineMenuWrap" ref={lineMenuRef}>
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
                            { className: 'boardEditorLineDouble', label: '이중 라인' },
                          ].map((item) => (
                            <button
                              key={item.className}
                              type="button"
                              role="menuitem"
                              className={`boardBlogLineOption ${item.className}`}
                              aria-label={item.label}
                              onClick={() => insertLineStyle(item.className)}
                            >
                              <span className="srOnly">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="boardBlogToolbarBtn"
                      aria-label="링크 삽입"
                      tabIndex={-1}
                      onClick={openLinkModal}
                    >
                      <span aria-hidden="true" />
                    </button>
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
                </div>

                <div className={['boardBlogMetaArea', shouldShowCategory ? '' : 'boardBlogMetaAreaNoCategory'].filter(Boolean).join(' ')}>
                  {shouldShowCategory && (() => {
                    const categoriesToRender = [...(config.categories || [])]
                    if (boardType === 'free' && user?.email === 's2ckh1005@gmail.com') {
                      if (!categoriesToRender.includes('공지사항')) {
                        categoriesToRender.unshift('공지사항')
                      }
                    }
                    return (
                      <>
                        <label className="srOnly" htmlFor="boardBlogCategory">
                          카테고리
                        </label>
                        <select
                          id="boardBlogCategory"
                          className="boardBlogCategorySelect"
                          value={category}
                          onChange={(event) => {
                            const nextCat = event.target.value
                            setCategory(nextCat)
                            setIsNotice(nextCat === '공지사항')
                          }}
                        >
                          {categoriesToRender.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </>
                    )
                  })()}

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
                {(() => {
                  const categoriesToRender = [...(config.categories || [])]
                  if (boardType === 'free' && user?.email === 's2ckh1005@gmail.com') {
                    if (!categoriesToRender.includes('공지사항')) {
                      categoriesToRender.unshift('공지사항')
                    }
                  }
                  return (
                    <select
                      id="boardWriteCategory"
                      className="boardWriteSelect"
                      value={category}
                      onChange={(event) => {
                        const nextCat = event.target.value
                        setCategory(nextCat)
                        setIsNotice(nextCat === '공지사항')
                      }}
                    >
                      {categoriesToRender.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )
                })()}

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
            <button type="submit" className="boardWriteSubmitBtn" disabled={submitting}>
              {submitting ? '저장 중...' : (isEditMode ? '수정' : '등록')}
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
                    <span className="boardBlogHomepagePreviewUrl">
                      {homepagePreview.displayUrl}
                    </span>
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

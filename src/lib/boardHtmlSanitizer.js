export function cleanBoardHtmlContent(html) {
  if (!html || typeof DOMParser === 'undefined') return html ?? ''

  const document = new DOMParser().parseFromString(html, 'text/html')

  document.querySelectorAll('a.boardLinkPreviewYoutube').forEach((youtubeLink) => {
    const hasPreviewImage = youtubeLink.querySelector('img, .boardLinkPreviewYoutubeImage')

    if (hasPreviewImage) return

    const parentParagraph = youtubeLink.parentElement?.tagName === 'P'
      ? youtubeLink.parentElement
      : null

    /*
     * 예전 저장 방식에서 유튜브 미리보기 카드 아래에 텍스트 링크 앵커가 한 번 더 남아 검은 줄처럼 보였습니다.
     * 실제 영상 카드는 이미지가 있는 앵커만 유지하고, 이미지 없이 텍스트만 가진 보조 앵커는 본문 HTML에서 제거합니다.
     */
    youtubeLink.remove()

    if (!parentParagraph) return

    const hasVisibleContent = parentParagraph.textContent.trim()
      || parentParagraph.querySelector('img, iframe, video, a')

    if (!hasVisibleContent) {
      parentParagraph.remove()
    }
  })

  return document.body.innerHTML
}

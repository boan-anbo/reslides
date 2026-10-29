/**
 * Constants for @slidev/client-react
 * Pure constants only - no React-specific code here
 * Context definitions are in context.tsx
 */

// CSS class constants - same as Vue version
export const CLASS_VCLICK_TARGET = 'slidev-vclick-target'
export const CLASS_VCLICK_HIDDEN = 'slidev-vclick-hidden'
export const CLASS_VCLICK_FADE = 'slidev-vclick-fade'
export const CLASS_VCLICK_GONE = 'slidev-vclick-gone'
export const CLASS_VCLICK_HIDDEN_EXP = 'slidev-vclick-hidden-explicitly'
export const CLASS_VCLICK_CURRENT = 'slidev-vclick-current'
export const CLASS_VCLICK_PRIOR = 'slidev-vclick-prior'
export const CLASS_VCLICK_DISPLAY_NONE = 'slidev-vclick-display-none'

export const CLICKS_MAX = 999999

export const TRUST_ORIGINS = [
  'localhost',
  '127.0.0.1',
]

export const FRONTMATTER_FIELDS = [
  'clicks',
  'clicksStart',
  'disabled',
  'hide',
  'hideInToc',
  'layout',
  'level',
  'preload',
  'routeAlias',
  'src',
  'title',
  'transition',
  'zoom',
  'dragPos',
  'lang',
]

export const HEADMATTER_FIELDS = [
  ...FRONTMATTER_FIELDS,
  'theme',
  'titleTemplate',
  'info',
  'author',
  'keywords',
  'presenter',
  'browserExporter',
  'download',
  'exportFilename',
  'export',
  'highlighter',
  'lineNumbers',
  'monaco',
  'monacoTypesSource',
  'monacoTypesAdditionalPackages',
  'monacoRunAdditionalDeps',
  'monacoRunUseStrict',
  'remoteAssets',
  'selectable',
  'record',
  'colorSchema',
  'routerMode',
  'aspectRatio',
  'canvasWidth',
  'themeConfig',
  'favicon',
  'plantUmlServer',
  'fonts',
  'defaults',
  'drawings',
  'htmlAttrs',
  'mdc',
  'contextMenu',
  'wakeLock',
  'seoMeta',
  'notesAutoRuby',
  'magicMoveDuration',
]

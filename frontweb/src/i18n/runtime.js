import { computed, ref } from 'vue'
import { zhSourceDictionary } from './zhSourceDictionary'
import { additionalEnglishDictionary } from './additionalEnglishDictionary'

export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
]

const STORAGE_KEY = 'local-mini-drama-ui-language'
const DEFAULT_LANGUAGE = 'en'
const textOriginals = new WeakMap()
const attrOriginals = new WeakMap()
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'empty-text']

let observer = null
let applying = false

export const currentLanguage = ref(normalizeLanguage(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE))

const sortedKeys = computed(() => {
  const dictionary = getDictionary(currentLanguage.value)
  return Object.keys(dictionary).sort((a, b) => b.length - a.length)
})

function getDictionary(language) {
  const base = zhSourceDictionary[language] || {}
  if (language === 'en') return { ...base, ...additionalEnglishDictionary }
  return base
}

export function normalizeLanguage(language) {
  return language === 'en' || language === 'vi' ? language : DEFAULT_LANGUAGE
}

export function translateText(value, language = currentLanguage.value) {
  if (!value || language === 'zh') return value
  const dictionary = getDictionary(language)
  if (!dictionary) return value

  let out = value
  const keys = language === currentLanguage.value
    ? sortedKeys.value
    : Object.keys(dictionary).sort((a, b) => b.length - a.length)

  for (const key of keys) {
    if (out.includes(key)) out = out.split(key).join(dictionary[key])
  }
  return out
}

function translateTextNode(node) {
  const original = textOriginals.get(node) || node.nodeValue
  if (!textOriginals.has(node)) textOriginals.set(node, original)
  const translated = translateText(original)
  if (node.nodeValue !== translated) node.nodeValue = translated
}

function translateAttributes(el) {
  if (!attrOriginals.has(el)) attrOriginals.set(el, new Map())
  const originals = attrOriginals.get(el)

  for (const attr of ATTRS) {
    if (!el.hasAttribute?.(attr)) continue
    const current = el.getAttribute(attr)
    if (!originals.has(attr) || /[\u4e00-\u9fff]/.test(current)) {
      originals.set(attr, current)
    }
    const translated = translateText(originals.get(attr))
    if (current !== translated) el.setAttribute(attr, translated)
  }
}

function walk(root) {
  if (!root) return
  if (root.nodeType === Node.TEXT_NODE) {
    if (/[\u4e00-\u9fff]/.test(textOriginals.get(root) || root.nodeValue || '')) translateTextNode(root)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return

  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (/[\u4e00-\u9fff]/.test(textOriginals.get(node) || node.nodeValue || '')) translateTextNode(node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(node)
    }
    node = walker.nextNode()
  }
}

export function applyLanguage() {
  if (typeof document === 'undefined' || applying) return
  applying = true
  try {
    document.documentElement.lang = currentLanguage.value === 'vi' ? 'vi' : 'en'
    walk(document.body)
    document.title = translateText(document.title)
  } finally {
    applying = false
  }
}

export function setLanguage(language) {
  currentLanguage.value = normalizeLanguage(language)
  localStorage.setItem(STORAGE_KEY, currentLanguage.value)
  queueMicrotask(applyLanguage)
}

export function startRuntimeI18n() {
  if (typeof document === 'undefined') return
  queueMicrotask(applyLanguage)
  if (observer) return

  observer = new MutationObserver(() => {
    if (!applying) queueMicrotask(applyLanguage)
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  })
}

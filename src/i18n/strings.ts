import type { Language } from '../utils/dataTypes'

const en = {
  'nav.home': 'Home',
  'nav.archives': 'Archive',
  'nav.subjects': 'Subjects',
  'nav.tags': 'Tags',
  'rail.recent': 'Recent entries',
  'rail.subjects': 'Subjects',
  'rail.allSubjects': 'All subjects',
  'rail.tags': 'Tags',
  'shell.mainNav': 'Main',
  'shell.menu': 'Toggle menu',
  'shell.skip': 'Skip to content',
  'shell.language': 'Language',
  'shell.themeToLight': 'Switch to light mode',
  'shell.themeToDark': 'Switch to dark mode',
  'footer.rights': 'Some rights reserved',
  'footer.icon': 'Star icon by Maxicons',
} as const

export type StringKey = keyof typeof en

const pt: Record<StringKey, string> = {
  'nav.home': 'Início',
  'nav.archives': 'Arquivo',
  'nav.subjects': 'Disciplinas',
  'nav.tags': 'Tags',
  'rail.recent': 'Entradas recentes',
  'rail.subjects': 'Disciplinas',
  'rail.allSubjects': 'Todas as disciplinas',
  'rail.tags': 'Tags',
  'shell.mainNav': 'Principal',
  'shell.menu': 'Alternar menu',
  'shell.skip': 'Pular para o conteúdo',
  'shell.language': 'Idioma',
  'shell.themeToLight': 'Mudar para o tema claro',
  'shell.themeToDark': 'Mudar para o tema escuro',
  'footer.rights': 'Alguns direitos reservados',
  'footer.icon': 'Ícone de estrela por Maxicons',
}

export const strings: Record<Language, Record<StringKey, string>> = { en, pt }

import { useMemo } from 'react'
import { cmsApi } from './cmsApi'
import { useAsyncData } from './useAsyncData'
import { useLanguage } from '../i18n/LanguageProvider'
import { buildTagList, buildTagSummary, filterPostsByLanguage } from './contentTaxonomy'

interface UseCmsContentOptions {
  // Admin screens need every post; public pages show the visitor's language only.
  allLanguages?: boolean
}

export function useCmsContent({ allLanguages = false }: UseCmsContentOptions = {}) {
  const { language } = useLanguage()
  const { data, loading, error, reload } = useAsyncData(() => cmsApi.listAll(), [])

  const content = useMemo(() => {
    if (!data) return { subjects: [], posts: [], tags: [], tagSummary: [] }
    if (allLanguages) return data

    const posts = filterPostsByLanguage(data.posts, language)
    return {
      subjects: data.subjects,
      posts,
      tags: buildTagList(posts),
      tagSummary: buildTagSummary(posts),
    }
  }, [data, allLanguages, language])

  return { ...content, loading, error, reload }
}

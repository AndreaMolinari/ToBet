import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import type { Tag } from '../lib/types'

interface TagsState {
  tags: Tag[]
  loading: boolean
  createTag: (tag: Tag) => Promise<void>
  deleteTag: (name: string) => Promise<void>
}

export function useTags(): TagsState {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    db.getTags()
      .then(data => { if (!cancelled) { setTags(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tick])

  const createTag = useCallback(async (tag: Tag) => {
    await db.createTag(tag)
    refresh()
  }, [refresh])

  const deleteTag = useCallback(async (name: string) => {
    await db.deleteTag(name)
    refresh()
  }, [refresh])

  return { tags, loading, createTag, deleteTag }
}

import { useState, useEffect } from 'react'

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useGravatarUrl(email: string | undefined, size = 40): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!email) return
    sha256hex(email.trim().toLowerCase()).then(hash => {
      setUrl(`https://gravatar.com/avatar/${hash}?s=${size * 2}&d=mp`)
    })
  }, [email, size])
  return url
}

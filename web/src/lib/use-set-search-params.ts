import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Update = (prev: URLSearchParams) => URLSearchParams

export function useSetSearchParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (update: Update, options: { replace?: boolean } = {}) => {
    const params = update(new URLSearchParams(searchParams.toString())).toString()
    const url = params ? `${pathname}?${params}` : pathname
    if (options.replace) router.replace(url, { scroll: false })
    else router.push(url, { scroll: false })
  }
}

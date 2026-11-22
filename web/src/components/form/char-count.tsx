export function CharCount({ count, max }: { count: number; max: number }) {
  return (
    <span
      className={count > max ? 'text-xs text-destructive tabular-nums' : 'text-xs text-muted-foreground tabular-nums'}
    >
      {count}/{max}
    </span>
  )
}

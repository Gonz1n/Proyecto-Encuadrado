export function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <div>
      <h2 id={id} className="text-3xl font-bold tracking-tight sm:text-4xl">
        {children}
      </h2>
      <hr className="mt-3 border-[var(--cp-terracota)]" />
    </div>
  )
}

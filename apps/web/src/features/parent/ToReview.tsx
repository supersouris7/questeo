import type { ReviewItem } from './summary.ts';

/** Espace parent : « Notions à renforcer » (lecture seule, aucune action). */
export function ToReview({ items }: { readonly items: readonly ReviewItem[] }) {
  return (
    <section aria-labelledby="a-reviser" className="flex flex-col gap-2">
      <h2 id="a-reviser" className="text-lg font-bold">
        Notions à renforcer
      </h2>
      {items.length === 0 ? (
        <p>Rien d’urgent à renforcer pour l’instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.skillId} className="bg-surface rounded-2xl p-3 shadow-sm">
              <p className="font-bold">
                {i.title} <span className="text-muted text-sm font-normal">· {i.subject}</span>
              </p>
              <p className="text-sm">{i.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useState } from 'react';
import type { Feeling } from '@epicademie/shared';
import { rateSession } from './api.ts';

const SMILEYS: readonly { readonly value: Feeling; readonly face: string; readonly label: string }[] = [
  { value: 1, face: '😕', label: 'Pas encore' },
  { value: 2, face: '🙂', label: 'Un peu' },
  { value: 3, face: '😄', label: 'Oui' },
];

/** « Je me sens capable ? » en fin de séance : 3 smileys, facultatif, rien d'autre n'est demandé. */
export function FeelingQuestion({
  sessionId,
  adult,
}: {
  readonly sessionId: string;
  /** Profil adulte : pas de mention des parents. */
  readonly adult: boolean;
}) {
  const [chosen, setChosen] = useState<Feeling | null>(null);
  const [failed, setFailed] = useState(false);
  const choose = (value: Feeling) => {
    setChosen(value);
    setFailed(false);
    rateSession(sessionId, value).catch(() => {
      setChosen(null);
      setFailed(true);
    });
  };
  return (
    <fieldset className="cartoon bg-surface flex w-full flex-col items-center gap-2 p-3">
      <legend className="sr-only">Je me sens capable ?</legend>
      <p aria-hidden className="font-display text-xl tracking-wide">
        Je me sens capable ?
      </p>
      {!adult && <p className="text-muted text-sm">Tes parents verront tes réponses.</p>}
      <div className="flex justify-center gap-3">
        {SMILEYS.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={chosen === s.value}
            onClick={() => choose(s.value)}
            className={`cartoon cartoon-press flex min-h-16 min-w-20 flex-col items-center justify-center px-3 py-1 ${chosen === s.value ? 'bg-accent text-white' : 'bg-surface-2'}`}
          >
            <span aria-hidden className="text-3xl">
              {s.face}
            </span>
            <span className="text-sm font-bold">{s.label}</span>
          </button>
        ))}
      </div>
      <p role="status" className="min-h-6 font-bold">
        {chosen !== null && 'Merci, c’est noté !'}
        {failed && 'Pas enregistré (problème de connexion) : touche à nouveau.'}
      </p>
    </fieldset>
  );
}

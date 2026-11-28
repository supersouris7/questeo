import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../shared/api/client.ts';
import { keyIsForGame } from '../../shared/lib/keys.ts';
import { confirmParent, unlockParentPin, useMe, useSetMe } from './api.ts';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

/**
 * Déverrouillage de l'Espace parent : le code PIN (4 chiffres, au clavier ou à l'écran) s'il a
 * été choisi, sinon (ou s'il est oublié) le mot de passe du compte, quand le compte en a un.
 */
export function ParentUnlock({ onUnlocked }: { readonly onUnlocked: () => void }) {
  const { data: me } = useMe();
  const [usePassword, setUsePassword] = useState(false);
  if (me?.hasPin && !usePassword) {
    return <PinForm onUnlocked={onUnlocked} onForgot={me.noPassword ? undefined : () => setUsePassword(true)} />;
  }
  return <PasswordForm onUnlocked={onUnlocked} hasPin={me?.hasPin ?? false} />;
}

interface PinFormProps {
  readonly onUnlocked: () => void;
  /** Absent : compte sans mot de passe (portail). */
  readonly onForgot: (() => void) | undefined;
}

function PinForm({ onUnlocked, onForgot }: PinFormProps) {
  const setMe = useSetMe();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (code: string) => {
      setBusy(true);
      try {
        setMe(await unlockParentPin(code));
        onUnlocked();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Vérification impossible pour le moment.');
        setPin('');
        setBusy(false);
      }
    },
    [setMe, onUnlocked],
  );
  const press = useCallback(
    (k: string) => {
      if (busy) return;
      setError(null);
      if (k === '⌫') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      const next = `${pin}${k}`.slice(0, 4);
      setPin(next);
      if (next.length === 4) void submit(next);
    },
    [busy, pin, submit],
  );
  // Clavier physique : chiffres et Retour arrière.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!keyIsForGame(e) && !(e.target instanceof HTMLButtonElement)) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [press]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-bold">Code PIN parent</p>
      <div className="flex gap-3" role="status" aria-label={`${pin.length} chiffres saisis sur 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-[var(--outline)] ${i < pin.length ? 'bg-[var(--outline)]' : ''}`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-danger text-center font-bold">
          {error}
        </p>
      )}
      <div className="grid w-full max-w-64 grid-cols-3 gap-2">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => press(k)}
              aria-label={k === '⌫' ? 'Effacer' : k}
              className="bg-surface-2 hover:bg-surface h-14 rounded-xl text-2xl font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {k}
            </button>
          ),
        )}
      </div>
      {onForgot ? (
        <button type="button" onClick={onForgot} className="text-muted text-sm font-bold underline">
          Code oublié ? Utiliser le mot de passe du compte
        </button>
      ) : (
        <p className="text-muted text-center text-sm">Code oublié ? Demandez à l’administrateur de le réinitialiser.</p>
      )}
    </div>
  );
}

function PasswordForm({ onUnlocked, hasPin }: { readonly onUnlocked: () => void; readonly hasPin: boolean }) {
  const setMe = useSetMe();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        confirmParent(password)
          .then((me) => {
            setMe(me);
            onUnlocked();
          })
          .catch((err: unknown) => {
            setError(err instanceof ApiError ? err.message : 'Vérification impossible pour le moment.');
            setBusy(false);
          });
      }}
    >
      <label className="flex flex-col gap-1 font-bold">
        Mot de passe du compte familial
        <input
          type="password"
          autoComplete="current-password"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- seul champ de la fenêtre
          autoFocus
          className="bg-surface-2 rounded-xl border-2 border-[var(--outline)]/30 px-3 py-3 font-normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-danger font-bold">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || password === ''}
        className="bg-accent rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50"
      >
        Ouvrir l’Espace parent
      </button>
      {!hasPin && (
        <p className="text-muted text-sm">
          Astuce : choisis un code PIN à 4 chiffres dans Paramètres pour ouvrir l’Espace parent plus vite.
        </p>
      )}
    </form>
  );
}

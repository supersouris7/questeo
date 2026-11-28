/** Première connexion par le portail : choix du code parent, sans mot de passe. */
import { useState } from 'react';
import { ApiError } from '../../shared/api/client.ts';
import { GameButton } from '../../shared/ui/game/GameButton.tsx';
import { PageShell } from '../../shared/ui/PageShell.tsx';
import { chooseParentPin, useSetMe } from './api.ts';
import { PORTAL_LOGIN_URL } from './portalLogin.ts';

function PinField(props: { readonly label: string; readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 font-bold">
      {props.label}
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        className="bg-surface-2 rounded-xl border-2 border-[var(--outline)]/30 px-3 py-3 font-normal tracking-[0.5em]"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      />
    </label>
  );
}

/** `unlocked` : la session vient d'être ouverte par le portail ; sinon il faut y repasser. */
export function ChooseParentPin({ unlocked }: { readonly unlocked: boolean }) {
  const setMe = useSetMe();
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (pin !== again) {
      setError('Les deux codes sont différents.');
      return;
    }
    setBusy(true);
    try {
      setMe(await chooseParentPin(pin));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FORBIDDEN') setExpired(true);
      else setError(err instanceof ApiError ? err.message : 'Enregistrement impossible pour le moment.');
      setBusy(false);
    }
  };

  return (
    <PageShell title="Code parent">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="text-lg">
          Parent, choisissez votre code à 4 chiffres. Il ouvre l’Espace parent et sera demandé pour se déconnecter :
          gardez-le pour vous.
        </p>
        {!unlocked || expired ? (
          <>
            <p role="status">Pour choisir le code, reconnectez-vous d’abord.</p>
            <a href={PORTAL_LOGIN_URL} className="text-accent min-h-11 self-center font-bold underline">
              Me reconnecter
            </a>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <PinField label="Code parent (4 chiffres)" value={pin} onChange={setPin} />
            <PinField label="Répétez le code" value={again} onChange={setAgain} />
            {error && (
              <p role="alert" className="text-danger font-bold">
                {error}
              </p>
            )}
            <GameButton type="submit" size="lg" disabled={busy || pin.length !== 4 || again.length !== 4}>
              Enregistrer le code
            </GameButton>
          </form>
        )}
      </div>
    </PageShell>
  );
}

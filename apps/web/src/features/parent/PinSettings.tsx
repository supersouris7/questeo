import { useState } from 'react';
import { ParentPinSchema } from '@epicademie/shared';
import { ApiError } from '../../shared/api/client.ts';
import { GameButton } from '../../shared/ui/game/GameButton.tsx';
import { setParentPin, useMe, useSetMe } from '../account/index.ts';

/**
 * Code PIN de l'Espace parent : choisi ou changé avec le mot de passe du compte (un enfant ne
 * peut pas le changer seul). Oublié : on en choisit un autre de la même façon.
 */
export function PinSettings() {
  const { data: me } = useMe();
  const setMe = useSetMe();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    const parsed = ParentPinSchema.safeParse(pin);
    if (!parsed.success) {
      setMessage({ ok: false, text: 'Le code PIN a 4 chiffres.' });
      return;
    }
    try {
      setMe(await setParentPin(password, parsed.data));
      setMessage({ ok: true, text: 'Code PIN enregistré.' });
      setOpen(false);
      setPassword('');
      setPin('');
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : 'Enregistrement impossible.' });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">
        Code PIN parent : {me?.hasPin ? 'choisi' : 'pas encore choisi (le mot de passe du compte est demandé)'}
      </p>
      {me?.noPassword ? (
        <p className="text-muted">Pour changer de code, demandez à l’administrateur de le réinitialiser.</p>
      ) : !open ? (
        <GameButton variant="surface" icon="icons-navigation-settings" onClick={() => setOpen(true)}>
          {me?.hasPin ? 'Changer le code PIN' : 'Choisir un code PIN'}
        </GameButton>
      ) : (
        <form
          className="cartoon bg-surface flex flex-col gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="flex flex-col gap-1 font-bold">
            Mot de passe du compte
            <input
              type="password"
              autoComplete="current-password"
              className="bg-surface-2 rounded-xl px-3 py-2 font-normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Nouveau code PIN (4 chiffres)
            <input
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              className="bg-surface-2 rounded-xl px-3 py-2 font-normal tracking-[0.5em]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </label>
          <div className="flex gap-2">
            <GameButton type="submit" size="sm" disabled={password === '' || pin.length !== 4}>
              Enregistrer
            </GameButton>
            <GameButton size="sm" variant="surface" onClick={() => setOpen(false)}>
              Annuler
            </GameButton>
          </div>
        </form>
      )}
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={`font-bold ${message.ok ? 'text-success' : 'text-danger'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

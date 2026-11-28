import { CODE_ATTEMPT_LIMIT, CODE_ATTEMPT_WINDOW_MS } from '@epicademie/shared';
import type { Clock } from '../../core/clock.ts';

/**
 * Limiteur des codes faux, en mémoire : `CODE_ATTEMPT_LIMIT` échecs par clé (adresse) dans la
 * fenêtre, puis refus pendant une fenêtre. Une clé est effacée dès que plus aucun de ses échecs
 * ne compte : aucune adresse n'est gardée au-delà.
 */
interface Entry {
  failures: number[];
  timer: NodeJS.Timeout;
}

/** Borne de mémoire : au-delà, la clé la plus ancienne est oubliée. */
const MAX_KEYS = 10_000;

export function createAttemptLimiter(clock: Pick<Clock, 'now'>) {
  const entries = new Map<string, Entry>();
  const now = () => clock.now().getTime();

  const forget = (key: string) => {
    clearTimeout(entries.get(key)?.timer);
    entries.delete(key);
  };

  /** Échecs encore comptés : ceux de la fenêtre, ou tous tant que le blocage dure. */
  const counted = (failures: readonly number[]) => {
    const last = failures.at(-1) ?? 0;
    // Blocage : une fenêtre entière à partir de l'échec qui a atteint la limite.
    if (failures.length >= CODE_ATTEMPT_LIMIT) return now() - last < CODE_ATTEMPT_WINDOW_MS ? [...failures] : [];
    return failures.filter((at) => now() - at < CODE_ATTEMPT_WINDOW_MS);
  };

  return {
    blocked: (key: string) => counted(entries.get(key)?.failures ?? []).length >= CODE_ATTEMPT_LIMIT,
    fail(key: string): void {
      const failures = [...counted(entries.get(key)?.failures ?? []), now()];
      forget(key);
      const [oldest] = entries.keys();
      if (oldest !== undefined && entries.size >= MAX_KEYS) forget(oldest);
      entries.set(key, { failures, timer: setTimeout(() => forget(key), CODE_ATTEMPT_WINDOW_MS) });
    },
    /** Nombre d'adresses suivies. */
    size: () => entries.size,
    dispose(): void {
      for (const key of [...entries.keys()]) forget(key);
    },
  };
}

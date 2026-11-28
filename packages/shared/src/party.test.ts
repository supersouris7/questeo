import { describe, expect, it } from 'vitest';
import {
  GUEST_PSEUDOS,
  QuizSetupSchema,
  RealtimeAuthSchema,
  ROOM_CODE_ALPHABET,
  ROOM_MAX_SEATS,
  RoomCodeSchema,
} from './index.ts';

describe('salles et Quiz TV : contrat', () => {
  it('code : 4 lettres parmi 19 consonnes, saisie tolérante à la casse', () => {
    expect(new Set(ROOM_CODE_ALPHABET).size).toBe(19);
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[AEIOUYL]/);
    expect(RoomCodeSchema.parse(' bcdf ')).toBe('BCDF');
    for (const bad of ['BCD', 'BCDFG', 'ABCD', 'BCD1']) expect(RoomCodeSchema.safeParse(bad).success).toBe(false);
  });

  it('pseudos : fixes, distincts, assez nombreux pour une salle pleine', () => {
    expect(new Set(GUEST_PSEUDOS).size).toBe(GUEST_PSEUDOS.length);
    expect(GUEST_PSEUDOS.length).toBeGreaterThan(ROOM_MAX_SEATS);
  });

  it('manette : aucun texte libre ne passe', () => {
    expect(QuizSetupSchema.parse({ name: 'Prénom', rerollPseudo: true })).toEqual({ rerollPseudo: true });
    expect(QuizSetupSchema.safeParse({ avatar: 'moi.png' }).success).toBe(false);
  });

  it('connexion : variante invité', () => {
    expect(RealtimeAuthSchema.parse({ guest: { code: 'BCDF' } })).toEqual({ guest: { code: 'BCDF' } });
    expect(RealtimeAuthSchema.safeParse({ guest: {} }).success).toBe(false);
    expect(RealtimeAuthSchema.safeParse({ guest: { code: 'x'.repeat(17) } }).success).toBe(false);
  });
});

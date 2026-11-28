import type { Socket } from 'socket.io';
import type { ClientToServerEvents, OnlinePlayer, Profile, ServerToClientEvents } from '@epicademie/shared';

/** Données attachées à une connexion authentifiée. */
export interface SocketData {
  profile: Profile;
  /** Famille du compte connecté : le temps réel relie les joueurs de la même famille… */
  familyId: string;
  /** …et les amis actifs d'autres familles (validés par les parents). */
  friendIds?: readonly string[];
  /** Écran TV de la famille (pas de profil : `profile` n'est pas renseigné). */
  tv?: boolean;
  /** Invité sans compte : sa place dans une salle, et rien d'autre (ni profil ni famille). */
  guest?: { readonly code: string; readonly seatId: string };
}

/**
 * Présence : qui est connecté, sur quel appareil. Un profil n'est ouvert que sur un seul
 * appareil à la fois. Chaque joueur ne voit que les joueurs de sa famille et ses amis actifs
 * (amitié acceptée et validée par un parent de chaque famille) : jamais d'autres enfants. En mémoire de l'instance (voir docs/adr/0006-temps-reel.md pour le
 * passage à plusieurs instances).
 */
export type PlayerSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function createPresence() {
  const online = new Map<
    string,
    { readonly socket: PlayerSocket; readonly profile: Profile; readonly familyId: string }
  >();
  /** Amis actifs des joueurs connectés (tenus à jour par le module « amis »). */
  const friends = new Map<string, ReadonlySet<string>>();
  const listeners = new Set<() => void>();
  const inFamily = (familyId: string) => [...online.values()].filter((e) => e.familyId === familyId);
  const sameFamily = (a: string, b: string) => {
    const fa = online.get(a)?.familyId;
    return fa !== undefined && fa === online.get(b)?.familyId;
  };
  const isFriend = (a: string, b: string) => friends.get(a)?.has(b) === true;

  return {
    isOnline: (profileId: string) => online.get(profileId)?.socket.connected === true,
    /** Connexion actuelle du joueur (pour la remplacer par un autre appareil). */
    socketOf: (profileId: string) => online.get(profileId)?.socket,
    /** Joueurs connectés d'une famille. */
    onlineIds: (familyId: string) => inFamily(familyId).map((e) => e.profile.id),
    /** Tous les joueurs connectés. */
    allIds: () => [...online.keys()],
    count: () => online.size,
    profile: (profileId: string) => online.get(profileId)?.profile,
    familyOf: (profileId: string) => online.get(profileId)?.familyId,
    /** Les deux joueurs connectés peuvent se voir : même famille, ou amis actifs. */
    linked: (a: string, b: string) => online.has(a) && online.has(b) && (sameFamily(a, b) || isFriend(a, b)),

    join(socket: PlayerSocket, profile: Profile, familyId: string, friendIds: readonly string[] = []): void {
      online.set(profile.id, { socket, profile, familyId });
      friends.set(profile.id, new Set(friendIds));
    },

    /** Retire le joueur si c'est bien cette connexion (une reconnexion a pu la remplacer). */
    leave(socket: PlayerSocket, profileId: string): void {
      if (online.get(profileId)?.socket === socket) {
        online.delete(profileId);
        friends.delete(profileId);
      }
    },

    /** Amis actifs d'un joueur connecté (après une validation ou un retrait). */
    setFriends(profileId: string, friendIds: readonly string[]): void {
      if (online.has(profileId)) friends.set(profileId, new Set(friendIds));
    },
    /** Prévient la passerelle qu'il faut renvoyer la liste des connectés. */
    changed(): void {
      for (const l of listeners) l();
    },
    onChanged(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    emit<E extends keyof ServerToClientEvents>(
      profileId: string,
      event: E,
      ...args: Parameters<ServerToClientEvents[E]>
    ): void {
      online.get(profileId)?.socket.emit(event, ...args);
    },

    /** Joueurs connectés tels que les voit ce joueur : sa famille (lui compris) et ses amis actifs. */
    visibleTo(viewerId: string, isBusy: (profileId: string) => boolean): OnlinePlayer[] {
      const out: OnlinePlayer[] = [];
      for (const { profile: p } of online.values()) {
        const friend = isFriend(viewerId, p.id);
        if (p.id !== viewerId && !sameFamily(viewerId, p.id) && !friend) continue;
        out.push({
          id: p.id,
          name: p.name,
          hero: p.hero,
          avatar: p.avatar,
          busy: isBusy(p.id),
          ...(friend ? { friend } : {}),
        });
      }
      return out;
    },
  };
}

export type Presence = ReturnType<typeof createPresence>;

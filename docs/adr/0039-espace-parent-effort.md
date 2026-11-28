# ADR 0039 — Espace parent : la semaine d'abord

- Statut : Acceptée
- Date : 2026-11-27
- Ticket : #126

## Contexte

Le parent doit voir d'abord l'effort de son enfant, savoir comment l'encourager et lire ses réponses « Je me
sens capable ? » (ADR 0038), sans comparaison entre enfants.

## Décision

- `GET /profiles/:id/parent-week` : accès `parent` (verrou ouvert) et profil de la famille, sinon 403 ou 404.
  Un enfant par réponse ; aucune agrégation entre profils.
- Le ressenti est agrégé côté serveur (nombres par réponse) : 7 derniers jours et 4 semaines d'avant. Tendance
  seulement avec au moins 3 réponses de chaque côté et un écart de note moyenne d'au moins 0,3.
- Un seul conseil, choisi par des règles fixes (`@epicademie/engine/parent-week`), dans cet ordre : aucune
  séance, ressenti à rassurer, reprise après pause, progrès, notion retravaillée, régularité, effort. Le progrès
  passe avant la notion retravaillée : une réussite en hausse suppose une réponse fausse suivie de réponses cette
  semaine, donc l'ordre inverse ne le choisirait jamais. Les textes sont côté web, accordés au profil (tournure
  neutre sans genre).
- Transparence : sous « Je me sens capable ? », un profil non adulte lit « Tes parents verront tes réponses. »
  (aussi sur un compte autonome : un parent rattaché ensuite verra l'historique).
- Aucune donnée nouvelle n'est enregistrée.

## Conséquences

La « semaine » est glissante (7 derniers jours), comme dans le progrès personnel : le conseil peut changer en
cours de semaine.

## Options écartées

Conseil généré par un modèle de langage : non déterministe et envoi de données d'enfants à l'extérieur.

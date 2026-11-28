-- Connexion par le portail (recette) : date du premier rattachement. Colonne nullable : compatible avec
-- le code précédent. Retour arrière :
--   ALTER TABLE "accounts" DROP COLUMN "portal_linked_at";
ALTER TABLE "accounts" ADD COLUMN "portal_linked_at" timestamp with time zone;

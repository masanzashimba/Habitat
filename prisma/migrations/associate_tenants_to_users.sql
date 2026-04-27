-- Migration: Associer les tenants aux utilisateurs par email
-- Date: 2026-04-25
-- Description: Cette migration associe automatiquement tous les tenants
--              aux utilisateurs correspondants en utilisant l'email comme clé.

-- ============================================================================
-- ÉTAPE 1: Associer les tenants aux utilisateurs
-- ============================================================================

-- Associer tous les tenants qui ont un email correspondant à un utilisateur
UPDATE "Tenant" t
SET "userId" = u.id
FROM "User" u
WHERE t.email = u.email
  AND t."userId" IS NULL
  AND u.role = 'tenant';

-- ============================================================================
-- ÉTAPE 2: Vérification des résultats
-- ============================================================================

-- Afficher les tenants associés
SELECT
  t.id as tenant_id,
  t.email as tenant_email,
  t."firstName" as tenant_firstname,
  t."lastName" as tenant_lastname,
  t."userId" as tenant_user_id,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  CASE
    WHEN t."userId" IS NOT NULL THEN '✅ Associé'
    ELSE '❌ Non associé'
  END as status
FROM "Tenant" t
LEFT JOIN "User" u ON t."userId" = u.id
ORDER BY t."createdAt" DESC;

-- ============================================================================
-- ÉTAPE 3: Statistiques
-- ============================================================================

-- Compter les tenants associés et non associés
SELECT
  COUNT(*) FILTER (WHERE "userId" IS NOT NULL) as tenants_associes,
  COUNT(*) FILTER (WHERE "userId" IS NULL) as tenants_non_associes,
  COUNT(*) as total_tenants
FROM "Tenant";

-- ============================================================================
-- ÉTAPE 4: Vérifier les contrats accessibles
-- ============================================================================

-- Afficher tous les contrats avec leurs associations
SELECT
  c.id as contract_id,
  c."leaseId",
  l."tenantId",
  t."userId" as tenant_user_id,
  t.email as tenant_email,
  u.email as user_email,
  p.title as property_title,
  CASE
    WHEN t."userId" IS NOT NULL THEN '✅ Tenant peut voir le contrat'
    ELSE '❌ Tenant ne peut PAS voir le contrat'
  END as access_status
FROM "Contract" c
JOIN "Lease" l ON c."leaseId" = l.id
JOIN "Tenant" t ON l."tenantId" = t.id
LEFT JOIN "User" u ON t."userId" = u.id
JOIN "Property" p ON l."propertyId" = p.id
ORDER BY c."createdAt" DESC;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Cette migration:
-- 1. Associe automatiquement les tenants aux utilisateurs par email
-- 2. Ne modifie que les tenants qui n'ont pas encore de userId
-- 3. Vérifie que l'utilisateur a le role 'tenant'
-- 4. Affiche les résultats pour vérification
-- 5. Affiche les statistiques
-- 6. Affiche l'état d'accès aux contrats

-- Après cette migration:
-- - Les tenants pourront voir leurs contrats dans /dashboard/contrats
-- - Le filtre lease.tenant.userId fonctionnera correctement
-- - Les nouveaux contrats seront automatiquement associés (code déjà en place)

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================

-- Pour annuler cette migration (déconseillé):
-- UPDATE "Tenant" SET "userId" = NULL WHERE "userId" IS NOT NULL;

-- ============================================================================

# PromptVault

Bibliothèque de prompts local-first avec application web responsive, schéma Supabase sécurisé et extension Chrome Manifest V3.

## Démarrage

1. Installer les dépendances avec `npm install`.
2. Copier `.env.example` vers `.env.local` et renseigner le projet Supabase.
3. Exécuter la migration `supabase/migrations/202608160001_promptvault.sql` dans Supabase.
4. Activer Google dans **Supabase → Authentication → Providers** puis ajouter l’URL de callback fournie par Supabase dans Google Cloud Console.
5. Démarrer avec `npm run dev`, puis ouvrir `http://localhost:3000`.

Sans configuration Supabase, l’application fonctionne en mode local et conserve les prompts dans le navigateur. Les règles RLS de la migration garantissent qu’un utilisateur connecté ne peut lire et écrire que ses données.

## Extension Chrome

1. Ouvrir `chrome://extensions`.
2. Activer le mode développeur.
3. Choisir **Charger l’extension non empaquetée** et sélectionner le dossier `extension`.

Permissions : `storage` conserve un cache hors ligne, `identity` prépare le flux Google/Supabase et `contextMenus` enregistre un texte sélectionné. L’accès réseau est limité au domaine Supabase.

## Vérifications

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

## Synchronisation

La base est conçue pour Supabase Realtime. `client_updated_at` sert à résoudre les conflits par « dernière modification gagnante ». Le cache de l’extension permet la consultation hors ligne et doit être remplacé par les données Realtime dès que les variables Supabase sont configurées.

## Sécurité

La clé `anon` est publique par conception et protégée par RLS. Ne jamais placer la clé `service_role` dans l’application ou l’extension. Configurez les URL OAuth autorisées précisément et publiez une politique de confidentialité avant diffusion sur le Chrome Web Store.

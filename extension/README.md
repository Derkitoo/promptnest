# Extension Chrome PromptNest

## Installation locale

1. Exécuter `npm run build:extension` à la racine du projet.
2. Ouvrir `chrome://extensions`, activer **Mode développeur**, puis **Charger l’extension non empaquetée**.
3. Choisir le dossier `extension/dist`.

## Configuration Google / Supabase

Ajouter cette URL exacte dans **Supabase → Authentication → URL Configuration → Redirect URLs** :

`https://beflijeobbbggeimbknjohpckbkdaphb.chromiumapp.org/supabase`

Exécuter aussi la migration `supabase/migrations/202608160002_extension_capture.sql` dans l’éditeur SQL Supabase. La clé publique présente dans l’extension est conçue pour être exposée ; aucune clé `service_role` n’est utilisée.

## Utilisation

- Cliquer sur l’icône PromptNest ou utiliser `Ctrl+Maj+P`.
- Se connecter avec le même compte Google que sur l’application web.
- Écrire un prompt ou sélectionner du texte sur une page avant d’ouvrir l’extension.
- Le clic droit **Enregistrer dans PromptNest** prépare aussi la sélection.

## Publication Chrome Web Store

Importer `promptnest-extension-v1.0.0.zip` dans le tableau de bord Chrome Web Store, fournir les textes de `STORE_LISTING.md`, les captures demandées et une URL publique vers la politique de confidentialité.

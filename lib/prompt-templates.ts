export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  description: string;
}

export const TEMPLATE_LIBRARY: PromptTemplate[] = [
  {
    id: "tpl-code-review",
    title: "Revue de code Senior & Audit de sécurité",
    content: "Tu es un Tech Lead / Architecte logiciel expérimenté.\n\nFais une revue de code approfondie du snippet suivant en {{langage}} :\n\n```{{langage}}\n{{code}}\n```\n\nStructure ton analyse :\n1. 🚨 Risques de sécurité & Failles (OWASP, injection, etc.)\n2. ⚡ Performance & Scalabilité\n3. 🧼 Lisibilité & Clean Code (DRY, SOLID)\n4. 💡 Propose une version optimisée et refactorisée.",
    category: "Développement",
    tags: ["code-review", "clean-code", "sécurité"],
    description: "Analyse complète d'un bout de code avec recommandations d'architecture et refactoring."
  },
  {
    id: "tpl-debug",
    title: "Débogage méthodique & Cause racine",
    content: "Aide-moi à diagnostiquer et résoudre l'erreur suivante en {{techno}} :\n\nMessage d'erreur / Stacktrace :\n{{erreur}}\n\nContexte / Code concerné :\n{{contexte}}\n\nÉtapes attendues :\n1. Explique pourquoi cette erreur survient.\n2. Identifie la cause racine la plus probable.\n3. Propose le correctif exact avec le code corrigé.",
    category: "Développement",
    tags: ["debug", "stacktrace", "fix"],
    description: "Méthode pas-à-pas pour isoler l'origine d'un bug et obtenir la solution exacte."
  },
  {
    id: "tpl-spec-prod",
    title: "Spécification Technique & Cahier des charges",
    content: "Transforme l'idée de fonctionnalité suivante en spécification technique complète :\n\nFonctionnalité : {{fonctionnalite}}\nPublic cible : {{utilisateur}}\nTech Stack : {{stack}}\n\nRédige la spécification en incluant :\n- Objectif business & User Stories avec critère d'acceptation (Gherkin)\n- Schéma de base de données / Modèle de données\n- Endpoints API (Request / Response JSON)\n- Cas d'erreur et edge cases à anticiper.",
    category: "Produit",
    tags: ["spécification", "produit", "api"],
    description: "Génère un cahier des charges technique prêt à être confié aux développeurs."
  },
  {
    id: "tpl-copywriting-landing",
    title: "Copywriting de Landing Page Hero Section",
    content: "Tu es un copywriter expert en conversion SaaS.\n\nProduit : {{produit}}\nCible : {{cible}}\nProblème principal : {{probleme}}\n\nPropose 3 variations de la section Hero :\n1. Titre percutant (Headline H1 - max 10 mots)\n2. Sous-titre explicatif (Subheadline - max 20 mots)\n3. Call-to-action principal (CTA - max 4 mots)\n4. 3 arguments clés sous forme de puces (Value propositions)",
    category: "Copywriting",
    tags: ["landing-page", "conversion", "marketing"],
    description: "Formulation de titres et sous-titres hautement convertissants pour page d'accueil."
  },
  {
    id: "tpl-unit-tests",
    title: "Générateur de Tests Unitaires & Intégration",
    content: "Écris une suite de tests unitaires complète en {{framework_test}} pour la fonction / composant suivant :\n\n```{{langage}}\n{{code}}\n```\n\nExigences :\n- Couvrir le happy path (cas nominal).\n- Couvrir les edge cases (valeurs nulles, limites, erreurs réseau/async).\n- Utiliser des mocks adaptés si nécessaire.",
    category: "Développement",
    tags: ["tests", "unit-test", "qa"],
    description: "Génération de tests unitaires complets couvrant les cas nominaux et cas d'erreur."
  },
  {
    id: "tpl-email-cold",
    title: "Email de Prospection B2B personnalisé",
    content: "Rédige un email de prospection ultra-personnalisé et court (< 120 mots).\n\nProspect : {{nom_prospect}}, {{poste}} chez {{entreprise}}\nNotre valeur : {{valeur_ajoutee}}\nAccroche basée sur : {{actualite_prospect}}\n\nStructure :\n1. Accroche spécifique et contextuelle\n2. Le problème spécifique rencontré par leur secteur\n3. Notre solution en 1 phrase avec preuve sociale\n4. CTA simple (pas de vente agressive, juste un échange).",
    category: "Marketing",
    tags: ["email", "sales", "b2b"],
    description: "Template d'outreach percutant sans jargon commercial agressif."
  },
  {
    id: "tpl-sql-optimization",
    title: "Optimisation de Requête SQL & Indexation",
    content: "Tu es un administrateur de base de données PostgreSQL / MySQL senior.\n\nAnalyse la requête SQL suivante qui est trop lente :\n\n```sql\n{{requete_sql}}\n```\n\nSchéma / Index existants :\n{{schema}}\n\n1. Explique pourquoi cette requête sature (Seq Scan, N+1, Join inefficace).\n2. Propose la requête réécrite et optimisée.\n3. Indique les index exacts à ajouter (`CREATE INDEX ...`).",
    category: "Développement",
    tags: ["sql", "database", "optimization"],
    description: "Réécriture de requêtes SQL lentes et recommandations d'indexation."
  },
  {
    id: "tpl-doc-readme",
    title: "Générateur de README.md Professionnel",
    content: "Rédige le README.md complet pour le projet suivant :\n\nNom du projet : {{nom_projet}}\nDescription : {{description}}\nStack technique : {{stack}}\n\nSections requises :\n- Badges & Pitch de présentation\n- Fonctionnalités clés\n- Guide d'installation rapide (`npm install` / `docker`)\n- Exemples d'utilisation avec extrait de code\n- Configuration (`.env`)\n- Licence et contribution.",
    category: "Documentation",
    tags: ["readme", "git", "doc"],
    description: "Création d'une documentation README claire, attrayante et structurée pour GitHub."
  }
];

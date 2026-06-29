(function attachResources(root) {
  root.RATTRAPAGE_RESOURCES = {
    guides: [
      {
        id: "guide-maths",
        title: "Guide oral - EDS Mathématiques",
        path: "docs/guides/guide_rattrapage_maths.pdf",
        description: "Méthodes, automatismes et scripts pour expliquer au tableau en mathématiques.",
        priority: 1,
        discipline: "maths"
      },
      {
        id: "guide-nsi",
        title: "Guide oral - EDS NSI",
        path: "docs/guides/guide_rattrapage_nsi.pdf",
        description: "Patrons Python, SQL, structures, graphes, systèmes et sécurité pour l’oral.",
        priority: 1,
        discipline: "nsi"
      }
    ],
    mathsSubjects: [
      {
        id: "maths-16-sujets",
        title: "Sujets blancs Maths - 16 exercices corrigés",
        path: "docs/sujets/maths/sujets_blancs_maths_16_exercices.pdf",
        description: "Banque d’entraînement : choisir deux ou trois sujets ciblés, puis expliquer la méthode au tableau.",
        recommended: "Priorité : Sujet C ou E pour les fonctions ; Sujet H ou I pour les probabilités ; Sujet A ou D pour géométrie/suites ; Sujet L, O ou P seulement si les bases sont stabilisées.",
        priority: 1
      }
    ],
    filters: ["Tous", "Priorité 1", "SQL", "Structures", "Arbres", "Graphes", "POO", "Récursivité", "Routage"],
    nsiSubjects: [
      { id: "bdd-sujet1", title: "BDD - Sujet 1", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet1.pdf", priority: 1, order: "Après BDD 6 ou 7", oralGoal: "Repérer tables, attributs, clefs, puis écrire SELECT / FROM / JOIN / ON / WHERE." },
      { id: "bdd-sujet2", title: "BDD - Sujet 2", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet2.pdf", priority: 2, order: "Consolidation SQL", oralGoal: "Justifier le schéma relationnel et les contraintes d’intégrité." },
      { id: "bdd-sujet3", title: "BDD - Sujet 3", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet3.pdf", priority: 1, order: "Après BDD 6 ou 7", oralGoal: "Relier clef primaire, clef étrangère et jointure." },
      { id: "bdd-sujet4", title: "BDD - Sujet 4", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet4.pdf", priority: 2, order: "Consolidation", oralGoal: "Écrire une requête progressive et expliquer chaque clause." },
      { id: "bdd-sujet5", title: "BDD - Sujet 5", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet5.pdf", priority: 2, order: "Consolidation", oralGoal: "Distinguer relation, attribut, domaine et contrainte." },
      { id: "bdd-sujet6", title: "BDD - Sujet 6", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet6.pdf", priority: 1, order: "À faire en premier", oralGoal: "Construire une requête courte à partir des tables données." },
      { id: "bdd-sujet7", title: "BDD - Sujet 7", theme: "Bases de données", filter: "SQL", path: "docs/sujets/nsi/BDD_sujet7.pdf", priority: 1, order: "À faire en premier", oralGoal: "Repérer les clefs, puis formuler la jointure avec ON." },
      { id: "structures-lineaires-sujet1", title: "Structures linéaires - Sujet 1", theme: "Structures linéaires", filter: "Structures", path: "docs/sujets/nsi/Structures_lineaires_sujet1.pdf", priority: 1, order: "Pile puis file", oralGoal: "Expliquer LIFO, FIFO, interface et opérations usuelles." },
      { id: "structures-lineaires-sujet2", title: "Structures linéaires - Sujet 2", theme: "Structures linéaires", filter: "Structures", path: "docs/sujets/nsi/Structures_lineaires_sujet2.pdf", priority: 1, order: "Après le sujet 1", oralGoal: "Choisir pile ou file selon le parcours ou le traitement." },
      { id: "structures-lineaires-sujet3", title: "Structures linéaires - Sujet 3", theme: "Structures linéaires", filter: "Structures", path: "docs/sujets/nsi/Structures_lineaires_sujet3.pdf", priority: 2, order: "Consolidation", oralGoal: "Décrire les opérations sans confondre structure abstraite et représentation." },
      { id: "structures-lineaires-sujet4", title: "Structures linéaires - Sujet 4", theme: "Structures linéaires", filter: "Structures", path: "docs/sujets/nsi/Structures_lineaires_sujet4.pdf", priority: 2, order: "Consolidation", oralGoal: "Tracer les états successifs d’une structure." },
      { id: "arbres-sujet1", title: "Arbres - Sujet 1", theme: "Arbres", filter: "Arbres", path: "docs/sujets/nsi/Arbres_sujet1.pdf", priority: 1, order: "À faire en premier", oralGoal: "Définir racine, feuille, taille, hauteur et parcours." },
      { id: "arbres-sujet2", title: "Arbres - Sujet 2", theme: "Arbres", filter: "Arbres", path: "docs/sujets/nsi/Arbres_sujet2.pdf", priority: 1, order: "Après le sujet 1", oralGoal: "Comparer parcours préfixe, infixe, suffixe et largeur." },
      { id: "arbres-sujet3", title: "Arbres - Sujet 3", theme: "Arbres", filter: "Arbres", path: "docs/sujets/nsi/Arbres_sujet3.pdf", priority: 2, order: "Consolidation", oralGoal: "Expliquer recherche et insertion dans un arbre binaire de recherche." },
      { id: "arbres-sujet4", title: "Arbres - Sujet 4", theme: "Arbres", filter: "Arbres", path: "docs/sujets/nsi/Arbres_sujet4.pdf", priority: 2, order: "Consolidation", oralGoal: "Écrire une fonction récursive simple sur un arbre." },
      { id: "graphes-sujet1", title: "Graphes - Sujet 1", theme: "Graphes", filter: "Graphes", path: "docs/sujets/nsi/Graphes_sujet1.pdf", priority: 1, order: "À faire en premier", oralGoal: "Préciser orienté ou non orienté, sommets, arêtes ou arcs, représentation." },
      { id: "graphes-sujet2", title: "Graphes - Sujet 2", theme: "Graphes", filter: "Graphes", path: "docs/sujets/nsi/Graphes_sujet2.pdf", priority: 1, order: "Après le sujet 1", oralGoal: "Expliquer parcours en largeur et parcours en profondeur." },
      { id: "graphes-sujet3", title: "Graphes - Sujet 3", theme: "Graphes", filter: "Graphes", path: "docs/sujets/nsi/Graphes_sujet3.pdf", priority: 2, order: "Consolidation", oralGoal: "Identifier chemin, cycle, matrice d’adjacence ou listes de voisins." },
      { id: "poo-sujet1", title: "Programmation objet - Sujet 1", theme: "Programmation objet", filter: "POO", path: "docs/sujets/nsi/POO_sujet1.pdf", priority: 2, order: "Après Python court", oralGoal: "Distinguer classe, objet, attribut et méthode avec un exemple simple." },
      { id: "poo-sujet2", title: "Programmation objet - Sujet 2", theme: "Programmation objet", filter: "POO", path: "docs/sujets/nsi/POO_sujet2.pdf", priority: 2, order: "Consolidation", oralGoal: "Lire une classe Python courte et expliquer son rôle." },
      { id: "poo-sujet3", title: "Programmation objet - Sujet 3", theme: "Programmation objet", filter: "POO", path: "docs/sujets/nsi/POO_sujet3.pdf", priority: 2, order: "Consolidation", oralGoal: "Relier constructeur, attributs et méthodes sans théorie inutile." },
      { id: "programmation-sujet1", title: "Programmation / récursivité - Sujet 1", theme: "Programmation / récursivité", filter: "Récursivité", path: "docs/sujets/nsi/Programmation_sujet1.pdf", priority: 1, order: "À faire en premier", oralGoal: "Spécifier entrées, sorties, types, puis traiter liste ou dictionnaire." },
      { id: "programmation-sujet2", title: "Programmation / récursivité - Sujet 2", theme: "Programmation / récursivité", filter: "Récursivité", path: "docs/sujets/nsi/Programmation_sujet2.pdf", priority: 1, order: "Après le sujet 1", oralGoal: "Donner cas de base, appel récursif et problème plus petit." },
      { id: "routage-sujet1", title: "Protocoles de routage - Sujet 1", theme: "Protocoles de routage", filter: "Routage", path: "docs/sujets/nsi/Protocoles_de_routage_sujet1.pdf", priority: 1, order: "À faire en premier", oralGoal: "Lire une table de routage et expliquer RIP par nombre de sauts." },
      { id: "routage-sujet2", title: "Protocoles de routage - Sujet 2", theme: "Protocoles de routage", filter: "Routage", path: "docs/sujets/nsi/Protocoles_de_routage_sujet2.pdf", priority: 1, order: "Après le sujet 1", oralGoal: "Comparer RIP et OSPF : nombre de sauts contre coût de route." }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);

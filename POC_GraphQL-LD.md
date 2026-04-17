# POC — GraphQL-LD : Requêter des données Linked Data avec GraphQL

> Basé sur l'article *GraphQL-LD: Linked Data Querying with GraphQL* — Taelman, Vander Sande, Verborgh (IDLab, Ghent University – imec)

---

## Objectif du POC

Démontrer qu'une requête GraphQL couplée à un contexte JSON-LD peut être :
1. **traduite automatiquement en SPARQL** (algèbre SPARQL),
2. **exécutée contre un endpoint RDF** (ex. DBpedia),
3. **restituée sous forme d'arbre** compatible avec la réponse attendue par un client GraphQL.

---

## Prérequis

| Outil | Version recommandée | Rôle |
|---|---|---|
| Node.js | ≥ 18 LTS | Runtime JavaScript |
| npm / yarn | dernière stable | Gestionnaire de paquets |
| `graphql-to-sparql` | dernière (npm) | Traduction GraphQL → SPARQL |
| `sparqljson-to-tree` | dernière (npm) | SPARQL résultats → arbre |
| `@comunica/query-sparql` | dernière (npm) | Moteur SPARQL (Comunica) |
| `graphql` | ≥ 16 | Parser GraphQL |

---

## Architecture du POC

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Node.js)                    │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │ GraphQL Query│    │      JSON-LD Context          │  │
│  └──────┬───────┘    └───────────────┬───────────────┘  │
│         └──────────────┬────────────┘                   │
│                        ▼                                │
│          ┌─────────────────────────────┐                │
│          │   graphql-to-sparql module  │                │
│          │  (GraphQL → SPARQL algebra) │                │
│          └──────────────┬──────────────┘                │
│                         ▼                               │
│          ┌──────────────────────────────┐               │
│          │   Comunica SPARQL Engine     │               │
│          │  (exécution contre endpoint) │               │
│          └──────────────┬───────────────┘               │
│                         ▼                               │
│          ┌──────────────────────────────┐               │
│          │   sparqljson-to-tree module  │               │
│          │  (résultats → arbre GraphQL) │               │
│          └──────────────┬───────────────┘               │
│                         ▼                               │
│               Réponse JSON (arbre)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              Endpoint RDF (ex. DBpedia)
```

---

## Étapes de développement

### Étape 1 — Initialisation du projet

```bash
mkdir graphql-ld-poc && cd graphql-ld-poc
npm init -y
npm install graphql-to-sparql sparqljson-to-tree @comunica/query-sparql graphql
```

### Étape 2 — Définir la requête GraphQL-LD

Créer un fichier `query.js` avec la requête GraphQL et le contexte JSON-LD correspondant.

**Exemple** (tiré de l'article) : trouver tous les groupes pour lesquels Michael Jackson a écrit une chanson, via DBpedia.

```js
// query.js

export const graphqlQuery = `
{
  label
  writer(label_en: "Michael Jackson") {
    label
    artist {
      label
    }
  }
}
`;

export const jsonldContext = {
  "@context": {
    "label":    "http://www.w3.org/2000/01/rdf-schema#label",
    "label_en": {
      "@id":        "http://www.w3.org/2000/01/rdf-schema#label",
      "@language":  "en"
    },
    "writer": "http://dbpedia.org/ontology/writer",
    "artist": "http://dbpedia.org/ontology/musicalArtist"
  }
};
```

> **Note** : le contexte JSON-LD établit le pont sémantique entre les champs GraphQL (sans sémantique) et les URIs RDF. C'est la pièce centrale de l'approche GraphQL-LD.

---

### Étape 3 — Traduire la requête GraphQL en SPARQL

```js
// translate.js
import { Client } from 'graphql-to-sparql';
import { graphqlQuery, jsonldContext } from './query.js';

const client = new Client();

export async function translateToSparql() {
  const algebra = await client.graphqlToSparql(graphqlQuery, jsonldContext);
  console.log('SPARQL Algebra générée :\n', algebra.toString());
  return algebra;
}
```

> Ce module prend en charge la traduction des structures arborescentes de GraphQL en **patrons de triplets SPARQL**. Les fragments GraphQL sont traduits avec la sémantique `OPTIONAL` (LEFT JOIN), et la pagination (`first` / `offset`) devient `LIMIT` / `OFFSET`.

---

### Étape 4 — Exécuter la requête via Comunica

```js
// execute.js
import { QueryEngine } from '@comunica/query-sparql';
import { translateToSparql } from './translate.js';

const ENDPOINT = 'https://dbpedia.org/sparql';

export async function executeQuery() {
  const sparqlAlgebra = await translateToSparql();

  const engine = new QueryEngine();
  const bindingsStream = await engine.queryBindings(sparqlAlgebra, {
    sources: [{ type: 'sparql', value: ENDPOINT }]
  });

  const bindings = await bindingsStream.toArray();
  console.log(`${bindings.length} résultat(s) obtenus.`);
  return bindings;
}
```

---

### Étape 5 — Convertir les résultats en arbre GraphQL

```js
// shape.js
import { SparqlJsonParser } from 'sparqljson-to-tree';
import { executeQuery } from './execute.js';

export async function getFormattedResults() {
  const bindings = await executeQuery();

  // Définir quelles variables sont singulières (vs plurielles/tableaux)
  const singularVariables = { label: true };

  const parser = new SparqlJsonParser({ singularVariables });
  const tree = parser.bindingsToTree(bindings);

  console.log('Résultats mis en forme :\n', JSON.stringify(tree, null, 2));
  return tree;
}
```

> Par défaut, les variables non déclarées dans `singularVariables` sont traitées comme **plurielles** (tableaux). Ce comportement correspond à la sémantique naturelle de GraphQL.

---

### Étape 6 — Point d'entrée principal

```js
// index.js
import { getFormattedResults } from './shape.js';

(async () => {
  try {
    const results = await getFormattedResults();
    console.log('\n=== Résultat final ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Erreur :', err);
  }
})();
```

Lancer le POC :

```bash
node index.js
```

---

## Résultat attendu

La sortie JSON doit ressembler à :

```json
[
  {
    "artist": { "label": "Barry Gibb" },
    "label": "All in Your Name"
  },
  ...
]
```

C'est un arbre d'objets imbriqués, directement exploitable par un framework comme React ou Angular — sans que le développeur n'ait eu à écrire une seule ligne de SPARQL.

---

## Points de vérification

| Étape | Ce qu'il faut vérifier |
|---|---|
| Traduction GraphQL → SPARQL | La requête SPARQL générée contient bien les URIs du contexte JSON-LD |
| Fragments GraphQL | Vérifier que les fragments se traduisent en `OPTIONAL` dans SPARQL |
| Pagination | Tester `first: 5` dans la requête GraphQL → `LIMIT 5` dans SPARQL |
| Résultats pluriels | Un champ sans `singularVariables` doit retourner un tableau |
| Résultat final | La forme JSON correspond à la structure de la requête GraphQL |

---

## Extensions possibles

- **Interface web** : connecter le POC à un composant React pour afficher les résultats directement dans l'UI.
- **Sources multiples** : tirer parti des URIs globaux RDF pour joindre des données de plusieurs endpoints (ex. DBpedia + Wikidata).
- **Formalisation du contexte** : déléguer la fourniture du contexte JSON-LD à des experts du domaine, les développeurs n'ayant à gérer que la requête GraphQL.
- **Comparaison avec HyperGraphQL** : contrairement à HyperGraphQL qui nécessite un service intermédiaire, GraphQL-LD traduit les requêtes côté client — à benchmarker en termes de latence et de complexité de déploiement.

---

## Références

- `graphql-to-sparql` : https://github.com/rubensworks/graphql-to-sparql.js
- `sparqljson-to-tree` : https://github.com/rubensworks/sparqljson-to-tree.js
- Comunica : https://comunica.dev
- Exemple complet (gist officiel) : https://gist.github.com/rubensworks/9d6eccce996317677d71944ed1087ea6
- JSON-LD 1.0 (W3C) : https://www.w3.org/TR/json-ld/
- SPARQL 1.1 (W3C) : https://www.w3.org/TR/sparql11-query/

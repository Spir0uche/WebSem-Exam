// execute.js
// Exécute une requête SPARQL contre l'endpoint DBpedia

import { QueryEngine } from '@comunica/query-sparql';

const ENDPOINT = 'https://dbpedia.org/sparql';

const TEST_SPARQL_QUERY = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dbo:  <http://dbpedia.org/ontology/>
PREFIX dbr:  <http://dbpedia.org/resource/>

SELECT ?work ?workLabel
WHERE {
  ?work dbo:writer dbr:Michael_Jackson .
  ?work rdfs:label ?workLabel .
  FILTER(lang(?workLabel) = "en")
}
LIMIT 50
`;

export async function executeQuery() {
  try {
    console.log('✓ Requête SPARQL de test chargée');
    console.log(TEST_SPARQL_QUERY.trim());
    console.log(`✓ Exécution contre ${ENDPOINT}`);
    
    const engine = new QueryEngine();
    const bindingsStream = await engine.queryBindings(TEST_SPARQL_QUERY, {
      sources: [{ type: 'sparql', value: ENDPOINT }],
    });

    const bindings = await bindingsStream.toArray();
    console.log(`✓ ${bindings.length} résultat(s) obtenus`);
    return bindings;
  } catch (err) {
    console.error('Erreur lors de l\'exécution SPARQL :', err.message);
    throw err;
  }
}


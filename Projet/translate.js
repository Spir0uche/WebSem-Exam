// translate.js
// Traduit la requête GraphQL en algèbre SPARQL avec expansion du contexte JSON-LD

import { Converter } from 'graphql-to-sparql';
import { graphqlQuery, jsonldContext } from './query.js';
import { parse } from 'graphql';

export async function translateToSparql() {
  try {
    logQueryShapeChange('GraphQL texte', snapshotGraphqlText(graphqlQuery));

    // Parser la requête GraphQL
    const parsedQuery = parse(graphqlQuery);
    logQueryShapeChange('AST GraphQL', snapshotGraphqlAst(parsedQuery));
    
    // Créer un convertisseur avec le contexte JSON-LD
    const converter = new Converter(jsonldContext);
    
    // Convertir en algèbre SPARQL
    const algebra = await converter.graphqlToSparqlAlgebra(parsedQuery);
    logQueryShapeChange('Algèbre SPARQL (initiale)', snapshotSparqlAlgebra(algebra));
    
    // Expansionner le contexte JSON-LD dans l'algèbre
    expandContextInAlgebra(algebra, jsonldContext);
    logQueryShapeChange('Algèbre SPARQL (contexte appliqué)', snapshotSparqlAlgebra(algebra));
    
    console.log('✓ Requête GraphQL convertie en algèbre SPARQL');
    console.log(`✓ ${algebra.input.patterns.length} triplets identifiés dans le patron`);
    return algebra;
  } catch (err) {
    console.error('Erreur lors de la traduction GraphQL → SPARQL :', err.message);
    throw err;
  }
}

function expandContextInAlgebra(algebra, context) {
  // Récursion à travers l'algèbre pour expansionner les shorthands GraphQL en URIs RDF
  if (!algebra) return;
  
  if (algebra.input && algebra.input.patterns) {
    algebra.input.patterns.forEach(pattern => {
      if (pattern.predicate && pattern.predicate.value) {
        const expanded = expandTerm(pattern.predicate.value, context);
        if (expanded) {
          pattern.predicate.value = expanded;
        }
      }
    });
  }
}

function expandTerm(term, context) {
  // Expander un shorthand GraphQL vers son URI RDF
  if (context[term]) {
    const contextValue = context[term];
    
    // Si c'est une chaîne directe, c'est l'URI
    if (typeof contextValue === 'string') {
      return contextValue;
    }
    
    // Si c'est un objet, prendre l'@id
    if (contextValue && typeof contextValue === 'object' && contextValue['@id']) {
      return contextValue['@id'];
    }
  }
  
  return null;
}

function logQueryShapeChange(stage, payload) {
  const stamp = new Date().toISOString();
  console.log(`\n[QUERY SHAPE] ${stamp} | ${stage}`);
  console.log(JSON.stringify(payload, null, 2));
}

function snapshotGraphqlText(queryText) {
  const compact = queryText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');

  return {
    type: 'graphql-text',
    length: queryText.length,
    preview: compact.slice(0, 220),
  };
}

function snapshotGraphqlAst(ast) {
  const firstDefinition = ast?.definitions?.[0];
  const selections = firstDefinition?.selectionSet?.selections || [];

  return {
    type: 'graphql-ast',
    kind: ast?.kind || null,
    definitionsCount: ast?.definitions?.length || 0,
    operation: firstDefinition?.operation || null,
    topLevelFields: selections
      .filter((sel) => sel?.kind === 'Field')
      .map((field) => field?.name?.value)
      .filter(Boolean),
  };
}

function snapshotSparqlAlgebra(algebra) {
  const patterns = algebra?.input?.patterns || [];

  return {
    type: 'sparql-algebra',
    algebraType: algebra?.type || null,
    variables: (algebra?.variables || []).map((v) => v?.value).filter(Boolean),
    tripleCount: patterns.length,
    predicates: patterns
      .map((pattern) => pattern?.predicate?.value)
      .filter(Boolean),
  };
}

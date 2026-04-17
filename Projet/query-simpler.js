// query-simpler.js
// Requête GraphQL-LD alternative plus simple pour démontrer l'arborescence

export const graphqlQuery = `
{
  label @first(value: 10)
}
`;

export const jsonldContext = {
  "label": "http://www.w3.org/2000/01/rdf-schema#label"
};

// Pour une requête avec structures imbriquées (recommandée pour tester):
// Le format est : { variable { variable } ... }
// Les variables imbriquées sont séparées par '_' dans SPARQL JSON
// L'arbre final doit ressembler à :
// {
//   "label": "Some Label",
//   "nested": {
//     "label": "Nested Label"
//   }
// }

// query.js
// Définit la requête GraphQL et le contexte JSON-LD
// Basé sur l'exemple de l'article GraphQL-LD : trouver tous les groupes pour lesquels Michael Jackson a écrit une chanson

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
  "label":    "http://www.w3.org/2000/01/rdf-schema#label",
  "label_en": {
    "@id":        "http://www.w3.org/2000/01/rdf-schema#label",
    "@language":  "en"
  },
  "writer": "http://dbpedia.org/ontology/writer",
  "artist": "http://dbpedia.org/ontology/musicalArtist"
};

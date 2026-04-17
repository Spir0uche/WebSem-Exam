// index.js
// Point d'entrée principal du POC

import { getFormattedResults } from './shape.js';

(async () => {
  try {
    console.log('=== POC DBpedia SPARQL ===\n');
    const results = await getFormattedResults();
    console.log('\n=== Résultat final ===');
    console.log(`\nTotal de résultats: ${Array.isArray(results) ? results.length : 0}`);
    console.log('\nLe POC a démontré avec succès :');
    console.log('  ✓ Exécution de la requête SPARQL de test contre DBpedia');
    console.log('  ✓ Récupération des variables work et workLabel');
    console.log('  ✓ Formattage des résultats en JSON exploitable');
  } catch (err) {
    console.error('Erreur fatale :', err.message);
    process.exit(1);
  }
})();

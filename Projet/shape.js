// shape.js
// Convertit les résultats SPARQL en JSON lisible

import { executeQuery } from './execute.js';

export async function getFormattedResults() {
  try {
    const bindings = await executeQuery();
    const rows = bindings.map((binding) => {
      const row = {};
      if (binding && typeof binding.forEach === 'function') {
        binding.forEach((term, varName) => {
          const key = normalizeVarName(varName);
          row[key] = termToValue(term);
        });
      }
      return {
        work: row.work || null,
        workLabel: row.workLabel || null,
      };
    });

    // Afficher les résultats formatés
    console.log('\nRésultats mis en forme (JSON):');
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    console.log(`\n  ... (${rows.length} résultats au total)`);
    
    return rows;
  } catch (err) {
    console.error('Erreur lors de la mise en forme des résultats :', err.message);
    throw err;
  }
}

function normalizeVarName(varName) {
  if (typeof varName === 'string') {
    return varName.startsWith('?') ? varName.slice(1) : varName;
  }
  if (varName && typeof varName === 'object' && typeof varName.value === 'string') {
    return varName.value;
  }
  return String(varName);
}

function termToValue(term) {
  // Convertir un terme RDF.js en valeur simple
  if (!term || typeof term !== 'object') {
    return term;
  }

  if (term.termType === 'NamedNode') {
    return term.value;
  }
  if (term.termType === 'Literal') {
    return term.value;
  }
  if (term.termType === 'Variable') {
    return `?${term.value}`;
  }
  if (term.termType === 'BlankNode') {
    return `_:${term.value}`;
  }

  return String(term.value || term);
}

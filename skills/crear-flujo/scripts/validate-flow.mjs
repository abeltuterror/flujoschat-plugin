#!/usr/bin/env node
/**
 * Validador local del JSON de flujos de FlujosChat (sin dependencias).
 * Uso: node validate-flow.mjs <archivo.json>
 * Sale con código 1 si hay errores; 0 si solo hay avisos o está correcto.
 */
import { readFileSync } from 'node:fs';

const TRIGGERS = ['KEYWORD', 'WELCOME', 'EVENT', 'MANUAL'];
const STEP_TYPES = ['MESSAGE', 'QUESTION', 'CONDITION', 'WAIT', 'API_CALL', 'AI_HANDOFF', 'END'];
const CONDITIONS = ['EXACT_MATCH', 'CONTAINS', 'STARTS_WITH', 'REGEX', 'ANY', 'BUTTON', 'LIST'];

const file = process.argv[2];
if (!file) {
  console.error('Uso: node validate-flow.mjs <archivo.json>');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`❌ No se pudo parsear el JSON: ${e.message}`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const inRange = (n, lo, hi) => typeof n === 'number' && Number.isInteger(n) && n >= lo && n <= hi;
const strLen = (s, lo, hi) => typeof s === 'string' && s.length >= lo && s.length <= hi;

if (Array.isArray(data.transitions)) {
  warnings.push('"transitions" en el nivel superior: deben ir dentro de cada step (steps[].transitions).');
}

const flow = data.flow;
if (!flow || typeof flow !== 'object') {
  errors.push('Falta el objeto "flow".');
} else {
  if (!strLen(flow.name, 3, 100)) errors.push('flow.name: string de 3 a 100 caracteres (requerido).');
  if (!TRIGGERS.includes(flow.trigger)) errors.push(`flow.trigger: debe ser uno de ${TRIGGERS.join(', ')}.`);
  if (flow.priority != null && !inRange(flow.priority, 1, 100)) errors.push('flow.priority: entero 1–100.');
}

const steps = data.steps;
const orders = new Set();
if (!Array.isArray(steps) || steps.length === 0) {
  errors.push('"steps" debe ser un array con al menos un paso.');
} else {
  for (const s of steps) {
    if (inRange(s?.stepOrder, 1, 1e9)) orders.add(s.stepOrder);
  }
  steps.forEach((s, i) => {
    const tag = `steps[${i}]`;
    if (!inRange(s?.stepOrder, 1, 1e9)) errors.push(`${tag}.stepOrder: entero >= 1 (requerido).`);
    if (!STEP_TYPES.includes(s?.stepType)) errors.push(`${tag}.stepType: debe ser uno de ${STEP_TYPES.join(', ')}.`);
    if (!strLen(s?.name, 3, 100)) errors.push(`${tag}.name: string de 3 a 100 caracteres.`);
    if (!s?.config || typeof s.config !== 'object') errors.push(`${tag}.config: objeto requerido.`);
    if (s && 'nextStepOrder' in s) warnings.push(`${tag}: usa "nextStepId" en vez de "nextStepOrder".`);
    if (typeof s?.nextStepId === 'number' && !orders.has(s.nextStepId)) {
      warnings.push(`${tag}.nextStepId apunta a stepOrder ${s.nextStepId}, que no existe.`);
    }
    // Ramas CONDITION
    if (s?.stepType === 'CONDITION' && s.config) {
      for (const k of ['trueStepId', 'falseStepId']) {
        if (typeof s.config[k] === 'number' && !orders.has(s.config[k])) {
          warnings.push(`${tag}.config.${k} apunta a stepOrder ${s.config[k]}, que no existe.`);
        }
      }
    }
    // Transiciones
    if (s?.transitions != null) {
      if (!Array.isArray(s.transitions)) {
        errors.push(`${tag}.transitions: debe ser un array.`);
      } else {
        s.transitions.forEach((t, j) => {
          const tt = `${tag}.transitions[${j}]`;
          if ('fromStepOrder' in (t || {})) warnings.push(`${tt}: "fromStepOrder" se ignora (el origen es implícito).`);
          if (!inRange(t?.toStepOrder, 1, 1e9)) errors.push(`${tt}.toStepOrder: entero >= 1 (requerido).`);
          else if (!orders.has(t.toStepOrder)) warnings.push(`${tt}.toStepOrder ${t.toStepOrder} no existe; la transición se descartará.`);
          if (!CONDITIONS.includes(t?.condition)) errors.push(`${tt}.condition: debe ser uno de ${CONDITIONS.join(', ')}.`);
          if (t?.priority != null && !inRange(t.priority, 1, 100)) errors.push(`${tt}.priority: entero 1–100.`);
          if (t?.condition !== 'ANY' && (t?.matchValue == null || t?.matchValue === '')) {
            warnings.push(`${tt}: condición "${t?.condition}" normalmente requiere matchValue.`);
          }
        });
      }
    }
  });
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} error(es):`);
  errors.forEach((e) => console.error(`  - ${e}`));
}
if (warnings.length) {
  console.warn(`\n⚠️  ${warnings.length} aviso(s):`);
  warnings.forEach((w) => console.warn(`  - ${w}`));
}
if (!errors.length) {
  console.log(`\n✅ JSON válido${warnings.length ? ' (con avisos)' : ''}: ${steps?.length || 0} paso(s).`);
}
process.exit(errors.length ? 1 : 0);

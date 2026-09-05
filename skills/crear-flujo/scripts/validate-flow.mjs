#!/usr/bin/env node
/**
 * Validador local del JSON de flujos de FlujosChat (sin dependencias).
 * Uso: node validate-flow.mjs <archivo.json>
 * Sale con código 1 si hay errores; 0 si solo hay avisos o está correcto.
 *
 * Comprueba la forma del JSON (lo mismo que rechazaría el servidor) y además los límites de
 * WhatsApp, que Meta aplica en silencio: un flujo que los viola se guarda sin error y el
 * cliente no recibe el mensaje.
 */
import { readFileSync } from 'node:fs';

const TRIGGERS = ['KEYWORD', 'WELCOME', 'EVENT', 'MANUAL', 'REFERRAL'];
const STEP_TYPES = ['MESSAGE', 'QUESTION', 'CONDITION', 'WAIT', 'API_CALL', 'AI_HANDOFF', 'PAYMENT', 'END'];
const CONDITIONS = ['EXACT_MATCH', 'CONTAINS', 'STARTS_WITH', 'REGEX', 'ANY', 'BUTTON', 'LIST'];

// Límites de WhatsApp para mensajes interactivos (Meta los aplica sin devolver error).
const META = {
  botones: 3,
  tituloBoton: 20,
  filas: 10,
  tituloFila: 24,
  descripcionFila: 72,
  textoBotonLista: 20,
  tituloSeccion: 24,
  cuerpoConBotones: 1024,
  cuerpoTexto: 4096,
};

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
// Longitud como la cuenta WhatsApp: por puntos de código, no por unidades UTF-16.
const largo = (s) => (typeof s === 'string' ? [...s].length : 0);

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
  if (flow.trigger === 'KEYWORD' && !(Array.isArray(flow.triggerKeywords) && flow.triggerKeywords.length)) {
    errors.push('flow.trigger KEYWORD sin triggerKeywords: el flujo nunca se dispararía.');
  }
  if (flow.trigger === 'REFERRAL' && !(Array.isArray(flow.triggerReferralIds) && flow.triggerReferralIds.length)) {
    warnings.push('flow.trigger REFERRAL sin triggerReferralIds: se disparará con cualquier anuncio.');
  }
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
    const cfg = s?.config && typeof s.config === 'object' ? s.config : {};
    const trans = Array.isArray(s?.transitions) ? s.transitions : [];

    // Ramas CONDITION
    if (s?.stepType === 'CONDITION') {
      for (const k of ['trueStepId', 'falseStepId']) {
        if (typeof cfg[k] === 'number' && !orders.has(cfg[k])) {
          warnings.push(`${tag}.config.${k} apunta a stepOrder ${cfg[k]}, que no existe.`);
        }
      }
    }

    // PAYMENT (cobro): bifurca por config, no por transiciones.
    if (s?.stepType === 'PAYMENT') {
      if (trans.length) warnings.push(`${tag}: paso PAYMENT con transitions (se ignoran; bifurca por successStepId/timeoutStepId).`);
      for (const k of ['successStepId', 'timeoutStepId']) {
        if (cfg[k] === undefined || cfg[k] === null) {
          errors.push(`${tag}.config.${k}: requerido en PAYMENT; sin esa rama el cliente queda colgado.`);
        } else if (typeof cfg[k] === 'number' && !orders.has(cfg[k])) {
          errors.push(`${tag}.config.${k} apunta a stepOrder ${cfg[k]}, que no existe.`);
        }
      }
      const montoFijo = Number.isFinite(cfg.amountCents) && cfg.amountCents > 0;
      if (!montoFijo && !cfg.amountVariable) {
        errors.push(`${tag}.config: PAYMENT sin monto; define amountCents (céntimos) o amountVariable (variable en soles).`);
      }
      if (!cfg.instructionText) {
        warnings.push(`${tag}.config.instructionText: falta; el cliente no sabrá a qué número pagar.`);
      } else if (!String(cfg.instructionText).includes('{payment_amount}')) {
        errors.push(`${tag}.config.instructionText: debe incluir {payment_amount}, o el cobro no se identifica.`);
      }
      if (cfg.ttlMinutes !== undefined && (!Number.isFinite(cfg.ttlMinutes) || cfg.ttlMinutes < 1)) {
        errors.push(`${tag}.config.ttlMinutes: número de minutos >= 1.`);
      }
    }

    // Límites de WhatsApp en mensajes interactivos.
    const esInteractivo = s?.stepType === 'MESSAGE' || s?.stepType === 'QUESTION';
    const cuerpo = cfg.text ?? cfg.question;
    if (esInteractivo && cfg.messageType === 'BUTTONS') {
      const botones = Array.isArray(cfg.buttons) ? cfg.buttons : [];
      if (!botones.length) errors.push(`${tag}.config.buttons: un paso BUTTONS necesita al menos un botón.`);
      if (botones.length > META.botones) errors.push(`${tag}.config.buttons: máximo ${META.botones} botones (hay ${botones.length}); usa LIST.`);
      botones.forEach((b, j) => {
        if (largo(b?.title) > META.tituloBoton) errors.push(`${tag}.config.buttons[${j}].title: máximo ${META.tituloBoton} caracteres.`);
        if (!b?.id) errors.push(`${tag}.config.buttons[${j}].id: requerido.`);
      });
      if (largo(cuerpo) > META.cuerpoConBotones) errors.push(`${tag}: el texto con botones no puede pasar de ${META.cuerpoConBotones} caracteres.`);
      if (cfg.headerImageUrl && typeof cfg.headerImageUrl === 'string' && !cfg.headerImageUrl.startsWith('https://')) {
        errors.push(`${tag}.config.headerImageUrl: debe ser un enlace https:// público.`);
      }
      // Cada botón lleva su transición; ANY no vale aquí.
      const ids = new Set(botones.map((b) => b?.id).filter(Boolean));
      const cubiertos = new Set(trans.filter((t) => t?.condition === 'BUTTON' || t?.condition === 'EXACT_MATCH').map((t) => t?.matchValue));
      for (const id of ids) {
        if (!cubiertos.has(id)) errors.push(`${tag}: el botón "${id}" no tiene transición BUTTON con matchValue "${id}"; la sesión quedaría atrapada.`);
      }
    } else if (esInteractivo && cfg.messageType === 'LIST') {
      const secciones = Array.isArray(cfg.sections) ? cfg.sections : [];
      const filas = secciones.flatMap((sec) => (Array.isArray(sec?.rows) ? sec.rows : []));
      if (!filas.length) errors.push(`${tag}.config.sections: un paso LIST necesita al menos una fila.`);
      if (filas.length > META.filas) errors.push(`${tag}.config.sections: máximo ${META.filas} filas en total (hay ${filas.length}).`);
      if (largo(cfg.buttonText) > META.textoBotonLista) errors.push(`${tag}.config.buttonText: máximo ${META.textoBotonLista} caracteres.`);
      secciones.forEach((sec, j) => {
        if (largo(sec?.title) > META.tituloSeccion) errors.push(`${tag}.config.sections[${j}].title: máximo ${META.tituloSeccion} caracteres.`);
      });
      filas.forEach((r) => {
        if (largo(r?.title) > META.tituloFila) errors.push(`${tag}: la fila "${r?.id}" tiene título de más de ${META.tituloFila} caracteres.`);
        if (largo(r?.description) > META.descripcionFila) errors.push(`${tag}: la fila "${r?.id}" tiene descripción de más de ${META.descripcionFila} caracteres.`);
        if (!r?.id) errors.push(`${tag}: hay una fila de lista sin id.`);
      });
      if (largo(cuerpo) > META.cuerpoTexto) errors.push(`${tag}: el texto de la lista no puede pasar de ${META.cuerpoTexto} caracteres.`);
      if (cfg.headerImageUrl) errors.push(`${tag}.config.headerImageUrl: Meta no admite imagen de cabecera en una lista; se guardaría y nunca se enviaría.`);
      const ids = new Set(filas.map((r) => r?.id).filter(Boolean));
      const cubiertos = new Set(trans.filter((t) => ['LIST', 'CONTAINS', 'EXACT_MATCH'].includes(t?.condition)).map((t) => t?.matchValue));
      for (const id of ids) {
        if (!cubiertos.has(id)) errors.push(`${tag}: la fila "${id}" no tiene transición con matchValue "${id}"; la sesión quedaría atrapada.`);
      }
    } else if (esInteractivo && largo(cuerpo) > META.cuerpoTexto) {
      errors.push(`${tag}: el texto no puede pasar de ${META.cuerpoTexto} caracteres.`);
    }

    // Transiciones
    if (s?.transitions != null) {
      if (!Array.isArray(s.transitions)) {
        errors.push(`${tag}.transitions: debe ser un array.`);
      } else {
        const conOpciones = esInteractivo && (cfg.messageType === 'BUTTONS' || cfg.messageType === 'LIST');
        s.transitions.forEach((t, j) => {
          const tt = `${tag}.transitions[${j}]`;
          if ('fromStepOrder' in (t || {})) warnings.push(`${tt}: "fromStepOrder" se ignora (el origen es implícito).`);
          if (!inRange(t?.toStepOrder, 1, 1e9)) errors.push(`${tt}.toStepOrder: entero >= 1 (requerido).`);
          else if (!orders.has(t.toStepOrder)) warnings.push(`${tt}.toStepOrder ${t.toStepOrder} no existe; la transición se descartará.`);
          if (!CONDITIONS.includes(t?.condition)) errors.push(`${tt}.condition: debe ser uno de ${CONDITIONS.join(', ')}.`);
          if (t?.priority != null && !inRange(t.priority, 1, 100)) errors.push(`${tt}.priority: entero 1–100.`);
          if (t?.condition !== 'ANY' && (t?.matchValue == null || t?.matchValue === '')) {
            errors.push(`${tt}: la condición "${t?.condition}" requiere matchValue.`);
          }
          // El bug del ANY: WhatsApp no desactiva los botones viejos y el motor acepta clics de
          // pasos anteriores, así que un ANY en un paso con botones o lista captura respuestas
          // que no le corresponden → variables corruptas y bucles.
          if (t?.condition === 'ANY' && conOpciones) {
            errors.push(`${tt}: ANY en un paso ${cfg.messageType} captura clics de mensajes anteriores; usa una transición por botón/fila y quita el ANY.`);
          }
        });
      }
    }

    // Un paso que manda contenido y no lleva a ningún lado deja la sesión colgada.
    const terminal = s?.stepType === 'END' || cfg.transferToAgent === true || s?.stepType === 'PAYMENT' || s?.stepType === 'CONDITION';
    if (esInteractivo && !terminal && !trans.length && (s?.nextStepId === undefined || s?.nextStepId === null)) {
      warnings.push(`${tag}: no tiene transitions ni nextStepId; la conversación termina ahí sin END.`);
    }
    if (cfg.transferToAgent === true && (trans.length || (s?.nextStepId !== undefined && s?.nextStepId !== null))) {
      warnings.push(`${tag}: transferToAgent corta el flujo; sus transitions/nextStepId no se ejecutarán.`);
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

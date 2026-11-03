const test = require('node:test');
const assert = require('node:assert/strict');

const { parseClinicDateTime, clinicDateISO, toEcuador } = require('../src/utils/dates');

test('interpreta una cita sin offset como hora local de Ecuador', () => {
  assert.equal(parseClinicDateTime('2026-11-02T09:30:00'), '2026-11-02T14:30:00Z');
});

test('conserva el instante de una cita que ya incluye offset', () => {
  assert.equal(parseClinicDateTime('2026-11-02T09:30:00-05:00'), '2026-11-02T14:30:00Z');
});

test('obtiene fecha y hora de calendario en America/Guayaquil', () => {
  const instant = '2026-11-03T02:15:00Z';
  assert.equal(clinicDateISO(instant), '2026-11-02');
  assert.equal(toEcuador(instant).toFormat('HH:mm'), '21:15');
});

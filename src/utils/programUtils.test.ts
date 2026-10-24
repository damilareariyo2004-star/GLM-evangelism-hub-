import test from 'node:test';
import assert from 'node:assert/strict';
import { getProgramBadgeStyle } from './programUtils';

test('getProgramBadgeStyle returns distinct soft color classes per program', () => {
  const sunday = getProgramBadgeStyle('Sunday Service');
  const wednesday = getProgramBadgeStyle('Wednesday Program/Joint Auxano');
  const friday = getProgramBadgeStyle('Friday Program/Something New');
  const auxano = getProgramBadgeStyle('School Auxano');

  assert.ok(sunday.includes('text-blue-700'));
  assert.ok(wednesday.includes('text-indigo-700'));
  assert.ok(friday.includes('text-rose-700'));
  assert.ok(auxano.includes('text-amber-800'));
});

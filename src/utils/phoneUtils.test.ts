import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePhoneNumber,
  getTelLink,
  getWhatsAppLink,
  getFollowUpMessage,
  getProgramInvitationMessage,
  getProgramWhatsAppLink,
  validatePhoneNumber,
  normalizePhoneForComparison,
  formatWhatsAppNumber
} from './phoneUtils';

test('sanitizePhoneNumber strips special characters and spaces', () => {
  assert.equal(sanitizePhoneNumber('(0808) 123-4567'), '08081234567');
  assert.equal(sanitizePhoneNumber('+234 808 345 6789'), '+2348083456789');
  assert.equal(sanitizePhoneNumber(''), '');
});

test('formatWhatsAppNumber converts Nigerian 0808... numbers to 234808...', () => {
  assert.equal(formatWhatsAppNumber('08081234567'), '2348081234567');
  assert.equal(formatWhatsAppNumber('+234 808 123 4567'), '2348081234567');
  assert.equal(formatWhatsAppNumber('07039876543'), '2347039876543');
  assert.equal(formatWhatsAppNumber('09012345678'), '2349012345678');
});

test('normalizePhoneForComparison matches local and international formats for same number', () => {
  assert.equal(
    normalizePhoneForComparison('0808 123 4567'),
    normalizePhoneForComparison('+234 808 123 4567')
  );
  assert.equal(normalizePhoneForComparison('08081234567'), '2348081234567');
});

test('validatePhoneNumber checks validity accurately', () => {
  assert.equal(validatePhoneNumber('08081234567').isValid, true);
  assert.equal(validatePhoneNumber('+234 808 123 4567').isValid, true);
  assert.equal(validatePhoneNumber('123').isValid, false);
  assert.equal(validatePhoneNumber('abc1234567').isValid, false);
  assert.equal(validatePhoneNumber('').isValid, false);
});

test('getFollowUpMessage generates exact requested text dynamically', () => {
  const msg = getFollowUpMessage('Sister Sarah', 'Brother Emmanuel');
  assert.equal(
    msg,
    'Hello Sister Sarah, This is Brother Emmanuel from Gospel Labour Ministry. We met during evangelism today and I was really blessed to meet you. I would love to follow you up and keep in touch with you. Hope you are doing great. God bless you!'
  );
});

test('getWhatsAppLink formats url with 234 international number and exact follow-up message', () => {
  const link = getWhatsAppLink('08081234567', 'Sister Sarah', 'Brother Emmanuel');
  assert.match(link, /^https:\/\/wa\.me\/2348081234567\?text=/);
  assert.ok(link.includes('Sister%20Sarah'));
  assert.ok(link.includes('Brother%20Emmanuel'));
  assert.ok(link.includes('Gospel%20Labour%20Ministry'));
});

test('getProgramWhatsAppLink formats invitation message with program name', () => {
  const link = getProgramWhatsAppLink(
    '08081234567',
    'Wednesday Program / Joint Auxano',
    'Brother John',
    'Evangelist Mark'
  );
  assert.match(link, /^https:\/\/wa\.me\/2348081234567\?text=/);
  assert.ok(link.includes('Wednesday%20Program%20%2F%20Joint%20Auxano'));
});

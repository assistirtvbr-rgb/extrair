import test from 'node:test';
import assert from 'node:assert';
import { sanitizeCSVValue } from './csv.js';
import { extractCleanDomain, parseSocialChannel, normalizeUrl } from './domain.js';
import { calculateLeadScore } from './scoring.js';

test('CSV Formula Injection Protection', () => {
  assert.strictEqual(sanitizeCSVValue('=1+1'), "'=1+1");
  assert.strictEqual(sanitizeCSVValue('+cmd|/c calc'), "'+cmd|/c calc");
  assert.strictEqual(sanitizeCSVValue('-500'), "'-500");
  assert.strictEqual(sanitizeCSVValue('@SUM(A1:A10)'), "'@SUM(A1:A10)");
  assert.strictEqual(sanitizeCSVValue('Clinica Dental Prime'), 'Clinica Dental Prime');
});

test('Domain Extraction & Normalization', () => {
  assert.strictEqual(extractCleanDomain('https://www.clinicadental.com.br/agendamento?ref=1'), 'clinicadental.com.br');
  assert.strictEqual(extractCleanDomain('http://odontosaude.com.br'), 'odontosaude.com.br');
  assert.strictEqual(extractCleanDomain('saude.med.br/contato'), 'saude.med.br');
  assert.strictEqual(normalizeUrl('clinicadental.com.br'), 'https://clinicadental.com.br/');
  assert.strictEqual(normalizeUrl('invalid-url-without-dot'), null);
});

test('Social Channel Parsing', () => {
  const insta = parseSocialChannel('https://www.instagram.com/clinicadentalprime/');
  assert.strictEqual(insta?.platform, 'instagram');
  assert.strictEqual(insta?.handle, '@clinicadentalprime');

  const zap = parseSocialChannel('https://wa.me/5521998765432');
  assert.strictEqual(zap?.platform, 'whatsapp');

  const linked = parseSocialChannel('https://www.linkedin.com/company/odontoprime');
  assert.strictEqual(linked?.platform, 'linkedin');
});

test('Explainable Lead Scoring', () => {
  const samplePlace = {
    phone: '(21) 3333-0000',
    website: 'https://dentalprime.com.br',
    rating: 4.8,
    userRatingCount: 50,
    distanceKm: 1.5,
    digitalPresence: {
      whatsapp: { url: 'https://wa.me/552199999999' },
      instagram: { handle: '@dentalprime' }
    }
  };

  const sampleLead = {
    status: 'Interessado',
    nextAction: 'Ligar para secretário'
  };

  const scoreResult = calculateLeadScore(samplePlace, sampleLead);
  assert.strictEqual(scoreResult.totalScore, 100);
  assert.strictEqual(scoreResult.tier, 'Alta Prioridade');
  assert.strictEqual(scoreResult.factors.length, 7);
});

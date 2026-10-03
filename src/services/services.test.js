import test from 'node:test';
import assert from 'node:assert';
import { LocationNotFoundError } from './geoService.js';

test('LocationNotFoundError provides clean error message', () => {
  const err = new LocationNotFoundError('Rua Inexistente 99999XYZ');
  assert.strictEqual(err.name, 'LocationNotFoundError');
  assert.ok(err.message.includes('Rua Inexistente 99999XYZ'));
});

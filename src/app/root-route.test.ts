import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('app router defines a root page for slash route', () => {
  const rootPagePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');

  assert.equal(
    existsSync(rootPagePath),
    true,
    'expected src/app/page.tsx to exist so "/" does not return 404',
  );
});

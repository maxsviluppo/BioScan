import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'bio-scan-verde-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('should allow a user to create their own profile', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'users/alice'), {
        email: 'alice@example.com',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('should deny creating a profile for another user', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'users/bob'), {
        email: 'bob@example.com',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('should deny creating a history item for another user', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'users/alice/history/item1'), {
        userId: 'bob',
        image: 'base64-data',
        result: 'some results',
        timestamp: serverTimestamp(),
      })
    );
  });

  it('should deny path poisoning with long IDs', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const longId = 'a'.repeat(200);
    await assertFails(
      setDoc(doc(alice.firestore(), `users/alice/history/${longId}`), {
        userId: 'alice',
        image: 'base64-data',
        result: 'some results',
        timestamp: serverTimestamp(),
      })
    );
  });

  it('should deny resource poisoning with huge payload', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const hugeImage = 'i'.repeat(3000000); // 3MB
    await assertFails(
      setDoc(doc(alice.firestore(), 'users/alice/history/item1'), {
        userId: 'alice',
        image: hugeImage,
        result: 'some results',
        timestamp: serverTimestamp(),
      })
    );
  });
});

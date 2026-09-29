const {test} = require('node:test');
const assert = require('node:assert/strict');
const createAccounts = require('./github-accounts.js');
const encode = value => Buffer.from(value).toString('base64');

test('two browsers share credentials and IDs, reject duplicates, and update passwords', async () => {
  let stored = null, revision = 0;
  const request = async (method, body, path) => {
    assert.equal(path, 'data/accounts.json');
    if (method === 'GET') return stored ? {content:stored, sha:String(revision)} : null;
    if (body.sha !== (stored ? String(revision) : undefined)) throw Object.assign(new Error('Conflict'), {status:409});
    stored = body.content; revision++;
    return {};
  };
  const first = createAccounts(request, encode), second = createAccounts(request, encode);
  const account = await first.register('Andy', 'example-password', '123456');
  assert.equal((await second.login(' ANDY ', 'example-password')).id, account.id);
  await assert.rejects(second.login('andy', 'wrong-password'), /Incorrect/);
  await assert.rejects(second.register('andy', 'another-password', '654321'), /already exists/);
  assert.equal((await second.register('another', 'example-password', '123456')).id, '123457');
  await second.changePassword('andy', 'example-password', 'updated-password');
  await assert.rejects(first.login('andy', 'example-password'), /Incorrect/);
  assert.equal((await first.login('andy', 'updated-password')).id, '123456');
  assert.ok(!Buffer.from(stored, 'base64').toString().includes('updated-password'));
  const results = await Promise.allSettled([first.register('race', 'password-one', '999'), second.register('race', 'password-two', '999')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(results.find(result => result.status === 'rejected').reason.message, /already exists/);
});

test('unavailable server never authenticates a browser account', async () => {
  const accounts = createAccounts(async () => { throw new Error('Offline'); }, encode);
  await assert.rejects(accounts.login('andy', 'password'), /Offline/);
  await assert.rejects(accounts.register('andy', 'password', '123456'), /Offline/);
});

/* Shared account registry. GitHub's file SHA serializes concurrent registrations. */
(function(root){
  function createGithubAccounts(request, encode, cryptoApi = globalThis.crypto){
    const path = 'data/accounts.json';
    const normalize = name => String(name).trim().toLowerCase();
    const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    async function passwordToken(password, salt){
      const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      return hex(new Uint8Array(await cryptoApi.subtle.deriveBits({name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:210000, hash:'SHA-256'}, key, 256)));
    }
    async function credential(password){
      const salt = hex(cryptoApi.getRandomValues(new Uint8Array(16)));
      return {salt, token:await passwordToken(password, salt), algorithm:'PBKDF2-SHA256', iterations:210000};
    }
    async function read(){
      const file = await request('GET', null, path);
      if (!file) return {accounts:{}, sha:null};
      const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0))));
      if (data.schemaVersion !== 1 || !data.accounts || typeof data.accounts !== 'object') throw new Error('The shared account list could not be read.');
      return {accounts:data.accounts, sha:file.sha};
    }
    async function write(registry){
      await request('PUT', {message:'Update shared classroom accounts', content:encode(JSON.stringify({schemaVersion:1, accounts:registry.accounts}, null, 2)), ...(registry.sha ? {sha:registry.sha} : {})}, path);
    }
    async function verify(account, password){
      return !!account?.credential && account.credential.token === await passwordToken(password, account.credential.salt);
    }
    return {
      async login(name, password){
        const username = normalize(name), registry = await read();
        const account = Object.hasOwn(registry.accounts, username) ? registry.accounts[username] : null;
        if (!account) throw new Error('This username is not registered on the server yet. Choose Create account to register it.');
        if (!await verify(account, password)) throw new Error('Incorrect username or password.');
        if (!/^\d+$/.test(account.id)) throw new Error('This account has an invalid server ID.');
        return {...account, username};
      },
      async register(name, password, preferredId){
        const username = normalize(name);
        if (!/^[a-z0-9_-]{3,20}$/.test(username) || password.length < 4) throw new Error('Use 3–20 letters, numbers, _ or -, and a password of at least 4 characters.');
        const passwordCredential = await credential(password);
        for (let attempt = 0; attempt < 4; attempt++){
          const registry = await read();
          if (Object.hasOwn(registry.accounts, username)) throw new Error('That username already exists. Log in with its password or choose a different username to create a new account.');
          let id = String(preferredId);
          while (Object.values(registry.accounts).some(account => account.id === id)) id = String(BigInt(id) + 1n);
          const account = {id, username, credential:passwordCredential, createdAt:new Date().toISOString()};
          registry.accounts[username] = account;
          try { await write(registry); return account; }
          catch(error){ if (![409,422].includes(error.status) || attempt === 3) throw error; }
        }
      },
      async changePassword(name, current, replacement){
        if (replacement.length < 4) throw new Error('Use at least 4 characters.');
        const username = normalize(name), registry = await read();
        const account = Object.hasOwn(registry.accounts, username) ? registry.accounts[username] : null;
        if (!await verify(account, current)) throw new Error('Current password is incorrect.');
        account.credential = await credential(replacement);
        await write(registry);
      }
    };
  }
  root.createGithubAccounts = createGithubAccounts;
  if (typeof module !== 'undefined') module.exports = createGithubAccounts;
})(globalThis);

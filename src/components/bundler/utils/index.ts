/**
 * 扩展名转换为对应 loader
 */
export function extToLoader(ext: string) {
  ext = ext.replace(/^\./, '');
  switch (ext) {
    case 'scss':
    case 'sass':
      // return 'css';
      return undefined;
    case 'js':
    case 'jsx':
      return 'jsx';
    case 'tsx':
    case 'ts':
      return 'tsx';
    default:
      return ext;
  }
}

export function semverToDbVersion (v: string) {
  const [a, b, c] = v.split('.');
  return +a * 10000 + +b * 100 + +c;
}

// 尚未用到，比较麻烦，还得在 worker 线程上搞初始化
// https://github.com/mdn/webassembly-examples/blob/gh-pages/wasm-utils.js
// This library function fetches the wasm Module at 'url', instantiates it with
// the given 'importObject', and returns a Promise resolving to the finished
// wasm Instance. Additionally, the function attempts to cache the compiled wasm
// Module in IndexedDB using 'url' as the key. The entire site's wasm cache (not
// just the given URL) is versioned by dbVersion and any change in dbVersion on
// any call to instantiateCachedURL() will conservatively clear out the entire
// cache to avoid stale modules.
export function fetchCachedWasmModule(dbVersion: number, url: string) {
  const dbName = 'wasm-cache';
  const storeName = 'wasm-cache';

  // This helper function Promise-ifies the operation of opening an IndexedDB
  // database and clearing out the cache when the version changes.
  function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      var request = indexedDB.open(dbName, dbVersion);
      request.onerror = reject.bind(null, 'Error opening wasm cache database');
      request.onsuccess = () => { resolve(request.result) };
      request.onupgradeneeded = event => {
        var db = request.result;
        if (db.objectStoreNames.contains(storeName)) {
            console.log(`Clearing out version ${event.oldVersion} wasm cache`);
            db.deleteObjectStore(storeName);
        }
        console.log(`Creating version ${event.newVersion} wasm cache`);
        db.createObjectStore(storeName)
      };
    });
  }

  // This helper function Promise-ifies the operation of looking up 'url' in the
  // given IDBDatabase.
  function lookupInDatabase(db: IDBDatabase): Promise<WebAssembly.Module> {
    return new Promise((resolve, reject) => {
      var store = db.transaction([storeName]).objectStore(storeName);
      var request = store.get(url);
      request.onerror = reject.bind(null, `Error getting wasm module ${url}`);
      request.onsuccess = event => {
        if (request.result)
          resolve(request.result);
        else
          reject(`Module ${url} was not found in wasm cache`);
      }
    });
  }

  // This helper function fires off an async operation to store the given wasm
  // Module in the given IDBDatabase.
  function storeInDatabase(db: IDBDatabase, module: WebAssembly.Module) {
    var store = db.transaction([storeName], 'readwrite').objectStore(storeName);
    var request = store.put(module, url);
    request.onerror = err => { console.log(`Failed to store in wasm cache: ${err}`) };
    request.onsuccess = err => { console.log(`Successfully stored ${url} in wasm cache`) };
  }

  // This helper function fetches 'url', compiles it into a Module,
  // instantiates the Module with the given import object.
  function fetchAndInstantiate() {
    return fetch(url).then(response =>
      response.arrayBuffer()
    ).then(res => WebAssembly.compile(res));
  }

  // With all the Promise helper functions defined, we can now express the core
  // logic of an IndexedDB cache lookup. We start by trying to open a database.
  return openDatabase().then(db => {
    // Now see if we already have a compiled Module with key 'url' in 'db':
    return lookupInDatabase(db).then(module => {
      // We do! Instantiate it with the given import object.
      console.log(`Found ${url} in wasm cache`);
      return module;
    }, errMsg => {
      // Nope! Compile from scratch and then store the compiled Module in 'db'
      // with key 'url' for next time.
      console.log(errMsg);
      return fetchAndInstantiate().then(module => {
        storeInDatabase(db, module);
        return module;
      });
    })
  },
  errMsg => {
    // If opening the database failed (due to permissions or quota), fall back
    // to simply fetching and compiling the module and don't try to store the
    // results.
    console.log(errMsg);
    return fetchAndInstantiate();
  });
}
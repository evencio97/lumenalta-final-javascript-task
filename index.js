// let savedCount = 0
/**
 * @param {CallableFunction} connect 
 * @param {CallableFunction} save 
 * @param {string} url
*/
const createPromise = (connect, save, url) => {
  return new Promise(async (resolve, reject) => {
    let connection, error;
    try {
      connection = await connect();

      await save(await connection.download(url));
      // savedCount++;
      connection.close();
      resolve(true);
    } catch (error) {
      if (connection)
        connection.close();

      resolve(error);
    }
  })
}

/**
 * 
 * @param {CallableFunction} connect 
 * @param {CallableFunction} save 
 * @param {string[]} downloadList 
 * @param {number} maxConcurrency 
 * @returns 
*/
const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  if (!(downloadList.length && maxConcurrency)) return [];
  /** @type {Promise[]} */
  let promises = [];
  let results;
  for (const e of downloadList) {
    promises.push(createPromise(connect, save, e));
    if (promises.length < maxConcurrency) continue;
    // console.log(promises.length);
    try {
      results = await Promise.all(promises);
    } catch (error) {
      throw new Error("connection failed");
    }
    promises = [];
  }
  // console.log(savedCount);
}

module.exports = pooledDownload

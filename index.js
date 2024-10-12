/**
 * @typedef {Object} IConnection
 * @property {Function} download
 * @property {Function} close
*/

/**
 * @param {Function} connect
 * @param {number} maxConcurrency
 * @returns {IConnection[]}
*/
const createConnections = async (connect, maxConcurrency) => {
  const connections = [];
  try {
    // Create as many connections as posible
    for (let i = 0; i < maxConcurrency; i++) {
      connections.push(await connect());
    }
  } catch (error) {
    // Ignore if a connection fail
  }
  // Check if at less one connection was successful
  if (!connections.length)
    throw new Error("connection failed");
  
  return connections;
}

/**
 * @param {IConnection[]} connections
*/
const closeConnections = (connections) => {
  for (const connection of connections) {
    connection.close();
  }
  return true;
}

/**
 * @param {IConnection[]} connections 
 * @param {Function} save
 * @param {string} url
*/
const createPromises = (connections, save, url) => {
  /** @type {Promise<boolean>[]} */
  const promises = []
  for (const connection of connections) {
    promises.push(
      new Promise((resolve, reject) => {
        // Download file
        resolve(connection.download(url));
      }).then(
        (value) => save(value)
      ).then((value) => {
        return true;
      })
    );
  }
  return promises
}

/**
 * @param {Function} connect
 * @param {Function} save 
 * @param {string[]} downloadList 
 * @param {number} maxConcurrency
*/
const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  if (!(downloadList.length && maxConcurrency)) return;
  // Create connections
  /** @type {IConnection[]} */
  const connections = await createConnections(connect, maxConcurrency);
  /** @type {string[]} */
  let urls = [],
    savedCount = 0,
    /** @type {Error} */ error;
  // Iterate url list
  for (const e of downloadList) {
    // Ignore invalid urls
    if (!e.length) continue;
    // Start adding promises to the queue
    urls.push(e);
    // Check if have the same numbers of urls that active connections
    if (urls.length < connections.length)
      continue;
    try {
      // Executed downloads batch
      savedCount += (await Promise.all(createPromises(connections, save, e))).length;
    } catch (err) {
      // Save error if something fails and break loop
      error = err;
      break;
    }
    // Reset promises queue
    urls = [];
  }
  // Close connections
  await closeConnections(connections);
  // Check if error downloading
  if (error)
    // throw new Error("unexpected error during download");
    throw new Error("connection failed");

  console.log("Total saved files:", savedCount);
  return true;
}


module.exports = pooledDownload;

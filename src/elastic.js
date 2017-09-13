const elasticsearch = require("elasticsearch");

function makeClient(url) {
  const client = new elasticsearch.Client({
    host: url
  });

  return {
    index(index, type, id, body) {
      return client.index({
        index,
        type,
        id,
        body
      });
    },
    close() {
      client.close();
    }
  };
}

module.exports = makeClient;

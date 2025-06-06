const newsData = require("./mockup_data.json");
const SingleNewsData = require("./mockup_single_news.json");

module.exports = {
  Query: {
    news: () => newsData,
    singleNewsItem: (_, { id }) =>
      SingleNewsData.find((item) => String(item.id) === String(id)),
  },
};

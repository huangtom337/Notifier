const cheerio = require("cheerio");

const fetchPostIds = async (searchUrl, userAgent) => {
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.6",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "sec-ch-ua": '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
  };

  try {
    const response = await fetch(searchUrl, {
      headers,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    });
    const data = await response.text();
    return parseHtml(data);
  } catch (error) {
    console.error("Error fetching results", error);
    return [];
  }
};

const parseHtml = (html) => {
  const $ = cheerio.load(html);
  let results = [];
  const searchResults = $("ol.cl-static-search-results");
  if (searchResults.length > 0) {
    const resultItems = searchResults.find("li.cl-static-search-result");
    resultItems.each((index, item) => {
      const element = $(item);
      const title = element.attr("title");
      const linkElement = element.find("a");
      const link = linkElement.length > 0 ? linkElement.attr("href") : "";
      const url = new URL(link);
      const pathnameParts = url.pathname.split("/");
      const postId = pathnameParts[pathnameParts.length - 1].split(".")[0];
      const price = element.find(".price").text().trim() || "";
      const location = element.find(".location").text().trim() || "";
      const carTitle = element.find(".title").text().trim() || "";
      results.push({ postId, title, link, price, location, carTitle });
    });
  } else {
    console.log("No search results found");
  }
  return results;
};

module.exports = {
  fetchPostIds,
};

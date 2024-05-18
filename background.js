/**
 * Sets up an alarm to trigger on an interval
 *
 * @returns {void}
 */
const setupAlarm = () => {
  chrome.storage.local.get({ checkInterval: 15 }, (result) => {
    const interval = result.checkInterval;
    // chrome.alarms.create("checkSubscriptions", { periodInMinutes: interval });
    // testing
    chrome.alarms.create("immediateAlarm", { when: Date.now() + 1000 });
  });
};

setupAlarm();

/**
 * Attatches listener to storage. When new interval is set, update it
 *
 * @param {object} changes - Change object
 * @param {string} area - Where the storage is affected (cloud vs local)
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.checkInterval) {
    setupAlarm();
  }
});

/**
 * Attatches listener to alarm, performs check to website
 *
 * @param {object} alarm - Alarm
 */

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkSubscriptions" || alarm.name === "immediateAlarm") {
    chrome.storage.local.get({ subscriptions: [] }, (result) => {
      const subscriptions = result.subscriptions;
      subscriptions.forEach((subscription) => {
        checkCraigslist(subscription);
      });
    });
  }
});

/**
 * Logic to scrape; checks if new content appeared
 *
 * @param {string} term - Search term
 */

const checkCraigslist = async (term) => {
  // const url = `https://sapi.craigslist.org/web/v8/postings/search/full?batch=16-0-360-0-0&cc=US&lang=en&query=${encodeURIComponent(
  // term
  // )}&searchPath=cta`;
  const htmlUrl = `https://vancouver.craigslist.org/search/cta?query=${encodeURIComponent(
    term
  )}#search=1~gallery~0~0`;
  fetch(htmlUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.text();
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
  // const postIds = await fetchPostIds(htmlUrl);
  // console.log(postIds);
};

const fetchPostIds = async (searchUrl) => {
  try {
    const response = await fetch(searchUrl);
    const html = await response.text();
    console.log(html);
    // const parser = new DOMParser();
    // const doc = parser.parseFromString(html, "text/html");
    //
    // const postIds = {};
    // const items = doc.querySelectorAll("li[data-pid]");
    // items.forEach((item) => {
    // const title = item.querySelector("a.result-title").textContent.trim();
    // const postId = item.getAttribute("data-pid");
    // postIds[title] = postId;
    // });

    return postIds;
  } catch (error) {
    console.error("Error fetching Post IDs", error);
    return {};
  }
};

//   // Match JSON data with post IDs
//   jsonData.forEach(post => {
//     const title = post[post.length - 1];
//     const postId = postIds[title];
//     if (postId) {
//       console.log(`Title: ${title}, Post ID: ${postId}`);
//     } else {
//       console.log(`Title: ${title}, Post ID not found`);
//     }
//   });

// function notifyUser(items) {
//   items.forEach(item => {
//     const options = {
//       type: 'basic',
//       iconUrl: 'icon.png',
//       title: item.title,
//       message: `New post: ${item.title}`,
//       buttons: [{ title: 'View' }],
//       isClickable: true
//     };
//     chrome.notifications.create(item.postId, options);
//   });
// }

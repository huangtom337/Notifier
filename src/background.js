const { fetchPostIds } = require("./utils");

const notifications = {};

const storeUserAgent = async () => {
  try {
    const userAgent = navigator.userAgent;
    chrome.storage.local.set({ userAgent });
    console.log("User-Agent stored:", userAgent);
  } catch (error) {
    console.error("Error retrieving user agent:", error);
  }
};

// Get User agent when extension is installed
chrome.runtime.onInstalled.addListener(storeUserAgent);

/**
 * Sets up an alarm to trigger on an interval
 *
 * @returns {void}
 */
const setupAlarm = () => {
  chrome.storage.local.get({ checkInterval: 15 }, (result) => {
    const interval = result.checkInterval;
    chrome.alarms.create("checkSubscriptions", { periodInMinutes: interval });
    // testing
    // chrome.alarms.create("immediateAlarm", { when: Date.now() + 1000 });
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
 * Attaches listener to alarm, performs check to website
 *
 * @param {object} alarm - Alarm
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkSubscriptions" || alarm.name === "immediateAlarm") {
    chrome.storage.local.get({ subscriptions: [] }, async (result) => {
      const subscriptions = result.subscriptions;
      chrome.storage.local.get(["userAgent"], async (result) => {
        const userAgent = result.userAgent;
        for (let i = 0; i < subscriptions.length; i++) {
          await checkCraigslist(subscriptions, i, userAgent);
          console.log("checked");
        }
      });
    });
  }
});

/**
 * Logic to scrape; checks if new content appeared
 *
 * @param {string} term - Search term
 */
const checkCraigslist = async (subscriptions, index, userAgent) => {
  const subscription = subscriptions[index];
  const htmlUrl = `https://vancouver.craigslist.org/search/cta?query=${encodeURIComponent(
    subscription.term
  )}`;
  const posts = await fetchPostIds(htmlUrl, userAgent);

  if (posts.length > 0) {
    let newPostsCount = 0;
    const newPosts = [];
    for (const post of posts) {
      if (post.postId === subscription.lastPostId) {
        break;
      }
      newPostsCount++;
      newPosts.push(post);
    }
    if (newPostsCount > 0) {
      subscription.lastPostId = posts[0].postId;
      notifyUser(newPostsCount, subscription.term, newPosts);
    } else if (subscription.lastPostId === "no-posts-found") {
      subscription.lastPostId = posts[0].postId; // update default value
    }
    subscriptions[index] = subscription;
    chrome.storage.local.set({ subscriptions });
  }
};

/**
 * Notifies user the new posts that matches their subscription
 *
 * @param {int} newPostsCount
 * @param {string} subscriptionTerm
 * @param {array} newPosts
 *
 */
const notifyUser = (newPostsCount, subscriptionTerm, newPosts) => {
  const options = {
    type: "basic",
    iconUrl: "../icons/icon.png",
    title: "New Craigslist Posts",
    message: `You have ${newPostsCount} new posts for "${subscriptionTerm}". Click to view more.`,
    buttons: [{ title: "View" }],
    isClickable: true,
  };

  const notificationId = `notification_${Date.now()}`;
  notifications[notificationId] = newPosts;

  chrome.notifications.create(notificationId, options);
};

chrome.notifications.onClicked.addListener((notificationId) => {
  const newPosts = notifications[notificationId];
  if (newPosts) {
    newPosts.forEach((post) => {
      showDetailedNotification(post);
    });
  }
});

/**
 * Displays a specific notification to user
 *
 * @param {object} post
 */
const showDetailedNotification = (post) => {
  const options = {
    type: "basic",
    iconUrl: "../icons/icon.png",
    title: post.title,
    message: `Price: ${post.price}\nLocation: ${post.location}`,
    buttons: [{ title: "Go to site" }],
    isClickable: true,
  };

  const notificationId = post.postId;
  notifications[notificationId] = post.link;

  chrome.notifications.create(notificationId, options);
};

chrome.notifications.onButtonClicked.addListener(
  (notificationId, buttonIndex) => {
    const url = notifications[notificationId];
    if (url && buttonIndex === 0) {
      chrome.tabs.create({ url });
    }
  }
);

const { fetchPostIds } = require("./utils");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribeForm");
  const searchTermInput = document.getElementById("searchTerm");
  const subscriptionsList = document.getElementById("subscriptions");
  const intervalForm = document.getElementById("intervalForm");
  const intervalInput = document.getElementById("intervalInput");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const searchTerm = searchTermInput.value;
    if (searchTerm) {
      const htmlUrl = `https://vancouver.craigslist.org/search/cta?query=${encodeURIComponent(
        searchTerm
      )}`;
      const posts = await fetchPostIds(htmlUrl, ""); // Pass userAgent to fetch function
      const lastPostId = posts.length > 0 ? posts[0].postId : "no-posts-found";
      chrome.storage.local.get({ subscriptions: [] }, (result) => {
        const subscriptions = result.subscriptions;
        subscriptions.push({ term: searchTerm, lastPostId });
        chrome.storage.local.set({ subscriptions }, () => {
          searchTermInput.value = "";
          displaySubscriptions();
        });
      });
    }
  });

  intervalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const interval = parseInt(intervalInput.value, 10);
    if (!isNaN(interval) && interval > 0) {
      chrome.storage.local.set({ checkInterval: interval }, () => {
        intervalInput.value = "";
        displayInterval();
        alert(`Interval set to ${interval} minutes`);
      });
    }
  });

  const displayInterval = () => {
    chrome.storage.local.get({ checkInterval: "Not set" }, (result) => {
      const currentInterval = result.checkInterval;
      document.getElementById("currentInterval").textContent = currentInterval;
    });
  };

  const displaySubscriptions = () => {
    subscriptionsList.innerHTML = "";
    chrome.storage.local.get({ subscriptions: [] }, (result) => {
      const subscriptions = result.subscriptions;
      subscriptions.forEach((subscription, index) => {
        const li = document.createElement("li");
        li.textContent = subscription.term;
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.id = `delete-button-${index}`;
        deleteButton.onclick = () => deleteSubscription(index);
        li.appendChild(deleteButton);
        subscriptionsList.appendChild(li);
      });
    });
  };

  const deleteSubscription = (index) => {
    chrome.storage.local.get({ subscriptions: [] }, (result) => {
      const subscriptions = result.subscriptions;
      subscriptions.splice(index, 1);
      chrome.storage.local.set({ subscriptions }, () => {
        displaySubscriptions();
      });
    });
  };

  displaySubscriptions();
  displayInterval(); // Ensure interval is displayed on load
});

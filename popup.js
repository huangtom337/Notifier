document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("subscribeForm");
  const searchTermInput = document.getElementById("searchTerm");
  const subscriptionsList = document.getElementById("subscriptions");
  const intervalForm = document.getElementById("intervalForm");
  const intervalInput = document.getElementById("intervalInput");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const searchTerm = searchTermInput.value;
    if (searchTerm) {
      chrome.storage.local.get({ subscriptions: [] }, (result) => {
        const subscriptions = result.subscriptions;
        subscriptions.push(searchTerm);
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
        alert(`Interval set to ${interval} minutes`);
      });
    }
  });

  function displaySubscriptions() {
    subscriptionsList.innerHTML = "";
    chrome.storage.local.get({ subscriptions: [] }, (result) => {
      const subscriptions = result.subscriptions;
      subscriptions.forEach((term) => {
        const li = document.createElement("li");
        li.textContent = term;
        subscriptionsList.appendChild(li);
      });
    });
  }

  displaySubscriptions();
});

console.log("Website content script loaded");

// This script now only needs to notify the background script that the page has loaded
if (window.location.pathname === "/upload-image") {
  console.log("On upload-image page, notifying background script");
  chrome.runtime.sendMessage({ action: "pageLoaded" });

  // Call sendAuthTokenToExtension when appropriate
  // For example, you might want to do this after the page has fully loaded
  window.addEventListener("load", () => {
    sendAuthTokenToExtension();
  });
}

function sendAuthTokenToExtension() {
  chrome.runtime.sendMessage({ action: "getAuthToken" }, (response) => {
    if (response.success) {
      console.log("Auth token successfully retrieved and stored");
      window.close();
    } else {
      console.log("Failed to retrieve auth token");
    }
  });
}

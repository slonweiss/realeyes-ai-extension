import { jwtVerify, createRemoteJWKSet } from "jose";

let authTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);
  if (request.action === "showNotification") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icon.png",
        title: "Hello World",
        message: "You clicked the Hello World button!",
      },
      () => {
        sendResponse({ success: true });
      }
    );
    return true; // Indicates we will send a response asynchronously
  }

  if (request.action === "sendImage") {
    const { url, mimeType, filename, size, sample, sha256Hash, origin } =
      request.imageData;

    // Create formData here
    const createFormData = () => {
      return fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          const uint8Array = new Uint8Array(arrayBuffer);
          const blob = new Blob([uint8Array], { type: mimeType });
          const file = new File([blob], filename, { type: mimeType });

          const formData = new FormData();
          formData.append("image", file);
          formData.append("url", url);
          formData.append("mimeType", mimeType);
          formData.append("filename", filename);
          formData.append("size", size.toString());
          formData.append("sha256Hash", sha256Hash);
          formData.append("origin", origin);

          return formData;
        });
    };

    new Promise((resolve) => {
      chrome.storage.local.get(["authToken"], function (result) {
        resolve(result.authToken);
      });
    }).then((authToken) => {
      if (!authToken) {
        initiateAuthentication();
        sendResponse({ error: "Authentication required" });
      } else {
        createFormData().then((formData) => {
          fetch("https://api.realeyes.ai/analyze-image", {
            method: "POST",
            body: formData,
            headers: {
              "X-Origin": origin,
              Authorization: `Bearer ${authToken}`,
            },
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log("Background: Processed response:", data);
              sendResponse(data);
            })
            .catch((error) => {
              console.error("Background: Error:", error);
              sendResponse({ error: error.message });
            });
        });
      }
    });

    return true; // Indicates that the response is sent asynchronously
  }

  if (request.action === "reloadContentScript") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.executeScript(
          tabs[0].id,
          { file: "social-content.js" },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Failed to reload content script:",
                chrome.runtime.lastError
              );
              sendResponse({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              console.log("Content script reloaded successfully");
              sendResponse({ success: true });
            }
          }
        );
      } else {
        sendResponse({ success: false, error: "No active tab found" });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }

  if (request.action === "authenticationComplete") {
    chrome.tabs.remove(sender.tab.id);
  }

  if (request.action === "initiateAuthentication") {
    initiateAuthentication();
  }

  if (request.action === "pageLoaded") {
    console.log("Background script received 'pageLoaded' message.");
    checkForAuthToken(sender.tab.id);
  }

  return false; // For other messages, we're not sending a response
});

chrome.runtime.onInstalled.addListener(function () {
  // Set default settings
  const defaultSettings = {
    enableOverlay: true,
    facebook: true,
    twitter: true,
    instagram: true,
    linkedin: true,
    reddit: true,
  };
  chrome.storage.sync.set(defaultSettings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    console.log("Settings changed:", changes);
    chrome.tabs.query(
      {
        url: [
          "https://*.linkedin.com/*",
          "https://*.facebook.com/*",
          "https://*.twitter.com/*",
          "https://*.x.com/*",
          "https://*.instagram.com/*",
          "https://*.reddit.com/*",
        ],
      },
      (tabs) => {
        tabs.forEach((tab) => {
          console.log("Sending settingsChanged message to tab:", tab.id);
          chrome.tabs.sendMessage(
            tab.id,
            { action: "settingsChanged", changes },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log(
                  `Error sending settingsChanged message to tab ${tab.id}:`,
                  chrome.runtime.lastError.message
                );
              } else {
                console.log(`Settings updated successfully in tab ${tab.id}`);
              }
            }
          );
        });
      }
    );
  }
});

// Function to log all stored data
function logAllStoredData() {
  chrome.storage.local.get(null, function (items) {
    console.log(
      "All stored data (from background):",
      JSON.stringify(items, null, 2)
    );
    console.log("Storage size:", Object.keys(items).length);
  });
}

// Function to check if the user is authenticated
function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["authToken"], function (result) {
      resolve(result.authToken);
    });
  });
}

// Function to initiate authentication
function initiateAuthentication() {
  console.log("Initiating authentication");
  if (authTabId !== null) {
    console.log("Authentication tab already open, focusing on it");
    chrome.tabs.update(authTabId, { active: true });
    return;
  }

  chrome.tabs.create(
    { url: "https://realeyes.ai/upload-image" },
    function (tab) {
      console.log("Authentication tab created:", tab.id);
      authTabId = tab.id;
      chrome.tabs.onRemoved.addListener(function (closedTabId) {
        if (closedTabId === authTabId) {
          console.log("Authentication tab closed");
          authTabId = null;
        }
      });
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (
          tabId === tab.id &&
          info.url &&
          info.url.startsWith("https://realeyes.ai/upload-image")
        ) {
          console.log("Authentication page loaded, checking for auth token");
          chrome.tabs.onUpdated.removeListener(listener);
          checkForAuthToken(tabId);
        }
      });
    }
  );
}

function checkForAuthToken(tabId, retryCount = 0) {
  const MAX_RETRIES = 5;
  console.log("Checking for auth token");
  chrome.cookies.get(
    { url: "https://realeyes.ai", name: "opp_access_token" },
    async function (cookie) {
      if (cookie) {
        console.log("Auth token found in cookie:", cookie.value);
        if (await validateJWT(cookie.value)) {
          // Store the auth token securely in extension's local storage
          chrome.storage.local.set({ authToken: cookie.value }, function () {
            console.log("Valid auth token saved to local storage");
            chrome.tabs.remove(tabId);
          });
        } else {
          console.log("Invalid or expired auth token");
          chrome.storage.local.remove("authToken");
          chrome.tabs.remove(tabId);
          // Optionally, notify the user that authentication failed
        }
      } else {
        console.log("Auth token not found");
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retrying in 1 second (attempt ${retryCount + 1}/${MAX_RETRIES})`
          );
          setTimeout(() => checkForAuthToken(tabId, retryCount + 1), 1000);
        } else {
          console.log("Max retries reached. Authentication failed.");
          chrome.tabs.remove(tabId);
          // Optionally, notify the user that authentication failed after retries
        }
      }
    }
  );
}

async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAuthToken") {
    chrome.cookies.get(
      { url: "https://realeyes.ai", name: "opp_access_token" },
      async function (cookie) {
        if (cookie && (await verifyToken(cookie.value))) {
          chrome.storage.local.set({ authToken: cookie.value }, function () {
            console.log("Valid auth token saved to local storage");
            sendResponse({ success: true });
          });
        } else {
          console.log("Invalid or expired auth token");
          chrome.storage.local.remove("authToken");
          sendResponse({ success: false });
        }
      }
    );
    return true; // Indicates we will respond asynchronously
  }
});

// Add this to check the auth state periodically
setInterval(() => {
  chrome.storage.local.get(["authToken"], function (result) {
    console.log("Periodic check - Auth token:", result.authToken);
    if (result.authToken) {
      if (validateJWT(result.authToken)) {
        console.log("Periodic auth check: Valid token exists");
      } else {
        console.log("Periodic auth check: Token is invalid or expired");
        chrome.storage.local.remove("authToken", function () {
          console.log("Auth token removed");
          logAllStoredData(); // Log all data after removal
        });
      }
    } else {
      console.log("Periodic auth check: No token");
    }
  });
}, 60000); // Check every minute

// Log all stored data every 2 minutes
setInterval(logAllStoredData, 120000);

// Call logAllStoredData immediately when the background script loads
logAllStoredData();

async function validateJWT(token) {
  try {
    const region = "us-east-2"; // Replace with your actual AWS region
    const userPoolId = "us-east-2_1jhX1tAKk"; // Replace with your actual User Pool ID
    const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const jwksUrl = `${expectedIssuer}/.well-known/jwks.json`;

    const JWKS = createRemoteJWKSet(new URL(jwksUrl));

    const { payload, protectedHeader } = await jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
    });

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log("Token has expired");
      return false;
    }

    // Add any additional validation checks here

    return true;
  } catch (error) {
    console.error("Error validating JWT:", error);
    return false;
  }
}

// Log storage when background script initializes
logAllStoredData();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "setAuthToken") {
    console.log("Attempting to save auth token:", request.token);
    chrome.storage.local.set({ authToken: request.token }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error saving auth token:", chrome.runtime.lastError);
      } else {
        console.log("Auth token saved successfully");
        logAllStoredData(); // Log all data after saving
      }
    });
  }
});

// Log storage periodically (every 5 minutes)
setInterval(logAllStoredData, 300000);

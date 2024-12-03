import { jwtVerify, createRemoteJWKSet } from "jose";

let authTabId = null;
let authTabListeners = new Map(); // Store cleanup functions for each tab

const AUTH_URL = "https://realeyes.ai/upload-image";

// Utility function to safely remove tabs
function removeTabIfExists(tabId) {
  if (!tabId) return;

  chrome.tabs.get(tabId, function (tab) {
    if (chrome.runtime.lastError) {
      console.log(`Tab ${tabId} does not exist, no need to remove`);
      // Make sure to clear authTabId if this was the auth tab
      if (tabId === authTabId) {
        authTabId = null;
      }
    } else {
      chrome.tabs.remove(tabId);
    }
  });
}

// Utility function to safely update tabs
function updateTabIfExists(tabId, updateProperties) {
  chrome.tabs.get(tabId, function (tab) {
    if (chrome.runtime.lastError) {
      console.error(
        `Tab with id ${tabId} does not exist:`,
        chrome.runtime.lastError
      );
    } else {
      chrome.tabs.update(tabId, updateProperties);
    }
  });
}

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
    const {
      url,
      mimeType,
      filename,
      size,
      sha256Hash,
      origin,
      storeData,
      userId,
    } = request.imageData;

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
          formData.append("storeData", storeData.toString());
          formData.append("userId", userId);

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
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
    } else if (authTabId !== null) {
      // Use the stored authTabId if sender.tab.id is not available
      chrome.tabs.remove(authTabId);
      authTabId = null;
    } else {
      console.error(
        "Cannot close tab: sender.tab.id is undefined and authTabId is null"
      );
    }
  }

  if (request.action === "initiateAuthentication") {
    initiateAuthentication();
  }

  if (request.action === "pageLoaded") {
    console.log("Background script received 'pageLoaded' message.");
    checkForAuthToken(sender.tab.id);
  }

  if (request.action === "submitFeedback") {
    // Get the auth token first
    chrome.storage.local.get(["authToken"], function (result) {
      const authToken = result.authToken;

      if (!authToken) {
        console.error("No auth token found");
        sendResponse({ success: false, error: "Authentication required" });
        return;
      }

      const { imageHash, feedbackType, comment, userId } = request.feedbackData;

      fetch("https://api.realeyes.ai/submit-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Origin": request.origin,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          imageHash,
          feedbackType,
          comment,
          userId,
        }),
      })
        .then(async (response) => {
          const data = await response.json();

          // Handle 409 as a special case
          if (response.status === 409) {
            return sendResponse({
              success: false,
              alreadySubmitted: true,
              message:
                data.error ||
                "User has already submitted feedback for this image",
            });
          }

          // Handle other error cases
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Handle success case
          console.log("Feedback submitted successfully:", data);
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          console.error("Error submitting feedback:", error);
          sendResponse({
            success: false,
            error: error.message,
            status: error.status,
          });
        });
    });

    return true; // Will respond asynchronously
  }

  if (request.action === "openExtensionPopup") {
    try {
      chrome.action.openPopup();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
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
          // First try to send message
          chrome.tabs.sendMessage(
            tab.id,
            { action: "settingsChanged", changes },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log("Content script not found, injecting it first...");
                // If failed, inject the content script and try again
                chrome.scripting.executeScript(
                  {
                    target: { tabId: tab.id },
                    files: ["social-content.js"],
                  },
                  () => {
                    if (chrome.runtime.lastError) {
                      console.log(
                        "Could not inject content script:",
                        chrome.runtime.lastError.message
                      );
                      return;
                    }
                    // Try sending the message again after injection
                    setTimeout(() => {
                      chrome.tabs.sendMessage(
                        tab.id,
                        { action: "settingsChanged", changes },
                        (response) => {
                          if (chrome.runtime.lastError) {
                            console.log(
                              "Still could not send message after injection:",
                              chrome.runtime.lastError.message
                            );
                          } else {
                            console.log(
                              "Settings updated successfully after content script injection"
                            );
                          }
                        }
                      );
                    }, 100); // Small delay to ensure script is loaded
                  }
                );
              } else {
                console.log("Settings updated successfully");
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

// Helper to clean up tab listeners
function cleanupTabListeners(tabId) {
  if (authTabListeners.has(tabId)) {
    const cleanupFns = authTabListeners.get(tabId);
    cleanupFns.forEach((fn) => fn());
    authTabListeners.delete(tabId);
  }
}

// Handle tab removal
function handleTabRemoval(tabId) {
  if (tabId === authTabId) {
    console.log("Auth tab was closed, cleaning up");
    cleanupTabListeners(tabId);
    authTabId = null;
  }
}

// Main authentication handler
async function initiateAuthentication() {
  console.log("Initiating authentication");

  try {
    // Clean up any existing auth tab
    if (authTabId !== null) {
      try {
        const tab = await chrome.tabs.get(authTabId);
        if (tab) {
          await chrome.tabs.remove(authTabId);
        }
      } catch (e) {
        console.log("Previous auth tab already closed");
      }
      cleanupTabListeners(authTabId);
      authTabId = null;
    }

    // Create new auth tab
    const tab = await chrome.tabs.create({ url: AUTH_URL });
    authTabId = tab.id;

    // Set up listeners
    const removeListener = (tabId) => handleTabRemoval(tabId);
    const updateListener = (tabId, changeInfo) => {
      if (
        tabId === authTabId &&
        changeInfo.url &&
        changeInfo.url.startsWith(AUTH_URL)
      ) {
        checkForAuthToken(tabId);
      }
    };

    // Store cleanup functions
    authTabListeners.set(authTabId, [
      () => chrome.tabs.onRemoved.removeListener(removeListener),
      () => chrome.tabs.onUpdated.removeListener(updateListener),
    ]);

    // Add listeners
    chrome.tabs.onRemoved.addListener(removeListener);
    chrome.tabs.onUpdated.addListener(updateListener);
  } catch (error) {
    console.error("Error in initiateAuthentication:", error);
    authTabId = null;
    throw error;
  }
}

// Update message handler for initiateLogin
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "initiateLogin") {
    initiateAuthentication()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Login initiation failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  // ... rest of your message handlers ...
});

// Update checkForAuthToken to handle errors better
async function checkForAuthToken(tabId, retryCount = 0) {
  const MAX_RETRIES = 5;

  try {
    const cookie = await chrome.cookies.get({
      url: "https://realeyes.ai",
      name: "opp_access_token",
    });

    if (cookie) {
      console.log("Auth token found in cookie");
      const isValid = await validateJWT(cookie.value);

      if (isValid) {
        await chrome.storage.local.set({ authToken: cookie.value });
        console.log("Valid auth token saved to local storage");
        cleanupTabListeners(tabId);
        if (tabId === authTabId) {
          try {
            await chrome.tabs.remove(tabId);
          } catch (e) {
            console.log("Tab already closed");
          }
          authTabId = null;
        }
      } else {
        console.log("Invalid or expired auth token");
        await chrome.storage.local.remove("authToken");
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => checkForAuthToken(tabId, retryCount + 1), 1000);
        }
      }
    } else if (retryCount < MAX_RETRIES) {
      setTimeout(() => checkForAuthToken(tabId, retryCount + 1), 1000);
    }
  } catch (error) {
    console.error("Error checking auth token:", error);
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => checkForAuthToken(tabId, retryCount + 1), 1000);
    }
  }
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

// Listen for cookie changes
chrome.cookies.onChanged.addListener(function (changeInfo) {
  const { cookie, removed } = changeInfo;

  // Only handle cookies from realeyes.ai domain
  if (cookie.domain.includes("realeyes.ai")) {
    if (cookie.name === "opp_access_token") {
      if (!removed) {
        // Cookie was added/updated
        console.log("Auth cookie detected");
        chrome.storage.local.set({ authToken: cookie.value }, function () {
          console.log("Auth token saved to local storage");

          // If this was from our auth tab, close it
          if (authTabId) {
            chrome.tabs.get(authTabId, function (tab) {
              if (tab) {
                chrome.tabs.remove(authTabId);
              }
              authTabId = null;
            });
          }

          // Notify any open tabs that auth state changed
          chrome.tabs.query({}, function (tabs) {
            tabs.forEach((tab) => {
              chrome.tabs
                .sendMessage(tab.id, {
                  action: "authStateChanged",
                  isAuthenticated: true,
                })
                .catch(() => {}); // Ignore errors for tabs that can't receive messages
            });
          });
        });
      } else {
        // Cookie was removed - handle logout
        chrome.storage.local.remove("authToken", function () {
          console.log("Auth token removed from local storage");

          // Notify tabs of logout
          chrome.tabs.query({}, function (tabs) {
            tabs.forEach((tab) => {
              chrome.tabs
                .sendMessage(tab.id, {
                  action: "authStateChanged",
                  isAuthenticated: false,
                })
                .catch(() => {});
            });
          });
        });
      }
    }
  }
});

// Add error handling for tab operations
async function createOrUpdateTab(url) {
  try {
    const existingTabs = await chrome.tabs.query({ url: url });

    if (existingTabs.length > 0) {
      return await chrome.tabs.update(existingTabs[0].id, { active: true });
    } else {
      return await chrome.tabs.create({ url: url });
    }
  } catch (error) {
    console.error("Error managing tab:", error);
    // Create new tab as fallback
    return await chrome.tabs.create({ url: url });
  }
}

// Update your login handler
async function handleLogin() {
  try {
    // Close existing auth tab if it exists
    if (authTabId) {
      try {
        await chrome.tabs.remove(authTabId);
      } catch (e) {
        console.log("No existing auth tab to close");
      }
    }

    // Create new auth tab
    const tab = await chrome.tabs.create({ url: AUTH_URL });
    authTabId = tab.id;

    // Listen for tab close
    chrome.tabs.onRemoved.addListener((tabId) => {
      if (tabId === authTabId) {
        authTabId = null;
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    authTabId = null;
  }
}

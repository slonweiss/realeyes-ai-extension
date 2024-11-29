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
    chrome.tabs.remove(sender.tab.id);
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

// Handle login requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "initiateLogin") {
    // Create auth tab if not exists
    if (!authTabId) {
      chrome.tabs.create(
        {
          url: "https://realeyes.ai/upload-image",
          active: true,
        },
        function (tab) {
          authTabId = tab.id;

          // Set up listener for URL changes to detect successful login
          chrome.tabs.onUpdated.addListener(function onTabUpdate(
            tabId,
            changeInfo
          ) {
            if (tabId === authTabId && changeInfo.url) {
              if (changeInfo.url.includes("realeyes.ai/upload-image")) {
                // Check for auth cookie
                chrome.cookies.get(
                  {
                    url: "https://realeyes.ai",
                    name: "opp_access_token",
                  },
                  function (cookie) {
                    if (cookie) {
                      // Store the auth token
                      chrome.storage.local.set(
                        { authToken: cookie.value },
                        function () {
                          console.log("Auth token saved to local storage");

                          // Close the auth tab
                          chrome.tabs.remove(authTabId);
                          authTabId = null;

                          // Notify tabs of successful login
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
                        }
                      );
                    }
                  }
                );
              }
            }
          });
        }
      );
    } else {
      // Focus existing auth tab
      chrome.tabs.update(authTabId, { active: true });
    }
    sendResponse({ success: true });
    return true;
  }
});

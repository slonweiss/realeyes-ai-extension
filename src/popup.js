document.addEventListener("DOMContentLoaded", function () {
  const loginContainer = document.getElementById("loginContainer");
  const settingsContainer = document.getElementById("settingsContainer");
  const enableOverlayToggle = document.getElementById("enableOverlay");
  const siteToggles = [
    "facebook",
    "twitter",
    "instagram",
    "linkedin",
    "reddit",
  ];
  const settingsContent = document.getElementById("settingsContent");
  const loginButton = document.getElementById("login");
  const logoutButton = document.getElementById("logoutButton");

  console.log("Popup script loaded");

  function logAllStorageData() {
    chrome.storage.local.get(null, function (items) {
      console.log(
        "All stored data (from popup):",
        JSON.stringify(items, null, 2)
      );
    });
  }

  // Log storage when popup opens
  logAllStorageData();

  function checkAuthentication() {
    return new Promise((resolve) => {
      // First check for valid cookie
      chrome.cookies.get(
        {
          url: "https://realeyes.ai",
          name: "opp_access_token",
        },
        (cookie) => {
          if (cookie && cookie.value) {
            // If cookie exists, store it in local storage and resolve as authenticated
            chrome.storage.local.set({ authToken: cookie.value }, () => {
              console.log("Auth token set from existing cookie");
              resolve(true);
            });
          } else {
            // If no cookie, fall back to checking local storage
            chrome.storage.local.get(["authToken"], function (result) {
              console.log("No cookie found, checking local storage:", result);
              resolve(!!result.authToken);
            });
          }
        }
      );
    });
  }

  checkAuthentication().then((isAuthenticated) => {
    console.log("Authentication check result:", isAuthenticated);
    if (isAuthenticated) {
      showSettings();
    } else {
      showLogin();
    }
  });

  function checkExistingCookie() {
    return new Promise((resolve) => {
      chrome.cookies.get(
        {
          url: "https://realeyes.ai",
          name: "opp_access_token",
        },
        (cookie) => {
          if (cookie && cookie.value) {
            // Store the cookie value as authToken
            chrome.storage.local.set({ authToken: cookie.value }, () => {
              console.log("Auth token set from existing cookie");
              resolve(true);
            });
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  function showLogin() {
    console.log("Showing login");
    loginContainer.style.display = "block";
    settingsContainer.style.display = "none";
  }

  function showSettings() {
    console.log("Showing settings");
    loginContainer.style.display = "none";
    settingsContainer.style.display = "block";
    loadSavedSettings();
  }

  // Load saved settings
  function loadSavedSettings() {
    chrome.storage.sync.get(
      [
        "enableOverlay",
        "facebook",
        "twitter",
        "instagram",
        "linkedin",
        "reddit",
      ],
      function (items) {
        enableOverlayToggle.checked = items.enableOverlay !== false;
        siteToggles.forEach((site) => {
          document.getElementById(site).checked = items[site] !== false;
        });
        updateToggleStates();
        updateContentScript(items);
      }
    );
  }

  // Function to update content script
  function updateContentScript(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        // Skip chrome:// and other protected URLs
        if (
          tabs[0].url.startsWith("chrome://") ||
          tabs[0].url.startsWith("chrome-extension://")
        ) {
          console.log("Skipping protected URL:", tabs[0].url);
          return;
        }

        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "updateSettings", settings: settings },
          function (response) {
            if (chrome.runtime.lastError) {
              console.log(
                "Content script not found in tab. Injecting content script."
              );
              chrome.scripting.executeScript(
                {
                  target: { tabId: tabs[0].id },
                  files: ["social-content.js"],
                },
                () => {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "Cannot inject script into this tab:",
                      chrome.runtime.lastError.message
                    );
                    return;
                  }
                  // Retry sending the message after injecting the script
                  chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "updateSettings", settings: settings },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        console.log(
                          "Error after injecting content script:",
                          chrome.runtime.lastError.message
                        );
                      } else {
                        console.log(
                          "Settings updated in content script after injection"
                        );
                      }
                    }
                  );
                }
              );
            } else {
              console.log("Settings updated in content script");
            }
          }
        );
      } else {
        console.log("No active tab found");
      }
    });
  }

  // Function to update toggle states
  function updateToggleStates() {
    const isOverlayEnabled = enableOverlayToggle.checked;

    if (isOverlayEnabled) {
      settingsContent.classList.remove("disabled-section");
    } else {
      settingsContent.classList.add("disabled-section");
    }

    siteToggles.forEach((site) => {
      const siteToggle = document.getElementById(site);
      siteToggle.disabled = !isOverlayEnabled;
    });
  }

  // Event listener for login button
  if (loginButton) {
    loginButton.addEventListener("click", async function () {
      try {
        await chrome.runtime.sendMessage({ action: "initiateLogin" });
        window.close();
      } catch (error) {
        console.error("Login click error:", error);
      }
    });
  } else {
    console.error("Login button not found");
  }

  // Event listener for enable overlay toggle
  if (enableOverlayToggle) {
    enableOverlayToggle.addEventListener("change", updateToggleStates);
  } else {
    console.error("Enable overlay toggle not found");
  }

  const body = document.querySelector("body");
  const saveIndicator = document.createElement("div");
  saveIndicator.className = "save-indicator";
  saveIndicator.textContent = "Settings saved";
  body.appendChild(saveIndicator);

  // Replace the debouncedSave function with this instant save function
  function saveSettings() {
    const settings = {
      enableOverlay: enableOverlayToggle.checked,
    };

    siteToggles.forEach((site) => {
      const siteToggle = document.getElementById(site);
      settings[site] = siteToggle.checked;
    });

    chrome.storage.sync.set(settings, function () {
      console.log("Settings saved");
      updateContentScript(settings);

      // Show save indicator
      saveIndicator.classList.add("show");

      // Hide indicator after 1.5 seconds
      setTimeout(() => {
        saveIndicator.classList.remove("show");
      }, 1500);
    });
  }

  // Update event listeners to use instant save
  if (enableOverlayToggle) {
    enableOverlayToggle.addEventListener("change", () => {
      updateToggleStates();
      saveSettings();
    });
  }

  // Update site toggle listeners
  siteToggles.forEach((site) => {
    const toggle = document.getElementById(site);
    if (toggle) {
      toggle.addEventListener("change", saveSettings);
    }
  });

  // Remove any existing save button code since we're auto-saving
  const saveButton = document.getElementById("save");
  if (saveButton) {
    saveButton.remove();
  }

  // Check for authentication status changes
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.authToken) {
      if (changes.authToken.newValue) {
        showSettings();
      } else {
        showLogin();
      }
    }
  });

  // Event listener for logout button
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      // Remove local storage auth token
      chrome.storage.local.remove("authToken", function () {
        console.log("Auth token removed");

        // Remove the cookie
        chrome.cookies.remove(
          {
            url: "https://realeyes.ai",
            name: "opp_access_token",
          },
          function () {
            // Construct logout URL
            const logoutUrl = new URL("https://signin.realeyes.ai/logout");
            logoutUrl.searchParams.append(
              "client_id",
              "49nfihgrtdm78kf6su5brla4o5"
            );
            logoutUrl.searchParams.append("logout_uri", "https://realeyes.ai");

            // Open logout URL and close popup
            chrome.tabs.create({ url: logoutUrl.toString() });
            window.close();
          }
        );
      });
    });
  }
});

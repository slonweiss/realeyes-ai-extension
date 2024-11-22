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
  const saveButton = document.getElementById("save");

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
      chrome.storage.local.get(["authToken"], function (result) {
        console.log("Auth token check result:", result);
        resolve(!!result.authToken);
      });
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
                  // Retry sending the message after injecting the script
                  chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "updateSettings", settings: settings },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        console.error(
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
        // Handle the case when there's no active tab
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
    loginButton.addEventListener("click", function () {
      console.log("Login button clicked");
      chrome.runtime.sendMessage({ action: "initiateAuthentication" });
      window.close(); // Close the popup after initiating login
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

  // Event listener for save button
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      console.log("Save settings button clicked");
      const settings = {
        enableOverlay: enableOverlayToggle.checked,
      };

      siteToggles.forEach((site) => {
        const siteToggle = document.getElementById(site);
        settings[site] = siteToggle.checked;
      });

      chrome.storage.sync.set(settings, function () {
        console.log("Settings saved");
        saveButton.textContent = "Saved!";
        saveButton.classList.add("success");
        setTimeout(() => {
          saveButton.textContent = "Save Settings";
          saveButton.classList.remove("success");
        }, 2000);

        updateContentScript(settings);
      });
    });
  } else {
    console.error("Save button not found");
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
});

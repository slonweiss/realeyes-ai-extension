(() => {
  // At the top of the file, add:
  console.log("Social content script loaded");

  // Utility function to debounce frequent function calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Global variables
  let extensionEnabled = false;
  let siteEnabled = false;
  let currentSite = null;

  let retryCount = 0;
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000; // 1 second

  let bodyObserver;
  let observer;

  // Remove all overlay elements from the page
  function removeAllOverlays() {
    const overlays = document.querySelectorAll(".image-overlay");
    overlays.forEach((overlay) => overlay.remove());
  }

  // Check if image processing should occur based on user settings
  async function shouldProcessImage() {
    try {
      const items = await new Promise((resolve, reject) => {
        chrome.storage.sync.get(
          [
            "enableOverlay",
            "facebook",
            "twitter",
            "instagram",
            "linkedin",
            "reddit",
          ],
          (items) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(items);
            }
          }
        );
      });

      extensionEnabled = items.enableOverlay !== false;
      siteEnabled = items[currentSite] !== false;

      return extensionEnabled && siteEnabled;
    } catch (error) {
      console.error("Error in shouldProcessImage:", error);
      return false;
    }
  }

  // Main function to add or update overlays on images
  async function addOrUpdateOverlayToImages() {
    const shouldProcess = await shouldProcessImage();
    if (!shouldProcess) {
      removeAllOverlays();
      return;
    }

    const allImages = [];

    // Recursive function to traverse DOM and shadow DOM
    function traverse(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (
        node.tagName.toLowerCase() === "img" &&
        !node.dataset.overlayProcessed
      ) {
        allImages.push(node);
      }

      if (node.shadowRoot) {
        traverse(node.shadowRoot);
      }

      node.childNodes.forEach((child) => traverse(child));
    }

    traverse(document.body);

    // Special handling for Instagram
    if (currentSite === "instagram") {
      const instagramImages = document.querySelectorAll(
        'img[srcset], img[src*="instagram"]'
      );
      instagramImages.forEach((img) => {
        if (!img.dataset.overlayProcessed) {
          allImages.push(img);
        }
      });
    }

    // Special handling for Reddit
    if (currentSite === "reddit") {
      const redditImages = document.querySelectorAll('img[alt="Post image"]');
      redditImages.forEach((img) => allImages.push(img));
    }

    // Process each image
    allImages.forEach((img, index) => {
      if (
        (img.width > 50 && img.height > 50) ||
        (img.getAttribute("width") > 50 && img.getAttribute("height") > 50) ||
        img.classList.contains("media-lightbox-img")
      ) {
        try {
          if (img.complete && img.naturalWidth > 0) {
            processImage(img, index);
          } else {
            img.addEventListener(
              "load",
              () => {
                processImage(img, index);
              },
              { once: true }
            );
          }
        } catch (error) {
          console.error("Error processing image:", error);
        }
      } else {
        img.dataset.overlayProcessed = "skipped";
      }
    });
  }

  // Process individual image
  function processImage(img, index) {
    if (img.dataset.overlayProcessed === "true") {
      return;
    }

    // Use Intersection Observer to detect when image is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (
              (img.width > 100 && img.height > 100) ||
              img.tagName.toLowerCase() === "video"
            ) {
              addOrUpdateOverlayToImage(img, index);
            }
            observer.unobserve(img);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    img.dataset.overlayProcessed = "true";

    // Error handling for image loading
    img.onerror = function () {
      // Error handling logic here if needed
    };

    // Handle successful image load
    img.onload = function () {
      if (
        (img.width > 100 && img.height > 100) ||
        img.tagName.toLowerCase() === "video"
      ) {
        addOrUpdateOverlayToImage(img, index);
      }
    };
  }

  // Add or update overlay on an image
  function addOrUpdateOverlayToImage(img, index) {
    let overlay = document.querySelector(
      `.image-overlay[data-for-image="${img.src}"]`
    );

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "image-overlay";
      overlay.dataset.forImage = img.src;
      overlay.style.cssText = `
        position: absolute;
        width: 30px;
        height: 30px;
        background-color: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        cursor: pointer;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        pointer-events: auto;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        opacity: 0.5;
        transition: opacity 0.3s ease, background-color 0.3s ease, display 0.3s ease;
      `;
      overlay.textContent = "🧿";

      overlay.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const highestQualityUrl = getHighestQualityImageUrl(img);

        if (highestQualityUrl) {
          showConsentPopup(overlay, highestQualityUrl);
        } else {
          showMessage("No suitable image found.", "error");
        }
      };

      img.parentElement.appendChild(overlay);

      overlay.addEventListener("mouseenter", () => {
        overlay.style.opacity = "1";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      });

      overlay.addEventListener("mouseleave", () => {
        overlay.style.opacity = "0.5";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      });
    }

    const updateOverlayPosition = debounce(() => {
      const rect = img.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const isPartiallyVisible =
        rect.top < viewportHeight &&
        rect.bottom > 0 &&
        rect.left < viewportWidth &&
        rect.right > 0;

      const isSlideshow = img.closest(".media-lightbox-img") !== null;
      const isVideo =
        img.tagName.toLowerCase() === "video" || img.querySelector("video");

      if (
        isPartiallyVisible &&
        ((rect.width > 100 && rect.height > 100) || isVideo) &&
        (!isSlideshow || img.offsetParent !== null)
      ) {
        overlay.style.display = "flex";
        const top = 10;
        const right = 10;
        overlay.style.top = `${top}px`;
        overlay.style.right = `${right}px`;
        overlay.style.bottom = "auto";
        overlay.style.left = "auto";
      } else if (isVideo) {
        overlay.style.display = "flex";
        overlay.style.top = "10px";
        overlay.style.right = "10px";
        overlay.style.bottom = "auto";
        overlay.style.left = "auto";
      } else {
        setTimeout(() => {
          if (!isPartiallyVisible) {
            overlay.style.display = "none";
          }
        }, 300); // 300ms delay before hiding
      }
    }, 100); // 100ms debounce

    updateOverlayPosition();

    if (!img.dataset.overlayEventListenersAdded) {
      const scrollHandler = () => {
        updateOverlayPosition();
      };
      const resizeHandler = () => {
        updateOverlayPosition();
      };
      window.addEventListener("scroll", scrollHandler, { passive: true });
      window.addEventListener("resize", resizeHandler, { passive: true });
      img.dataset.overlayEventListenersAdded = "true";
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "src" ||
            mutation.attributeName === "style")
        ) {
          overlay.dataset.forImage = img.src;
          updateOverlayPosition();
        }
      });
    });

    observer.observe(img, {
      attributes: true,
      attributeFilter: ["src", "style"],
    });
  }

  // Add this helper function for debugging
  function debugLog(message, ...args) {
    console.log(`[RealEyes Debug] ${message}`, ...args);
  }

  // Show consent popup before sending image for analysis
  function showConsentPopup(target, imageUrl) {
    debugLog("Showing consent popup for target:", target);

    // Check if there's already a popup for this image
    const existingPopup = document.querySelector(
      `.consent-popup[data-for-image="${imageUrl}"]`
    );
    if (existingPopup) {
      return existingPopup;
    }

    // Remove any other popups
    const existingPopups = document.querySelectorAll(
      ".consent-popup:not([data-for-image='" + imageUrl + "'])"
    );
    existingPopups.forEach((popup) => popup.remove());

    const popup = document.createElement("div");
    popup.className = "consent-popup";
    popup.setAttribute("data-for-image", imageUrl);

    // Add popup content
    popup.innerHTML = `
      <p class="consent-message">Send Image for Analysis?</p>
      <div class="consent-buttons">
        <button class="confirm-btn">Analyze Image</button>
        <button class="cancel-btn">Cancel</button>
      </div>
      <div class="consent-options">
        <label class="store-data-option">
          <input type="checkbox" class="store-data-checkbox" id="storeImageData" checked>
          <span>Allow storage of image for improved detection</span>
        </label>
      </div>
    `;

    document.body.appendChild(popup);

    // Create an Intersection Observer for the target (overlay icon)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Show popup when target is visible
            popup.style.display = "flex";
            updatePopupPosition();
          } else {
            // Hide popup when target is not visible
            popup.style.display = "none";
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    // Position the popup relative to the icon overlay
    const updatePopupPosition = () => {
      if (popup.style.display === "none") return;

      const overlayRect = target.getBoundingClientRect();
      debugLog("Overlay rect:", overlayRect);

      // Calculate position relative to the overlay icon
      let left = overlayRect.right + window.pageXOffset + 10;
      let top = overlayRect.top + window.pageYOffset;

      // If popup would go off-screen to the right, position it to the left
      if (
        left + popup.offsetWidth >
        window.innerWidth - 10 + window.pageXOffset
      ) {
        left = overlayRect.left + window.pageXOffset - popup.offsetWidth - 10;
      }

      // Ensure popup stays within viewport bounds vertically
      const maxTop =
        window.innerHeight + window.pageYOffset - popup.offsetHeight - 10;
      top = Math.max(10 + window.pageYOffset, Math.min(top, maxTop));

      debugLog("Setting popup position:", { left, top });

      popup.style.position = "absolute";
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    };

    // Initial positioning
    setTimeout(updatePopupPosition, 0);

    // Update position on window resize and scroll
    const debouncedUpdate = debounce(updatePopupPosition, 100);
    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate);

    // Enhanced cleanup function
    const cleanup = () => {
      debugLog("Cleaning up popup");
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("scroll", debouncedUpdate);
      observer.disconnect();
      popup.remove();
    };

    // Update the confirm button click handler
    popup
      .querySelector(".confirm-btn")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();

        const storeDataCheckbox = popup.querySelector("#storeImageData");
        const storeData = storeDataCheckbox ? storeDataCheckbox.checked : false;

        // Remove ALL existing content from popup
        popup.innerHTML = '<div class="loading-indicator">Analyzing...</div>';

        // Send image for analysis using the existing popup
        await sendImageForAnalysis(imageUrl, popup, storeData);
      });

    // Only add cleanup to cancel button
    popup.querySelector(".cancel-btn")?.addEventListener("click", cleanup);

    return popup;
  }

  // Send image data for analysis
  function sendImageForAnalysis(url, popup, storeData) {
    let filename = url.split("/").pop().split("?")[0];
    let mimeType = "image/jpeg"; // Default to JPEG for Twitter images

    if (url.includes("twimg.com")) {
      // For Twitter images, extract format from URL
      const format = new URL(url).searchParams.get("format");
      if (format) {
        filename += `.${format}`;
        mimeType = `image/${format}`;
      }
    } else {
      mimeType = getMimeType(filename);
    }

    console.log(`Sending image for analysis: ${filename}`);
    console.log(`MIME type: ${mimeType}`);
    console.log(`Image URL: ${url}`);
    console.log(`Store image data: ${storeData}`);

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        const uint8Array = new Uint8Array(arrayBuffer);
        return crypto.subtle
          .digest("SHA-256", uint8Array)
          .then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
            return { uint8Array, hashHex };
          });
      })
      .then(({ uint8Array, hashHex }) => {
        chrome.runtime.sendMessage(
          {
            action: "sendImage",
            imageData: {
              url,
              mimeType,
              filename,
              size: uint8Array.length,
              sha256Hash: hashHex,
              origin: window.location.origin,
              storeData: storeData, // Add the storage consent flag
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
              displayAnalysisResults(
                popup,
                "Error: " + chrome.runtime.lastError.message,
                "error"
              );
            } else if (response.error === "Authentication required") {
              displayAnalysisResults(
                popup,
                "Authentication required. Please log in and try again.",
                "error"
              );
            } else {
              console.log("Server response:", response);
              displayAnalysisResults(popup, response, "success");
            }
          }
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        displayAnalysisResults(popup, "Error: " + error.message, "error");
      });
  }

  // Simplify displayAnalysisResults since UI cleanup is handled earlier
  function displayAnalysisResults(popup, results, status) {
    // Clear any existing content
    popup.innerHTML = "";

    if (status === "error") {
      popup.innerHTML = `
        <div class="error-container">
          <p class="error">${results}</p>
          <button class="close-btn">Close</button>
        </div>
      `;
    } else {
      const analysis = results.sageMakerAnalysis;
      console.log("Analysis results:", analysis);

      if (analysis) {
        const probability = (analysis.probability * 100).toFixed(1);
        const isFake = analysis.isFake;

        // Determine color based on probability
        let confidenceColor;
        if (probability < 33) {
          confidenceColor = "#28a745";
        } else if (probability < 66) {
          confidenceColor = "#ffc107";
        } else {
          confidenceColor = "#dc3545";
        }

        popup.innerHTML = `
            <div class="probability-circle">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle
                  cx="75"
                  cy="75"
                  r="70"
                  stroke="#E6E6E6"
                  stroke-width="10"
                  fill="none"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="70"
                  stroke="${confidenceColor}"
                  stroke-width="10"
                  fill="none"
                  stroke-linecap="round"
                  stroke-dasharray="439.82"
                  stroke-dashoffset="${439.82 * (1 - probability / 100)}"
                  transform="rotate(-90 75 75)"
                  style="transition: stroke-dashoffset 1s"
                />
              </svg>
              <div class="probability-text">
                <div class="probability-value" style="color: ${confidenceColor}">${probability}%</div>
                <div class="probability-label">Deepfake Probability</div>
              </div>
            </div>

            <div class="confidence-indicators">
              <div class="indicator real">
                <div class="indicator-dot"></div>
                <div class="indicator-label">Likely Real</div>
              </div>
              <div class="indicator uncertain">
                <div class="indicator-dot"></div>
                <div class="indicator-label">Uncertain</div>
              </div>
              <div class="indicator fake">
                <div class="indicator-dot"></div>
                <div class="indicator-label">Likely Deepfake</div>
              </div>
            </div>

            <div style="
              width: 100%;
              text-align: center; 
              margin-top: 20px;
            ">
              <button class="close-btn">Close</button>
            </div>
          </div>
        `;
      } else {
        popup.innerHTML = `
          <div class="error-container">
            <p class="error">No analysis results available</p>
            <button class="close-btn">Close</button>
          </div>
        `;
      }
    }

    // Add click handler for the close button
    const closeBtn = popup.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        popup.remove();
      });
    }
  }

  // Helper function to get MIME type from filename
  function getMimeType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  // Get the highest quality image URL
  function getHighestQualityImageUrl(img) {
    if (currentSite === "instagram") {
      // Try to get the image data from the loaded image
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        return canvas.toDataURL("image/jpeg");
      } catch (e) {
        console.error("Failed to get image data:", e);
        // Fall back to the original src if we can't get the data URL
        return img.src;
      }
    }

    const originalSrc = img.src;
    let highQualityUrl = originalSrc;

    if (currentSite === "linkedin") {
      const isCertificationImage =
        img.closest(".feed-shared-celebration-image") !== null;

      if (isCertificationImage) {
        return originalSrc;
      }

      try {
        const parsedUrl = new URL(originalSrc);
        const pathname = parsedUrl.pathname;

        // Remove size parameters
        parsedUrl.searchParams.delete("w");
        parsedUrl.searchParams.delete("h");

        // Set to highest quality
        parsedUrl.searchParams.set("w", "1000");
        parsedUrl.searchParams.set("h", "1000");

        highQualityUrl = parsedUrl.toString();

        // Preserve the original file extension if it exists
        const originalExtension = pathname.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(originalExtension)) {
          if (!highQualityUrl.toLowerCase().endsWith(`.${originalExtension}`)) {
            highQualityUrl += `.${originalExtension}`;
          }
        }
      } catch (error) {
        console.error("Failed to parse LinkedIn image URL:", error);
        highQualityUrl = originalSrc;
      }
    } else if (currentSite === "instagram") {
      if (originalSrc.includes("&_nc_ht=")) {
        try {
          const url = new URL(originalSrc);
          url.searchParams.delete("_nc_sid");
          url.searchParams.delete("_nc_ohc");
          url.searchParams.delete("_nc_ht");
          url.searchParams.delete("edm");
          url.searchParams.delete("oh");
          url.searchParams.delete("oe");
          highQualityUrl = url.toString();
        } catch (error) {
          console.error("Failed to parse Instagram image URL:", error);
        }
      }
    }

    return highQualityUrl;
  }

  // Show message to user
  function showMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.style.position = "fixed";
    messageDiv.style.bottom = "20px";
    messageDiv.style.right = "20px";
    messageDiv.style.padding = "10px 20px";
    messageDiv.style.borderRadius = "5px";
    messageDiv.style.color = "#fff";
    messageDiv.style.zIndex = "10000";
    messageDiv.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
    messageDiv.style.opacity = "0";
    messageDiv.style.transition = "opacity 0.5s ease-in-out";

    if (type === "success") {
      messageDiv.style.backgroundColor = "#4caf50";
    } else if (type === "error") {
      messageDiv.style.backgroundColor = "#f44336";
    } else {
      messageDiv.style.backgroundColor = "#333";
    }

    document.body.appendChild(messageDiv);

    void messageDiv.offsetWidth;

    messageDiv.style.opacity = "1";

    setTimeout(() => {
      messageDiv.style.opacity = "0";
      messageDiv.addEventListener("transitionend", () => {
        messageDiv.remove();
      });
    }, 3000);
  }

  // Debounced version of addOrUpdateOverlayToImages
  const debouncedAddOrUpdateOverlayToImages = debounce(
    addOrUpdateOverlayToImages,
    500
  );

  // Handle DOM changes
  function handleDOMChanges(mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" || mutation.type === "attributes") {
        if (
          mutation.addedNodes.length > 0 ||
          (mutation.type === "attributes" && mutation.attributeName === "src")
        ) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            addOrUpdateOverlayToImages();
          }, DEBOUNCE_DELAY);
          break;
        }
      }
    }
  }

  // Set up observers for DOM changes
  function setupObservers() {
    bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const images = node.querySelectorAll(
                "img:not([data-overlay-processed])"
              );
              images.forEach((img, index) => processImage(img, index));
            }
          });
        }
      });
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    setInterval(checkForNewImages, 2000);

    window.addEventListener(
      "scroll",
      debounce(() => {
        addOrUpdateOverlayToImages();
      }, 200)
    );

    observer = new MutationObserver(handleDOMChanges);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Disconnect observers
  function disconnectObservers() {
    if (bodyObserver) {
      bodyObserver.disconnect();
    }
    if (observer) {
      observer.disconnect();
    }

    window.removeEventListener("scroll", debouncedAddOrUpdateOverlayToImages);
  }

  // Check for new images periodically
  function checkForNewImages() {
    const images = document.querySelectorAll(
      "img:not([data-overlay-processed])"
    );
    images.forEach((img, index) => processImage(img, index));
  }

  // Watch for changes in certification images
  function watchCertificationImage(container) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);

          const addedImage = addedNodes.find((node) => node.tagName === "IMG");
          const removedImage = removedNodes.find(
            (node) => node.tagName === "IMG"
          );

          if (addedImage) {
            processImage(addedImage, "certification");
          }

          if (removedImage) {
            const overlay = container.querySelector(".image-overlay");
            if (overlay) {
              overlay.remove();
            }
          }
        }
      });
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  // Check if the extension is still valid
  function checkExtensionValidity() {
    if (!chrome.runtime.id) {
      location.reload();
    }
  }

  setInterval(checkExtensionValidity, 60000);

  // Initialize overlay
  async function initializeOverlay() {
    const shouldProcess = await shouldProcessImage();
    if (shouldProcess) {
      addOrUpdateOverlayToImages();
    }
  }

  // Set up the extension
  async function setupExtension() {
    if (!chrome.runtime || !chrome.runtime.id) {
      return;
    }

    const hostname = window.location.hostname;
    if (hostname.includes("linkedin.com")) currentSite = "linkedin";
    else if (hostname.includes("facebook.com")) currentSite = "facebook";
    else if (hostname.includes("twitter.com") || hostname.includes("x.com"))
      currentSite = "twitter";
    else if (hostname.includes("instagram.com")) currentSite = "instagram";
    else if (hostname.includes("reddit.com")) currentSite = "reddit";
    else currentSite = null;

    if (currentSite) {
      const shouldProcess = await shouldProcessImage();
      if (shouldProcess) {
        extensionEnabled = true;
        siteEnabled = true;
        initializeOverlay();
        setupObservers();
      } else {
        disableExtension();
      }
    }
  }

  // Disable the extension
  function disableExtension() {
    extensionEnabled = false;
    siteEnabled = false;
    removeAllOverlays();
    disconnectObservers();
  }

  // Handle settings updates
  function handleSettingsUpdate(settings) {
    extensionEnabled = settings.enableOverlay !== false;
    siteEnabled = settings[currentSite] !== false;

    if (!extensionEnabled || !siteEnabled) {
      hideAllOverlays();
    } else {
      showAllOverlays();
      addOrUpdateOverlayToImages();
    }
  }

  // Hide all overlays
  function hideAllOverlays() {
    const overlays = document.querySelectorAll(".image-overlay");
    overlays.forEach((overlay) => {
      overlay.style.display = "none";
    });
  }

  // Show all overlays
  function showAllOverlays() {
    const overlays = document.querySelectorAll(".image-overlay");
    overlays.forEach((overlay) => {
      overlay.style.display = "flex";
    });
  }

  // Message listener for chrome runtime messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in social content script:", request);
    if (request.action === "settingsChanged") {
      console.log("Settings changed:", request.changes);
      // Update your content script's behavior based on the new settings
      // For example:
      updateSettings(request.changes);
      sendResponse({ success: true });
    }
    if (request.action === "updateSettings") {
      handleSettingsUpdate(request.settings);
      sendResponse({ status: "Settings updated" });
    }
    return true; // Indicates that the response is sent asynchronously
  });

  function updateSettings(changes) {
    // Implement this function to update your content script's behavior
    // based on the changed settings
    console.log("Updating settings in content script:", changes);
    // Example:
    if (changes.enableOverlay) {
      extensionEnabled = changes.enableOverlay.newValue;
    }
    // Update other settings as needed
    setupExtension(); // Re-run your setup function with the new settings
  }

  // Initialize the extension
  setupExtension();

  // Add CSS rules
  const cssRules = `
    .overlay:state(secondary-text-color) {
      color: var(--secondary-text-color);
    }
    
    .image-fill:state(webkit-fill-available) {
      width: -webkit-fill-available;
    }
  `;

  const style = document.createElement("style");
  style.innerHTML = cssRules;
  document.head.appendChild(style);

  // Create image overlay
  function createImageOverlay(imageElement) {
    debugLog("Creating overlay for image:", imageElement);

    let wrapper = imageElement.closest(".image-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";
      imageElement.parentNode.insertBefore(wrapper, imageElement);
      wrapper.appendChild(imageElement);
    }

    const overlay = document.createElement("div");
    overlay.className = "image-overlay";
    overlay.setAttribute("data-for-image", imageElement.src); // Store the image URL
    wrapper.appendChild(overlay);

    // Add click handler for the overlay
    overlay.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        debugLog("Overlay clicked, showing popup");
        showConsentPopup(overlay, imageElement.src);
      },
      true
    );

    return overlay;
  }

  // Add overlay to image
  function addOverlay(imageElement, index) {
    if (imageElement.getAttribute("aria-hidden") === "true") {
      imageElement.removeAttribute("aria-hidden");
    }

    createImageOverlay(imageElement);
  }

  // Debounce timer and delay
  let debounceTimer;
  const DEBOUNCE_DELAY = 300;

  // Log errors
  function logError(error) {
    console.error("RealEyes.ai Extension Error:", error);
    // Additional logging mechanisms can be added here
  }

  // Global error event listener
  window.addEventListener("error", (event) => {
    logError(event.error);
  });

  const getValidOrigin = () => {
    const currentOrigin = window.location.origin;
    if (allowedOrigins.includes(currentOrigin)) {
      return currentOrigin;
    }
    return null;
  };
})();

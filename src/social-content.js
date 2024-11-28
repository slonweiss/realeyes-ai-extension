(() => {
  // At the top of the file, add:
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

  // Add after the debounce function (around line 15)
  function decodeJWT(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      console.log("Decoded JWT payload:", decoded);
      console.log("Extracted userId:", decoded.username);
      return decoded;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
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
    // Create a unique identifier for this image/overlay pair
    const uniqueId = `overlay-${index}-${Date.now()}`;

    let overlay = document.querySelector(
      `.image-overlay[data-for-image="${img.src}"]`
    );

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "image-overlay";
      overlay.dataset.forImage = img.src;
      overlay.dataset.overlayId = uniqueId;

      // Create an img element for the icon
      const iconImg = document.createElement("img");
      iconImg.src = chrome.runtime.getURL("icons/realeyes-ai-icon.png");
      iconImg.style.cssText = `
        width: 20px;
        height: 20px;
        object-fit: contain;
        ${currentSite === "reddit" ? "margin-top: 16px;" : ""}
      `;

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

      // Replace emoji with the image
      overlay.appendChild(iconImg);

      overlay.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // First try to find popup by image src
        let existingPopup = document.querySelector(
          `.consent-popup[data-for-image="${img.src}"]`
        );

        // If not found, try to find by overlay ID
        if (!existingPopup) {
          existingPopup = document.querySelector(
            `.consent-popup[data-overlay-id="${uniqueId}"]`
          );
        }

        // If popup exists, remove it
        if (existingPopup) {
          existingPopup.remove();
          return;
        }

        const highestQualityUrl = getHighestQualityImageUrl(img);

        if (highestQualityUrl) {
          showConsentPopup(overlay, highestQualityUrl, uniqueId);
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

  // Show consent popup before sending image for analysis
  function showConsentPopup(target, imageUrl, overlayId) {
    // Check for existing popup using both image URL and overlay ID
    let existingPopup = document.querySelector(
      `.consent-popup[data-for-image="${imageUrl}"]`
    );

    if (!existingPopup) {
      existingPopup = document.querySelector(
        `.consent-popup[data-overlay-id="${overlayId}"]`
      );
    }

    if (existingPopup) {
      return existingPopup;
    }

    // Remove any other popups
    const existingPopups = document.querySelectorAll(".consent-popup");
    existingPopups.forEach((popup) => popup.remove());

    const popup = document.createElement("div");
    popup.className = "consent-popup";
    popup.setAttribute("data-for-image", imageUrl);
    popup.setAttribute("data-overlay-id", overlayId); // Add overlay ID to popup

    // Add popup content
    popup.innerHTML = `
        <p class="consent-message">Analyze this image?</p>
        <div class="consent-buttons">
            <button class="confirm-btn">Analyze Now</button>
            <button class="cancel-btn">Skip</button>
        </div>
        <div class="consent-options">
            <label class="store-data-option">
                <input type="checkbox" class="store-data-checkbox" id="storeImageData" checked>
                <span>Help us improve detection by storing this image</span>
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
      const scrollY = window.scrollY || window.pageYOffset;

      // Calculate position relative to the overlay icon
      let left = overlayRect.right + 10;
      let top = overlayRect.top + scrollY; // Add scroll offset back

      // If popup would go off-screen to the right, position it to the left
      if (left + popup.offsetWidth > window.innerWidth - 10) {
        left = overlayRect.left - popup.offsetWidth - 10;
      }

      // Ensure popup stays within viewport bounds vertically
      const maxTop =
        document.documentElement.scrollHeight - popup.offsetHeight - 10;
      top = Math.max(10, Math.min(top, maxTop));

      popup.style.position = "absolute"; // Change back to absolute
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    };

    // Add scroll event listener to hide popup when image is out of view
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            popup.style.display = "none";
          }
        });
      },
      { threshold: 0 }
    );

    visibilityObserver.observe(target);

    // Initial positioning
    setTimeout(updatePopupPosition, 0);

    // Update position on window resize and scroll
    const debouncedUpdate = debounce(updatePopupPosition, 100);
    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate);

    // Enhanced cleanup function
    const cleanup = () => {
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

    // Get auth token first
    chrome.storage.local.get(["authToken"], async function (result) {
      const authToken = result.authToken;

      if (!authToken) {
        displayAnalysisResults(
          popup,
          "Authentication required. Please log in and try again.",
          "error"
        );
        return;
      }

      // Decode JWT and get userId
      const decodedToken = decodeJWT(authToken);
      const userId = decodedToken?.username || null;

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
                storeData: storeData,
                userId: userId, // Add userId to the request
              },
            },
            (response) => {
              if (chrome.runtime.lastError) {
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
                displayAnalysisResults(popup, response, "success");
              }
            }
          );
        })
        .catch((error) => {
          console.error("Error:", error);
          displayAnalysisResults(popup, "Error: " + error.message, "error");
        });
    });
  }

  // Simplify displayAnalysisResults since UI cleanup is handled earlier
  function displayAnalysisResults(popup, results, status) {
    const overlayId = popup.getAttribute("data-overlay-id");
    popup.innerHTML = "";

    if (status === "error") {
      popup.innerHTML = `
            <div class="error-container">
                <div class="close-x">×</div>
                <p class="error">${results}</p>
            </div>
        `;
    } else {
      // Get the analysis with higher probability
      const standardAnalysis = results.sageMakerAnalysis;
      const ufdAnalysis = results.sageMakerAnalysisUFD;

      const analysis =
        standardAnalysis.probability > ufdAnalysis.probability
          ? standardAnalysis
          : ufdAnalysis;
      const modelUsed =
        standardAnalysis.probability > ufdAnalysis.probability
          ? "DMImageDetection Model"
          : "UniversalFakeDetect Model";

      if (analysis) {
        const probability = (analysis.probability * 100).toFixed(1);

        // Determine color and text based on probability
        let confidenceColor;
        let titleText;
        if (probability < 33) {
          confidenceColor = "#28a745";
          titleText = "This content is likely real.";
        } else if (probability < 66) {
          confidenceColor = "#ffc107";
          titleText = "This content is uncertain—proceed with caution.";
        } else {
          confidenceColor = "#dc3545";
          titleText = "This content is likely a deepfake.";
        }

        popup.innerHTML = `
                <div class="close-x">×</div>
                <div class="analysis-title" style="color: ${confidenceColor}">${titleText}</div>

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
                            stroke-dashoffset="${
                              439.82 * (1 - probability / 100)
                            }"
                            transform="rotate(-90 75 75)"
                            style="transition: stroke-dashoffset 1s"
                        />
                    </svg>
                    <div class="probability-text">
                        <div class="probability-value" style="color: ${confidenceColor}">${probability}%</div>
                        <div class="probability-label" style="
                            font-size: 12px;
                            color: #333;
                            margin-top: 10px;
                        ">Deepfake Probability</div>
                    </div>
                </div>

                <div class="confidence-indicators">
                    <div class="indicator real">
                        <div class="indicator-dot"></div>
                        <div class="indicator-label">Likely Real</div>
                    </div>
                    <div class="indicator uncertain">
                        <div class="indicator-dot"></div>
                        <div class="indicator-label" style="white-space: nowrap;">Uncertain</div>
                    </div>
                    <div class="indicator fake">
                        <div class="indicator-dot"></div>
                        <div class="indicator-label">Likely Deepfake</div>
                    </div>
                </div>

                <div class="request-count" data-tooltip="${
                  results.requestCount === 1
                    ? "The analysis results were determined in near-real-time"
                    : "Displaying cached analysis results"
                }">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="#666"/>
                        <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="#666"/>
                    </svg>
                    ${
                      results.requestCount === 1
                        ? "You're the first to analyze this image"
                        : `Image analyzed ${results.requestCount} time${
                            results.requestCount !== 1 ? "s" : ""
                          }`
                    }
                </div>

                <div class="analysis-details-accordion">
                    <button class="accordion-button">
                        <span>View Analysis Details</span>
                    </button>
                    
                    <div class="accordion-content">
                        <div class="details-section">
                            <div class="model-comparison">
                                <div class="model-result ${
                                  standardAnalysis.probability >
                                  ufdAnalysis.probability
                                    ? "selected"
                                    : ""
                                }">
                                    <h4 style="font-size: 12px;">DMImageDetection</h4>
                                    <div class="model-probability">${(
                                      standardAnalysis.probability * 100
                                    ).toFixed(1)}%</div>
                                </div>
                                <div class="model-result ${
                                  ufdAnalysis.probability >
                                  standardAnalysis.probability
                                    ? "selected"
                                    : ""
                                }">
                                    <h4 style="font-size: 12px;">UniversalFakeDetect</h4>
                                    <div class="model-probability">
                                        <div class="bar-fill" style="width: ${(
                                          ufdAnalysis.probability * 100
                                        ).toFixed(1)}%"></div>
                                        <span>${(
                                          ufdAnalysis.probability * 100
                                        ).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="details-grid">
                                ${detailRow(
                                  "File Name",
                                  results.originalFileName,
                                  "Original filename of the uploaded image"
                                )}
                                ${detailRow(
                                  "File Size",
                                  `${(results.fileSize / 1024).toFixed(2)} KB`,
                                  "Size of the image file in kilobytes"
                                )}
                                ${detailRow(
                                  "Dimensions",
                                  `${results.metadata.sharp.width}x${results.metadata.sharp.height}`,
                                  "Width and height of the image in pixels"
                                )}
                                ${detailRow(
                                  "Format",
                                  results.metadata.sharp.format.toUpperCase(),
                                  "Image file format"
                                )}
                                ${detailRow(
                                  "Color Space",
                                  results.metadata.sharp.space.toUpperCase(),
                                  "Color space used by the image (sRGB, CMYK, etc.)"
                                )}
                                ${detailRow(
                                  "Channels",
                                  results.metadata.sharp.channels,
                                  "Number of color channels in the image"
                                )}
                                ${detailRow(
                                  "Bit Depth",
                                  results.metadata.sharp.depth,
                                  "Bits per channel used to represent colors"
                                )}
                                ${detailRow(
                                  "Resolution",
                                  `${results.metadata.sharp.density} DPI`,
                                  "Image resolution in dots per inch (DPI)"
                                )}
                                ${detailRow(
                                  "Chroma Subsampling",
                                  results.metadata.sharp.chromaSubsampling,
                                  "Type of chroma subsampling used for color compression"
                                )}
                                ${detailRow(
                                  "Progressive Loading",
                                  results.metadata.sharp.isProgressive
                                    ? "Yes"
                                    : "No",
                                  "Whether the image uses progressive loading"
                                )}
                                ${detailRow(
                                  "Has Alpha Channel",
                                  results.metadata.sharp.hasAlpha
                                    ? "Yes"
                                    : "No",
                                  "Whether the image contains transparency"
                                )}
                                ${detailRow(
                                  "Has Color Profile",
                                  results.metadata.sharp.hasProfile
                                    ? "Yes"
                                    : "No",
                                  "Whether the image contains a color profile"
                                )}
                                ${detailRow(
                                  "Image Hash",
                                  results.imageHash,
                                  "Unique SHA-256 hash of the image content"
                                )}
                                ${detailRow(
                                  "Perceptual Hash",
                                  results.pHash,
                                  "Perceptual hash used for finding similar images"
                                )}
                                ${detailRow(
                                  "Upload Date",
                                  new Date(results.uploadDate).toLocaleString(),
                                  "When the image was uploaded for analysis"
                                )}
                                ${detailRow(
                                  "Origin Website",
                                  results.originWebsites?.[0] || "Unknown",
                                  "Website where the image was found"
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feedback-section">
                    <p>Was this analysis helpful?</p>
                    <div class="feedback-buttons">
                        <button class="feedback-btn thumbs-up" data-image-hash="${
                          results.imageHash
                        }" data-value="up">
                            <span>👍</span>
                        </button>
                        <button class="feedback-btn thumbs-down" data-image-hash="${
                          results.imageHash
                        }" data-value="down">
                            <span>👎</span>
                        </button>
                    </div>
                    <div class="feedback-comment" style="display: none;">
                        <div class="textarea-container">
                            <textarea placeholder="Tell us why (optional)" maxlength="100"></textarea>
                            <div class="char-counter">0/100 characters</div>
                        </div>
                        <button class="submit-feedback-btn">Submit Feedback</button>
                    </div>
                </div>
            `;

        // Add CSS for the close-x
        const style = document.createElement("style");
        style.textContent = `
                .close-x {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    cursor: pointer;
                    font-size: 20px;
                    color: #666;
                    transition: color 0.2s;
                }
                .close-x:hover {
                    color: #333;
                }
            `;
        document.head.appendChild(style);

        // Add event listeners for feedback buttons
        const feedbackBtns = popup.querySelectorAll(".feedback-btn");
        const feedbackComment = popup.querySelector(".feedback-comment"); // Changed from textarea to container
        const submitBtn = popup.querySelector(".submit-feedback-btn");
        const textarea = popup.querySelector("textarea");
        const charCounter = popup.querySelector(".char-counter");

        feedbackBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            // Remove active class from all buttons
            feedbackBtns.forEach((b) => b.classList.remove("active"));
            // Add active class to clicked button
            btn.classList.add("active");
            // Show comment section
            feedbackComment.style.display = "block"; // Changed from textarea to container
          });
        });

        textarea.addEventListener("input", () => {
          const length = textarea.value.length;
          const remaining = 100 - length;
          charCounter.textContent = `${length}/100 characters`;

          // Update counter color based on remaining characters
          charCounter.classList.remove("near-limit", "at-limit");
          if (length >= 90) {
            charCounter.classList.add("at-limit");
          } else if (length >= 75) {
            charCounter.classList.add("near-limit");
          }
        });

        submitBtn.addEventListener("click", async () => {
          // Disable the submit button and show loading state
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="spinner"></span>
            Sending...
          `;

          // Get auth token from storage
          const { authToken } = await chrome.storage.local.get(["authToken"]);
          console.log(
            "Retrieved authToken:",
            authToken ? "Token exists" : "No token found"
          );

          if (!authToken) {
            console.error("No auth token found");
            submitBtn.innerHTML = "Error: Please log in";
            return;
          }

          // Decode JWT and get userId
          const decodedToken = decodeJWT(authToken);
          const userId = decodedToken?.username || null;
          console.log("Final userId to be submitted:", userId);

          const feedbackBtns = popup.querySelectorAll(".feedback-btn");
          const feedbackComment = popup.querySelector("textarea");
          const imageHash = feedbackBtns[0].dataset.imageHash;
          const selectedFeedback = Array.from(feedbackBtns)
            .find((btn) => btn.classList.contains("active"))
            ?.getAttribute("data-value");
          const comment = feedbackComment?.value?.trim() || "";

          if (!selectedFeedback) {
            console.error("No feedback selected");
            return;
          }

          console.log("Submitting feedback with data:", {
            imageHash,
            feedbackType: selectedFeedback,
            comment,
            userId,
          });

          try {
            // Send message to background script
            chrome.runtime.sendMessage(
              {
                action: "submitFeedback",
                feedbackData: {
                  imageHash,
                  feedbackType: selectedFeedback,
                  comment,
                  userId,
                },
                origin: window.location.origin,
              },
              (response) => {
                console.log("Feedback submission response:", response);
                const feedbackSection =
                  popup.querySelector(".feedback-section");
                feedbackSection.style.marginTop = "0";

                if (response.success) {
                  let iconColor, title, message;

                  switch (response.data.message) {
                    case "Feedback already received":
                      iconColor = "#3498db"; // Primary blue
                      title = "Already Submitted";
                      message =
                        "You've already provided feedback for this image";
                      break;
                    case "Feedback updated successfully":
                      iconColor = "#2196F3"; // Material blue
                      title = "Feedback Updated";
                      message = "Your feedback has been updated successfully";
                      break;
                    case "Feedback submitted successfully":
                    default:
                      iconColor = "#4CAF50"; // Green
                      title = "Thank you!";
                      message = "Your feedback helps improve our analyses";
                      break;
                  }

                  feedbackSection.innerHTML = `
                    <div class="feedback-success">
                        <div class="icon-container">
                            <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle cx="26" cy="26" r="25" fill="none" stroke="${iconColor}" stroke-width="2"/>
                                <path fill="none" stroke="${iconColor}" stroke-width="2" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                        <h3 class="feedback-title" style="color: ${iconColor}">${title}</h3>
                        <p class="feedback-message">${message}</p>
                    </div>
                `;
                } else {
                  // Error handling
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = "Submit Feedback";

                  const errorMsg = document.createElement("p");
                  errorMsg.className = "feedback-error";
                  errorMsg.textContent = `Error: ${
                    response.error || "Failed to submit feedback"
                  }`;
                  submitBtn.parentNode.insertBefore(
                    errorMsg,
                    submitBtn.nextSibling
                  );
                }
              }
            );
          } catch (error) {
            console.error("Error in feedback submission:", error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Submit Feedback";

            const errorMsg = document.createElement("p");
            errorMsg.className = "feedback-error";
            errorMsg.textContent = "Error: Failed to submit feedback";
            submitBtn.parentNode.insertBefore(errorMsg, submitBtn.nextSibling);
          }
        });

        console.log("Feedback buttons:", {
          feedbackBtns: popup.querySelectorAll(".feedback-btn"),
          submitBtn: popup.querySelector(".submit-feedback-btn"),
          feedbackComment: popup.querySelector("textarea"),
        });

        textarea.addEventListener("input", () => {
          const length = textarea.value.length;
          const remaining = 100 - length;
          charCounter.textContent = `${length}/100 characters`;

          // Update counter color based on remaining characters
          charCounter.classList.remove("near-limit", "at-limit");
          if (length >= 90) {
            charCounter.classList.add("at-limit");
          } else if (length >= 75) {
            charCounter.classList.add("near-limit");
          }
        });

        // Add accordion functionality
        const accordionButton = popup.querySelector(".accordion-button");
        const accordionContent = popup.querySelector(".accordion-content");

        accordionButton.addEventListener("click", () => {
          const isOpen = accordionContent.style.display === "block";
          accordionContent.style.display = isOpen ? "none" : "block";
        });
      } else {
        popup.innerHTML = `
                <div class="error-container">
                    <div class="close-x">×</div>
                    <p class="error">No analysis results available</p>
                </div>
            `;
      }
    }

    // Ensure the overlay ID is maintained
    popup.setAttribute("data-overlay-id", overlayId);

    // Add click handler for the close X
    const closeX = popup.querySelector(".close-x");
    if (closeX) {
      closeX.addEventListener("click", () => {
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
    if (request.action === "settingsChanged") {
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
  const cssRules = ``;

  const style = document.createElement("style");
  style.innerHTML = cssRules;
  document.head.appendChild(style);

  // Create image overlay
  function createImageOverlay(imageElement) {
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

  // In the displayAnalysisResults function, update how we generate the detail rows
  // Move the title attribute from detail-row to detail-label
  const detailRow = (label, value, tooltip) => `
    <div class="detail-row">
        <span class="detail-label" title="${tooltip}">${label}</span>
        <span class="detail-value">${value}</span>
    </div>
  `;
})();

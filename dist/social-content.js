(()=>{function e(e,t){let n;return function(...o){clearTimeout(n),n=setTimeout((()=>{clearTimeout(n),e(...o)}),t)}}function t(e){try{const t=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),n=decodeURIComponent(atob(t).split("").map((e=>"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2))).join("")),o=JSON.parse(n);return console.log("Decoded JWT payload:",o),console.log("Extracted userId:",o.username),o}catch(e){return console.error("Error decoding JWT:",e),null}}let n,o,a=!1,s=!1,i=null;function r(){document.querySelectorAll(".image-overlay").forEach((e=>e.remove()))}async function l(){try{const e=await new Promise(((e,t)=>{chrome.storage.sync.get(["enableOverlay","facebook","twitter","instagram","linkedin","reddit"],(n=>{chrome.runtime.lastError?t(chrome.runtime.lastError):e(n)}))}));return a=!1!==e.enableOverlay,s=!1!==e[i],a&&s}catch(e){return console.error("Error in shouldProcessImage:",e),!1}}async function c(){if(!await l())return void r();const e=[];(function t(n){n.nodeType===Node.ELEMENT_NODE&&("img"!==n.tagName.toLowerCase()||n.dataset.overlayProcessed||e.push(n),n.shadowRoot&&t(n.shadowRoot),n.childNodes.forEach((e=>t(e))))})(document.body),"instagram"===i&&document.querySelectorAll('img[srcset], img[src*="instagram"]').forEach((t=>{t.dataset.overlayProcessed||e.push(t)})),"reddit"===i&&document.querySelectorAll('img[alt="Post image"]').forEach((t=>e.push(t))),e.forEach(((e,t)=>{if(e.width>50&&e.height>50||e.getAttribute("width")>50&&e.getAttribute("height")>50||e.classList.contains("media-lightbox-img"))try{e.complete&&e.naturalWidth>0?d(e,t):e.addEventListener("load",(()=>{d(e,t)}),{once:!0})}catch(e){console.error("Error processing image:",e)}else e.dataset.overlayProcessed="skipped"}))}function d(e,t){if("true"===e.dataset.overlayProcessed)return;const n=new IntersectionObserver((o=>{o.forEach((o=>{o.isIntersecting&&((e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&u(e,t),n.unobserve(e))}))}),{threshold:.1});n.observe(e),e.dataset.overlayProcessed="true",e.onerror=function(){},e.onload=function(){(e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&u(e,t)}}function u(n,o){const a=`overlay-${o}-${Date.now()}`;let s=document.querySelector(`.image-overlay[data-for-image="${n.src}"]`);if(!s){s=document.createElement("div"),s.className="image-overlay",s.dataset.forImage=n.src,s.dataset.overlayId=a;const o=document.createElement("img");o.src=chrome.runtime.getURL("icons/realeyes-ai-icon.png"),o.style.cssText=`\n        width: 20px;\n        height: 20px;\n        object-fit: contain;\n        ${"reddit"===i?"margin-top: 16px;":""}\n      `,s.style.cssText="\n            position: absolute;\n            width: 30px;\n            height: 30px;\n            background-color: rgba(255, 255, 255, 0.4);\n            border-radius: 50%;\n            cursor: pointer;\n            z-index: 2147483647;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 20px;\n            pointer-events: auto;\n            box-shadow: 0 2px 4px rgba(0,0,0,0.2);\n            opacity: 0.5;\n            transition: opacity 0.3s ease, background-color 0.3s ease, display 0.3s ease;\n        ",s.appendChild(o),s.onclick=async o=>{o.stopPropagation(),o.preventDefault();const a=document.querySelector(`.consent-popup[data-overlay-id="${s.dataset.overlayId}"]`);if(a)return void a.remove();const r=function(e){if("instagram"===i){const t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight,t.getContext("2d").drawImage(e,0,0);try{return t.toDataURL("image/jpeg")}catch(t){return console.error("Failed to get image data:",t),e.src}}const t=e.src;let n=t;if("linkedin"===i){if(null!==e.closest(".feed-shared-celebration-image"))return t;try{const e=new URL(t),o=e.pathname;e.searchParams.delete("w"),e.searchParams.delete("h"),e.searchParams.set("w","1000"),e.searchParams.set("h","1000"),n=e.toString();const a=o.split(".").pop().toLowerCase();["jpg","jpeg","png","gif","webp"].includes(a)&&(n.toLowerCase().endsWith(`.${a}`)||(n+=`.${a}`))}catch(e){console.error("Failed to parse LinkedIn image URL:",e),n=t}}else if("instagram"===i&&t.includes("&_nc_ht="))try{const e=new URL(t);e.searchParams.delete("_nc_sid"),e.searchParams.delete("_nc_ohc"),e.searchParams.delete("_nc_ht"),e.searchParams.delete("edm"),e.searchParams.delete("oh"),e.searchParams.delete("oe"),n=e.toString()}catch(e){console.error("Failed to parse Instagram image URL:",e)}return n}(n),l=s.dataset.overlayId;try{const{authToken:n}=await chrome.storage.local.get(["authToken"]);if(!n){document.querySelectorAll(".consent-popup").forEach((e=>e.remove()));const t=document.createElement("div");t.className="consent-popup",t.setAttribute("data-overlay-id",s.dataset.overlayId),t.innerHTML='\n              <div class="close-x">×</div>\n              <p class="consent-message">Please log in to analyze images</p>\n              <div class="consent-buttons">\n                <button class="confirm-btn">Log In</button>\n                <button class="cancel-btn">Cancel</button>\n              </div>\n              <div style="color: #666; font-size: 12px; margin-top: 10px; text-align: center;">\n                <svg width="16" height="16" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 5px;">\n                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>\n                </svg>\n                Or click the RealEyes icon in your browser toolbar\n              </div>\n            ',document.body.appendChild(t);const n=()=>{const e=s.getBoundingClientRect(),n=window.scrollY||window.pageYOffset;let o=e.right+10,a=e.top+n;o+t.offsetWidth>window.innerWidth-10&&(o=e.left-t.offsetWidth-10);const i=document.documentElement.scrollHeight-t.offsetHeight-10;a=Math.max(10,Math.min(a,i)),t.style.position="absolute",t.style.left=`${o}px`,t.style.top=`${a}px`};setTimeout(n,0);const o=e(n,100);window.addEventListener("resize",o),window.addEventListener("scroll",o);const a=t.querySelector(".close-x"),i=t.querySelector(".confirm-btn"),r=t.querySelector(".cancel-btn"),l=()=>{window.removeEventListener("resize",o),window.removeEventListener("scroll",o),t.remove()};return a.addEventListener("click",l),i.addEventListener("click",(()=>{chrome.runtime.sendMessage({action:"initiateLogin"},(e=>{!chrome.runtime.lastError&&e?.success||window.open("https://realeyes.ai/upload-image","_blank")})),t.remove()})),r.addEventListener("click",(()=>{t.remove()})),document.addEventListener("click",(function e(n){t.contains(n.target)||s.contains(n.target)||(l(),document.removeEventListener("click",e))})),void new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting||l()}))}),{threshold:.1}).observe(s)}r?function(n,o,a){let s=document.querySelector(`.consent-popup[data-for-image="${o}"]`);if(s||(s=document.querySelector(`.consent-popup[data-overlay-id="${a}"]`)),s)return s;document.querySelectorAll(".consent-popup").forEach((e=>e.remove()));const i=document.createElement("div");i.className="consent-popup",i.setAttribute("data-for-image",o),i.setAttribute("data-overlay-id",a),i.innerHTML='\n        <p class="consent-message">Analyze this image?</p>\n        <div class="consent-buttons">\n            <button class="confirm-btn">Analyze Now</button>\n            <button class="cancel-btn">Skip</button>\n        </div>\n        <div class="consent-options">\n            <label class="store-data-option">\n                <input type="checkbox" class="store-data-checkbox" id="storeImageData" checked>\n                <span>Help us improve detection by storing this image</span>\n            </label>\n        </div>\n    ',document.body.appendChild(i);const r=new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting?(i.style.display="flex",l()):i.style.display="none"}))}),{threshold:.1});r.observe(n);const l=()=>{if("none"===i.style.display)return;const e=n.getBoundingClientRect(),t=window.scrollY||window.pageYOffset;let o=e.right+10,a=e.top+t;o+i.offsetWidth>window.innerWidth-10&&(o=e.left-i.offsetWidth-10);const s=document.documentElement.scrollHeight-i.offsetHeight-10;a=Math.max(10,Math.min(a,s)),i.style.position="absolute",i.style.left=`${o}px`,i.style.top=`${a}px`};new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting||(i.style.display="none")}))}),{threshold:0}).observe(n),setTimeout(l,0);const d=e(l,100);window.addEventListener("resize",d),window.addEventListener("scroll",d),i.querySelector(".confirm-btn")?.addEventListener("click",(async e=>{e.preventDefault();const n=i.querySelector("#storeImageData"),a=!!n&&n.checked;i.innerHTML='\n        <div class="loading-indicator">\n            <div class="spinner"></div>\n            <span>Analyzing...</span>\n        </div>\n      ',await function(e,n,o){let a=e.split("/").pop().split("?")[0],s="image/jpeg";chrome.storage.local.get(["authToken"],(async function(i){const r=i.authToken;if(!r){n.innerHTML='\n          <div class="error-container" style="text-align: center; padding: 15px;">\n            <div class="close-x">×</div>\n            <p style="margin: 0 0 15px;">Please log in to use the extension.</p>\n            <button id="loginButton" style="\n              width: 100%;\n              padding: 10px;\n              margin: 0 auto;\n              display: block;\n              background-color: #2196f3;\n              color: white;\n              border: none;\n              border-radius: 4px;\n              cursor: pointer;\n              transition: background-color 0.3s;\n              font-size: 14px;\n            ">Log In</button>\n          </div>\n        ';const e=n.querySelector("#loginButton");return e.addEventListener("mouseover",(()=>{e.style.backgroundColor="#0d8bf2"})),e.addEventListener("mouseout",(()=>{e.style.backgroundColor="#2196f3"})),void e.addEventListener("click",(()=>{chrome.cookies.get({url:"https://realeyes.ai",name:"opp_access_token"},(function(e){e&&e.value?chrome.storage.local.set({authToken:e.value},(function(){n.remove(),c()})):(window.open("https://realeyes.ai/upload-image","_blank"),n.remove())}))}))}const l=t(r),d=l?.username||null;if(e.includes("twimg.com")){const t=new URL(e).searchParams.get("format");t&&(a+=`.${t}`,s=`image/${t}`)}else s=function(e){return{jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp"}[e.split(".").pop().toLowerCase()]||"application/octet-stream"}(a);fetch(e).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.arrayBuffer()})).then((e=>{const t=new Uint8Array(e);return crypto.subtle.digest("SHA-256",t).then((e=>{const n=Array.from(new Uint8Array(e)).map((e=>e.toString(16).padStart(2,"0"))).join("");return{uint8Array:t,hashHex:n}}))})).then((({uint8Array:t,hashHex:i})=>{chrome.runtime.sendMessage({action:"sendImage",imageData:{url:e,mimeType:s,filename:a,size:t.length,sha256Hash:i,origin:window.location.origin,storeData:o,userId:d}},(e=>{chrome.runtime.lastError?m(n,"Error: "+chrome.runtime.lastError.message,"error"):"Authentication required"===e.error?m(n,"Authentication required. Please log in and try again.","error"):m(n,e,"success")}))})).catch((e=>{console.error("Error:",e),m(n,"Error: "+e.message,"error")}))}))}(o,i,a)})),i.querySelector(".cancel-btn")?.addEventListener("click",(()=>{window.removeEventListener("resize",d),window.removeEventListener("scroll",d),r.disconnect(),i.remove()}))}(s,r,l):p("No suitable image found.","error")}catch(e){console.error("Authentication check failed:",e),p("An error occurred. Please try again.","error")}},n.parentElement.appendChild(s),s.addEventListener("mouseenter",(()=>{s.style.opacity="1",s.style.backgroundColor="rgba(255, 255, 255, 0.8)"})),s.addEventListener("mouseleave",(()=>{s.style.opacity="0.5",s.style.backgroundColor="rgba(255, 255, 255, 0.4)"}))}const r=e((()=>{const e=n.getBoundingClientRect(),t=window.innerHeight,o=window.innerWidth,a=e.top<t&&e.bottom>0&&e.left<o&&e.right>0,i=null!==n.closest(".media-lightbox-img"),r="video"===n.tagName.toLowerCase()||n.querySelector("video");if(!a||!(e.width>100&&e.height>100||r)||i&&null===n.offsetParent)r?(s.style.display="flex",s.style.top="10px",s.style.right="10px",s.style.bottom="auto",s.style.left="auto"):setTimeout((()=>{a||(s.style.display="none")}),300);else{s.style.display="flex";const e=10,t=10;s.style.top=`${e}px`,s.style.right=`${t}px`,s.style.bottom="auto",s.style.left="auto"}}),100);if(r(),!n.dataset.overlayEventListenersAdded){const e=()=>{r()},t=()=>{r()};window.addEventListener("scroll",e,{passive:!0}),window.addEventListener("resize",t,{passive:!0}),n.dataset.overlayEventListenersAdded="true"}new MutationObserver((e=>{e.forEach((e=>{"attributes"!==e.type||"src"!==e.attributeName&&"style"!==e.attributeName||(s.dataset.forImage=n.src,r())}))})).observe(n,{attributes:!0,attributeFilter:["src","style"]})}function m(e,n,o){const a=e.getAttribute("data-overlay-id");if(e.innerHTML="","error"===o)e.innerHTML=`\n            <div class="error-container">\n                <div class="close-x">×</div>\n                <p class="error">${n}</p>\n            </div>\n        `;else{const o=n.sageMakerAnalysis||{probability:0},a=n.sageMakerAnalysisUFD||{probability:0},s=o.probability>a.probability?o:a;if(s){const i=(100*s.probability).toFixed(1);let r,l;i<33?(r="#28a745",l="This content is likely real."):i<66?(r="#ffc107",l="This content is uncertain—proceed with caution."):(r="#dc3545",l="This content is likely a deepfake."),e.innerHTML=`\n                <div class="close-x">×</div>\n                <div class="analysis-title" style="color: ${r}">${l}</div>\n\n                <div class="probability-circle">\n                    <svg width="150" height="150" viewBox="0 0 150 150">\n                        <circle\n                            cx="75"\n                            cy="75"\n                            r="70"\n                            stroke="#E6E6E6"\n                            stroke-width="10"\n                            fill="none"\n                        />\n                        <circle\n                            cx="75"\n                            cy="75"\n                            r="70"\n                            stroke="${r}"\n                            stroke-width="10"\n                            fill="none"\n                            stroke-linecap="round"\n                            stroke-dasharray="439.82"\n                            stroke-dashoffset="${439.82*(1-i/100)}"\n                            transform="rotate(-90 75 75)"\n                            style="transition: stroke-dashoffset 1s"\n                        />\n                    </svg>\n                    <div class="probability-text">\n                        <div class="probability-value" style="color: ${r}">${i}%</div>\n                        <div class="probability-label" style="\n                            font-size: 12px;\n                            color: #333;\n                            margin-top: 10px;\n                        ">Deepfake Probability</div>\n                    </div>\n                </div>\n\n                <div class="confidence-indicators">\n                    <div class="indicator real">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label">Likely Real</div>\n                    </div>\n                    <div class="indicator uncertain">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label" style="white-space: nowrap;">Uncertain</div>\n                    </div>\n                    <div class="indicator fake">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label">Likely Deepfake</div>\n                    </div>\n                </div>\n\n                <div class="request-count" data-tooltip="${1===n.requestCount?"The analysis results were determined in near-real-time":"Displaying cached analysis results"}">\n                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="#666"/>\n                        <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="#666"/>\n                    </svg>\n                    ${1===n.requestCount?"You're the first to analyze this image":`Image analyzed ${n.requestCount} time${1!==n.requestCount?"s":""}`}\n                </div>\n\n                <div class="analysis-details-accordion">\n                    <button class="accordion-button">\n                        <span>View Analysis Details</span>\n                    </button>\n                    \n                    <div class="accordion-content">\n                        <div class="details-section">\n                            <div class="model-comparison">\n                                <div class="model-result ${o.probability>a.probability?"selected":""}">\n                                    <h4 style="font-size: 12px;">DMImageDetection</h4>\n                                    <div class="model-probability">\n                                        ${void 0!==o.probability?`${(100*o.probability).toFixed(1)}%`:"No result"}\n                                    </div>\n                                </div>\n                                <div class="model-result ${a.probability>o.probability?"selected":""}">\n                                    <h4 style="font-size: 12px;">UniversalFakeDetect</h4>\n                                    <div class="model-probability">\n                                        ${void 0!==a.probability?`${(100*a.probability).toFixed(1)}%`:"No result"}\n                                    </div>\n                                </div>\n                            </div>\n                            \n                            <a href="https://realeyes.ai/transparency" \n                               class="model-info-link" \n                               target="_blank"\n                               rel="noopener noreferrer">\n                               Learn more about the detection models →\n                            </a>\n                            \n                            <div class="details-grid">\n                                ${x("File Name",n.originalFileName,"Original filename of the uploaded image")}\n                                ${x("File Size",`${(n.fileSize/1024).toFixed(2)} KB`,"Size of the image file in kilobytes")}\n                                ${x("Dimensions",`${n.metadata.sharp.width}x${n.metadata.sharp.height}`,"Width & height of the image in pixels")}\n                                ${x("Format",n.metadata.sharp.format.toUpperCase(),"Image file format")}\n                                ${x("Color Space",n.metadata.sharp.space.toUpperCase(),"Color space used by the image (sRGB, CMYK, etc.)")}\n                                ${x("Channels",n.metadata.sharp.channels,"Number of color channels in the image")}\n                                ${x("Bit Depth",n.metadata.sharp.depth,"Number of bits used per color channel. Higher values (e.g., 8-bit, 16-bit) mean more possible colors and smoother gradients")}\n                                ${x("Resolution",`${n.metadata.sharp.density} DPI`,"Image resolution in dots per inch (DPI)")}\n                                ${x("Chroma Subsampling",n.metadata.sharp.chromaSubsampling,"Type of chroma subsampling used for color compression")}\n                                ${x("Progressive Loading",n.metadata.sharp.isProgressive?"Yes":"No","A technique where the image loads gradually, starting with a low-quality version that becomes clearer over time. Improves perceived loading speed on slower connections")}\n                                ${x("Has Alpha Channel",n.metadata.sharp.hasAlpha?"Yes":"No","Whether the image contains transparency")}\n                                ${x("Color Profile",n.metadata.sharp.hasProfile?"Yes":"No","A set of data that defines how colors should be displayed. Helps ensure consistent color appearance across different devices and screens")}\n                                ${x("Image Hash",n.imageHash,"A unique digital fingerprint of the image. It can be used to identify identical copies of this image, even if renamed")}\n                                ${x("Perceptual Hash",n.pHash,"A special type of image fingerprint that can identify visually similar images, even if they've been slightly modified, resized, or compressed")}\n                                ${x("Upload Date",new Date(n.uploadDate).toLocaleString(),"When the image was uploaded for analysis")}\n                                ${x("Origin Website",n.originWebsites?.[0]||"Unknown","Website where the image originated")}\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <div class="feedback-section">\n                    <p>Was this analysis helpful?</p>\n                    <div class="feedback-buttons">\n                        <button class="feedback-btn thumbs-up" data-image-hash="${n.imageHash}" data-value="up">\n                            <span>👍</span>\n                        </button>\n                        <button class="feedback-btn thumbs-down" data-image-hash="${n.imageHash}" data-value="down">\n                            <span>👎</span>\n                        </button>\n                    </div>\n                    <div class="feedback-comment" style="display: none;">\n                        <div class="textarea-container">\n                            <textarea placeholder="Tell us why (optional)" maxlength="100"></textarea>\n                            <div class="char-counter">0/100 characters</div>\n                        </div>\n                        <button class="submit-feedback-btn">Submit Feedback</button>\n                    </div>\n                </div>\n            `;const c=document.createElement("style");c.textContent="\n                .close-x {\n                    position: absolute;\n                    top: 5px;\n                    right: 10px;\n                    cursor: pointer;\n                    font-size: 20px;\n                    color: #666;\n                    transition: color 0.2s;\n                }\n                .close-x:hover {\n                    color: #333;\n                }\n            ",document.head.appendChild(c);const d=e.querySelectorAll(".feedback-btn"),u=e.querySelector(".feedback-comment"),m=e.querySelector(".submit-feedback-btn"),p=e.querySelector("textarea"),h=e.querySelector(".char-counter");d.forEach((e=>{e.addEventListener("click",(()=>{d.forEach((e=>e.classList.remove("active"))),e.classList.add("active"),u.style.display="block"}))})),p.addEventListener("input",(()=>{const e=p.value.length;h.textContent=`${e}/100 characters`,h.classList.remove("near-limit","at-limit"),e>=90?h.classList.add("at-limit"):e>=75&&h.classList.add("near-limit")})),m.addEventListener("click",(async()=>{m.disabled=!0,m.innerHTML='\n            <span class="spinner"></span>\n            Sending...\n          ';const{authToken:n}=await chrome.storage.local.get(["authToken"]);if(console.log("Retrieved authToken:",n?"Token exists":"No token found"),!n)return console.error("No auth token found"),void(m.innerHTML="Error: Please log in");const o=t(n),a=o?.username||null;console.log("Final userId to be submitted:",a);const s=e.querySelectorAll(".feedback-btn"),i=e.querySelector("textarea"),r=s[0].dataset.imageHash,l=Array.from(s).find((e=>e.classList.contains("active")))?.getAttribute("data-value"),c=i?.value?.trim()||"";if(l){console.log("Submitting feedback with data:",{imageHash:r,feedbackType:l,comment:c,userId:a});try{chrome.runtime.sendMessage({action:"submitFeedback",feedbackData:{imageHash:r,feedbackType:l,comment:c,userId:a},origin:window.location.origin},(t=>{console.log("Feedback submission response:",t);const n=e.querySelector(".feedback-section");if(n.style.marginTop="0",t.success){let e,o,a;switch(t.data.message){case"Feedback already received":e="#3498db",o="Already Submitted",a="You've already provided feedback for this image";break;case"Feedback updated successfully":e="#2196F3",o="Feedback Updated",a="Your feedback has been updated successfully";break;default:e="#4CAF50",o="Thank you!",a="Your feedback helps improve our analyses"}n.innerHTML=`\n                    <div class="feedback-success">\n                        <div class="icon-container">\n                            <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">\n                                <circle cx="26" cy="26" r="25" fill="none" stroke="${e}" stroke-width="2"/>\n                                <path fill="none" stroke="${e}" stroke-width="2" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>\n                            </svg>\n                        </div>\n                        <h3 class="feedback-title" style="color: ${e}">${o}</h3>\n                        <p class="feedback-message">${a}</p>\n                    </div>\n                `}else{m.disabled=!1,m.innerHTML="Submit Feedback";const e=document.createElement("p");e.className="feedback-error",e.textContent=`Error: ${t.error||"Failed to submit feedback"}`,m.parentNode.insertBefore(e,m.nextSibling)}}))}catch(e){console.error("Error in feedback submission:",e),m.disabled=!1,m.innerHTML="Submit Feedback";const t=document.createElement("p");t.className="feedback-error",t.textContent="Error: Failed to submit feedback",m.parentNode.insertBefore(t,m.nextSibling)}}else console.error("No feedback selected")})),console.log("Feedback buttons:",{feedbackBtns:e.querySelectorAll(".feedback-btn"),submitBtn:e.querySelector(".submit-feedback-btn"),feedbackComment:e.querySelector("textarea")}),p.addEventListener("input",(()=>{const e=p.value.length;h.textContent=`${e}/100 characters`,h.classList.remove("near-limit","at-limit"),e>=90?h.classList.add("at-limit"):e>=75&&h.classList.add("near-limit")}));const g=e.querySelector(".accordion-button"),y=e.querySelector(".accordion-content");g.addEventListener("click",(()=>{const e="block"===y.style.display;y.style.display=e?"none":"block",g.querySelector("span").textContent=e?"View Analysis Details":"Hide Analysis Details"}));const v=e.querySelector(".model-result.selected");v&&(v.addEventListener("mousemove",(e=>{const t=v,n=e.clientX+15,o=e.clientY+15;t.style.setProperty("--tooltip-x",`${n}px`),t.style.setProperty("--tooltip-y",`${o}px`)})),v.addEventListener("mouseleave",(()=>{v.style.setProperty("--tooltip-visibility","hidden"),v.style.setProperty("--tooltip-opacity","0")})))}else e.innerHTML='\n                <div class="error-container">\n                    <div class="close-x">×</div>\n                    <p class="error">No analysis results available</p>\n                </div>\n            '}e.setAttribute("data-overlay-id",a);const s=e.querySelector(".close-x");s&&s.addEventListener("click",(()=>{e.remove()}))}function p(e,t){const n=document.createElement("div");n.textContent=e,n.style.position="fixed",n.style.bottom="20px",n.style.right="20px",n.style.padding="10px 20px",n.style.borderRadius="5px",n.style.color="#fff",n.style.zIndex="10000",n.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)",n.style.opacity="0",n.style.transition="opacity 0.5s ease-in-out",n.style.backgroundColor="success"===t?"#4caf50":"error"===t?"#f44336":"#333",document.body.appendChild(n),n.offsetWidth,n.style.opacity="1",setTimeout((()=>{n.style.opacity="0",n.addEventListener("transitionend",(()=>{n.remove()}))}),3e3)}const h=e(c,500);function g(e){for(const t of e)if(("childList"===t.type||"attributes"===t.type)&&(t.addedNodes.length>0||"attributes"===t.type&&"src"===t.attributeName)){clearTimeout(w),w=setTimeout((()=>{c()}),k);break}}function y(){document.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>d(e,t)))}async function v(){await l()&&c()}async function b(){if(!chrome.runtime||!chrome.runtime.id)return;const t=window.location.hostname;i=t.includes("linkedin.com")?"linkedin":t.includes("facebook.com")?"facebook":t.includes("twitter.com")||t.includes("x.com")?"twitter":t.includes("instagram.com")?"instagram":t.includes("reddit.com")?"reddit":null,i&&(await l()?(a=!0,s=!0,v(),n=new MutationObserver((e=>{e.forEach((e=>{"childList"===e.type&&e.addedNodes.forEach((e=>{e.nodeType===Node.ELEMENT_NODE&&e.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>d(e,t)))}))}))})),n.observe(document.body,{childList:!0,subtree:!0}),setInterval(y,2e3),window.addEventListener("scroll",e((()=>{c()}),200)),o=new MutationObserver(g),o.observe(document.body,{childList:!0,subtree:!0})):(a=!1,s=!1,r(),n&&n.disconnect(),o&&o.disconnect(),window.removeEventListener("scroll",h)))}setInterval((function(){chrome.runtime.id||location.reload()}),6e4),chrome.runtime.onMessage.addListener(((e,t,n)=>{return"settingsChanged"===e.action&&((r=e.changes).enableOverlay&&(a=r.enableOverlay.newValue),b(),n({success:!0})),"updateSettings"===e.action&&(o=e.settings,a=!1!==o.enableOverlay,s=!1!==o[i],a&&s?(document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="flex"})),c()):document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="none"})),n({status:"Settings updated"})),!0;var o,r})),b();const f=document.createElement("style");let w;f.innerHTML="",document.head.appendChild(f);const k=300;window.addEventListener("error",(e=>{e.error}));const x=(e,t,n)=>`\n    <div class="detail-row">\n        <span class="detail-label" title="${n}">${e}</span>\n        <span class="detail-value">${t}</span>\n    </div>\n  `;chrome.runtime.onMessage.addListener(((e,t,n)=>{"authStateChanged"===e.action&&(e.isAuthenticated?(console.log("User authenticated, refreshing overlays"),v()):(console.log("User logged out, removing overlays"),r()))}))})();
//# sourceMappingURL=social-content.js.map
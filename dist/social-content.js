(()=>{function e(e,t){let n;return function(...o){clearTimeout(n),n=setTimeout((()=>{clearTimeout(n),e(...o)}),t)}}function t(e){try{const t=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),n=decodeURIComponent(atob(t).split("").map((e=>"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2))).join("")),o=JSON.parse(n);return console.log("Decoded JWT payload:",o),console.log("Extracted userId:",o.username),o}catch(e){return console.error("Error decoding JWT:",e),null}}let n,o,a=!1,s=!1,r=null;function i(){document.querySelectorAll(".image-overlay").forEach((e=>e.remove()))}async function c(){try{const e=await new Promise(((e,t)=>{chrome.storage.sync.get(["enableOverlay","facebook","twitter","instagram","linkedin","reddit"],(n=>{chrome.runtime.lastError?t(chrome.runtime.lastError):e(n)}))}));return a=!1!==e.enableOverlay,s=!1!==e[r],a&&s}catch(e){return console.error("Error in shouldProcessImage:",e),!1}}async function l(){if(!await c())return void i();const e=[];(function t(n){n.nodeType===Node.ELEMENT_NODE&&("img"!==n.tagName.toLowerCase()||n.dataset.overlayProcessed||e.push(n),n.shadowRoot&&t(n.shadowRoot),n.childNodes.forEach((e=>t(e))))})(document.body),"instagram"===r&&document.querySelectorAll('img[srcset], img[src*="instagram"]').forEach((t=>{t.dataset.overlayProcessed||e.push(t)})),"reddit"===r&&document.querySelectorAll('img[alt="Post image"]').forEach((t=>e.push(t))),e.forEach(((e,t)=>{if(e.width>50&&e.height>50||e.getAttribute("width")>50&&e.getAttribute("height")>50||e.classList.contains("media-lightbox-img"))try{e.complete&&e.naturalWidth>0?d(e,t):e.addEventListener("load",(()=>{d(e,t)}),{once:!0})}catch(e){console.error("Error processing image:",e)}else e.dataset.overlayProcessed="skipped"}))}function d(e,t){if("true"===e.dataset.overlayProcessed)return;const n=new IntersectionObserver((o=>{o.forEach((o=>{o.isIntersecting&&((e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&u(e,t),n.unobserve(e))}))}),{threshold:.1});n.observe(e),e.dataset.overlayProcessed="true",e.onerror=function(){},e.onload=function(){(e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&u(e,t)}}function u(n,o){const a=`overlay-${o}-${Date.now()}`;let s=document.querySelector(`.image-overlay[data-for-image="${n.src}"]`);if(!s){s=document.createElement("div"),s.className="image-overlay",s.dataset.forImage=n.src,s.dataset.overlayId=a;const o=document.createElement("img");o.src=chrome.runtime.getURL("icons/realeyes-ai-icon.png"),o.style.cssText=`\n        width: 20px;\n        height: 20px;\n        object-fit: contain;\n        ${"reddit"===r?"margin-top: 16px;":""}\n      `,s.style.cssText="\n            position: absolute;\n            width: 30px;\n            height: 30px;\n            background-color: rgba(255, 255, 255, 0.4);\n            border-radius: 50%;\n            cursor: pointer;\n            z-index: 2147483647;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 20px;\n            pointer-events: auto;\n            box-shadow: 0 2px 4px rgba(0,0,0,0.2);\n            opacity: 0.5;\n            transition: opacity 0.3s ease, background-color 0.3s ease, display 0.3s ease;\n        ",s.appendChild(o),s.onclick=o=>{o.stopPropagation(),o.preventDefault();let i=document.querySelector(`.consent-popup[data-for-image="${n.src}"]`);if(i||(i=document.querySelector(`.consent-popup[data-overlay-id="${a}"]`)),i)return void i.remove();const c=function(e){if("instagram"===r){const t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight,t.getContext("2d").drawImage(e,0,0);try{return t.toDataURL("image/jpeg")}catch(t){return console.error("Failed to get image data:",t),e.src}}const t=e.src;let n=t;if("linkedin"===r){if(null!==e.closest(".feed-shared-celebration-image"))return t;try{const e=new URL(t),o=e.pathname;e.searchParams.delete("w"),e.searchParams.delete("h"),e.searchParams.set("w","1000"),e.searchParams.set("h","1000"),n=e.toString();const a=o.split(".").pop().toLowerCase();["jpg","jpeg","png","gif","webp"].includes(a)&&(n.toLowerCase().endsWith(`.${a}`)||(n+=`.${a}`))}catch(e){console.error("Failed to parse LinkedIn image URL:",e),n=t}}else if("instagram"===r&&t.includes("&_nc_ht="))try{const e=new URL(t);e.searchParams.delete("_nc_sid"),e.searchParams.delete("_nc_ohc"),e.searchParams.delete("_nc_ht"),e.searchParams.delete("edm"),e.searchParams.delete("oh"),e.searchParams.delete("oe"),n=e.toString()}catch(e){console.error("Failed to parse Instagram image URL:",e)}return n}(n);c?function(n,o,a){let s=document.querySelector(`.consent-popup[data-for-image="${o}"]`);if(s||(s=document.querySelector(`.consent-popup[data-overlay-id="${a}"]`)),s)return s;document.querySelectorAll(".consent-popup").forEach((e=>e.remove()));const r=document.createElement("div");r.className="consent-popup",r.setAttribute("data-for-image",o),r.setAttribute("data-overlay-id",a),r.innerHTML='\n        <p class="consent-message">Analyze this image?</p>\n        <div class="consent-buttons">\n            <button class="confirm-btn">Analyze Now</button>\n            <button class="cancel-btn">Skip</button>\n        </div>\n        <div class="consent-options">\n            <label class="store-data-option">\n                <input type="checkbox" class="store-data-checkbox" id="storeImageData" checked>\n                <span>Help us improve detection by storing this image</span>\n            </label>\n        </div>\n    ',document.body.appendChild(r);const i=new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting?(r.style.display="flex",c()):r.style.display="none"}))}),{threshold:.1});i.observe(n);const c=()=>{if("none"===r.style.display)return;const e=n.getBoundingClientRect(),t=window.scrollY||window.pageYOffset;let o=e.right+10,a=e.top+t;o+r.offsetWidth>window.innerWidth-10&&(o=e.left-r.offsetWidth-10);const s=document.documentElement.scrollHeight-r.offsetHeight-10;a=Math.max(10,Math.min(a,s)),r.style.position="absolute",r.style.left=`${o}px`,r.style.top=`${a}px`};new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting||(r.style.display="none")}))}),{threshold:0}).observe(n),setTimeout(c,0);const l=e(c,100);window.addEventListener("resize",l),window.addEventListener("scroll",l),r.querySelector(".confirm-btn")?.addEventListener("click",(async e=>{e.preventDefault();const n=r.querySelector("#storeImageData"),a=!!n&&n.checked;r.innerHTML='<div class="loading-indicator">Analyzing...</div>',await function(e,n,o){let a=e.split("/").pop().split("?")[0],s="image/jpeg";chrome.storage.local.get(["authToken"],(async function(r){const i=r.authToken;if(!i)return void m(n,"Authentication required. Please log in and try again.","error");const c=t(i),l=c?.username||null;if(e.includes("twimg.com")){const t=new URL(e).searchParams.get("format");t&&(a+=`.${t}`,s=`image/${t}`)}else s=function(e){return{jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp"}[e.split(".").pop().toLowerCase()]||"application/octet-stream"}(a);fetch(e).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.arrayBuffer()})).then((e=>{const t=new Uint8Array(e);return crypto.subtle.digest("SHA-256",t).then((e=>{const n=Array.from(new Uint8Array(e)).map((e=>e.toString(16).padStart(2,"0"))).join("");return{uint8Array:t,hashHex:n}}))})).then((({uint8Array:t,hashHex:r})=>{chrome.runtime.sendMessage({action:"sendImage",imageData:{url:e,mimeType:s,filename:a,size:t.length,sha256Hash:r,origin:window.location.origin,storeData:o,userId:l}},(e=>{chrome.runtime.lastError?m(n,"Error: "+chrome.runtime.lastError.message,"error"):"Authentication required"===e.error?m(n,"Authentication required. Please log in and try again.","error"):m(n,e,"success")}))})).catch((e=>{console.error("Error:",e),m(n,"Error: "+e.message,"error")}))}))}(o,r,a)})),r.querySelector(".cancel-btn")?.addEventListener("click",(()=>{window.removeEventListener("resize",l),window.removeEventListener("scroll",l),i.disconnect(),r.remove()}))}(s,c,a):function(){const e=document.createElement("div");e.textContent="No suitable image found.",e.style.position="fixed",e.style.bottom="20px",e.style.right="20px",e.style.padding="10px 20px",e.style.borderRadius="5px",e.style.color="#fff",e.style.zIndex="10000",e.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)",e.style.opacity="0",e.style.transition="opacity 0.5s ease-in-out",e.style.backgroundColor="#f44336",document.body.appendChild(e),e.offsetWidth,e.style.opacity="1",setTimeout((()=>{e.style.opacity="0",e.addEventListener("transitionend",(()=>{e.remove()}))}),3e3)}()},n.parentElement.appendChild(s),s.addEventListener("mouseenter",(()=>{s.style.opacity="1",s.style.backgroundColor="rgba(255, 255, 255, 0.8)"})),s.addEventListener("mouseleave",(()=>{s.style.opacity="0.5",s.style.backgroundColor="rgba(255, 255, 255, 0.4)"}))}const i=e((()=>{const e=n.getBoundingClientRect(),t=window.innerHeight,o=window.innerWidth,a=e.top<t&&e.bottom>0&&e.left<o&&e.right>0,r=null!==n.closest(".media-lightbox-img"),i="video"===n.tagName.toLowerCase()||n.querySelector("video");if(!a||!(e.width>100&&e.height>100||i)||r&&null===n.offsetParent)i?(s.style.display="flex",s.style.top="10px",s.style.right="10px",s.style.bottom="auto",s.style.left="auto"):setTimeout((()=>{a||(s.style.display="none")}),300);else{s.style.display="flex";const e=10,t=10;s.style.top=`${e}px`,s.style.right=`${t}px`,s.style.bottom="auto",s.style.left="auto"}}),100);if(i(),!n.dataset.overlayEventListenersAdded){const e=()=>{i()},t=()=>{i()};window.addEventListener("scroll",e,{passive:!0}),window.addEventListener("resize",t,{passive:!0}),n.dataset.overlayEventListenersAdded="true"}new MutationObserver((e=>{e.forEach((e=>{"attributes"!==e.type||"src"!==e.attributeName&&"style"!==e.attributeName||(s.dataset.forImage=n.src,i())}))})).observe(n,{attributes:!0,attributeFilter:["src","style"]})}function m(e,n,o){const a=e.getAttribute("data-overlay-id");if(e.innerHTML="","error"===o)e.innerHTML=`\n            <div class="error-container">\n                <div class="close-x">×</div>\n                <p class="error">${n}</p>\n            </div>\n        `;else{const o=n.sageMakerAnalysis,a=n.sageMakerAnalysisUFD,s=o.probability>a.probability?o:a,r=o.probability>a.probability?"DMImageDetection Model":"UniversalFakeDetect Model";if(s){const i=(100*s.probability).toFixed(1);let c,l;i<33?(c="#28a745",l="This content is likely real."):i<66?(c="#ffc107",l="This content is uncertain—proceed with caution."):(c="#dc3545",l="This content is likely a deepfake."),e.innerHTML=`\n                <div class="close-x">×</div>\n                <div class="analysis-title" style="color: ${c}">${l}</div>\n\n                <div class="probability-circle">\n                    <svg width="150" height="150" viewBox="0 0 150 150">\n                        <circle\n                            cx="75"\n                            cy="75"\n                            r="70"\n                            stroke="#E6E6E6"\n                            stroke-width="10"\n                            fill="none"\n                        />\n                        <circle\n                            cx="75"\n                            cy="75"\n                            r="70"\n                            stroke="${c}"\n                            stroke-width="10"\n                            fill="none"\n                            stroke-linecap="round"\n                            stroke-dasharray="439.82"\n                            stroke-dashoffset="${439.82*(1-i/100)}"\n                            transform="rotate(-90 75 75)"\n                            style="transition: stroke-dashoffset 1s"\n                        />\n                    </svg>\n                    <div class="probability-text">\n                        <div class="probability-value" style="color: ${c}">${i}%</div>\n                        <div class="probability-label" style="\n                            font-size: 12px;\n                            color: #333;\n                            margin-top: 10px;\n                        ">Deepfake Probability</div>\n                    </div>\n                </div>\n\n                <div class="confidence-indicators">\n                    <div class="indicator real">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label">Likely Real</div>\n                    </div>\n                    <div class="indicator uncertain">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label" style="white-space: nowrap;">Uncertain</div>\n                    </div>\n                    <div class="indicator fake">\n                        <div class="indicator-dot"></div>\n                        <div class="indicator-label">Likely Deepfake</div>\n                    </div>\n                </div>\n\n                <div class="request-count" data-tooltip="${1===n.requestCount?"The analysis results were determined in near-real-time":"Displaying cached analysis results"}">\n                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n                        <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="#666"/>\n                        <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="#666"/>\n                    </svg>\n                    ${1===n.requestCount?"You're the first to analyze this image":`Image analyzed ${n.requestCount} time${1!==n.requestCount?"s":""}`}\n                </div>\n\n                <div class="analysis-details-accordion">\n                    <button class="accordion-button">\n                        <span>View Analysis Details</span>\n                    </button>\n                    \n                    <div class="accordion-content">\n                        <div class="details-section">\n                            <h4 style="margin: 5px 0; color: #495057;">Model Details</h4>\n                            <p><strong>Selected Model:</strong> ${r}</p>\n                            <p><strong>Logit Value:</strong> ${s.logit.toFixed(4)}</p>\n                            <p><strong>Raw Probability:</strong> ${s.probability.toFixed(6)}</p>\n                            \n                            <h4 style="margin: 10px 0 5px; color: #495057;">Image Information</h4>\n                            <p><strong>File Name:</strong> ${n.originalFileName}</p>\n                            <p><strong>File Size:</strong> ${(n.fileSize/1024).toFixed(2)} KB</p>\n                            <p><strong>Dimensions:</strong> ${n.metadata.sharp.width}x${n.metadata.sharp.height}</p>\n                            <p><strong>Format:</strong> ${n.metadata.sharp.format.toUpperCase()}</p>\n                            \n                            <h4 style="margin: 10px 0 5px; color: #495057;">Analysis Comparison</h4>\n                            <p><strong>DMImageDetection Model:</strong> ${(100*o.probability).toFixed(1)}% probability</p>\n                            <p><strong>UniversalFakeDetect Model:</strong> ${(100*a.probability).toFixed(1)}% probability</p>\n                            \n                            <h4 style="margin: 10px 0 5px; color: #495057;">Technical Details</h4>\n                            <p><strong>Image Hash:</strong> ${n.imageHash}</p>\n                            <p><strong>Perceptual Hash:</strong> ${n.pHash}</p>\n                            <p><strong>Upload Date:</strong> ${new Date(n.uploadDate).toLocaleString()}</p>\n                        </div>\n                    </div>\n                </div>\n\n                <div class="feedback-section">\n                    <p>Was this analysis helpful?</p>\n                    <div class="feedback-buttons">\n                        <button class="feedback-btn thumbs-up" data-image-hash="${n.imageHash}" data-value="up">\n                            <span>👍</span>\n                        </button>\n                        <button class="feedback-btn thumbs-down" data-image-hash="${n.imageHash}" data-value="down">\n                            <span>👎</span>\n                        </button>\n                    </div>\n                    <div class="feedback-comment" style="display: none;">\n                        <div class="textarea-container">\n                            <textarea placeholder="Tell us why (optional)" maxlength="100"></textarea>\n                            <div class="char-counter">0/100 characters</div>\n                        </div>\n                        <button class="submit-feedback-btn">Submit Feedback</button>\n                    </div>\n                </div>\n            `;const d=document.createElement("style");d.textContent="\n                .close-x {\n                    position: absolute;\n                    top: 5px;\n                    right: 10px;\n                    cursor: pointer;\n                    font-size: 20px;\n                    color: #666;\n                    transition: color 0.2s;\n                }\n                .close-x:hover {\n                    color: #333;\n                }\n            ",document.head.appendChild(d);const u=e.querySelectorAll(".feedback-btn"),m=e.querySelector(".feedback-comment"),p=e.querySelector(".submit-feedback-btn"),g=e.querySelector("textarea"),h=e.querySelector(".char-counter");u.forEach((e=>{e.addEventListener("click",(()=>{u.forEach((e=>e.classList.remove("active"))),e.classList.add("active"),m.style.display="block"}))})),g.addEventListener("input",(()=>{const e=g.value.length;h.textContent=`${e}/100 characters`,h.classList.remove("near-limit","at-limit"),e>=90?h.classList.add("at-limit"):e>=75&&h.classList.add("near-limit")})),p.addEventListener("click",(async()=>{p.disabled=!0,p.innerHTML='\n            <span class="spinner"></span>\n            Sending...\n          ';const{authToken:n}=await chrome.storage.local.get(["authToken"]);if(console.log("Retrieved authToken:",n?"Token exists":"No token found"),!n)return console.error("No auth token found"),void(p.innerHTML="Error: Please log in");const o=t(n),a=o?.username||null;console.log("Final userId to be submitted:",a);const s=e.querySelectorAll(".feedback-btn"),r=e.querySelector("textarea"),i=s[0].dataset.imageHash,c=Array.from(s).find((e=>e.classList.contains("active")))?.getAttribute("data-value"),l=r?.value?.trim()||"";if(c){console.log("Submitting feedback with data:",{imageHash:i,feedbackType:c,comment:l,userId:a});try{chrome.runtime.sendMessage({action:"submitFeedback",feedbackData:{imageHash:i,feedbackType:c,comment:l,userId:a},origin:window.location.origin},(t=>{if(console.log("Feedback submission response:",t),t.success){const t=e.querySelector(".feedback-section");t.style.marginTop="0",t.innerHTML='\n                    <div class="feedback-success">\n                      <div class="icon-container">\n                        <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">\n                          <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" stroke-width="2"/>\n                          <path fill="none" stroke="#4CAF50" stroke-width="2" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>\n                        </svg>\n                      </div>\n                      <h3 class="feedback-title">Thank you!</h3>\n                      <p class="feedback-message">Your feedback helps improve our analyses</p>\n                    </div>\n                  '}else if(t.alreadySubmitted){const t=e.querySelector(".feedback-section");t.style.marginTop="0",t.innerHTML='\n                    <div class="feedback-already-submitted">\n                      <div class="icon-container">\n                        <svg class="status-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">\n                          <circle cx="26" cy="26" r="25" fill="none" stroke="#3498db" stroke-width="2"/>\n                          <path fill="none" stroke="#3498db" stroke-width="2" d="M26 15v2m0 7v13"/>\n                        </svg>\n                      </div>\n                      <h3 class="feedback-title" style="color: #3498db;">Already Submitted</h3>\n                      <p class="feedback-message">You\'ve already provided feedback for this image</p>\n                    </div>\n                  '}else{p.disabled=!1,p.innerHTML="Submit Feedback";const e=document.createElement("p");e.className="feedback-error",e.textContent=`Error: ${t.error||"Failed to submit feedback"}`,p.parentNode.insertBefore(e,p.nextSibling)}}))}catch(e){console.error("Error in feedback submission:",e),p.disabled=!1,p.innerHTML="Submit Feedback";const t=document.createElement("p");t.className="feedback-error",t.textContent="Error: Failed to submit feedback",p.parentNode.insertBefore(t,p.nextSibling)}}else console.error("No feedback selected")})),console.log("Feedback buttons:",{feedbackBtns:e.querySelectorAll(".feedback-btn"),submitBtn:e.querySelector(".submit-feedback-btn"),feedbackComment:e.querySelector("textarea")}),g.addEventListener("input",(()=>{const e=g.value.length;h.textContent=`${e}/100 characters`,h.classList.remove("near-limit","at-limit"),e>=90?h.classList.add("at-limit"):e>=75&&h.classList.add("near-limit")}));const y=e.querySelector(".accordion-button"),b=e.querySelector(".accordion-content");y.addEventListener("click",(()=>{const e="block"===b.style.display;b.style.display=e?"none":"block"}))}else e.innerHTML='\n                <div class="error-container">\n                    <div class="close-x">×</div>\n                    <p class="error">No analysis results available</p>\n                </div>\n            '}e.setAttribute("data-overlay-id",a);const s=e.querySelector(".close-x");s&&s.addEventListener("click",(()=>{e.remove()}))}const p=e(l,500);function g(e){for(const t of e)if(("childList"===t.type||"attributes"===t.type)&&(t.addedNodes.length>0||"attributes"===t.type&&"src"===t.attributeName)){clearTimeout(v),v=setTimeout((()=>{l()}),f);break}}function h(){document.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>d(e,t)))}async function y(){if(!chrome.runtime||!chrome.runtime.id)return;const t=window.location.hostname;r=t.includes("linkedin.com")?"linkedin":t.includes("facebook.com")?"facebook":t.includes("twitter.com")||t.includes("x.com")?"twitter":t.includes("instagram.com")?"instagram":t.includes("reddit.com")?"reddit":null,r&&(await c()?(a=!0,s=!0,async function(){await c()&&l()}(),n=new MutationObserver((e=>{e.forEach((e=>{"childList"===e.type&&e.addedNodes.forEach((e=>{e.nodeType===Node.ELEMENT_NODE&&e.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>d(e,t)))}))}))})),n.observe(document.body,{childList:!0,subtree:!0}),setInterval(h,2e3),window.addEventListener("scroll",e((()=>{l()}),200)),o=new MutationObserver(g),o.observe(document.body,{childList:!0,subtree:!0})):(a=!1,s=!1,i(),n&&n.disconnect(),o&&o.disconnect(),window.removeEventListener("scroll",p)))}setInterval((function(){chrome.runtime.id||location.reload()}),6e4),chrome.runtime.onMessage.addListener(((e,t,n)=>{return"settingsChanged"===e.action&&((i=e.changes).enableOverlay&&(a=i.enableOverlay.newValue),y(),n({success:!0})),"updateSettings"===e.action&&(o=e.settings,a=!1!==o.enableOverlay,s=!1!==o[r],a&&s?(document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="flex"})),l()):document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="none"})),n({status:"Settings updated"})),!0;var o,i})),y();const b=document.createElement("style");let v;b.innerHTML="",document.head.appendChild(b);const f=300;window.addEventListener("error",(e=>{e.error}))})();
//# sourceMappingURL=social-content.js.map
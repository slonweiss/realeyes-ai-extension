(()=>{function e(e,t){let n;return function(...o){clearTimeout(n),n=setTimeout((()=>{clearTimeout(n),e(...o)}),t)}}console.log("Social content script loaded");let t,n,o=!1,r=!1,s=null;function a(){document.querySelectorAll(".image-overlay").forEach((e=>e.remove()))}async function i(){try{const e=await new Promise(((e,t)=>{chrome.storage.sync.get(["enableOverlay","facebook","twitter","instagram","linkedin","reddit"],(n=>{chrome.runtime.lastError?t(chrome.runtime.lastError):e(n)}))}));return o=!1!==e.enableOverlay,r=!1!==e[s],o&&r}catch(e){return console.error("Error in shouldProcessImage:",e),!1}}async function l(){if(!await i())return void a();const e=[];(function t(n){n.nodeType===Node.ELEMENT_NODE&&("img"!==n.tagName.toLowerCase()||n.dataset.overlayProcessed||e.push(n),n.shadowRoot&&t(n.shadowRoot),n.childNodes.forEach((e=>t(e))))})(document.body),"instagram"===s&&document.querySelectorAll('img[srcset], img[src*="instagram"]').forEach((t=>{t.dataset.overlayProcessed||e.push(t)})),"reddit"===s&&document.querySelectorAll('img[alt="Post image"]').forEach((t=>e.push(t))),e.forEach(((e,t)=>{if(e.width>50&&e.height>50||e.getAttribute("width")>50&&e.getAttribute("height")>50||e.classList.contains("media-lightbox-img"))try{e.complete&&e.naturalWidth>0?c(e):e.addEventListener("load",(()=>{c(e)}),{once:!0})}catch(e){console.error("Error processing image:",e)}else e.dataset.overlayProcessed="skipped"}))}function c(e,t){if("true"===e.dataset.overlayProcessed)return;const n=new IntersectionObserver((t=>{t.forEach((t=>{t.isIntersecting&&((e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&d(e),n.unobserve(e))}))}),{threshold:.1});n.observe(e),e.dataset.overlayProcessed="true",e.onerror=function(){},e.onload=function(){(e.width>100&&e.height>100||"video"===e.tagName.toLowerCase())&&d(e)}}function d(t,n){let o=document.querySelector(`.image-overlay[data-for-image="${t.src}"]`);o||(o=document.createElement("div"),o.className="image-overlay",o.dataset.forImage=t.src,o.style.cssText="\n        position: absolute;\n        width: 30px;\n        height: 30px;\n        background-color: rgba(255, 255, 255, 0.4);\n        border-radius: 50%;\n        cursor: pointer;\n        z-index: 2147483647;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-size: 20px;\n        pointer-events: auto;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.2);\n        opacity: 0.5;\n        transition: opacity 0.3s ease, background-color 0.3s ease, display 0.3s ease;\n      ",o.textContent="🧿",o.onclick=e=>{e.stopPropagation(),e.preventDefault();const n=function(e){if("instagram"===s){const t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight,t.getContext("2d").drawImage(e,0,0);try{return t.toDataURL("image/jpeg")}catch(t){return console.error("Failed to get image data:",t),e.src}}const t=e.src;let n=t;if("linkedin"===s){if(null!==e.closest(".feed-shared-celebration-image"))return t;try{const e=new URL(t),o=e.pathname;e.searchParams.delete("w"),e.searchParams.delete("h"),e.searchParams.set("w","1000"),e.searchParams.set("h","1000"),n=e.toString();const r=o.split(".").pop().toLowerCase();["jpg","jpeg","png","gif","webp"].includes(r)&&(n.toLowerCase().endsWith(`.${r}`)||(n+=`.${r}`))}catch(e){console.error("Failed to parse LinkedIn image URL:",e),n=t}}else if("instagram"===s&&t.includes("&_nc_ht="))try{const e=new URL(t);e.searchParams.delete("_nc_sid"),e.searchParams.delete("_nc_ohc"),e.searchParams.delete("_nc_ht"),e.searchParams.delete("edm"),e.searchParams.delete("oh"),e.searchParams.delete("oe"),n=e.toString()}catch(e){console.error("Failed to parse Instagram image URL:",e)}return n}(t);n?function(e,t){document.querySelectorAll(".consent-popup").forEach((e=>{e.remove()}));const n=document.createElement("div");n.className="consent-popup",n.innerHTML='\n      <p class="consent-message">Do you want to send this image for analysis?</p>\n      <div class="consent-buttons">\n        <button class="confirm-btn">Analyze Image</button>\n        <button class="cancel-btn">Cancel</button>\n      </div>\n      <div class="loading-indicator" style="display: none;">\n        <div class="spinner"></div>\n        <p>Analyzing image...</p>\n      </div>\n      <div class="analysis-results" style="display: none;"></div>\n    ',n.style.position="fixed",n.style.zIndex="2147483647",document.body.appendChild(n);const o=()=>{const t=e.getBoundingClientRect(),o=window.innerWidth,r=window.innerHeight,s=n.offsetHeight,a=n.offsetWidth;if(!(t.top<r&&t.bottom>0&&t.left<o&&t.right>0))return void(n.style.display="none");let i,l;n.style.display="block",i=t.bottom+s+10<=r?t.bottom+10:t.top-s-10>=0?t.top-s-10:Math.max(10,Math.min(t.top,r-s-10)),l=Math.max(10,Math.min(t.left,o-a-10)),n.style.top=`${i}px`,n.style.left=`${l}px`};o();const r=()=>{o()};window.addEventListener("scroll",r,{passive:!0}),window.addEventListener("resize",r,{passive:!0});const s=n.querySelector(".confirm-btn"),a=n.querySelector(".cancel-btn"),i=n.querySelector(".loading-indicator"),l=(n.querySelector(".analysis-results"),n.querySelector(".consent-message")),c=()=>{l.style.display="none",n.querySelector(".consent-buttons").style.display="none",i.style.display="block",function(e,t){let n=e.split("/").pop().split("?")[0],o="image/jpeg";if(e.includes("twimg.com")){const t=new URL(e).searchParams.get("format");t&&(n+=`.${t}`,o=`image/${t}`)}else o=function(e){return{jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp"}[e.split(".").pop().toLowerCase()]||"application/octet-stream"}(n);console.log(`Sending image for analysis: ${n}`),console.log(`MIME type: ${o}`),console.log(`Image URL: ${e}`),fetch(e).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.arrayBuffer()})).then((e=>{const t=new Uint8Array(e);return crypto.subtle.digest("SHA-256",t).then((e=>{const n=Array.from(new Uint8Array(e)).map((e=>e.toString(16).padStart(2,"0"))).join("");return{uint8Array:t,hashHex:n}}))})).then((({uint8Array:r,hashHex:s})=>{chrome.runtime.sendMessage({action:"sendImage",imageData:{url:e,mimeType:o,filename:n,size:r.length,sample:Array.from(r.slice(0,16)),sha256Hash:s,origin:window.location.origin}},(e=>{chrome.runtime.lastError?(console.error("Error sending message:",chrome.runtime.lastError),u(t,"Error: "+chrome.runtime.lastError.message,"error")):"Authentication required"===e.error?u(t,"Authentication required. Please log in and try again.","error"):(console.log("Server response:",e),u(t,e,"success"))}))})).catch((e=>{console.error("Error:",e),u(t,"Error: "+e.message,"error")}))}(t,n)},d=e=>{y()},m=t=>{n.contains(t.target)||t.target===e||y()},y=()=>{n.remove(),s.removeEventListener("click",c),a.removeEventListener("click",d),document.removeEventListener("click",m),window.removeEventListener("scroll",r),window.removeEventListener("resize",r)};s.addEventListener("click",c),a.addEventListener("click",d),document.addEventListener("click",m)}(o,n):function(){const e=document.createElement("div");e.textContent="No suitable image found.",e.style.position="fixed",e.style.bottom="20px",e.style.right="20px",e.style.padding="10px 20px",e.style.borderRadius="5px",e.style.color="#fff",e.style.zIndex="10000",e.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)",e.style.opacity="0",e.style.transition="opacity 0.5s ease-in-out",e.style.backgroundColor="#f44336",document.body.appendChild(e),e.offsetWidth,e.style.opacity="1",setTimeout((()=>{e.style.opacity="0",e.addEventListener("transitionend",(()=>{e.remove()}))}),3e3)}()},t.parentElement.appendChild(o),o.addEventListener("mouseenter",(()=>{o.style.opacity="1",o.style.backgroundColor="rgba(255, 255, 255, 0.8)"})),o.addEventListener("mouseleave",(()=>{o.style.opacity="0.5",o.style.backgroundColor="rgba(255, 255, 255, 0.4)"})));const r=e((()=>{const e=t.getBoundingClientRect(),n=window.innerHeight,r=window.innerWidth,s=e.top<n&&e.bottom>0&&e.left<r&&e.right>0,a=null!==t.closest(".media-lightbox-img"),i="video"===t.tagName.toLowerCase()||t.querySelector("video");if(!s||!(e.width>100&&e.height>100||i)||a&&null===t.offsetParent)i?(o.style.display="flex",o.style.top="10px",o.style.right="10px",o.style.bottom="auto",o.style.left="auto"):setTimeout((()=>{s||(o.style.display="none")}),300);else{o.style.display="flex";const e=10,t=10;o.style.top=`${e}px`,o.style.right=`${t}px`,o.style.bottom="auto",o.style.left="auto"}}),100);if(r(),!t.dataset.overlayEventListenersAdded){const e=()=>{r()},n=()=>{r()};window.addEventListener("scroll",e,{passive:!0}),window.addEventListener("resize",n,{passive:!0}),t.dataset.overlayEventListenersAdded="true"}new MutationObserver((e=>{e.forEach((e=>{"attributes"!==e.type||"src"!==e.attributeName&&"style"!==e.attributeName||(o.dataset.forImage=t.src,r())}))})).observe(t,{attributes:!0,attributeFilter:["src","style"]})}function u(e,t,n){const o=e.querySelector(".loading-indicator"),r=e.querySelector(".analysis-results");if(o.style.display="none",r.style.display="block","error"===n)r.innerHTML=`<p class="error">${t}</p>`;else{let e="";for(const[n,o]of Object.entries(t))e+=`\n          <tr>\n            <td>${n}</td>\n            <td>${"object"==typeof o?JSON.stringify(o):o}</td>\n          </tr>\n        `;r.innerHTML=`\n        <h3>Analysis Results</h3>\n        <table class="results-table">\n          <tbody>\n            ${e}\n          </tbody>\n        </table>\n      `}}const m=e(l,500);function y(e){for(const t of e)if(("childList"===t.type||"attributes"===t.type)&&(t.addedNodes.length>0||"attributes"===t.type&&"src"===t.attributeName)){clearTimeout(f),f=setTimeout((()=>{l()}),v);break}}function g(){document.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>c(e)))}async function p(){if(!chrome.runtime||!chrome.runtime.id)return;const d=window.location.hostname;s=d.includes("linkedin.com")?"linkedin":d.includes("facebook.com")?"facebook":d.includes("twitter.com")||d.includes("x.com")?"twitter":d.includes("instagram.com")?"instagram":d.includes("reddit.com")?"reddit":null,s&&(await i()?(o=!0,r=!0,async function(){await i()&&l()}(),t=new MutationObserver((e=>{e.forEach((e=>{"childList"===e.type&&e.addedNodes.forEach((e=>{e.nodeType===Node.ELEMENT_NODE&&e.querySelectorAll("img:not([data-overlay-processed])").forEach(((e,t)=>c(e)))}))}))})),t.observe(document.body,{childList:!0,subtree:!0}),setInterval(g,2e3),window.addEventListener("scroll",e((()=>{l()}),200)),n=new MutationObserver(y),n.observe(document.body,{childList:!0,subtree:!0})):(o=!1,r=!1,a(),t&&t.disconnect(),n&&n.disconnect(),window.removeEventListener("scroll",m)))}setInterval((function(){chrome.runtime.id||location.reload()}),6e4),chrome.runtime.onMessage.addListener(((e,t,n)=>{return console.log("Message received in social content script:",e),"settingsChanged"===e.action&&(console.log("Settings changed:",e.changes),i=e.changes,console.log("Updating settings in content script:",i),i.enableOverlay&&(o=i.enableOverlay.newValue),p(),n({success:!0})),"updateSettings"===e.action&&(a=e.settings,o=!1!==a.enableOverlay,r=!1!==a[s],o&&r?(document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="flex"})),l()):document.querySelectorAll(".image-overlay").forEach((e=>{e.style.display="none"})),n({status:"Settings updated"})),!0;var a,i})),p();const h=document.createElement("style");let f;h.innerHTML="\n    .overlay:state(secondary-text-color) {\n      color: var(--secondary-text-color);\n    }\n    \n    .image-fill:state(webkit-fill-available) {\n      width: -webkit-fill-available;\n    }\n  ",document.head.appendChild(h);const v=300;window.addEventListener("error",(e=>{var t;t=e.error,console.error("RealEyes.ai Extension Error:",t)}))})();
//# sourceMappingURL=social-content.js.map
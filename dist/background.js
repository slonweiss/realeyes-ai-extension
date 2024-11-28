(()=>{"use strict";const e=new TextEncoder,t=new TextDecoder;const r=e=>{let r=e;r instanceof Uint8Array&&(r=t.decode(r)),r=r.replace(/-/g,"+").replace(/_/g,"/").replace(/\s/g,"");try{return(e=>{const t=atob(e),r=new Uint8Array(t.length);for(let e=0;e<t.length;e++)r[e]=t.charCodeAt(e);return r})(r)}catch{throw new TypeError("The input to be decoded is not correctly encoded.")}};class o extends Error{constructor(e,t){super(e,t),this.code="ERR_JOSE_GENERIC",this.name=this.constructor.name,Error.captureStackTrace?.(this,this.constructor)}}o.code="ERR_JOSE_GENERIC";class n extends o{constructor(e,t,r="unspecified",o="unspecified"){super(e,{cause:{claim:r,reason:o,payload:t}}),this.code="ERR_JWT_CLAIM_VALIDATION_FAILED",this.claim=r,this.reason=o,this.payload=t}}n.code="ERR_JWT_CLAIM_VALIDATION_FAILED";class a extends o{constructor(e,t,r="unspecified",o="unspecified"){super(e,{cause:{claim:r,reason:o,payload:t}}),this.code="ERR_JWT_EXPIRED",this.claim=r,this.reason=o,this.payload=t}}a.code="ERR_JWT_EXPIRED";class s extends o{constructor(){super(...arguments),this.code="ERR_JOSE_ALG_NOT_ALLOWED"}}s.code="ERR_JOSE_ALG_NOT_ALLOWED";class i extends o{constructor(){super(...arguments),this.code="ERR_JOSE_NOT_SUPPORTED"}}i.code="ERR_JOSE_NOT_SUPPORTED",class extends o{constructor(e="decryption operation failed",t){super(e,t),this.code="ERR_JWE_DECRYPTION_FAILED"}}.code="ERR_JWE_DECRYPTION_FAILED",class extends o{constructor(){super(...arguments),this.code="ERR_JWE_INVALID"}}.code="ERR_JWE_INVALID";class c extends o{constructor(){super(...arguments),this.code="ERR_JWS_INVALID"}}c.code="ERR_JWS_INVALID";class l extends o{constructor(){super(...arguments),this.code="ERR_JWT_INVALID"}}l.code="ERR_JWT_INVALID",class extends o{constructor(){super(...arguments),this.code="ERR_JWK_INVALID"}}.code="ERR_JWK_INVALID";class u extends o{constructor(){super(...arguments),this.code="ERR_JWKS_INVALID"}}u.code="ERR_JWKS_INVALID";class d extends o{constructor(e="no applicable key found in the JSON Web Key Set",t){super(e,t),this.code="ERR_JWKS_NO_MATCHING_KEY"}}d.code="ERR_JWKS_NO_MATCHING_KEY";class h extends o{constructor(e="multiple matching keys found in the JSON Web Key Set",t){super(e,t),this.code="ERR_JWKS_MULTIPLE_MATCHING_KEYS"}}Symbol.asyncIterator,h.code="ERR_JWKS_MULTIPLE_MATCHING_KEYS";class p extends o{constructor(e="request timed out",t){super(e,t),this.code="ERR_JWKS_TIMEOUT"}}p.code="ERR_JWKS_TIMEOUT";class f extends o{constructor(e="signature verification failed",t){super(e,t),this.code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED"}}f.code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED";const m=crypto,y=e=>e instanceof CryptoKey;function g(e,t="algorithm.name"){return new TypeError(`CryptoKey does not support this operation, its ${t} must be ${e}`)}function w(e,t){return e.name===t}function b(e){return parseInt(e.name.slice(4),10)}function S(e,t,...r){switch(t){case"HS256":case"HS384":case"HS512":{if(!w(e.algorithm,"HMAC"))throw g("HMAC");const r=parseInt(t.slice(2),10);if(b(e.algorithm.hash)!==r)throw g(`SHA-${r}`,"algorithm.hash");break}case"RS256":case"RS384":case"RS512":{if(!w(e.algorithm,"RSASSA-PKCS1-v1_5"))throw g("RSASSA-PKCS1-v1_5");const r=parseInt(t.slice(2),10);if(b(e.algorithm.hash)!==r)throw g(`SHA-${r}`,"algorithm.hash");break}case"PS256":case"PS384":case"PS512":{if(!w(e.algorithm,"RSA-PSS"))throw g("RSA-PSS");const r=parseInt(t.slice(2),10);if(b(e.algorithm.hash)!==r)throw g(`SHA-${r}`,"algorithm.hash");break}case"EdDSA":if("Ed25519"!==e.algorithm.name&&"Ed448"!==e.algorithm.name)throw g("Ed25519 or Ed448");break;case"ES256":case"ES384":case"ES512":{if(!w(e.algorithm,"ECDSA"))throw g("ECDSA");const r=function(e){switch(e){case"ES256":return"P-256";case"ES384":return"P-384";case"ES512":return"P-521";default:throw new Error("unreachable")}}(t);if(e.algorithm.namedCurve!==r)throw g(r,"algorithm.namedCurve");break}default:throw new TypeError("CryptoKey does not support this operation")}!function(e,t){if(t.length&&!t.some((t=>e.usages.includes(t)))){let e="CryptoKey does not support this operation, its usages must include ";if(t.length>2){const r=t.pop();e+=`one of ${t.join(", ")}, or ${r}.`}else 2===t.length?e+=`one of ${t[0]} or ${t[1]}.`:e+=`${t[0]}.`;throw new TypeError(e)}}(e,r)}function k(e,t,...r){if((r=r.filter(Boolean)).length>2){const t=r.pop();e+=`one of type ${r.join(", ")}, or ${t}.`}else 2===r.length?e+=`one of type ${r[0]} or ${r[1]}.`:e+=`of type ${r[0]}.`;return null==t?e+=` Received ${t}`:"function"==typeof t&&t.name?e+=` Received function ${t.name}`:"object"==typeof t&&null!=t&&t.constructor?.name&&(e+=` Received an instance of ${t.constructor.name}`),e}const E=(e,...t)=>k("Key must be ",e,...t);function v(e,t,...r){return k(`Key for the ${e} algorithm must be `,t,...r)}const A=e=>!!y(e)||"KeyObject"===e?.[Symbol.toStringTag],_=["CryptoKey"];function T(e){if("object"!=typeof(t=e)||null===t||"[object Object]"!==Object.prototype.toString.call(e))return!1;var t;if(null===Object.getPrototypeOf(e))return!0;let r=e;for(;null!==Object.getPrototypeOf(r);)r=Object.getPrototypeOf(r);return Object.getPrototypeOf(e)===r}function R(e){return T(e)&&"string"==typeof e.kty}const P=async e=>{if(!e.alg)throw new TypeError('"alg" argument is required when "jwk.alg" is not present');const{algorithm:t,keyUsages:r}=function(e){let t,r;switch(e.kty){case"RSA":switch(e.alg){case"PS256":case"PS384":case"PS512":t={name:"RSA-PSS",hash:`SHA-${e.alg.slice(-3)}`},r=e.d?["sign"]:["verify"];break;case"RS256":case"RS384":case"RS512":t={name:"RSASSA-PKCS1-v1_5",hash:`SHA-${e.alg.slice(-3)}`},r=e.d?["sign"]:["verify"];break;case"RSA-OAEP":case"RSA-OAEP-256":case"RSA-OAEP-384":case"RSA-OAEP-512":t={name:"RSA-OAEP",hash:`SHA-${parseInt(e.alg.slice(-3),10)||1}`},r=e.d?["decrypt","unwrapKey"]:["encrypt","wrapKey"];break;default:throw new i('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break;case"EC":switch(e.alg){case"ES256":t={name:"ECDSA",namedCurve:"P-256"},r=e.d?["sign"]:["verify"];break;case"ES384":t={name:"ECDSA",namedCurve:"P-384"},r=e.d?["sign"]:["verify"];break;case"ES512":t={name:"ECDSA",namedCurve:"P-521"},r=e.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":t={name:"ECDH",namedCurve:e.crv},r=e.d?["deriveBits"]:[];break;default:throw new i('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break;case"OKP":switch(e.alg){case"EdDSA":t={name:e.crv},r=e.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":t={name:e.crv},r=e.d?["deriveBits"]:[];break;default:throw new i('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break;default:throw new i('Invalid or unsupported JWK "kty" (Key Type) Parameter value')}return{algorithm:t,keyUsages:r}}(e),o=[t,e.ext??!1,e.key_ops??r],n={...e};return delete n.alg,delete n.use,m.subtle.importKey("jwk",n,...o)},W=e=>r(e);let I;const J=e=>"KeyObject"===e?.[Symbol.toStringTag],O=async(e,t,r,o,n=!1)=>{let a=e.get(t);if(a?.[o])return a[o];const s=await P({...r,alg:o});return n&&Object.freeze(t),a?a[o]=s:e.set(t,{[o]:s}),s},C=async(e,t,o,n)=>{const a=await async function(e,t,o){if(t=await((e,t)=>{if(J(e)){let r=e.export({format:"jwk"});return delete r.d,delete r.dp,delete r.dq,delete r.p,delete r.q,delete r.qi,r.k?W(r.k):(I||(I=new WeakMap),O(I,e,r,t))}return R(e)?e.k?r(e.k):(I||(I=new WeakMap),O(I,e,e,t,!0)):e})(t,e),y(t))return S(t,e,o),t;if(t instanceof Uint8Array){if(!e.startsWith("HS"))throw new TypeError(E(t,..._));return m.subtle.importKey("raw",t,{hash:`SHA-${e.slice(-3)}`,name:"HMAC"},!1,[o])}throw new TypeError(E(t,..._,"Uint8Array","JSON Web Key"))}(e,t,"verify");((e,t)=>{if(e.startsWith("RS")||e.startsWith("PS")){const{modulusLength:r}=t.algorithm;if("number"!=typeof r||r<2048)throw new TypeError(`${e} requires key modulusLength to be 2048 bits or larger`)}})(e,a);const s=function(e,t){const r=`SHA-${e.slice(-3)}`;switch(e){case"HS256":case"HS384":case"HS512":return{hash:r,name:"HMAC"};case"PS256":case"PS384":case"PS512":return{hash:r,name:"RSA-PSS",saltLength:e.slice(-3)>>3};case"RS256":case"RS384":case"RS512":return{hash:r,name:"RSASSA-PKCS1-v1_5"};case"ES256":case"ES384":case"ES512":return{hash:r,name:"ECDSA",namedCurve:t.namedCurve};case"EdDSA":return{name:t.name};default:throw new i(`alg ${e} is not supported either by JOSE or your javascript runtime`)}}(e,a.algorithm);try{return await m.subtle.verify(s,a,o,n)}catch{return!1}},K=e=>e?.[Symbol.toStringTag],D=(e,t,r)=>{if(void 0!==t.use&&"sig"!==t.use)throw new TypeError("Invalid key for this operation, when present its use must be sig");if(void 0!==t.key_ops&&!0!==t.key_ops.includes?.(r))throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${r}`);if(void 0!==t.alg&&t.alg!==e)throw new TypeError(`Invalid key for this operation, when present its alg must be ${e}`);return!0};function H(e,t,r,o){t.startsWith("HS")||"dir"===t||t.startsWith("PBES2")||/^A\d{3}(?:GCM)?KW$/.test(t)?((e,t,r,o)=>{if(!(t instanceof Uint8Array)){if(o&&R(t)){if(function(e){return R(e)&&"oct"===e.kty&&"string"==typeof e.k}(t)&&D(e,t,r))return;throw new TypeError('JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present')}if(!A(t))throw new TypeError(v(e,t,..._,"Uint8Array",o?"JSON Web Key":null));if("secret"!==t.type)throw new TypeError(`${K(t)} instances for symmetric algorithms must be of type "secret"`)}})(t,r,o,e):((e,t,r,o)=>{if(o&&R(t))switch(r){case"sign":if(function(e){return"oct"!==e.kty&&"string"==typeof e.d}(t)&&D(e,t,r))return;throw new TypeError("JSON Web Key for this operation be a private JWK");case"verify":if(function(e){return"oct"!==e.kty&&void 0===e.d}(t)&&D(e,t,r))return;throw new TypeError("JSON Web Key for this operation be a public JWK")}if(!A(t))throw new TypeError(v(e,t,..._,o?"JSON Web Key":null));if("secret"===t.type)throw new TypeError(`${K(t)} instances for asymmetric algorithms must not be of type "secret"`);if("sign"===r&&"public"===t.type)throw new TypeError(`${K(t)} instances for asymmetric algorithm signing must be of type "private"`);if("decrypt"===r&&"public"===t.type)throw new TypeError(`${K(t)} instances for asymmetric algorithm decryption must be of type "private"`);if(t.algorithm&&"verify"===r&&"private"===t.type)throw new TypeError(`${K(t)} instances for asymmetric algorithm verifying must be of type "public"`);if(t.algorithm&&"encrypt"===r&&"private"===t.type)throw new TypeError(`${K(t)} instances for asymmetric algorithm encryption must be of type "public"`)})(t,r,o,e)}H.bind(void 0,!1);const j=H.bind(void 0,!0);async function N(e,t){if(!T(e))throw new TypeError("JWK must be an object");switch(t||(t=e.alg),e.kty){case"oct":if("string"!=typeof e.k||!e.k)throw new TypeError('missing "k" (Key Value) Parameter value');return r(e.k);case"RSA":if(void 0!==e.oth)throw new i('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');case"EC":case"OKP":return P({...e,alg:t});default:throw new i('Unsupported "kty" (Key Type) Parameter value')}}async function x(o,n,a){if(o instanceof Uint8Array&&(o=t.decode(o)),"string"!=typeof o)throw new c("Compact JWS must be a string or Uint8Array");const{0:l,1:u,2:d,length:h}=o.split(".");if(3!==h)throw new c("Invalid Compact JWS");const p=await async function(o,n,a){if(!T(o))throw new c("Flattened JWS must be an object");if(void 0===o.protected&&void 0===o.header)throw new c('Flattened JWS must have either of the "protected" or "header" members');if(void 0!==o.protected&&"string"!=typeof o.protected)throw new c("JWS Protected Header incorrect type");if(void 0===o.payload)throw new c("JWS Payload missing");if("string"!=typeof o.signature)throw new c("JWS Signature missing or incorrect type");if(void 0!==o.header&&!T(o.header))throw new c("JWS Unprotected Header incorrect type");let l={};if(o.protected)try{const e=r(o.protected);l=JSON.parse(t.decode(e))}catch{throw new c("JWS Protected Header is invalid")}if(!((...e)=>{const t=e.filter(Boolean);if(0===t.length||1===t.length)return!0;let r;for(const e of t){const t=Object.keys(e);if(r&&0!==r.size)for(const e of t){if(r.has(e))return!1;r.add(e)}else r=new Set(t)}return!0})(l,o.header))throw new c("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");const u={...l,...o.header};let d=!0;if(function(e,t,r,o,n){if(void 0!==n.crit&&void 0===o?.crit)throw new e('"crit" (Critical) Header Parameter MUST be integrity protected');if(!o||void 0===o.crit)return new Set;if(!Array.isArray(o.crit)||0===o.crit.length||o.crit.some((e=>"string"!=typeof e||0===e.length)))throw new e('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');let a;a=void 0!==r?new Map([...Object.entries(r),...t.entries()]):t;for(const t of o.crit){if(!a.has(t))throw new i(`Extension Header Parameter "${t}" is not recognized`);if(void 0===n[t])throw new e(`Extension Header Parameter "${t}" is missing`);if(a.get(t)&&void 0===o[t])throw new e(`Extension Header Parameter "${t}" MUST be integrity protected`)}return new Set(o.crit)}(c,new Map([["b64",!0]]),a?.crit,l,u).has("b64")&&(d=l.b64,"boolean"!=typeof d))throw new c('The "b64" (base64url-encode payload) Header Parameter must be a boolean');const{alg:h}=u;if("string"!=typeof h||!h)throw new c('JWS "alg" (Algorithm) Header Parameter missing or invalid');const p=a&&((e,t)=>{if(void 0!==t&&(!Array.isArray(t)||t.some((e=>"string"!=typeof e))))throw new TypeError(`"${e}" option must be an array of strings`);if(t)return new Set(t)})("algorithms",a.algorithms);if(p&&!p.has(h))throw new s('"alg" (Algorithm) Header Parameter value not allowed');if(d){if("string"!=typeof o.payload)throw new c("JWS Payload must be a string")}else if("string"!=typeof o.payload&&!(o.payload instanceof Uint8Array))throw new c("JWS Payload must be a string or an Uint8Array instance");let m=!1;"function"==typeof n?(n=await n(l,o),m=!0,j(h,n,"verify"),R(n)&&(n=await N(n,h))):j(h,n,"verify");const y=function(...e){const t=e.reduce(((e,{length:t})=>e+t),0),r=new Uint8Array(t);let o=0;for(const t of e)r.set(t,o),o+=t.length;return r}(e.encode(o.protected??""),e.encode("."),"string"==typeof o.payload?e.encode(o.payload):o.payload);let g,w;try{g=r(o.signature)}catch{throw new c("Failed to base64url decode the signature")}if(!await C(h,n,g,y))throw new f;if(d)try{w=r(o.payload)}catch{throw new c("Failed to base64url decode the payload")}else w="string"==typeof o.payload?e.encode(o.payload):o.payload;const b={payload:w};return void 0!==o.protected&&(b.protectedHeader=l),void 0!==o.header&&(b.unprotectedHeader=o.header),m?{...b,key:n}:b}({payload:u,protected:l,signature:d},n,a),m={payload:p.payload,protectedHeader:p.protectedHeader};return"function"==typeof n?{...m,key:p.key}:m}const L=/^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i,$=e=>{const t=L.exec(e);if(!t||t[4]&&t[1])throw new TypeError("Invalid time period format");const r=parseFloat(t[2]);let o;switch(t[3].toLowerCase()){case"sec":case"secs":case"second":case"seconds":case"s":o=Math.round(r);break;case"minute":case"minutes":case"min":case"mins":case"m":o=Math.round(60*r);break;case"hour":case"hours":case"hr":case"hrs":case"h":o=Math.round(3600*r);break;case"day":case"days":case"d":o=Math.round(86400*r);break;case"week":case"weeks":case"w":o=Math.round(604800*r);break;default:o=Math.round(31557600*r)}return"-"===t[1]||"ago"===t[4]?-o:o},M=e=>e.toLowerCase().replace(/^application\//,""),U=(e,r,o={})=>{let s;try{s=JSON.parse(t.decode(r))}catch{}if(!T(s))throw new l("JWT Claims Set must be a top-level JSON object");const{typ:i}=o;if(i&&("string"!=typeof e.typ||M(e.typ)!==M(i)))throw new n('unexpected "typ" JWT header value',s,"typ","check_failed");const{requiredClaims:c=[],issuer:u,subject:d,audience:h,maxTokenAge:p}=o,f=[...c];void 0!==p&&f.push("iat"),void 0!==h&&f.push("aud"),void 0!==d&&f.push("sub"),void 0!==u&&f.push("iss");for(const e of new Set(f.reverse()))if(!(e in s))throw new n(`missing required "${e}" claim`,s,e,"missing");if(u&&!(Array.isArray(u)?u:[u]).includes(s.iss))throw new n('unexpected "iss" claim value',s,"iss","check_failed");if(d&&s.sub!==d)throw new n('unexpected "sub" claim value',s,"sub","check_failed");if(h&&(y="string"==typeof h?[h]:h,!("string"==typeof(m=s.aud)?y.includes(m):Array.isArray(m)&&y.some(Set.prototype.has.bind(new Set(m))))))throw new n('unexpected "aud" claim value',s,"aud","check_failed");var m,y;let g;switch(typeof o.clockTolerance){case"string":g=$(o.clockTolerance);break;case"number":g=o.clockTolerance;break;case"undefined":g=0;break;default:throw new TypeError("Invalid clockTolerance option type")}const{currentDate:w}=o,b=(S=w||new Date,Math.floor(S.getTime()/1e3));var S;if((void 0!==s.iat||p)&&"number"!=typeof s.iat)throw new n('"iat" claim must be a number',s,"iat","invalid");if(void 0!==s.nbf){if("number"!=typeof s.nbf)throw new n('"nbf" claim must be a number',s,"nbf","invalid");if(s.nbf>b+g)throw new n('"nbf" claim timestamp check failed',s,"nbf","check_failed")}if(void 0!==s.exp){if("number"!=typeof s.exp)throw new n('"exp" claim must be a number',s,"exp","invalid");if(s.exp<=b-g)throw new a('"exp" claim timestamp check failed',s,"exp","check_failed")}if(p){const e=b-s.iat;if(e-g>("number"==typeof p?p:$(p)))throw new a('"iat" claim timestamp check failed (too far in the past)',s,"iat","check_failed");if(e<0-g)throw new n('"iat" claim timestamp check failed (it should be in the past)',s,"iat","check_failed")}return s};async function F(e,t,r){const o=await x(e,t,r);if(o.protectedHeader.crit?.includes("b64")&&!1===o.protectedHeader.b64)throw new l("JWTs MUST NOT use unencoded payload");const n={payload:U(o.protectedHeader,o.payload,r),protectedHeader:o.protectedHeader};return"function"==typeof t?{...n,key:o.key}:n}function V(e){return T(e)}function B(e){return"function"==typeof structuredClone?structuredClone(e):JSON.parse(JSON.stringify(e))}class q{constructor(e){if(this._cached=new WeakMap,!function(e){return e&&"object"==typeof e&&Array.isArray(e.keys)&&e.keys.every(V)}(e))throw new u("JSON Web Key Set malformed");this._jwks=B(e)}async getKey(e,t){const{alg:r,kid:o}={...e,...t?.header},n=function(e){switch("string"==typeof e&&e.slice(0,2)){case"RS":case"PS":return"RSA";case"ES":return"EC";case"Ed":return"OKP";default:throw new i('Unsupported "alg" value for a JSON Web Key Set')}}(r),a=this._jwks.keys.filter((e=>{let t=n===e.kty;if(t&&"string"==typeof o&&(t=o===e.kid),t&&"string"==typeof e.alg&&(t=r===e.alg),t&&"string"==typeof e.use&&(t="sig"===e.use),t&&Array.isArray(e.key_ops)&&(t=e.key_ops.includes("verify")),t&&"EdDSA"===r&&(t="Ed25519"===e.crv||"Ed448"===e.crv),t)switch(r){case"ES256":t="P-256"===e.crv;break;case"ES256K":t="secp256k1"===e.crv;break;case"ES384":t="P-384"===e.crv;break;case"ES512":t="P-521"===e.crv}return t})),{0:s,length:c}=a;if(0===c)throw new d;if(1!==c){const e=new h,{_cached:t}=this;throw e[Symbol.asyncIterator]=async function*(){for(const e of a)try{yield await z(t,e,r)}catch{}},e}return z(this._cached,s,r)}}async function z(e,t,r){const o=e.get(t)||e.set(t,{}).get(t);if(void 0===o[r]){const e=await N({...t,ext:!0},r);if(e instanceof Uint8Array||"public"!==e.type)throw new u("JSON Web Key Set members must be public keys");o[r]=e}return o[r]}function G(e){const t=new q(e),r=async(e,r)=>t.getKey(e,r);return Object.defineProperties(r,{jwks:{value:()=>B(t._jwks),enumerable:!0,configurable:!1,writable:!1}}),r}let Y;"undefined"!=typeof navigator&&navigator.userAgent?.startsWith?.("Mozilla/5.0 ")||(Y="jose/v5.9.6");const X=Symbol();class Q{constructor(e,t){if(!(e instanceof URL))throw new TypeError("url must be an instance of URL");var r,o;this._url=new URL(e.href),this._options={agent:t?.agent,headers:t?.headers},this._timeoutDuration="number"==typeof t?.timeoutDuration?t?.timeoutDuration:5e3,this._cooldownDuration="number"==typeof t?.cooldownDuration?t?.cooldownDuration:3e4,this._cacheMaxAge="number"==typeof t?.cacheMaxAge?t?.cacheMaxAge:6e5,void 0!==t?.[X]&&(this._cache=t?.[X],r=t?.[X],o=this._cacheMaxAge,"object"==typeof r&&null!==r&&"uat"in r&&"number"==typeof r.uat&&!(Date.now()-r.uat>=o)&&"jwks"in r&&T(r.jwks)&&Array.isArray(r.jwks.keys)&&Array.prototype.every.call(r.jwks.keys,T)&&(this._jwksTimestamp=this._cache.uat,this._local=G(this._cache.jwks)))}coolingDown(){return"number"==typeof this._jwksTimestamp&&Date.now()<this._jwksTimestamp+this._cooldownDuration}fresh(){return"number"==typeof this._jwksTimestamp&&Date.now()<this._jwksTimestamp+this._cacheMaxAge}async getKey(e,t){this._local&&this.fresh()||await this.reload();try{return await this._local(e,t)}catch(r){if(r instanceof d&&!1===this.coolingDown())return await this.reload(),this._local(e,t);throw r}}async reload(){this._pendingFetch&&("undefined"!=typeof WebSocketPair||"undefined"!=typeof navigator&&"Cloudflare-Workers"===navigator.userAgent||"undefined"!=typeof EdgeRuntime&&"vercel"===EdgeRuntime)&&(this._pendingFetch=void 0);const e=new Headers(this._options.headers);Y&&!e.has("User-Agent")&&(e.set("User-Agent",Y),this._options.headers=Object.fromEntries(e.entries())),this._pendingFetch||(this._pendingFetch=(async(e,t,r)=>{let n,a,s=!1;"function"==typeof AbortController&&(n=new AbortController,a=setTimeout((()=>{s=!0,n.abort()}),t));const i=await fetch(e.href,{signal:n?n.signal:void 0,redirect:"manual",headers:r.headers}).catch((e=>{if(s)throw new p;throw e}));if(void 0!==a&&clearTimeout(a),200!==i.status)throw new o("Expected 200 OK from the JSON Web Key Set HTTP response");try{return await i.json()}catch{throw new o("Failed to parse the JSON Web Key Set HTTP response as JSON")}})(this._url,this._timeoutDuration,this._options).then((e=>{this._local=G(e),this._cache&&(this._cache.uat=Date.now(),this._cache.jwks=e),this._jwksTimestamp=Date.now(),this._pendingFetch=void 0})).catch((e=>{throw this._pendingFetch=void 0,e}))),await this._pendingFetch}}let Z=null;function ee(){chrome.storage.local.get(null,(function(e){console.log("All stored data (from background):",JSON.stringify(e,null,2)),console.log("Storage size:",Object.keys(e).length)}))}function te(){if(console.log("Initiating authentication"),null!==Z)return console.log("Authentication tab already open, focusing on it"),void chrome.tabs.update(Z,{active:!0});chrome.tabs.create({url:"https://realeyes.ai/upload-image"},(function(e){console.log("Authentication tab created:",e.id),Z=e.id,chrome.tabs.onRemoved.addListener((function(e){e===Z&&(console.log("Authentication tab closed"),Z=null)})),chrome.tabs.onUpdated.addListener((function t(r,o){r===e.id&&o.url&&o.url.startsWith("https://realeyes.ai/upload-image")&&(console.log("Authentication page loaded, checking for auth token"),chrome.tabs.onUpdated.removeListener(t),re(r))}))}))}function re(e,t=0){console.log("Checking for auth token"),chrome.cookies.get({url:"https://realeyes.ai",name:"opp_access_token"},(async function(r){r?(console.log("Auth token found in cookie:",r.value),await oe(r.value)?chrome.storage.local.set({authToken:r.value},(function(){console.log("Valid auth token saved to local storage"),chrome.tabs.remove(e)})):(console.log("Invalid or expired auth token"),chrome.storage.local.remove("authToken"),chrome.tabs.remove(e))):(console.log("Auth token not found"),t<5?(console.log(`Retrying in 1 second (attempt ${t+1}/5)`),setTimeout((()=>re(e,t+1)),1e3)):(console.log("Max retries reached. Authentication failed."),chrome.tabs.remove(e)))}))}async function oe(e){try{const t="https://cognito-idp.us-east-2.amazonaws.com/us-east-2_1jhX1tAKk",r=`${t}/.well-known/jwks.json`,o=function(e){const t=new Q(e,void 0),r=async(e,r)=>t.getKey(e,r);return Object.defineProperties(r,{coolingDown:{get:()=>t.coolingDown(),enumerable:!0,configurable:!1},fresh:{get:()=>t.fresh(),enumerable:!0,configurable:!1},reload:{value:()=>t.reload(),enumerable:!0,configurable:!1,writable:!1},reloading:{get:()=>!!t._pendingFetch,enumerable:!0,configurable:!1},jwks:{value:()=>t._local?.jwks(),enumerable:!0,configurable:!1,writable:!1}}),r}(new URL(r)),{payload:n,protectedHeader:a}=await F(e,o,{issuer:t}),s=Math.floor(Date.now()/1e3);return!(n.exp&&n.exp<s&&(console.log("Token has expired"),1))}catch(e){return console.error("Error validating JWT:",e),!1}}chrome.runtime.onMessage.addListener(((e,t,r)=>{if(console.log("Background received message:",e),"showNotification"===e.action)return chrome.notifications.create({type:"basic",iconUrl:"icon.png",title:"Hello World",message:"You clicked the Hello World button!"},(()=>{r({success:!0})})),!0;if("sendImage"===e.action){const{url:t,mimeType:o,filename:n,size:a,sha256Hash:s,origin:i,storeData:c,userId:l}=e.imageData,u=()=>fetch(t).then((e=>e.arrayBuffer())).then((e=>{const r=new Uint8Array(e),u=new Blob([r],{type:o}),d=new File([u],n,{type:o}),h=new FormData;return h.append("image",d),h.append("url",t),h.append("mimeType",o),h.append("filename",n),h.append("size",a.toString()),h.append("sha256Hash",s),h.append("origin",i),h.append("storeData",c.toString()),h.append("userId",l),h}));return new Promise((e=>{chrome.storage.local.get(["authToken"],(function(t){e(t.authToken)}))})).then((e=>{e?u().then((t=>{fetch("https://api.realeyes.ai/analyze-image",{method:"POST",body:t,headers:{"X-Origin":i,Authorization:`Bearer ${e}`}}).then((async e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.json()})).then((e=>{console.log("Background: Processed response:",e),r(e)})).catch((e=>{console.error("Background: Error:",e),r({error:e.message})}))})):(te(),r({error:"Authentication required"}))})),!0}if("reloadContentScript"===e.action)return chrome.tabs.query({active:!0,currentWindow:!0},(function(e){e[0]?chrome.tabs.executeScript(e[0].id,{file:"social-content.js"},(()=>{chrome.runtime.lastError?(console.error("Failed to reload content script:",chrome.runtime.lastError),r({success:!1,error:chrome.runtime.lastError.message})):(console.log("Content script reloaded successfully"),r({success:!0}))})):r({success:!1,error:"No active tab found"})})),!0;if("authenticationComplete"===e.action&&chrome.tabs.remove(t.tab.id),"initiateAuthentication"===e.action&&te(),"pageLoaded"===e.action&&(console.log("Background script received 'pageLoaded' message."),re(t.tab.id)),"submitFeedback"===e.action)return chrome.storage.local.get(["authToken"],(function(t){const o=t.authToken;if(!o)return console.error("No auth token found"),void r({success:!1,error:"Authentication required"});const{imageHash:n,feedbackType:a,comment:s,userId:i}=e.feedbackData;fetch("https://api.realeyes.ai/submit-feedback",{method:"POST",headers:{"Content-Type":"application/json","X-Origin":e.origin,Authorization:`Bearer ${o}`},body:JSON.stringify({imageHash:n,feedbackType:a,comment:s,userId:i})}).then((async e=>{const t=await e.json();if(409===e.status)return r({success:!1,alreadySubmitted:!0,message:t.error||"User has already submitted feedback for this image"});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);console.log("Feedback submitted successfully:",t),r({success:!0,data:t})})).catch((e=>{console.error("Error submitting feedback:",e),r({success:!1,error:e.message,status:e.status})}))})),!0;if("openExtensionPopup"===e.action)try{chrome.action.openPopup(),r({success:!0})}catch(e){r({success:!1,error:e.message})}return!1})),chrome.runtime.onInstalled.addListener((function(){chrome.storage.sync.set({enableOverlay:!0,facebook:!0,twitter:!0,instagram:!0,linkedin:!0,reddit:!0})})),chrome.storage.onChanged.addListener(((e,t)=>{"sync"===t&&(console.log("Settings changed:",e),chrome.tabs.query({url:["https://*.linkedin.com/*","https://*.facebook.com/*","https://*.twitter.com/*","https://*.x.com/*","https://*.instagram.com/*","https://*.reddit.com/*"]},(t=>{t.forEach((t=>{console.log("Sending settingsChanged message to tab:",t.id),chrome.tabs.sendMessage(t.id,{action:"settingsChanged",changes:e},(r=>{chrome.runtime.lastError?(console.log("Content script not found, injecting it first..."),chrome.scripting.executeScript({target:{tabId:t.id},files:["social-content.js"]},(()=>{chrome.runtime.lastError?console.log("Could not inject content script:",chrome.runtime.lastError.message):setTimeout((()=>{chrome.tabs.sendMessage(t.id,{action:"settingsChanged",changes:e},(e=>{chrome.runtime.lastError?console.log("Still could not send message after injection:",chrome.runtime.lastError.message):console.log("Settings updated successfully after content script injection")}))}),100)}))):console.log("Settings updated successfully")}))}))})))})),chrome.runtime.onMessage.addListener(((e,t,r)=>{if("getAuthToken"===e.action)return chrome.cookies.get({url:"https://realeyes.ai",name:"opp_access_token"},(async function(e){e&&await async function(e){try{const t=(new TextEncoder).encode(process.env.JWT_SECRET);return await F(e,t),!0}catch(e){return console.error("Token verification failed:",e),!1}}(e.value)?chrome.storage.local.set({authToken:e.value},(function(){console.log("Valid auth token saved to local storage"),r({success:!0})})):(console.log("Invalid or expired auth token"),chrome.storage.local.remove("authToken"),r({success:!1}))})),!0})),setInterval((()=>{chrome.storage.local.get(["authToken"],(function(e){console.log("Periodic check - Auth token:",e.authToken),e.authToken?oe(e.authToken)?console.log("Periodic auth check: Valid token exists"):(console.log("Periodic auth check: Token is invalid or expired"),chrome.storage.local.remove("authToken",(function(){console.log("Auth token removed"),ee()}))):console.log("Periodic auth check: No token")}))}),6e4),setInterval(ee,12e4),ee(),ee(),chrome.runtime.onMessage.addListener(((e,t,r)=>{console.log("Background received message:",e),"setAuthToken"===e.action&&(console.log("Attempting to save auth token:",e.token),chrome.storage.local.set({authToken:e.token},(function(){chrome.runtime.lastError?console.error("Error saving auth token:",chrome.runtime.lastError):(console.log("Auth token saved successfully"),ee())})))})),setInterval(ee,3e5)})();
//# sourceMappingURL=background.js.map
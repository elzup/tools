if(!self.define){let e,n={};const s=(s,t)=>(s=new URL(s+".js",t).href,n[s]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=n,document.head.appendChild(e)}else e=s,importScripts(s),n()})).then((()=>{let e=n[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(t,a)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(n[i])return;let c={};const r=e=>s(e,i),v={module:{uri:i},exports:c,require:r};n[i]=Promise.all(t.map((e=>v[e]||r(e)))).then((e=>(a(...e),c)))}}define(["./workbox-1846d813"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/chunks/0f86a987-38a2946def4b75e0.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/1065.0efb855c2ad84b7c.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/2735.da4fdcf8a3deb7a5.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/2881.4a419086aa34daab.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/29107295-27bafc7c860c12ad.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/37bf9728-5ba5b936cfa5784f.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/3873-f2a2608173adaaf5.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/4544e8b5-745c582c34967604.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/4958.abe6e7cfc3db4e4a.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/5450.9fb6a28558506d96.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/6074-731f3da2d5b61b0c.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/6158-9ef0c9d7b7c73062.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/6263-38ca551e4e6d9930.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/6656e8de.25bdb7cde90c646a.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/6747-de347b10fd775614.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/7603-a0b6103e7c1ec6a6.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/7785-14e89cbc3121f67b.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/8706.18dd32c1d1d051b4.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/9111-9320344dd8af96ac.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/9651.fa928ee6b0abac46.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/9734-4536723eec0cf6dd.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/cb1608f2-4b681fbf54fbde3d.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/framework-9fb5a1929308ee93.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/main-a6e1bba9353736d9.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/1px-874672b6af636d9a.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/_app-d7ccdfa70a317337.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/_error-64089eca85fe1274.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/char-counter-dcb7e7eefe0a16ff.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/clipsh-a55354f7431f3833.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/collatz-graph-b5c9c2a2354ad74f.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/cryptowat-chart-ffab4da42a0ebf67.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/diginima-d25024c2cfe98920.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/divergence-meter-e655670e0d30022c.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/ehou-ec39fb310c7280e7.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/ellip-billiards-750c10739c9a83f1.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/flow2chat-cae4897f7a7b1fb9.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/frag-problab-5f0b1f42032b33c5.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/gha-badge-maker-37e629f86a242a96.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/global-ip-1c9bbb22d7d1246f.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/hard-confirm-ba427710ced17359.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/index-01b56c9bc9e11173.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/key-event-master-f096c269a14ea971.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/kotobaru-02de237fab5ee0ec.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/mandelbulb-e841e0daac41fae4.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/mirror-1faff1a0653ea23c.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/noopener-37793dc396a3b292.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/noopener-attacker-33540b2609818f12.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/normal-distribution-2adcf2dd142a199d.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/pi-lab-298756dc7a16cbf2.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/pikbl-memo-124fe19a908af002.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/random-1b0b1eea9c38dd28.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/splatoonament-cost-3645d2f9e11a54f9.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/sub-window-ex-9294d2c0a426ee45.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/svg-play-63acfc3fa78dba02.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/textmaster-5785612664183b9e.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/word-search-0536add87677fb19.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/pages/xss-91ba199bd238d429.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/polyfills-5cd94c89d3acac5f.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/chunks/webpack-aa50e530fd3ec905.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/css/70de34300d757ebc.css",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/nzP8vCgFw5KztSNn6MevE/_buildManifest.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/nzP8vCgFw5KztSNn6MevE/_middlewareManifest.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/_next/static/nzP8vCgFw5KztSNn6MevE/_ssgManifest.js",revision:"nzP8vCgFw5KztSNn6MevE"},{url:"/clipsh/clipsh.png",revision:"a6bc0ce6a95f9df70f6e358345c7d104"},{url:"/clipsh/clipsh@192.png",revision:"a0aa3fb471420e211a53f18ed63a5497"},{url:"/clipsh/clipsh@512.png",revision:"cc1acebf34b074f6088fac6ba1f5f48a"},{url:"/clipsh/manifest.json",revision:"dfa077f41dcc5a4ce188fbd3e8b7ee2a"},{url:"/decopik.manifest.json",revision:"6cb4cf54dd2be6f8bf39a7d686843b55"},{url:"/decopikmin-memo-192.png",revision:"b12525cff5ce4c0d23aaac140b6ba731"},{url:"/decopikmin-memo-512.png",revision:"90e0d27558fcbf3510da24463252dcf4"},{url:"/decopikmin-memo.png",revision:"c7dd857c73f702b26590cbea264ee18e"},{url:"/favicon.ico",revision:"4caad433040be7b4351bd5efe05fe5c5"},{url:"/pikbl-ss.png",revision:"af297d4407b1ca4eb94ec95ba54c67d7"},{url:"/wordles.nohead.csv",revision:"0d727044aa741459a6be0307eb0f6fa0"},{url:"/words.nohead.csv",revision:"74f4c79039dbcffea0139805aee00547"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:n,event:s,state:t})=>n&&"opaqueredirect"===n.type?new Response(n.body,{status:200,statusText:"OK",headers:n.headers}):n}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const n=e.pathname;return!n.startsWith("/api/auth/")&&!!n.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));

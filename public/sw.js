if(!self.define){let e,s={};const n=(n,t)=>(n=new URL(n+".js",t).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(t,i)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(s[c])return;let a={};const r=e=>n(e,c),o={module:{uri:c},exports:a,require:r};s[c]=Promise.all(t.map((e=>o[e]||r(e)))).then((e=>(i(...e),a)))}}define(["./workbox-1846d813"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/0nR5FJO77I47zNYB7ZmM4/_buildManifest.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/0nR5FJO77I47zNYB7ZmM4/_middlewareManifest.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/0nR5FJO77I47zNYB7ZmM4/_ssgManifest.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/1065.fe22f98672bc7458.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/2568.36719474f0c3f258.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/29107295-27bafc7c860c12ad.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/3594.9f802d3958669631.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/37bf9728-92dd1feb393ffd99.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/4047-17f345affbec2940.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/4544e8b5-b3345cd0efb6f5f4.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/4958.ec991a227f74f660.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/4c8073aa-d827cf9ac8b2d4bc.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/5521-7f355d58f9b0d00a.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/5722.586342dd40919b19.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/5780.0b8fec802d8f3173.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/58917679-829e870a3c98d29d.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/6074-602fe52b965df06b.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/6263-2b2cab11d641ae37.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/64f69659-01d26bc8266ccf0b.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/6656e8de.680bbc6f2d71f552.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/6908-a4d59276232f9596.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/7066-d1b2fb6e747494ec.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/7603-9cab5982bc87d0fb.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/82c1d43a-18a595801d4b33ce.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/8652-024863e4c6692fbc.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/9651.b5852622d251bc50.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/cb1608f2-6673bbaf8fd4a079.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/d67bd397-9fc646aa91d0f398.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/fc6701f7-f49fc58caedeb70c.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/framework-9fb5a1929308ee93.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/main-730822f5c2b3da91.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/1px-17bbd31ce282882d.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/_app-c740f41dd80ae300.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/_error-48b85597481f3a17.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/char-counter-afa098b526dc4d96.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/collatz-graph-303fc73018626822.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/cryptowat-chart-66fdaea09f8a09b7.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/diginima-12290fb6a72ee91f.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/divergence-meter-585ab7e010e7b6e0.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/ellip-billiards-750c10739c9a83f1.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/gha-badge-maker-d6bad083abaaf222.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/global-ip-24044ecaca64c197.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/hard-confirm-ec7712d0227410fa.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/index-1a4326386e4229bd.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/key-event-master-dacc6941e0d9d4a7.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/mandelbulb-bde610d8874a7f3c.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/mirror-97f7f603f172839d.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/noopener-2de1a49db068d05e.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/noopener-attacker-f121af029fa51b9f.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/normal-distribution-525bc4777d7c5bad.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/pi-lab-3038b45febf777c7.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/pikbl-memo-c8cdb64ec12380ec.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/splatoonament-cost-f9916dec8da3ac4e.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/sub-window-ex-d30a67a0d345e8d0.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/svg-play-552c50eb9bf33c2e.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/textmaster-1e2cc7f7df169d7c.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/word-search-95179cc23f342b7e.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/pages/xss-01b6ef1ba7bcdaf1.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/polyfills-5cd94c89d3acac5f.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/_next/static/chunks/webpack-ef5ed055abf5b947.js",revision:"0nR5FJO77I47zNYB7ZmM4"},{url:"/decopik.manifest.json",revision:"22b836ad7850c05e3c1976d38636f75a"},{url:"/decopikmin-memo-192.png",revision:"b12525cff5ce4c0d23aaac140b6ba731"},{url:"/decopikmin-memo-512.png",revision:"90e0d27558fcbf3510da24463252dcf4"},{url:"/decopikmin-memo.png",revision:"c7dd857c73f702b26590cbea264ee18e"},{url:"/words.nohead.csv",revision:"f7b70f4b1816937eb337416bcb3d10f1"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:t})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const IFRAME_MOBILE_CONTENT_WIDTH = 375
if (typeof window !== 'undefined') {
  try {
    const inIframe = window.self !== window.top
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || '')
    if (inIframe && isMobileUA) {
      document.documentElement.classList.add('iframe-mobile-viewport')
      const w = `${IFRAME_MOBILE_CONTENT_WIDTH}px`

      const updateZoom = () => {
        const vw = window.visualViewport?.width ?? window.innerWidth
        const zoom = Math.max(0.5, Math.min(2.5, vw / IFRAME_MOBILE_CONTENT_WIDTH))
        document.documentElement.style.setProperty('--iframe-mobile-zoom', String(zoom))
      }
      updateZoom()
      window.visualViewport?.addEventListener('resize', updateZoom)
      window.addEventListener('orientationchange', updateZoom)

      const style = document.createElement('style')
      style.id = 'iframe-mobile-viewport-style'
      style.textContent = [
        'html.iframe-mobile-viewport, html.iframe-mobile-viewport body { margin: 0 !important; overflow-x: hidden !important; box-sizing: border-box !important; height: 100% !important; }',
        `#iframe-mobile-scaler { width: ${w} !important; min-width: ${w} !important; max-width: ${w} !important; height: 100% !important; min-height: 100% !important; zoom: var(--iframe-mobile-zoom, 1) !important; transform-origin: top left !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; }`,
        '#iframe-mobile-scaler #app { width: 100% !important; box-sizing: border-box !important; height: 100% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }',
        'html.iframe-mobile-viewport #app:not(.app-logged-in) { overflow-x: hidden !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; }',
        'html.iframe-mobile-viewport #app:not(.app-logged-in) > * { flex: none !important; min-height: min-content !important; }',
      ].join(' ')
      document.head.appendChild(style)
    }
  } catch {
    // cross-origin iframe access ignored
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})

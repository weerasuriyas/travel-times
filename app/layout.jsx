import './globals.css'
import 'leaflet/dist/leaflet.css'
import Providers from './providers'
import ScrollToTop from '../src/components/ScrollToTop'

export const metadata = {
  title: 'TRAVEL TIMES. | Sri Lanka',
  description: "Your definitive guide to Sri Lanka's hidden gems, cultural treasures, and unforgettable experiences.",
  icons: { icon: '/favicon.svg' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,400&family=Raleway:ital,wght@0,300;0,400;0,600;1,400&family=Nunito:ital,wght@0,300;0,400;0,600;1,400&family=Source+Code+Pro:wght@400;500&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[#FDFDFB] dark:bg-stone-950 text-[#1a1a1a] dark:text-stone-100 font-sans selection:bg-[#00E676] selection:text-white">
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  )
}

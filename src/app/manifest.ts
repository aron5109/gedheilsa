import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hlýja — líðan í þínum takti',
    short_name: 'Hlýja',
    description: 'Þitt rými fyrir líðan og litlu skrefin í hversdeginum.',
    lang: 'is',
    start_url: '/app',
    display: 'standalone',
    background_color: '#f6f7f2',
    theme_color: '#315d50',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}

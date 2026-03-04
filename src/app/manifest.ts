import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Shop Manager',
        short_name: 'ShopManager',
        description: 'Shop Management Application',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e11d48', // rose-600
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}

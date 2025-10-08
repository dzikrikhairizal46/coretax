// Force cache busting for CoreTax logo
(function() {
    'use strict';
    
    // Function to force reload with cache busting
    function forceReload() {
        const timestamp = new Date().getTime();
        const currentUrl = window.location.href;
        const url = currentUrl.split('?')[0] + '?t=' + timestamp;
        window.location.href = url;
    }
    
    // Function to clear service worker cache
    function clearServiceWorkerCache() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations.forEach(function(registration) {
                    registration.unregister();
                });
                console.log('Service Worker cache cleared');
            });
        }
    }
    
    // Function to update favicon
    function updateFavicon() {
        const timestamp = new Date().getTime();
        const favicon = document.querySelector("link[rel*='icon']");
        if (favicon) {
            favicon.href = '/coretax-logo.png?v=' + timestamp;
        }
        
        // Also update apple touch icon
        const appleIcon = document.querySelector("link[rel*='apple-touch-icon']");
        if (appleIcon) {
            appleIcon.href = '/coretax-logo.png?v=' + timestamp;
        }
    }
    
    // Auto-execute on page load
    document.addEventListener('DOMContentLoaded', function() {
        updateFavicon();
        clearServiceWorkerCache();
        
        // Add keyboard shortcut for force reload (Ctrl+Shift+L)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                forceReload();
            }
        });
        
        console.log('CoreTax cache busting script loaded');
        console.log('Press Ctrl+Shift+L to force reload');
    });
    
    // Export functions for manual use
    window.CoreTaxCache = {
        forceReload: forceReload,
        clearServiceWorkerCache: clearServiceWorkerCache,
        updateFavicon: updateFavicon
    };
})();
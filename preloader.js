// Preloader functionality for improved UX
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Hide preloader after 1.5s or when page is fully loaded
        const hidePreloader = () => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        };
        
        // Hide after short delay even if images aren't fully loaded
        setTimeout(hidePreloader, 1500);
        
        // Also hide when window loads
        window.addEventListener('load', hidePreloader);
    }
    
    // Trigger Three.js initialization after preloader
    if (typeof initThreeJS === 'function') {
        setTimeout(initThreeJS, 500);
    }
});

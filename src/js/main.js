document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything
    
    // VIPShop init (missed in app.js, handled here)
    if(window.VIPShop) VIPShop.init();
    
    // CasesFX start
    if(window.CasesFX) CasesFX.start();

    // Start App
    if(window.app) app.init();
    
    // Global Error Handling
    window.onerror = function(msg, url, line, col, error) {
        console.error("Global Error:", msg, error);
        // Only toast if app is ready
        if(window.app && app.toast && document.readyState === 'complete') {
            app.toast("An error occurred. Check console.", "System Error");
        }
        return false;
    };
});

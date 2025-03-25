/**
 * Main entry point for the game
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize game
    const game = new Game();
    
    // Log welcome message
    console.log('Slither.io シングルプレイヤー ゲームが初期化されました');
    console.log('マウスで移動、マウスボタンを押している間は加速します');
    
    // Prevent default behavior for right-click to avoid context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Handle visibility change (pause/resume game)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden (minimize, tab change, etc.)
            // You could pause the game here if needed
        } else {
            // Page is visible again
            // You could resume the game here if needed
        }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Escape':
                // Toggle pause functionality could be added here
                break;
        }
    });
});
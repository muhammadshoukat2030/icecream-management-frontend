/**
 * ================================================================
 * SHARED LAYOUT JS — FrostyOps Ice Cream Distribution
 * ================================================================
 * 
 * Handles:
 * - Mobile sidebar open/close
 * - Overlay toggle
 * - Navigation active state
 * - Responsive behavior
 * 
 * Usage: Just include this file in any page that uses shared-layout.css
 * 
 * ================================================================
 */

class FrostyLayout {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('overlay');
    this.hamburger = document.querySelector('.hamburger');
    this.menuToggle = document.getElementById('menuToggle');
    this.navlinks = document.querySelectorAll('.navlink');
    
    this.init();
  }

  /**
   * Initialize event listeners
   */
  init() {
    // Hamburger menu toggle
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleSidebar());
    }

    // Menu toggle button (alternative hamburger)
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Overlay click closes sidebar
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeSidebar());
    }

    // Close sidebar on navigation link click (mobile)
    this.navlinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.isMobile()) {
          this.closeSidebar();
        }
        this.setActiveNav(link);
      });
    });

    // Close sidebar when window resizes (if goes to desktop)
    window.addEventListener('resize', () => {
      if (!this.isMobile()) {
        this.closeSidebar();
      }
    });

    // Set initial active nav based on current page
    this.setActiveNavFromUrl();

    // Handle ESC key to close sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobile()) {
        this.closeSidebar();
      }
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    if (this.sidebar?.classList.contains('open')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  /**
   * Open sidebar
   */
  openSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.add('open');
    
    if (this.overlay) {
      this.overlay.classList.add('show');
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close sidebar
   */
  closeSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.remove('open');
    
    if (this.overlay) {
      this.overlay.classList.remove('show');
    }

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Check if currently in mobile view
   */
  isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Set active navigation based on current URL
   */
  setActiveNavFromUrl() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    this.navlinks.forEach(link => {
      const href = link.getAttribute('href');
      const linkFile = href.split('/').pop();

      if (linkFile === currentFile || 
          (currentFile === '' && linkFile === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Set active navigation link
   */
  setActiveNav(element) {
    this.navlinks.forEach(link => {
      link.classList.remove('active');
    });
    element.classList.add('active');
  }

  /**
   * Update page title and breadcrumb
   */
  setPageTitle(title) {
    document.title = `${title} — FrostyOps`;
    
    const crumb = document.querySelector('.crumb');
    if (crumb) {
      crumb.textContent = title;
    }

    const h1 = document.querySelector('.topbar-left h1');
    if (h1) {
      h1.textContent = title;
    }
  }

  /**
   * Show loading state on button
   */
  setButtonLoading(button, isLoading = true) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Submit';
    }
  }

  /**
   * Show notification/toast message
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create toast container if doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    const bgColor = {
      success: '#e9f9ee',
      error: '#fdeaec',
      warning: '#fef0e5',
      info: '#dbeafe'
    }[type] || '#e5f8ed';

    const textColor = {
      success: '#16a34a',
      error: '#e0384c',
      warning: '#d97706',
      info: '#0284c7'
    }[type] || '#16a34a';

    toast.style.cssText = `
      background: ${bgColor};
      color: ${textColor};
      padding: 14px 16px;
      border-radius: 9px;
      border-left: 4px solid ${textColor};
      animation: slideInRight 0.3s ease-out;
      font-weight: 500;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;

    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Add CSS animation rules if not already present
   */
  static addAnimationStyles() {
    if (document.getElementById('toast-animations')) return;

    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize layout when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.layout = new FrostyLayout();
    FrostyLayout.addAnimationStyles();
  });
} else {
  window.layout = new FrostyLayout();
  FrostyLayout.addAnimationStyles();
}

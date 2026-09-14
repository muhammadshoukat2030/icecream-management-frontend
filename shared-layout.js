/**
 * ================================================================
 * ENHANCED SHARED LAYOUT JAVASCRIPT
 * FrostyOps Ice Cream Distribution System
 * ================================================================
 * 
 * Features:
 * - Mobile drawer sidebar management
 * - Active navigation tracking
 * - Responsive behavior detection
 * - Toast notifications
 * - Button loading states
 * - Page title management
 * 
 * ================================================================
 */

class FrostyLayout {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('overlay');
    this.hamburger = document.querySelector('.hamburger');
    this.navlinks = document.querySelectorAll('.navlink');
    this.isMobileState = window.innerWidth <= 768;
    
    this.init();
  }

  init() {
    // Mobile hamburger toggle
    if (this.hamburger) {
      this.hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Overlay click closes sidebar
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeSidebar());
    }

    // Navigation link tracking
    this.navlinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.isMobileState) {
          this.closeSidebar();
        }
        this.setActiveNav(link);
      });
    });

    // ESC key closes sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileState && this.sidebar?.classList.contains('open')) {
        this.closeSidebar();
      }
    });

    // Set active nav based on current URL
    this.setActiveNavFromUrl();

    // Responsive behavior
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobileState;
      this.isMobileState = window.innerWidth <= 768;
      
      if (wasMobile && !this.isMobileState) {
        // Transitioned to desktop
        this.closeSidebar();
      }
    });

    // Add animation styles
    this.addAnimationStyles();
  }

  toggleSidebar() {
    if (this.sidebar?.classList.contains('open')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.add('open');
    if (this.overlay) this.overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  closeSidebar() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.remove('open');
    if (this.overlay) this.overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

 setActiveNavFromUrl() {
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop() || 'index.html';

  this.navlinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkFile = href.split('/').pop();

    // Salesman Details belongs to the Salesmen section
// Salesman Details belongs to the Salesmen section
const isSalesmanDetails =
  currentFile === 'SalesmanDetails.html' ||
  currentFile === 'SalesmenDetails.html' ||
  currentFile === 'salesman-details.html';

// Supplier Details belongs to the Suppliers section
const isSupplierDetails =
  currentFile === 'SupplierDetails.html' ||
  currentFile === 'SuppliersDetails.html' ||
  currentFile === 'supplier-details.html' ||
  currentFile === 'suppliers-details.html';

const isMatch =
  linkFile === currentFile ||
  (currentFile === '' && linkFile === 'index.html') ||
  (currentFile.includes('.html') && linkFile === currentFile) ||
  (isSalesmanDetails && linkFile === 'Salesmen.html') ||
  (isSupplierDetails && linkFile === 'suppliers.html');

    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
  setActiveNav(element) {
    this.navlinks.forEach(link => link.classList.remove('active'));
    element.classList.add('active');
  }

  setPageTitle(title) {
    document.title = `${title} — FrostyOps`;
    const crumb = document.querySelector('.crumb');
    if (crumb) crumb.textContent = title;
  }

  showNotification(message, type = 'info', duration = 3000) {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const bgColor = {
      success: '#e8f5e9',
      error: '#ffebee',
      warning: '#fff3e0',
      info: '#e3f2fd'
    }[type] || '#e8f5e9';

    const textColor = {
      success: '#2e7d32',
      error: '#c62828',
      warning: '#f57c00',
      info: '#1565c0'
    }[type] || '#2e7d32';

    notification.style.cssText = `
      background: ${bgColor};
      color: ${textColor};
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid ${textColor};
      font-weight: 500;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      animation: slideInRight 0.3s ease-out;
    `;

    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

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

  addAnimationStyles() {
    if (document.getElementById('frosty-animations')) return;

    const style = document.createElement('style');
    style.id = 'frosty-animations';
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

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.layout = new FrostyLayout();
  });
} else {
  window.layout = new FrostyLayout();
}

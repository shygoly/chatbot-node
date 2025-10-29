/**
 * Chatbot Widget - Customer-facing chat interface
 * Embeddable script for EverShop stores
 * 
 * Usage:
 * <script src="https://your-domain.com/widget/chatbot-widget.js"
 *         data-api-url="https://your-domain.com"
 *         data-bot-id="your-bot-id"
 *         data-shop-id="your-shop-id"
 *         data-customer-id="optional-customer-id">
 * </script>
 */

(function() {
  'use strict';

  // Configuration from script tag attributes
  const script = document.currentScript;
  const config = {
    apiUrl: script.getAttribute('data-api-url') || 'http://localhost:3000',
    botId: script.getAttribute('data-bot-id') || 'default',
    shopId: script.getAttribute('data-shop-id') || 'default',
    customerId: script.getAttribute('data-customer-id') || null,
    position: script.getAttribute('data-position') || 'bottom-right'
  };

  // Get or create session ID
  function getSessionId() {
    let sessionId = localStorage.getItem('chatbot_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbot_session_id', sessionId);
    }
    return sessionId;
  }

  // Initialize widget
  function initWidget() {
    // Check if already initialized
    if (document.getElementById('chatbot_widget_container')) {
      return;
    }

    // Inject CSS
    injectStyles();

    // Create widget HTML structure
    createWidgetHTML();

    // Setup event listeners
    setupEventListeners();

    // Load conversation history
    loadConversationHistory();
  }

  // Inject widget styles
  function injectStyles() {
    if (document.getElementById('chatbot_widget_css')) {
      return;
    }

    const styleTag = document.createElement('style');
    styleTag.id = 'chatbot_widget_css';
    styleTag.textContent = `
      /* Chat button */
      .chatbot_button {
        position: fixed;
        bottom: 20px;
        right: ${config.position === 'bottom-left' ? 'auto' : '20px'};
        left: ${config.position === 'bottom-left' ? '20px' : 'auto'};
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background-color: red;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000001;
        transition: all 0.3s ease;
        border: none;
        outline: none;
      }
      
      .chatbot_button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      .chatbot_button:active {
        transform: scale(0.95);
      }
      
      /* Arrow icon */
      .chatbot_arrow {
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
      }
      
      .chatbot_arrow.rotate {
        transform: rotate(180deg);
      }
      
      /* Chat container */
      .chatbot_container {
        position: fixed;
        bottom: 90px;
        right: ${config.position === 'bottom-left' ? 'auto' : '20px'};
        left: ${config.position === 'bottom-left' ? '20px' : 'auto'};
        width: 380px;
        height: 600px;
        border-radius: 12px;
        background: white;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000000;
        overflow: hidden;
        display: none;
        flex-direction: column;
        transition: all 0.3s ease;
      }
      
      .chatbot_container.open {
        display: flex;
      }
      
      /* Mobile responsive */
      @media (max-width: 480px) {
        .chatbot_container {
          width: calc(100% - 40px);
          height: 60vh;
          right: 20px;
          left: 20px;
          bottom: 80px;
        }
      }
      
      /* Chat iframe */
      .chatbot_iframe {
        width: 100%;
        height: 100%;
        border: none;
        flex: 1;
      }

      /* Loading indicator */
      .chatbot_loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: none;
      }

      .chatbot_loading.active {
        display: block;
      }

      .chatbot_spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid red;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: chatbot_spin 1s linear infinite;
      }

      @keyframes chatbot_spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleTag);
  }

  // Create widget HTML
  function createWidgetHTML() {
    // Create button
    const button = document.createElement('button');
    button.className = 'chatbot_button';
    button.id = 'chatbot_button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = `
      <svg class="chatbot_arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    document.body.appendChild(button);

    // Create chat container
    const container = document.createElement('div');
    container.className = 'chatbot_container';
    container.id = 'chatbot_container';
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'chatbot_iframe';
    iframe.id = 'chatbot_iframe';
    iframe.title = 'Chat Widget';
    
    // Build iframe URL with params
    const iframeUrl = new URL('/widget/chatbot-iframe.html', config.apiUrl);
    iframeUrl.searchParams.set('sessionId', getSessionId());
    iframeUrl.searchParams.set('botId', config.botId);
    iframeUrl.searchParams.set('shopId', config.shopId);
    if (config.customerId) {
      iframeUrl.searchParams.set('customerId', config.customerId);
    }
    
    iframe.src = iframeUrl.toString();
    
    // Loading indicator
    const loading = document.createElement('div');
    loading.className = 'chatbot_loading';
    loading.innerHTML = '<div class="chatbot_spinner"></div>';
    
    container.appendChild(loading);
    container.appendChild(iframe);
    document.body.appendChild(container);

    // Widget container for ID
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chatbot_widget_container';
    widgetContainer.style.display = 'none';
    document.body.appendChild(widgetContainer);
  }

  // Setup event listeners
  function setupEventListeners() {
    const button = document.getElementById('chatbot_button');
    const container = document.getElementById('chatbot_container');
    const arrow = button.querySelector('.chatbot_arrow');
    
    let isOpen = false;

    button.addEventListener('click', function() {
      isOpen = !isOpen;
      
      if (isOpen) {
        container.classList.add('open');
        arrow.classList.add('rotate');
        button.setAttribute('aria-label', 'Close chat');
        
        // Notify iframe
        const iframe = document.getElementById('chatbot_iframe');
        iframe.contentWindow.postMessage({ type: 'CHAT_OPENED' }, '*');
      } else {
        container.classList.remove('open');
        arrow.classList.remove('rotate');
        button.setAttribute('aria-label', 'Open chat');
        
        // Notify iframe
        const iframe = document.getElementById('chatbot_iframe');
        iframe.contentWindow.postMessage({ type: 'CHAT_CLOSED' }, '*');
      }
    });

    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (!event.origin.startsWith(config.apiUrl)) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'IFRAME_LOADED':
          // Hide loading indicator
          const loading = document.querySelector('.chatbot_loading');
          if (loading) {
            loading.classList.remove('active');
          }
          break;
        
        case 'CLOSE_CHAT':
          isOpen = false;
          container.classList.remove('open');
          arrow.classList.remove('rotate');
          button.setAttribute('aria-label', 'Open chat');
          break;
        
        case 'NEW_MESSAGE':
          // Show notification if chat is closed
          if (!isOpen) {
            showNotification(data);
          }
          break;
      }
    });

    // Handle ESC key to close chat
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && isOpen) {
        button.click();
      }
    });
  }

  // Load conversation history
  function loadConversationHistory() {
    const sessionId = getSessionId();
    const userId = config.customerId || sessionId;
    
    // Store session info for iframe
    sessionStorage.setItem('chatbot_session', JSON.stringify({
      sessionId,
      userId,
      apiUrl: config.apiUrl,
      botId: config.botId,
      shopId: config.shopId
    }));
  }

  // Show desktop notification
  function showNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New message', {
        body: data.message || 'You have a new message',
        icon: '/widget/chat-icon.png',
        tag: 'chatbot-notification'
      });
    }
  }

  // Public API
  window.ChatbotWidget = {
    open: function() {
      const button = document.getElementById('chatbot_button');
      if (button && !document.getElementById('chatbot_container').classList.contains('open')) {
        button.click();
      }
    },
    close: function() {
      const button = document.getElementById('chatbot_button');
      if (button && document.getElementById('chatbot_container').classList.contains('open')) {
        button.click();
      }
    },
    toggle: function() {
      const button = document.getElementById('chatbot_button');
      if (button) {
        button.click();
      }
    },
    sendMessage: function(text) {
      const iframe = document.getElementById('chatbot_iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({ 
          type: 'SEND_MESSAGE', 
          data: { text } 
        }, '*');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
})();


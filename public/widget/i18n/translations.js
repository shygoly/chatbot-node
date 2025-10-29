/**
 * Widget i18n Translations
 * Lightweight internationalization for customer widget
 */

const widgetTranslations = {
  en: {
    welcome: 'Welcome! How can we help you today?',
    welcomeTitle: 'Customer Service',
    welcomeSubtitle: 'We typically reply instantly',
    placeholder: 'Type your message...',
    send: 'Send',
    connecting: 'Connecting...',
    connected: 'Online - We typically reply instantly',
    disconnected: 'Offline - Messages will be delivered when back online',
    reconnecting: 'Reconnecting...',
    typingIndicator: '{name} is typing...',
    errorNetwork: 'Network error. Please check your connection.',
    errorSend: 'Failed to send message. Please try again.',
    close: 'Close',
    minimize: 'Minimize'
  },
  'zh-CN': {
    welcome: '欢迎！今天我们能帮您什么？',
    welcomeTitle: '客户服务',
    welcomeSubtitle: '我们通常会立即回复',
    placeholder: '输入您的消息...',
    send: '发送',
    connecting: '连接中...',
    connected: '在线 - 我们通常会立即回复',
    disconnected: '离线 - 消息将在恢复在线后发送',
    reconnecting: '重新连接中...',
    typingIndicator: '{name} 正在输入...',
    errorNetwork: '网络错误。请检查您的连接。',
    errorSend: '发送消息失败。请重试。',
    close: '关闭',
    minimize: '最小化'
  },
  es: {
    welcome: '¡Bienvenido! ¿Cómo podemos ayudarle hoy?',
    welcomeTitle: 'Servicio al cliente',
    welcomeSubtitle: 'Normalmente respondemos al instante',
    placeholder: 'Escriba su mensaje...',
    send: 'Enviar',
    connecting: 'Conectando...',
    connected: 'En línea - Normalmente respondemos al instante',
    disconnected: 'Fuera de línea - Los mensajes se entregarán cuando esté en línea',
    reconnecting: 'Reconectando...',
    typingIndicator: '{name} está escribiendo...',
    errorNetwork: 'Error de red. Verifique su conexión.',
    errorSend: 'Error al enviar el mensaje. Inténtelo de nuevo.',
    close: 'Cerrar',
    minimize: 'Minimizar'
  }
};

/**
 * Simple i18n handler for widget
 */
class WidgetI18n {
  constructor() {
    this.currentLang = this.detectLanguage();
  }

  /**
   * Detect browser language
   */
  detectLanguage() {
    // Check localStorage first
    const stored = localStorage.getItem('widget_language');
    if (stored && widgetTranslations[stored]) {
      return stored;
    }

    // Detect from browser
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    
    // Try exact match first (e.g., 'zh-CN')
    if (widgetTranslations[browserLang]) {
      return browserLang;
    }

    // Try language without region (e.g., 'zh' from 'zh-CN')
    const langCode = browserLang.split('-')[0];
    if (langCode === 'zh') {
      return 'zh-CN'; // Default to simplified Chinese
    }

    // Check if we have this language
    for (const key in widgetTranslations) {
      if (key.startsWith(langCode)) {
        return key;
      }
    }

    // Fallback to English
    return 'en';
  }

  /**
   * Translate a key
   */
  t(key, params = {}) {
    const translations = widgetTranslations[this.currentLang] || widgetTranslations.en;
    let value = translations[key] || widgetTranslations.en[key] || key;

    // Replace parameters
    Object.keys(params).forEach(param => {
      value = value.replace(`{${param}}`, params[param]);
    });

    return value;
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    if (widgetTranslations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('widget_language', lang);
      return true;
    }
    return false;
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return Object.keys(widgetTranslations).map(code => ({
      code,
      name: this.getLanguageName(code)
    }));
  }

  /**
   * Get language display name
   */
  getLanguageName(code) {
    const names = {
      'en': 'English',
      'zh-CN': '简体中文',
      'es': 'Español'
    };
    return names[code] || code;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.widgetI18n = new WidgetI18n();
}


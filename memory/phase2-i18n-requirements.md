# Phase 2.5: Multi-language Support (i18n) Requirements

**Version**: 2.0  
**Date**: October 28, 2025  
**Status**: Planning

---

## Overview

Implement internationalization (i18n) to support multiple languages across the customer widget, admin dashboard, and API responses, enabling global market expansion.

## Business Goals

1. **Global Reach**: Support customers in their native languages
2. **User Experience**: Provide localized, culturally appropriate content
3. **Market Expansion**: Enable entry into non-English markets
4. **Accessibility**: Make the product usable for non-English speakers

## MVP Supported Languages

### Priority 1 (MVP)
- **English (en)** - Default
- **Chinese Simplified (zh-CN)** - Primary target market
- **Spanish (es)** - Second largest market

### Priority 2 (Phase 2)
- Chinese Traditional (zh-TW)
- French (fr)
- German (de)
- Japanese (ja)
- Korean (ko)

## i18n Coverage

### 1. Customer Widget
- Welcome message
- Input placeholder
- Send button
- System messages
- Error messages
- Connection status

### 2. Admin Dashboard
- Navigation menu
- Page titles
- Button labels
- Form labels
- Table headers
- Error messages
- Success messages

### 3. Backend
- API error messages
- Validation messages
- System notifications

## Technical Implementation

### Frontend Architecture (i18next)

**Library**: i18next + react-i18next

**Configuration File**: `public/admin/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import zhCNTranslations from './locales/zh-CN.json';
import esTranslations from './locales/es.json';

i18n
  .use(LanguageDetector) // Auto-detect browser language
  .use(initReactI18next) // React integration
  .init({
    resources: {
      en: { translation: enTranslations },
      'zh-CN': { translation: zhCNTranslations },
      es: { translation: esTranslations }
    },
    fallbackLng: 'en',
    lng: 'en', // Default language
    interpolation: {
      escapeValue: false // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

### Translation File Structure

**File**: `public/admin/src/i18n/locales/en.json`

```json
{
  "nav": {
    "inbox": "Inbox",
    "assistant": "AI Assistant",
    "settings": "Settings",
    "analytics": "Analytics"
  },
  "inbox": {
    "title": "Inbox",
    "search": "Search conversations...",
    "filterStatus": "Filter by status",
    "filterAgent": "Filter by agent",
    "assign": "Assign",
    "changeStatus": "Change Status",
    "addTag": "Add Tag",
    "noConversations": "No conversations found"
  },
  "messages": {
    "sendButton": "Send",
    "typePlaceholder": "Type your message...",
    "sendSuccess": "Message sent successfully",
    "sendError": "Failed to send message"
  },
  "status": {
    "open": "Open",
    "pending": "Pending",
    "resolved": "Resolved",
    "closed": "Closed"
  },
  "errors": {
    "network": "Network error. Please check your connection.",
    "auth": "Authentication failed. Please log in again.",
    "unknown": "An error occurred. Please try again."
  },
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm"
  }
}
```

**File**: `public/admin/src/i18n/locales/zh-CN.json`

```json
{
  "nav": {
    "inbox": "收件箱",
    "assistant": "AI 助手",
    "settings": "设置",
    "analytics": "分析"
  },
  "inbox": {
    "title": "收件箱",
    "search": "搜索对话...",
    "filterStatus": "按状态筛选",
    "filterAgent": "按客服筛选",
    "assign": "分配",
    "changeStatus": "更改状态",
    "addTag": "添加标签",
    "noConversations": "未找到对话"
  },
  "messages": {
    "sendButton": "发送",
    "typePlaceholder": "输入您的消息...",
    "sendSuccess": "消息发送成功",
    "sendError": "消息发送失败"
  },
  "status": {
    "open": "待处理",
    "pending": "等待中",
    "resolved": "已解决",
    "closed": "已关闭"
  },
  "errors": {
    "network": "网络错误。请检查您的连接。",
    "auth": "身份验证失败。请重新登录。",
    "unknown": "发生错误。请重试。"
  },
  "common": {
    "loading": "加载中...",
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "confirm": "确认"
  }
}
```

### React Component Usage

```typescript
import { useTranslation } from 'react-i18next';

function InboxPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('inbox.title')}</h1>
      <input placeholder={t('inbox.search')} />
      <button>{t('messages.sendButton')}</button>
    </div>
  );
}
```

### Language Switcher Component

**File**: `public/admin/src/components/LanguageSwitcher.tsx`

```typescript
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  
  return (
    <select 
      value={i18n.language} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}

export default LanguageSwitcher;
```

### Widget i18n Implementation

**File**: `public/widget/i18n.js`

```javascript
const translations = {
  en: {
    welcome: 'Welcome! How can we help you today?',
    placeholder: 'Type your message...',
    send: 'Send',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    typingIndicator: '{name} is typing...'
  },
  'zh-CN': {
    welcome: '欢迎！今天我们能帮您什么？',
    placeholder: '输入您的消息...',
    send: '发送',
    connecting: '连接中...',
    connected: '已连接',
    disconnected: '已断开',
    typingIndicator: '{name} 正在输入...'
  },
  es: {
    welcome: '¡Bienvenido! ¿Cómo podemos ayudarle hoy?',
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    typingIndicator: '{name} está escribiendo...'
  }
};

class WidgetI18n {
  constructor() {
    this.currentLang = this.detectLanguage();
  }
  
  detectLanguage() {
    const stored = localStorage.getItem('widget_language');
    if (stored) return stored;
    
    const browser = navigator.language || navigator.userLanguage;
    return browser.split('-')[0]; // 'zh-CN' → 'zh'
  }
  
  t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[this.currentLang] || translations.en;
    
    for (const k of keys) {
      value = value[k];
      if (!value) break;
    }
    
    if (!value) {
      value = translations.en[key] || key;
    }
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      value = value.replace(`{${param}}`, params[param]);
    });
    
    return value;
  }
  
  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('widget_language', lang);
  }
}

const i18n = new WidgetI18n();
```

### Backend i18n Service

**File**: `src/services/i18n.service.ts`

```typescript
import fs from 'fs';
import path from 'path';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

class I18nService {
  private translations: Translations = {};
  
  constructor() {
    this.loadTranslations();
  }
  
  private loadTranslations() {
    const dir = path.join(__dirname, '../i18n');
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const lang = file.replace('.json', '');
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        this.translations[lang] = JSON.parse(content);
      }
    });
  }
  
  t(key: string, lang: string = 'en', params: Record<string, any> = {}): string {
    const langTranslations = this.translations[lang] || this.translations.en;
    let value = langTranslations[key] || this.translations.en[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      value = value.replace(`{${param}}`, params[param]);
    });
    
    return value;
  }
  
  getSupportedLanguages(): string[] {
    return Object.keys(this.translations);
  }
}

export default new I18nService();
```

**File**: `src/i18n/en.json`

```json
{
  "errors.validation.required": "This field is required",
  "errors.validation.email": "Invalid email address",
  "errors.auth.failed": "Authentication failed",
  "errors.notFound": "Resource not found",
  "success.messageSent": "Message sent successfully",
  "success.conversationUpdated": "Conversation updated",
  "notifications.orderShipped": "Your order #{orderNumber} has been shipped!",
  "notifications.orderDelivered": "Your order has been delivered"
}
```

### API Response Localization

```typescript
// Middleware to detect language from header
app.use((req, res, next) => {
  req.lang = req.headers['accept-language']?.split(',')[0] || 'en';
  next();
});

// Usage in route
router.post('/api/chat', async (req, res) => {
  try {
    // ... chat logic ...
    res.json({
      code: 0,
      msg: i18nService.t('success.messageSent', req.lang)
    });
  } catch (error) {
    res.status(400).json({
      code: 1,
      msg: i18nService.t('errors.unknown', req.lang)
    });
  }
});
```

## MVP Scope

**Included**:
- ✅ 3 languages (en, zh-CN, es)
- ✅ Admin dashboard full translation
- ✅ Widget full translation
- ✅ Language switcher in admin
- ✅ Auto-detect browser language
- ✅ Persistent language selection
- ✅ API error message localization

**Not Included** (Future):
- ❌ RTL support (Arabic, Hebrew)
- ❌ Translation management UI
- ❌ Automatic translation via API
- ❌ Crowdsourced translations
- ❌ Regional formats (date, time, currency)
- ❌ Locale-specific content
- ❌ Language-specific routing

## Translation Workflow

### For Developers
1. Add new keys to `en.json`
2. Use translation keys in code
3. Submit for translation

### For Translators
1. Receive `en.json` as reference
2. Create/update language files
3. Test in application
4. Submit pull request

### Translation Guidelines
- Keep translations concise
- Maintain consistent tone
- Preserve placeholders ({var})
- Consider cultural context
- Test for text overflow

## Testing

### Manual Testing
1. Switch language in admin dashboard
2. Verify all UI elements translated
3. Test widget in different languages
4. Verify API error messages
5. Test auto-detection

### Automated Testing
```typescript
describe('i18n', () => {
  it('should translate UI elements', () => {
    i18n.changeLanguage('zh-CN');
    expect(t('inbox.title')).toBe('收件箱');
  });
  
  it('should fallback to English', () => {
    i18n.changeLanguage('invalid');
    expect(t('inbox.title')).toBe('Inbox');
  });
});
```

## Dependencies

```json
{
  "i18next": "^23.7.0",
  "react-i18next": "^14.0.0",
  "i18next-browser-languagedetector": "^7.2.0"
}
```

## Success Metrics (MVP)

- 100% UI translation coverage for 3 languages
- >95% auto-detection accuracy
- <50ms translation lookup time
- Zero untranslated strings in production
- User satisfaction > 4.5/5 in non-English markets

---

**Document Owner**: Development Team  
**Last Updated**: October 28, 2025  
**Status**: Ready for MVP Implementation


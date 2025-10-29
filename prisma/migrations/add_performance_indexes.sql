-- Performance optimization indexes for chatbot-node
-- Created: 2025-10-28

-- Chat History Indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_conversation_created 
  ON coze_chat_history(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_inbox_user 
  ON coze_chat_history(inbox_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_shop_bot 
  ON coze_chat_history(shop_id, bot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_sender 
  ON coze_chat_history(sender, created_at DESC);

-- Conversation Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_inbox_user 
  ON coze_conversation(inbox_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_shop 
  ON coze_conversation(shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_bot 
  ON coze_conversation(bot_id);

CREATE INDEX IF NOT EXISTS idx_conversation_id_lookup 
  ON coze_conversation(conversation_id);

-- Inbox User Indexes
CREATE INDEX IF NOT EXISTS idx_inbox_user_session 
  ON shopify_inbox_user(session_id);

CREATE INDEX IF NOT EXISTS idx_inbox_user_shop 
  ON shopify_inbox_user(shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_user_email 
  ON shopify_inbox_user(user_email);

-- Bot Settings Indexes
CREATE INDEX IF NOT EXISTS idx_bot_settings_shop 
  ON shopify_bot_setting(shop_id);

CREATE INDEX IF NOT EXISTS idx_bot_settings_bot_id 
  ON shopify_bot_setting(bot_id);

-- Coze Info Indexes (for dataset management)
CREATE INDEX IF NOT EXISTS idx_coze_info_shop_type 
  ON coze_info(shop_id, dataset_type);

CREATE INDEX IF NOT EXISTS idx_coze_info_dataset 
  ON coze_info(dataset_id);

-- For PostgreSQL, add partial indexes for common queries
-- (These will be ignored in SQLite)

-- Active conversations (last 7 days)
CREATE INDEX IF NOT EXISTS idx_chat_history_recent 
  ON coze_chat_history(created_at DESC) 
  WHERE created_at > CURRENT_DATE - INTERVAL '7 days';

-- Unresolved conversations
CREATE INDEX IF NOT EXISTS idx_conversation_active 
  ON coze_conversation(created_at DESC, inbox_user_id) 
  WHERE updated_at > CURRENT_DATE - INTERVAL '30 days';


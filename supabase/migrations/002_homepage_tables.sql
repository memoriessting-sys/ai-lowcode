-- 灵页首页入口功能迁移
-- 创建时间: 2026-05-13

-- 1. templates 模板表
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('resume', 'poster', 'general')),
  description TEXT,
  thumbnail_url TEXT,
  page_schema JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  use_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON templates(use_count DESC);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates are viewable by everyone"
  ON templates FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Authenticated users can insert templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete own templates"
  ON templates FOR DELETE
  USING (auth.uid() = created_by);

-- 2. user_pages 用户页面表
CREATE TABLE IF NOT EXISTS user_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  page_schema JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pages_user_id ON user_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pages_updated_at ON user_pages(updated_at DESC);

ALTER TABLE user_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pages"
  ON user_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON user_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON user_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON user_pages FOR DELETE
  USING (auth.uid() = user_id);

-- 3. chat_histories AI 对话历史表
CREATE TABLE IF NOT EXISTS chat_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_id UUID REFERENCES user_pages(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_page_id ON chat_histories(page_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_updated_at ON chat_histories(updated_at DESC);

ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat histories"
  ON chat_histories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat histories"
  ON chat_histories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat histories"
  ON chat_histories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat histories"
  ON chat_histories FOR DELETE
  USING (auth.uid() = user_id);

-- 4. updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_pages_updated_at ON user_pages;
CREATE TRIGGER update_user_pages_updated_at
  BEFORE UPDATE ON user_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_histories_updated_at ON chat_histories;
CREATE TRIGGER update_chat_histories_updated_at
  BEFORE UPDATE ON chat_histories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建增加使用次数的函数
CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE templates SET use_count = use_count + 1 WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

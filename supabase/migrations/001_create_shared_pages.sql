 -- 用户表       
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,                                                                                           email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),                                                                                                                                 avatar_url TEXT,                                                                     
    ai_usage_today INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 自动创建 profile
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

  -- 使用记录表
  CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
  CREATE INDEX idx_usage_logs_guest_id ON usage_logs(guest_id);
  CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

  -- 添加插入权限                            
  CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can insert own profile" ON profiles                                                                                                 
    FOR INSERT WITH CHECK (auth.uid() = id);

    -- supabase/migrations/001_create_shared_pages.sql

create table shared_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  is_public boolean default true,
  page_schema jsonb not null,
  page_count integer default 1,
  created_at timestamptz default now(),
  view_count integer default 0
);

-- 索引
create index idx_shared_pages_user_id on shared_pages(user_id);
create index idx_shared_pages_created_at on shared_pages(created_at desc);

-- RLS 策略
alter table shared_pages enable row level security;

-- 公开分享：所有人可查看
create policy "Public shares are viewable by everyone"
  on shared_pages for select
  using (is_public = true);

-- 私有分享：仅创建者可查看
create policy "Private shares are viewable by owner"
  on shared_pages for select
  using (auth.uid() = user_id);

-- 插入：仅登录用户
create policy "Authenticated users can insert"
  on shared_pages for insert
  with check (auth.uid() = user_id);

-- 删除：仅创建者
create policy "Owners can delete their shares"
  on shared_pages for delete
  using (auth.uid() = user_id);

  CREATE TABLE usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    guest_id TEXT,
    action TEXT DEFAULT 'ai_generate',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
  CREATE INDEX idx_usage_logs_guest_id ON usage_logs(guest_id);
  CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

  
  -- 灵页首页入口功能迁移  -- 创建时间: 2026-05-13

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

  -- 公开模板所有人可查看
  CREATE POLICY "Public templates are viewable by everyone"
    ON templates FOR SELECT
    USING (is_public = TRUE);

  -- 登录用户可插入自己的模板
  CREATE POLICY "Authenticated users can insert templates"
    ON templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

  -- 创建者可更新自己的模板
  CREATE POLICY "Creators can update own templates"
    ON templates FOR UPDATE
    USING (auth.uid() = created_by);

  -- 创建者可删除自己的模板
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

  -- 用户可查看自己的页面
  CREATE POLICY "Users can view own pages"
    ON user_pages FOR SELECT
    USING (auth.uid() = user_id);

  -- 用户可插入自己的页面
  CREATE POLICY "Users can insert own pages"
    ON user_pages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- 用户可更新自己的页面
  CREATE POLICY "Users can update own pages"
    ON user_pages FOR UPDATE
    USING (auth.uid() = user_id);

  -- 用户可删除自己的页面
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

  -- 用户可查看自己的对话历史
  CREATE POLICY "Users can view own chat histories"
    ON chat_histories FOR SELECT
    USING (auth.uid() = user_id);

  -- 用户可插入自己的对话历史
  CREATE POLICY "Users can insert own chat histories"
    ON chat_histories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- 用户可更新自己的对话历史
  CREATE POLICY "Users can update own chat histories"
    ON chat_histories FOR UPDATE
    USING (auth.uid() = user_id);

  -- 用户可删除自己的对话历史
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

  -- 为 user_pages 添加更新时间触发器
  DROP TRIGGER IF EXISTS update_user_pages_updated_at ON user_pages;
  CREATE TRIGGER update_user_pages_updated_at
    BEFORE UPDATE ON user_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- 为 chat_histories 添加更新时间触发器
  DROP TRIGGER IF EXISTS update_chat_histories_updated_at ON chat_histories;
  CREATE TRIGGER update_chat_histories_updated_at
    BEFORE UPDATE ON chat_histories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


  
  -- 初始模板数据  -- 创建时间: 2026-05-13
  -- 简历类模板
  INSERT INTO templates (name, category, description, page_schema, is_public, use_count) VALUES
  ('简约简历', 'resume', '单列布局，黑白配色，适合传统行业求职', '{"page":{"id":"resume_simple","width":800,"height":1000,"background":"#ffffff"},"elements":[{"id":"header","type":"container","x":50,"y":50,"width":700,"  height":120,"props":{"background":"#2c3e50","padding":"20"},"children":[{"id":"name","type":"text","x":20,"y":20,"width":660,"height":40,"props":{"text":"您的姓名","fontSize":"28","fontWeight":"bold","color":"#ffffff"  }},{"id":"title","type":"text","x":20,"y":70,"width":660,"height":30,"props":{"text":"职位名称 -
  联系方式","fontSize":"16","color":"#ecf0f1"}}]},{"id":"section1","type":"container","x":50,"y":200,"width":700,"height":200,"props":{"background":"transparent","borderBottom":"1px solid
  #bdc3c7"},"children":[{"id":"section1_title","type":"text","x":0,"y":0,"width":700,"height":30,"props":{"text":"工作经历","fontSize":"18","fontWeight":"bold","color":"#2c3e50"}},{"id":"job1","type":"text","x":0,"y":50  ,"width":700,"height":150,"props":{"text":"公司名称 - 职位 -
  时间","fontSize":"14","color":"#34495e"}}]},{"id":"section2","type":"container","x":50,"y":420,"width":700,"height":200,"props":{"background":"transparent","borderBottom":"1px solid
  #bdc3c7"},"children":[{"id":"section2_title","type":"text","x":0,"y":0,"width":700,"height":30,"props":{"text":"教育背景","fontSize":"18","fontWeight":"bold","color":"#2c3e50"}},{"id":"edu1","type":"text","x":0,"y":50  ,"width":700,"height":150,"props":{"text":"学校名称 - 专业 - 学位 -
  时间","fontSize":"14","color":"#34495e"}}]},{"id":"section3","type":"container","x":50,"y":640,"width":700,"height":200,"props":{"background":"transparent"},"children":[{"id":"section3_title","type":"text","x":0,"y":0  ,"width":700,"height":30,"props":{"text":"技能特长","fontSize":"18","fontWeight":"bold","color":"#2c3e50"}},{"id":"skills","type":"text","x":0,"y":50,"width":700,"height":150,"props":{"text":"技能1, 技能2,
  技能3","fontSize":"14","color":"#34495e"}}]}]}'::jsonb, true, 0),

  ('创意简历', 'resume', '双列布局，彩色配色，适合创意行业求职', '{"page":{"id":"resume_creative","width":800,"height":1000,"background":"#f8f9fa"},"elements":[{"id":"left_col","type":"container","x":0,"y":0,"width":280  ,"height":1000,"props":{"background":"#3498db","padding":"30"},"children":[{"id":"avatar","type":"container","x":30,"y":30,"width":220,"height":220,"props":{"background":"#ffffff","borderRadius":"50%"},"children":[{"i  d":"avatar_placeholder","type":"text","x":70,"y":90,"width":80,"height":40,"props":{"text":"头像","fontSize":"16","color":"#3498db","textAlign":"center"}}]},{"id":"contact_title","type":"text","x":30,"y":280,"width":2  20,"height":30,"props":{"text":"联系方式","fontSize":"16","fontWeight":"bold","color":"#ffffff"}},{"id":"contact_info","type":"text","x":30,"y":320,"width":220,"height":100,"props":{"text":"电话:
  138-xxxx-xxxx","fontSize":"12","color":"#ecf0f1"}}]},{"id":"right_col","type":"container","x":300,"y":0,"width":500,"height":1000,"props":{"background":"#ffffff","padding":"40"},"children":[{"id":"name","type":"text",  "x":40,"y":40,"width":420,"height":50,"props":{"text":"您的姓名","fontSize":"32","fontWeight":"bold","color":"#2c3e50"}},{"id":"title","type":"text","x":40,"y":100,"width":420,"height":30,"props":{"text":"创意设计师 -   UI/UX","fontSize":"18","color":"#7f8c8d"}},{"id":"about_title","type":"text","x":40,"y":160,"width":420,"height":30,"props":{"text":"关于我","fontSize":"18","fontWeight":"bold","color":"#2c3e50"}},{"id":"about_text",  "type":"text","x":40,"y":200,"width":420,"height":100,"props":{"text":"简短的个人介绍","fontSize":"14","color":"#34495e"}},{"id":"exp_title","type":"text","x":40,"y":320,"width":420,"height":30,"props":{"text":"工作经
  历","fontSize":"18","fontWeight":"bold","color":"#2c3e50"}},{"id":"exp_text","type":"text","x":40,"y":360,"width":420,"height":200,"props":{"text":"公司名称 - 职位 -
  时间","fontSize":"14","color":"#34495e"}}]}]}'::jsonb, true, 0),

  ('专业简历', 'resume', '表格式布局，适合技术岗位求职', '{"page":{"id":"resume_professional","width":800,"height":1000,"background":"#ffffff"},"elements":[{"id":"header","type":"container","x":0,"y":0,"width":800,"heig  ht":100,"props":{"background":"#1a252f","padding":"20"},"children":[{"id":"name","type":"text","x":20,"y":20,"width":760,"height":60,"props":{"text":"您的姓名 - 职位名称","fontSize":"24","fontWeight":"bold","color":"#  ffffff","textAlign":"center"}}]},{"id":"summary","type":"container","x":20,"y":120,"width":760,"height":100,"props":{"background":"#f5f6f7","borderRadius":"8"},"children":[{"id":"summary_title","type":"text","x":20,"y  ":20,"width":720,"height":25,"props":{"text":"个人简介","fontSize":"16","fontWeight":"bold","color":"#1a252f"}},{"id":"summary_text","type":"text","x":20,"y":50,"width":720,"height":40,"props":{"text":"简短描述您的专
  业背景和核心能力","fontSize":"14","color":"#34495e"}}]},{"id":"skills_table","type":"container","x":20,"y":240,"width":760,"height":150,"props":{"background":"#ffffff","border":"1px solid
  #ddd"},"children":[{"id":"skills_title","type":"text","x":20,"y":20,"width":720,"height":25,"props":{"text":"技术技能","fontSize":"16","fontWeight":"bold","color":"#1a252f"}},{"id":"skills_row1","type":"text","x":20,"  y":50,"width":350,"height":30,"props":{"text":"前端开发: React, Vue, TypeScript","fontSize":"12","color":"#34495e"}},{"id":"skills_row2","type":"text","x":380,"y":50,"width":360,"height":30,"props":{"text":"后端开发:
  Node.js, Python","fontSize":"12","color":"#34495e"}},{"id":"skills_row3","type":"text","x":20,"y":80,"width":350,"height":30,"props":{"text":"数据库: PostgreSQL,
  MongoDB","fontSize":"12","color":"#34495e"}},{"id":"skills_row4","type":"text","x":380,"y":80,"width":360,"height":30,"props":{"text":"工具: Git, Docker,
  AWS","fontSize":"12","color":"#34495e"}}]},{"id":"experience","type":"container","x":20,"y":410,"width":760,"height":300,"props":{"background":"#ffffff"},"children":[{"id":"exp_title","type":"text","x":20,"y":20,"widt  h":720,"height":25,"props":{"text":"工作经历","fontSize":"16","fontWeight":"bold","color":"#1a252f"}},{"id":"exp1","type":"text","x":20,"y":50,"width":720,"height":120,"props":{"text":"公司名称 - 职位 - 2020.01 -
  至今","fontSize":"14","color":"#34495e"}},{"id":"exp2","type":"text","x":20,"y":180,"width":720,"height":120,"props":{"text":"公司名称 - 职位 - 2018.01 -
  2020.01","fontSize":"14","color":"#34495e"}}]},{"id":"education","type":"container","x":20,"y":730,"width":760,"height":150,"props":{"background":"#ffffff"},"children":[{"id":"edu_title","type":"text","x":20,"y":20,"w  idth":720,"height":25,"props":{"text":"教育背景","fontSize":"16","fontWeight":"bold","color":"#1a252f"}},{"id":"edu1","type":"text","x":20,"y":50,"width":720,"height":80,"props":{"text":"学校名称 - 专业 - 学位 - 2014
  - 2018","fontSize":"14","color":"#34495e"}}]}]}'::jsonb, true, 0);

  -- 海报类模板
  INSERT INTO templates (name, category, description, page_schema, is_public, use_count) VALUES
  ('活动海报', 'poster', '大标题 + 图片 + 时间地点，适合活动宣传',
  '{"page":{"id":"poster_event","width":600,"height":800,"background":"#1a1a2e"},"elements":[{"id":"hero","type":"container","x":0,"y":0,"width":600,"height":400,"props":{"background":"linear-gradient(135deg, #667eea
  0%, #764ba2 100%)"},"children":[{"id":"title","type":"text","x":50,"y":100,"width":500,"height":80,"props":{"text":"活动名称","fontSize":"48","fontWeight":"bold","color":"#ffffff","textAlign":"center"}},{"id":"subtitl  e","type":"text","x":50,"y":200,"width":500,"height":40,"props":{"text":"活动主题描述","fontSize":"20","color":"#ecf0f1","textAlign":"center"}}]},{"id":"info","type":"container","x":50,"y":450,"width":500,"height":200  ,"props":{"background":"#16213e","borderRadius":"12"},"children":[{"id":"date","type":"text","x":30,"y":30,"width":440,"height":40,"props":{"text":"日期:
  2024年XX月XX日","fontSize":"18","color":"#ffffff"}},{"id":"time","type":"text","x":30,"y":80,"width":440,"height":40,"props":{"text":"时间: XX:XX -
  XX:XX","fontSize":"18","color":"#ffffff"}},{"id":"location","type":"text","x":30,"y":130,"width":440,"height":40,"props":{"text":"地点: 活动地点","fontSize":"18","color":"#ffffff"}}]},{"id":"cta","type":"button","x":1  50,"y":700,"width":300,"height":60,"props":{"text":"立即报名","background":"#e94560","color":"#ffffff","fontSize":"18","borderRadius":"8"}}]}'::jsonb, true, 0),

  ('促销海报', 'poster', '折扣信息 + 商品展示，适合电商促销', '{"page":{"id":"poster_promo","width":600,"height":800,"background":"#fff5f5"},"elements":[{"id":"discount_badge","type":"container","x":50,"y":50,"width":50  0,"height":150,"props":{"background":"#ff4757","borderRadius":"12"},"children":[{"id":"discount_text","type":"text","x":50,"y":40,"width":400,"height":70,"props":{"text":"限时特惠","fontSize":"36","fontWeight":"bold",  "color":"#ffffff","textAlign":"center"}},{"id":"discount_percent","type":"text","x":50,"y":110,"width":400,"height":30,"props":{"text":"全场5折起","fontSize":"24","color":"#ffffff","textAlign":"center"}}]},{"id":"prod  uct_area","type":"container","x":50,"y":230,"width":500,"height":350,"props":{"background":"#ffffff","borderRadius":"12","border":"2px solid #ff6b81"},"children":[{"id":"product_img","type":"text","x":150,"y":100,"wid  th":200,"height":150,"props":{"text":"商品图片","fontSize":"16","color":"#ff6b81","textAlign":"center"}},{"id":"product_name","type":"text","x":50,"y":280,"width":400,"height":40,"props":{"text":"商品名称","fontSize":  "20","fontWeight":"bold","color":"#2f3542","textAlign":"center"}},{"id":"product_price","type":"text","x":50,"y":320,"width":400,"height":30,"props":{"text":"99.00 原价
  199.00","fontSize":"16","color":"#ff4757","textAlign":"center"}}]},{"id":"cta","type":"button","x":150,"y":620,"width":300,"height":60,"props":{"text":"立即抢购","background":"#ff4757","color":"#ffffff","fontSize":"20  ","borderRadius":"30"}},{"id":"deadline","type":"text","x":50,"y":700,"width":500,"height":40,"props":{"text":"活动截止: 2024年XX月XX日","fontSize":"14","color":"#747d8c","textAlign":"center"}}]}'::jsonb, true, 0),

  ('招聘海报', 'poster', '公司信息 + 职位描述，适合企业招聘',
  '{"page":{"id":"poster_recruit","width":600,"height":800,"background":"#f8f9fa"},"elements":[{"id":"header","type":"container","x":0,"y":0,"width":600,"height":120,"props":{"background":"#2d3436"},"children":[{"id":"c  ompany_name","type":"text","x":50,"y":30,"width":500,"height":60,"props":{"text":"公司名称","fontSize":"32","fontWeight":"bold","color":"#ffffff","textAlign":"center"}}]},{"id":"job_title","type":"container","x":50,"y  ":150,"width":500,"height":80,"props":{"background":"#74b9ff","borderRadius":"8"},"children":[{"id":"job_name","type":"text","x":30,"y":20,"width":440,"height":40,"props":{"text":"招聘职位: XX工程师","fontSize":"24","  fontWeight":"bold","color":"#ffffff","textAlign":"center"}}]},{"id":"requirements","type":"container","x":50,"y":260,"width":500,"height":300,"props":{"background":"#ffffff","borderRadius":"12","border":"1px solid
  #dfe6e9"},"children":[{"id":"req_title","type":"text","x":30,"y":20,"width":440,"height":30,"props":{"text":"岗位要求","fontSize":"18","fontWeight":"bold","color":"#2d3436"}},{"id":"req_list","type":"text","x":30,"y":  60,"width":440,"height":220,"props":{"text":"本科及以上学历, 3年以上相关工作经验","fontSize":"14","color":"#636e72"}}]},{"id":"benefits","type":"container","x":50,"y":580,"width":500,"height":120,"props":{"background"  :"#00b894","borderRadius":"8"},"children":[{"id":"benefits_title","type":"text","x":30,"y":20,"width":440,"height":30,"props":{"text":"福利待遇","fontSize":"16","fontWeight":"bold","color":"#ffffff"}},{"id":"benefits_  text","type":"text","x":30,"y":60,"width":440,"height":40,"props":{"text":"五险一金 - 年假 - 培训 -
  股权激励","fontSize":"14","color":"#ffffff"}}]},{"id":"contact","type":"text","x":50,"y":720,"width":500,"height":40,"props":{"text":"投递邮箱:
  hr@company.com","fontSize":"14","color":"#b2bec3","textAlign":"center"}}]}'::jsonb, true, 0);

  -- 通用类模板
  INSERT INTO templates (name, category, description, page_schema, is_public, use_count) VALUES
  ('落地页', 'general', '产品介绍 + 表单，适合产品推广',
  '{"page":{"id":"landing_page","width":1200,"height":900,"background":"#ffffff"},"elements":[{"id":"hero","type":"container","x":0,"y":0,"width":1200,"height":400,"props":{"background":"linear-gradient(135deg, #667eea
  0%, #764ba2 100%)"},"children":[{"id":"hero_title","type":"text","x":100,"y":80,"width":1000,"height":80,"props":{"text":"产品名称","fontSize":"48","fontWeight":"bold","color":"#ffffff","textAlign":"center"}},{"id":"h  ero_desc","type":"text","x":100,"y":180,"width":1000,"height":60,"props":{"text":"简短的产品描述，突出核心价值","fontSize":"24","color":"#ecf0f1","textAlign":"center"}},{"id":"hero_cta","type":"button","x":450,"y":280  ,"width":300,"height":60,"props":{"text":"立即体验","background":"#ffffff","color":"#667eea","fontSize":"20","borderRadius":"30"}}]},{"id":"features","type":"container","x":100,"y":450,"width":1000,"height":200,"props  ":{"background":"#f8f9fa"},"children":[{"id":"feat1","type":"container","x":50,"y":30,"width":280,"height":140,"props":{"background":"#ffffff","borderRadius":"8"},"children":[{"id":"feat1_title","type":"text","x":20,"  y":20,"width":240,"height":30,"props":{"text":"功能1","fontSize":"18","fontWeight":"bold","color":"#2d3436"}},{"id":"feat1_desc","type":"text","x":20,"y":60,"width":240,"height":60,"props":{"text":"功能描述","fontSize  ":"14","color":"#636e72"}}]},{"id":"feat2","type":"container","x":360,"y":30,"width":280,"height":140,"props":{"background":"#ffffff","borderRadius":"8"},"children":[{"id":"feat2_title","type":"text","x":20,"y":20,"wi  dth":240,"height":30,"props":{"text":"功能2","fontSize":"18","fontWeight":"bold","color":"#2d3436"}},{"id":"feat2_desc","type":"text","x":20,"y":60,"width":240,"height":60,"props":{"text":"功能描述","fontSize":"14","c  olor":"#636e72"}}]},{"id":"feat3","type":"container","x":670,"y":30,"width":280,"height":140,"props":{"background":"#ffffff","borderRadius":"8"},"children":[{"id":"feat3_title","type":"text","x":20,"y":20,"width":240,  "height":30,"props":{"text":"功能3","fontSize":"18","fontWeight":"bold","color":"#2d3436"}},{"id":"feat3_desc","type":"text","x":20,"y":60,"width":240,"height":60,"props":{"text":"功能描述","fontSize":"14","color":"#6  36e72"}}]}]},{"id":"form","type":"container","x":400,"y":700,"width":400,"height":150,"props":{"background":"#ffffff","borderRadius":"12","border":"2px solid
  #667eea"},"children":[{"id":"form_title","type":"text","x":30,"y":20,"width":340,"height":30,"props":{"text":"联系我们","fontSize":"18","fontWeight":"bold","color":"#2d3436","textAlign":"center"}},{"id":"email_input",  "type":"input","x":30,"y":60,"width":340,"height":40,"props":{"placeholder":"输入您的邮箱","border":"1px solid #dfe6e9","borderRadius":"8"}},{"id":"submit_btn","type":"button","x":130,"y":110,"width":140,"height":30,"  props":{"text":"提交","background":"#667eea","color":"#ffffff","fontSize":"14","borderRadius":"8"}}]}]}'::jsonb, true, 0),

  ('邀请函', 'general', '活动邀请 + RSVP，适合活动邀请',
  '{"page":{"id":"invitation","width":600,"height":800,"background":"#fef9e7"},"elements":[{"id":"border","type":"container","x":30,"y":30,"width":540,"height":740,"props":{"background":"#ffffff","border":"3px solid
  #f39c12","borderRadius":"12"},"children":[{"id":"title","type":"text","x":50,"y":60,"width":440,"height":80,"props":{"text":"诚挚邀请","fontSize":"36","fontWeight":"bold","color":"#f39c12","textAlign":"center"}},{"id"  :"event_name","type":"text","x":50,"y":160,"width":440,"height":60,"props":{"text":"活动名称","fontSize":"28","color":"#2c3e50","textAlign":"center"}},{"id":"message","type":"text","x":50,"y":240,"width":440,"height":  150,"props":{"text":"尊敬的嘉宾：我们诚挚地邀请您参加本次活动","fontSize":"16","color":"#34495e","textAlign":"center"}},{"id":"details","type":"container","x":50,"y":420,"width":440,"height":150,"props":{"background":  "#f8f9fa","borderRadius":"8"},"children":[{"id":"date","type":"text","x":30,"y":30,"width":380,"height":30,"props":{"text":"日期:
  2024年XX月XX日","fontSize":"16","color":"#2c3e50"}},{"id":"time","type":"text","x":30,"y":70,"width":380,"height":30,"props":{"text":"时间:
  XX:XX","fontSize":"16","color":"#2c3e50"}},{"id":"location","type":"text","x":30,"y":110,"width":380,"height":30,"props":{"text":"地点:
  活动地点","fontSize":"16","color":"#2c3e50"}}]},{"id":"rsvp","type":"container","x":50,"y":600,"width":440,"height":100,"props":{"background":"#f39c12","borderRadius":"8"},"children":[{"id":"rsvp_title","type":"text",  "x":30,"y":20,"width":380,"height":30,"props":{"text":"请回复您的出席意向","fontSize":"16","fontWeight":"bold","color":"#ffffff","textAlign":"center"}},{"id":"rsvp_btn","type":"button","x":170,"y":60,"width":100,"heig  ht":30,"props":{"text":"确认出席","background":"#ffffff","color":"#f39c12","fontSize":"14","borderRadius":"8"}}]}]}]}'::jsonb, true, 0);

  -- 创建增加使用次数的函数
  CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
  RETURNS void AS $$
  BEGIN
    UPDATE templates SET use_count = use_count + 1 WHERE id = template_id;
  END;
  $$ LANGUAGE plpgsql;
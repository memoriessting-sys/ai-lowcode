// src/services/aiService.ts

import { findSimilarCache, addCache } from './cacheService';
import { supabase } from '../lib/supabase';
import i18n from '../locales/i18n';

// API配置 - calls go through Vite proxy in dev, or same-domain in production
const PROXY_URL = "/api/chat";
const USAGE_URL = "/api/usage";

// Style key to i18n label mapping (for AI prompt)
const styleKeyToLabel: Record<string, string> = {
  simple: i18n.t('chat:panel.styles.simple'),
  business: i18n.t('chat:panel.styles.business'),
  lively: i18n.t('chat:panel.styles.lively'),
  tech: i18n.t('chat:panel.styles.tech'),
  chinese: i18n.t('chat:panel.styles.chinese'),
};

// Extract data from NestJS TransformInterceptor response wrapper { data: ... }
function extractData<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  message?: string;
}

const SYSTEM_PROMPT = `你是一个专业的视觉设计助手，擅长创建简历、海报、落地页、邀请函等多种类型的页面设计。用户会描述他们想要的页面，你需要返回一个JSON格式的页面配置。

返回格式必须是纯JSON，不要包含任何markdown代码块标记或解释文字。

**重要：当用户要求修改特定元素时，只返回修改指令，不要返回整个页面！**

## 增量修改格式（修改/添加/删除单个元素时使用）：

### 修改元素（只修改指定属性，其他属性保持不变）：
{"modify": {"id": "元素ID", "props": {"color": "#新颜色"}}}
例如：用户说"把按钮改成红色"，返回：
{"modify": {"id": "elem_xxx", "props": {"backgroundColor": "#ff0000"}}}

### 添加新元素：
{"add": {"type": "button", "x": 100, "y": 100, "width": 120, "height": 40, "props": {"text": "按钮", "backgroundColor": "#1890ff", "textColor": "#ffffff"}}}

### 删除元素：
{"delete": "元素ID"}

## 完整页面格式（仅用于创建新页面或整体修改）：
{
  "page": {"id": "page_1", "width": 1200, "height": 800, "background": "#ffffff"},
  "elements": [...]
}

## 设计场景指南：

### 简历设计 (width: 794, height: 1123 - A4竖版)
- 使用简洁专业的配色（深蓝、深灰、白色为主）
- 包含：姓名、职位、联系方式、工作经历、教育背景、技能特长
- 排版清晰，层次分明，使用分割线区分不同模块
- 示例配色：主色 #2c3e50, 强调色 #3498db, 背景 #ffffff

### 海报设计 (width: 600, height: 800 或自定义)
- 大标题醒目，使用对比色
- 包含：主标题、副标题、关键信息、行动按钮
- 可使用渐变背景增加视觉效果
- 示例配色：渐变 #667eea 到 #764ba2, 强调色 #e94560

### 落地页设计 (width: 1200, height: 900)
- 清晰的产品介绍和价值主张
- 包含：Hero区域、功能特点、用户评价、表单/CTA
- 使用卡片式布局展示功能
- 示例配色：主色 #667eea, 背景 #f8f9fa

### 邀请函设计 (width: 600, height: 800)
- 温馨优雅的设计风格
- 包含：活动名称、时间地点、邀请语、RSVP
- 可使用装饰性边框或图案
- 示例配色：主色 #f39c12, 背景 #fef9e7

### 名片设计 (width: 350, height: 200)
- 简洁专业，信息清晰
- 包含：姓名、职位、公司、联系方式
- 正反面设计可分开

## 图片生成能力：
当用户需要图片时，你可以通过以下方式提供：

### 使用占位图服务：
- 通用占位图: "https://picsum.photos/宽度/高度" (随机图片)
- 人物头像: "https://i.pravatar.cc/150" (随机头像)
- 商业图片: "https://source.unsplash.com/随机/宽度x高度"

### 图片元素示例：
{"type": "image", "x": 100, "y": 100, "width": 200, "height": 150, "props": {"src": "https://picsum.photos/200/150", "alt": "示例图片", "objectFit": "cover"}}

### 头像示例：
{"type": "image", "x": 50, "y": 50, "width": 100, "height": 100, "props": {"src": "https://i.pravatar.cc/100", "alt": "头像", "objectFit": "cover"}}

## 支持的元素类型和props：
- text: { text: "文本内容", fontSize: 数字, color: "#颜色", fontWeight?: "normal|bold", textAlign?: "left|center|right", fontFamily?: "字体名称" }
- image: { src: "图片URL", alt: "描述", objectFit?: "cover|contain|fill", borderRadius?: 数字 }
- button: { text: "按钮文字", background: "#颜色", color: "#颜色", borderRadius?: 数字, fontSize?: 数字 }
- input: { placeholder: "提示文字", border: "#颜色", background?: "#颜色", borderRadius?: 数字 }
- container: { background: "#颜色", borderRadius?: 数字, borderColor?: "#颜色", borderWidth?: 数字, padding?: 数字 }
- video: { src: "视频URL", autoplay?: boolean, loop?: boolean, muted?: boolean, controls?: boolean }
- audio: { src: "音频URL", autoplay?: boolean, loop?: boolean, controls?: boolean }
- link: { text: "链接文字", href: "链接地址", color: "#颜色", fontSize: 数字, underline?: boolean }
- divider: { color: "#颜色", thickness: 数字, style?: "solid|dashed|dotted" }
- icon: { name: "图标名称", size: 数字, color: "#颜色" }
- card: { title: "标题", content: "内容", background: "#颜色", borderRadius?: 数字, borderColor?: "#颜色", borderWidth?: 数字, titleColor?: "#颜色", contentColor?: "#颜色" }
- select: { options: ["选项1", "选项2"], placeholder: "提示文字", border: "#颜色" }

## 常用图标名称：
Star, Heart, Home, User, Settings, Mail, Phone, Search, Bell, Calendar, Clock, Check, X, Plus, Minus, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Camera, Image, File, Folder, Download, Upload, Play, Pause, Volume, Wifi, Bluetooth, Lock, Unlock, Eye, EyeOff, ThumbsUp, ThumbsDown, Smile, Frown, Award, Briefcase, Building, MapPin, Globe, Send, MessageCircle

## 设计原则：
1. **对比** - 使用对比色突出重点信息
2. **对齐** - 元素对齐，保持视觉整洁
3. **重复** - 相同元素使用一致的风格
4. **亲密性** - 相关元素靠近放置

## 规则：
1. 用户说"改XX颜色"、"改XX文字"等，使用 modify 格式，只修改 props 中对应的属性
2. 用户说"添加一个按钮"等，使用 add 格式
3. 用户说"删除XX"等，使用 delete 格式
4. 只有用户说"新建页面"、"重新生成"、"帮我设计一个简历"等，才返回完整页面JSON
5. 颜色使用标准十六进制格式如 #ff0000
6. 根据用户描述的场景自动选择合适的尺寸和配色方案
7. 主动为用户添加合适的图片占位符`;

function detectInputLanguage(messages: ChatMessage[]): 'zh' | 'en' {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return 'zh';
  const content = lastUserMsg.content;
  const englishChars = content.match(/[a-zA-Z]/g)?.length || 0;
  const totalChars = content.replace(/\s/g, '').length;
  return totalChars > 0 && englishChars / totalChars > 0.7 ? 'en' : 'zh';
}

function getSystemPrompt(messages: ChatMessage[]): string {
  const lang = detectInputLanguage(messages);
  const t = i18n.getFixedT(lang === 'en' ? 'en' : 'zh', 'ai');
  const promptKey = lang === 'en' ? 'systemPromptEn' : 'systemPrompt';
  const prompt = t(promptKey);
  return prompt || SYSTEM_PROMPT; // fallback to hardcoded constant
}

// Get guest_id from localStorage
function getGuestId(): string {
  const guestData = localStorage.getItem("ai-lowcode-guest");
  if (guestData) {
    const parsed = JSON.parse(guestData);
    if (parsed.guestId) {
      return parsed.guestId;
    }
  }

  // Generate a new guest ID
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem("ai-lowcode-guest", JSON.stringify({
    date: new Date().toDateString(),
    count: 0,
    guestId
  }));
  return guestId;
}

// Check usage by calling backend API
export async function checkUsage(): Promise<UsageCheckResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Check if logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      // Guest mode: use guest_id
      headers["x-guest-id"] = getGuestId();
    }

    const response = await fetch(USAGE_URL, { headers });

    if (!response.ok) {
      // 如果是 401 错误，可能是 session 过期，尝试刷新 session
      if (response.status === 401 && session) {
        // 刷新 session
        const { data: { session: newSession } } = await supabase.auth.refreshSession();
        if (newSession?.access_token) {
          headers["Authorization"] = `Bearer ${newSession.access_token}`;
          const retryResponse = await fetch(USAGE_URL, { headers });
          if (retryResponse.ok) {
            const retryRawData = await retryResponse.json();
            const retryData = extractData<{ used: number; limit: number; remaining: number; resetAt: string }>(retryRawData);
            return {
              allowed: retryData.remaining > 0,
              remaining: retryData.remaining,
              message: retryData.remaining > 0 ? undefined : i18n.t('ai:errors.usageLimitReached'),
            };
          }
        }
      }
      // 如果还是失败，返回游客模式的默认值
      return {
        allowed: true,
        remaining: 1,
        message: undefined,
      };
    }

    const rawData = await response.json();
    const data = extractData<{ used: number; limit: number; remaining: number; resetAt: string }>(rawData);

    return {
      allowed: data.remaining > 0,
      remaining: data.remaining,
      message: data.remaining > 0 ? undefined :
        (session ? i18n.t('ai:errors.usageLimitReached') : i18n.t('ai:errors.guestLimit')),
    };
  } catch (error) {
    console.error("Check usage error:", error);
    return {
      allowed: true, // Allow on error, backend will check again
      remaining: 1,
    };
  }
}

// Increment usage after successful API call - now handled by backend
export function incrementUsage(): void {
  // Usage is now tracked in backend via usage_logs table
  // Just trigger a usage refresh
  updateUsageDisplay();
}

// 更新 authStore 的 usage 显示
async function updateUsageDisplay(): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      headers["x-guest-id"] = getGuestId();
    }

    const response = await fetch(USAGE_URL, { headers });

    if (response.ok) {
      const rawData = await response.json();
      const data = extractData<{ used: number; limit: number; remaining: number; resetAt: string }>(rawData);
      const usageInfo = {
        used: data.used,
        limit: data.limit,
        remaining: data.remaining,
        resetAt: data.resetAt,
      };
      // 触发 authStore 更新
      window.dispatchEvent(new CustomEvent('usage-update', { detail: usageInfo }));
    }
  } catch (error) {
    console.error('Update usage display error:', error);
  }
}

export async function sendMessage(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  style?: string,
): Promise<void> {
  try {
    // 获取用户最新消息
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();

    if (lastUserMessage) {
      // 查找相似问题的缓存
      const cached = findSimilarCache(lastUserMessage.content);
      if (cached) {
        // 使用缓存结果，模拟流式输出效果
        const response = cached.response;
        let index = 0;
        const chunkSize = 5; // 每次输出5个字符

        const simulateStream = () => {
          if (index < response.length) {
            const chunk = response.slice(index, index + chunkSize);
            callbacks.onToken(chunk);
            index += chunkSize;
            setTimeout(simulateStream, 20);
          } else {
            callbacks.onComplete(response);
          }
        };

        simulateStream();
        return;
      }
    }

    // Check usage before making API request
    const usageCheck = await checkUsage();
    if (!usageCheck.allowed) {
      callbacks.onError(new Error(usageCheck.message || i18n.t('ai:errors.usageLimitShort')));
      return;
    }

    // Get auth token if logged in
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    // 构建消息数组，包含系统提示，只保留最近3轮对话
    const MAX_HISTORY_ROUNDS = 3;
    const recentMessages = [
      { role: "system", content: getSystemPrompt(messages) },
      ...messages.slice(-(MAX_HISTORY_ROUNDS * 2)).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Get guest_id for guest mode tracking
    const guestId = !session ? getGuestId() : undefined;

    // Guest mode: send x-guest-id header (AuthGuard checks this first)
    if (guestId) {
      headers["x-guest-id"] = guestId;
    }

    // 通过后端代理发送请求
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: recentMessages,
        guest_id: guestId,
        style: (style && styleKeyToLabel[style]) || style || i18n.t('chat:panel.styles.simple'),
      }),
    });

    // Handle rate limit (429)
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      callbacks.onError(new Error(errorData.error || i18n.t('ai:errors.usageLimitShort')));
      return;
    }

    if (!response.ok) {
      // 人性化错误提示
      if (response.status === 500) {
        throw new Error(i18n.t('ai:errors.serviceUnavailable'));
      }
      if (response.status === 502 || response.status === 503) {
        throw new Error(i18n.t('ai:errors.serviceMaintenance'));
      }
      throw new Error(i18n.t('ai:errors.requestFailed'));
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(i18n.t('ai:errors.responseError'));
    }

    const decoder = new TextDecoder();
    let fullResponse = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            // OpenAI兼容格式的流式响应
            if (parsed.choices?.[0]?.delta?.content) {
              const token = parsed.choices[0].delta.content;
              fullResponse += token;
              callbacks.onToken(token);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // Increment usage after successful API call
    incrementUsage();

    // 更新 authStore 的 usage 显示
    updateUsageDisplay();

    // 保存到缓存
    if (lastUserMessage && fullResponse) {
      addCache(lastUserMessage.content, fullResponse);
    }

    callbacks.onComplete(fullResponse);
  } catch (error) {
    // 人性化错误提示
    let friendlyMsg = i18n.t('ai:errors.generateFailed');
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        friendlyMsg = i18n.t('ai:errors.networkError');
      } else if (error.message.includes("timeout")) {
        friendlyMsg = i18n.t('ai:errors.timeout');
      } else if (error.message.includes("服务") || error.message.includes("service") || error.message.includes("Service")) {
        friendlyMsg = error.message;
      }
    }
    callbacks.onError(new Error(friendlyMsg));
  }
}

export function parsePageSchema(response: string): unknown {
  try {
    // 尝试直接解析
    return JSON.parse(response);
  } catch {
    // 尝试提取JSON代码块
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error(i18n.t('ai:errors.parseError'));
  }
}

// 解析增量修改指令
export function parseIncrementalChange(response: string, currentElements: any[], currentPage?: any): any {
  // 使用当前页面配置，而非硬编码默认值
  const pageConfig = currentPage || { id: 'page_1', width: 1200, height: 800, background: '#ffffff' };

  try {
    const data = JSON.parse(response);

    // 检查是否是增量修改格式
    if (data.modify) {
      // 修改元素
      const targetId = data.modify.id;
      const elements = [...currentElements];
      const index = elements.findIndex((el: any) => el.id === targetId);
      if (index !== -1) {
        // 如果有 props，只合并 props
        if (data.modify.props) {
          elements[index] = {
            ...elements[index],
            props: { ...elements[index].props, ...data.modify.props }
          };
        } else {
          // 否则合并整个元素
          elements[index] = { ...elements[index], ...data.modify };
        }
      }
      return {
        page: pageConfig,
        elements
      };
    }

    if (data.add) {
      // 添加元素
      const elements = [...currentElements];
      const newElement = {
        id: `elem_${Date.now()}`,
        x: data.add.x || 100,
        y: data.add.y || 100,
        width: data.add.width || 100,
        height: data.add.height || 40,
        ...data.add,
      };
      elements.push(newElement);
      return {
        page: pageConfig,
        elements
      };
    }

    if (data.delete) {
      // 删除元素
      const elements = currentElements.filter((el: any) => el.id !== data.delete);
      return {
        page: pageConfig,
        elements
      };
    }

    // 不是增量修改，返回完整数据（确保格式正确）
    if (data.page && data.elements) {
      return data;
    }

    // 如果只有 elements，补充 page
    if (data.elements && !data.page) {
      return {
        page: { id: 'page_1', width: 1200, height: 800, background: '#ffffff' },
        elements: data.elements
      };
    }

    throw new Error(i18n.t('ai:errors.unknownFormat'));
  } catch {
    // 尝试提取JSON代码块
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1].trim());
      if (data.page && data.elements) {
        return data;
      }
      if (data.elements) {
        return {
          page: pageConfig,
          elements: data.elements
        };
      }
    }
    throw new Error(i18n.t('ai:errors.parseError'));
  }
}


// 尝试解析不完整的 JSON（用于实时渲染）
// 核心思路：AI 流式输出的 JSON 是逐步构建的，中间状态不完整
// 我们找到最后一个"安全截断点"，截断到那里，然后补全缺失的括号
export function tryParseIncompleteJson(response: string): unknown | null {
  // 先尝试完整解析
  try {
    return JSON.parse(response);
  } catch {
    // 继续尝试其他方式
  }

  // 尝试提取 JSON 代码块
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // 尝试对代码块中的不完整 JSON 做截断+补全
      return tryTruncateAndClose(jsonMatch[1].trim());
    }
  }

  // 找到 JSON 对象的开始位置
  const jsonStart = response.indexOf('{');
  if (jsonStart === -1) return null;

  return tryTruncateAndClose(response.slice(jsonStart));
}

// 截断到最后一个安全点 + 补全括号
// 安全截断点 = 浅层深度（≤2）的逗号或闭合括号位置
// 这样截断后补全括号，JSON 结构仍然合法
function tryTruncateAndClose(jsonStr: string): unknown | null {
  // 1. 找到最后一个安全截断点
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastSafePoint = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (escape) { escape = false; continue; }
    if (char === '\\' && inString) { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      // 闭合括号回到浅层时，是安全截断点
      if (depth <= 2) {
        lastSafePoint = i;
      }
    } else if (char === ',' && depth <= 2) {
      // 浅层深度的逗号也是安全截断点
      lastSafePoint = i;
    }
  }

  // 2. 截断到最后一个安全点
  let truncated: string;
  if (lastSafePoint > 0) {
    truncated = jsonStr.slice(0, lastSafePoint + 1).trimEnd();
    // 去掉末尾逗号
    if (truncated.endsWith(',')) truncated = truncated.slice(0, -1).trimEnd();
  } else {
    // 没有安全截断点，尝试直接补全
    truncated = jsonStr.trimEnd();
    if (truncated.endsWith(',')) truncated = truncated.slice(0, -1).trimEnd();
  }

  // 3. 统计未闭合的括号
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escape = false;

  for (let i = 0; i < truncated.length; i++) {
    const char = truncated[i];
    if (escape) { escape = false; continue; }
    if (char === '\\' && inString) { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
    else if (char === '[') openBrackets++;
    else if (char === ']') openBrackets--;
  }

  // 4. 补全缺失的括号
  let completed = truncated;
  for (let i = 0; i < openBrackets; i++) completed += ']';
  for (let i = 0; i < openBraces; i++) completed += '}';

  try {
    return JSON.parse(completed);
  } catch {
    return null;
  }
}

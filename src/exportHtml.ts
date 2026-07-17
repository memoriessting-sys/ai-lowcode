// src/utils/exportHtml.ts

import JSZip from 'jszip';
import type { PageConfig, Element, TextProps, ImageProps, ButtonProps, InputProps, ContainerProps, VideoProps, AudioProps, LinkProps, DividerProps, IconProps, CardProps, SelectProps } from '../types/schema';
import i18n from '../locales/i18n';

const ICON_SVG_MAP: Record<string, string> = {
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  'check': '<path d="M20 6L9 17l-5-5"/>',
  'x': '<path d="M18 6L6 18M6 6l12 12"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  'heart': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'trash': '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  'edit': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'unlock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'calendar': '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'briefcase': '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'award': '<circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.11"/>',
  'building': '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'messagecircle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
  'volume': '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
  'bluetooth': '<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>',
  'thumbsup': '<path d="M7 10v12"/><path d="M15 5.88 14.24 5.32a2 2 0 0 0-2.74-.23l-5.74 4.86a2 2 0 0 0-.58 2.64L10 22h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2.76"/><path d="M22 7a2 2 0 0 0-2 2v5"/>',
  'thumbsdown': '<path d="M17 14V2"/><path d="M9 18.12 9.76 18.68a2 2 0 0 0 2.74.23l5.74-4.86a2 2 0 0 0 .58-2.64L14 2H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2.76"/><path d="M2 19a2 2 0 0 0 2-2v-5"/>',
  'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9" y1="9" y2="9.01"/><line x1="15" x2="15" y1="9" y2="9.01"/>',
  'frown': '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9" y1="9" y2="9.01"/><line x1="15" x2="15" y1="9" y2="9.01"/>',
};

function getIconSvg(iconName: string, size: number, color: string): string {
  const normalizedName = iconName.toLowerCase().replace(/\s+/g, '-');
  const path = ICON_SVG_MAP[normalizedName];
  if (!path) {
    // Fallback to star for unknown icons
    return `<span style="font-size:${size}px;color:${color};">&#9733;</span>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

// 画布基准尺寸（与 Canvas 组件保持一致）
const CANVAS_WIDTH = 1200;

function generateElementHtml(element: Element, indent: string = '    '): string {
  // 直接使用像素值，与画布保持一致
  const style = `position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px;`;
  let content = '';

  // 辅助函数：将像素值转换为 rem
  const pxToRem = (px: number) => (px / 16).toFixed(3);

  switch (element.type) {
    case 'text': {
      const props = element.props as TextProps;
      const textStyle = `font-size: ${pxToRem(props.fontSize)}rem; color: ${props.color};${props.fontWeight ? ` font-weight: ${props.fontWeight};` : ''}${props.textAlign ? ` text-align: ${props.textAlign};` : ''}`;
      content = `${indent}  <div style="${style} ${textStyle}">${props.content}</div>`;
      break;
    }
    case 'image': {
      const props = element.props as ImageProps;
      const objectFit = props.objectFit || 'cover';
      content = `${indent}  <img src="${props.src}" alt="${props.alt}" style="${style} object-fit: ${objectFit};" />`;
      break;
    }
    case 'button': {
      const props = element.props as ButtonProps;
      const borderRadiusRem = pxToRem(props.borderRadius || 0);
      const btnStyle = `background-color: ${props.backgroundColor}; color: ${props.textColor}; border: none; border-radius: ${borderRadiusRem}rem; cursor: pointer; font-size: ${pxToRem(14)}rem;`;
      // 如果有跳转目标，生成链接按钮
      if (props.linkToName) {
        const safeFileName = props.linkToName.replace(/[<>:"/\\|?*]/g, '_');
        content = `${indent}  <a href="${safeFileName}.html" style="${style} ${btnStyle} display: flex; align-items: center; justify-content: center; text-decoration: none;">${props.text}</a>`;
      } else {
        content = `${indent}  <button style="${style} ${btnStyle}">${props.text}</button>`;
      }
      break;
    }
    case 'input': {
      const props = element.props as InputProps;
      const paddingRem = pxToRem(12);
      const inputStyle = `border: 1px solid ${props.borderColor}; border-radius: ${pxToRem(4)}rem; padding: 0 ${paddingRem}rem; font-size: ${pxToRem(14)}rem;${props.backgroundColor ? ` background-color: ${props.backgroundColor};` : ''}`;
      content = `${indent}  <input type="text" placeholder="${props.placeholder}" style="${style} ${inputStyle}" />`;
      break;
    }
    case 'container': {
      const props = element.props as ContainerProps;
      const borderRadiusRem = pxToRem(props.borderRadius || 0);
      const borderWidthRem = pxToRem(props.borderWidth || 1);
      const containerStyle = `background-color: ${props.backgroundColor}; border-radius: ${borderRadiusRem}rem;${props.borderColor ? ` border: ${borderWidthRem}rem solid ${props.borderColor};` : ''}`;
      const children = element.type === 'container' && 'children' in element
        ? element.children.map(child => generateElementHtml(child, indent + '  ')).join('\n')
        : '';
      content = `${indent}  <div style="${style} ${containerStyle}">\n${children}\n${indent}  </div>`;
      break;
    }
    case 'video': {
      const props = element.props as VideoProps;
      const attrs = `${props.autoplay ? ' autoplay' : ''}${props.loop ? ' loop' : ''}${props.muted ? ' muted' : ''}${props.controls !== false ? ' controls' : ''}`;
      content = `${indent}  <video src="${props.src}" style="${style}"${attrs}></video>`;
      break;
    }
    case 'audio': {
      const props = element.props as AudioProps;
      const attrs = `${props.autoplay ? ' autoplay' : ''}${props.loop ? ' loop' : ''}${props.controls !== false ? ' controls' : ''}`;
      content = `${indent}  <audio src="${props.src}" style="${style}"${attrs}></audio>`;
      break;
    }
    case 'link': {
      const props = element.props as LinkProps;
      const linkStyle = `color: ${props.color}; font-size: ${pxToRem(props.fontSize)}rem; text-decoration: ${props.underline ? 'underline' : 'none'};`;
      // 如果有跳转目标，使用页面链接
      if (props.linkToName) {
        const safeFileName = props.linkToName.replace(/[<>:"/\\|?*]/g, '_');
        content = `${indent}  <a href="${safeFileName}.html" style="${style} ${linkStyle}">${props.text}</a>`;
      } else {
        content = `${indent}  <a href="${props.href}" target="_blank" style="${style} ${linkStyle}">${props.text}</a>`;
      }
      break;
    }
    case 'divider': {
      const props = element.props as DividerProps;
      const thicknessRem = pxToRem(props.thickness);
      const dividerStyle = `border-top: ${thicknessRem}rem ${props.style || 'solid'} ${props.color};`;
      content = `${indent}  <div style="${style}"><div style="width: 100%; ${dividerStyle}"></div></div>`;
      break;
    }
    case 'icon': {
      const props = element.props as IconProps;
      const iconSvg = getIconSvg(props.name, props.size, props.color);
      content = `${indent}  <div style="${style} display: flex; align-items: center; justify-content: center;">${iconSvg}</div>`;
      break;
    }
    case 'card': {
      const props = element.props as CardProps;
      const borderRadiusRem = pxToRem(props.borderRadius || 8);
      const borderWidthRem = pxToRem(props.borderWidth || 1);
      const paddingRem = pxToRem(16);
      const cardStyle = `background-color: ${props.backgroundColor}; border-radius: ${borderRadiusRem}rem;${props.borderColor ? ` border: ${borderWidthRem}rem solid ${props.borderColor};` : ''} padding: ${paddingRem}rem;`;
      content = `${indent}  <div style="${style} ${cardStyle}">
${indent}    <h3 style="color: ${props.titleColor || '#1a1a1a'}; margin-bottom: ${pxToRem(8)}rem; font-weight: bold; font-size: ${pxToRem(18)}rem;">${props.title}</h3>
${indent}    <p style="color: ${props.contentColor || '#666666'}; font-size: ${pxToRem(14)}rem;">${props.content}</p>
${indent}  </div>`;
      break;
    }
    case 'select': {
      const props = element.props as SelectProps;
      const options = props.options.map(opt => `<option value="${opt}">${opt}</option>`).join('\n        ');
      content = `${indent}  <select style="${style} border: 1px solid ${props.borderColor}; border-radius: ${pxToRem(4)}rem; padding: 0 ${pxToRem(12)}rem; font-size: ${pxToRem(14)}rem;">
        <option value="">${props.placeholder}</option>
        ${options}
      </select>`;
      break;
    }
  }

  return content;
}

export function generateHtml(page: PageConfig, elements: Element[]): string {
  const elementsHtml = elements.map(el => generateElementHtml(el)).join('\n');

  // 计算页面实际需要的高度（考虑元素超出页面高度的情况）
  const maxElementY = elements.reduce((max, el) => {
    const bottom = el.y + el.height;
    return bottom > max ? bottom : max;
  }, page.height);

  // 使用页面的实际宽度
  const pageWidth = page.width || CANVAS_WIDTH;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${i18n.t('common:defaultContent.exportPageTitle')}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      min-height: 100vh;
    }
    body {
      background: ${page.background};
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
    }
    .page-container {
      position: relative;
      width: ${pageWidth}px;
      min-height: ${maxElementY}px;
      background: ${page.background};
    }
    /* 响应式：小屏幕时缩放 */
    @media (max-width: ${pageWidth + 40}px) {
      .page-container {
        transform: scale(calc(100vw / ${pageWidth + 40}));
        transform-origin: top center;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
${elementsHtml}
  </div>
</body>
</html>`;
}

export function downloadHtml(page: PageConfig, elements: Element[], filename: string = 'page.html'): void {
  try {
    // 确保元素数组有效
    const validElements = (elements || []).filter(el => el && el.id);

    const html = generateHtml(page, validElements);

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.cssText = 'display: none;';

    document.body.appendChild(link);

    // 直接触发点击
    link.click();

    // 延迟清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);

    alert(i18n.t('common:defaultContent.downloading', { filename }));
  } catch (error) {
    console.error(i18n.t('common:defaultContent.downloadFailed', { message: '' }), error);
    alert(i18n.t('common:defaultContent.downloadFailed', { message: (error as Error).message }));
  }
}

interface PageData {
  name: string;
  page: PageConfig;
  elements: Element[];
}

export async function downloadZip(pages: PageData[], filename: string = 'pages.zip'): Promise<void> {
  try {
    const zip = new JSZip();

    pages.forEach((pageData) => {
      const html = generateHtml(pageData.page, pageData.elements);
      // 使用页面名称作为文件名，处理特殊字符
      const safeName = pageData.name.replace(/[<>:"/\\|?*]/g, '_');
      const pageFilename = `${safeName}.html`;
      zip.file(pageFilename, html);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.cssText = 'display: none;';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);

    alert(i18n.t('common:defaultContent.downloading', { filename }));
  } catch (error) {
    console.error(i18n.t('common:defaultContent.zipDownloadFailed', { message: '' }), error);
    alert(i18n.t('common:defaultContent.zipDownloadFailed', { message: (error as Error).message }));
  }
}

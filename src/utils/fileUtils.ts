import { AttachedFile } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileCategory(mimeType: string, filename: string): 'image' | 'pdf' | 'code' | 'data' | 'text' | 'doc' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['csv', 'json', 'xlsx', 'xls', 'tsv', 'xml'].includes(ext) || mimeType.includes('csv') || mimeType.includes('json')) return 'data';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'html', 'css', 'sql', 'sh', 'yaml', 'yml'].includes(ext)) return 'code';
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'text';
}

export async function readFileAsAttachedFile(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const isTextOrCode =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/javascript' ||
      file.type === 'application/xml' ||
      ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css', '.sql', '.yaml', '.yml', '.log'].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

    if (isTextOrCode) {
      reader.readAsText(file, 'UTF-8');
      reader.onload = () => {
        const textContent = reader.result as string;
        // Also generate base64 for consistency
        const base64 = btoa(unescape(encodeURIComponent(textContent)));
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          dataUrl: `data:${file.type || 'text/plain'};base64,${base64}`,
          base64,
          textContent,
        });
      };
      reader.onerror = (error) => reject(error);
    } else {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Parts = dataUrl.split(',');
        const base64 = base64Parts.length > 1 ? base64Parts[1] : dataUrl;
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          base64,
        });
      };
      reader.onerror = (error) => reject(error);
    }
  });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 1. Try textarea execCommand fallback first (often more reliable in preview iframes)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        return true;
      }
    } catch (fallbackErr) {
      // execCommand blocked
    }

    // 2. Try modern Clipboard API safely
    try {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (clipErr) {
      // Suppress insecure context or operation is insecure errors
    }

    return false;
  } catch (outerErr) {
    return false;
  }
}


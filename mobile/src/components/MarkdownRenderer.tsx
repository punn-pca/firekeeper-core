import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { normalizeTaxonomy } from '../utils/taxonomyTokens';

interface Props {
  content: string;
  isUser?: boolean;
}

// Regex to capture markdown inline elements & taxonomy tokens
// 1. Code blocks: ```...``` (handled at block level)
// 2. Inline taxonomy tags: `[FACT]`, `[EVIDENCE]`, etc.
// 3. Bold: `**...**`
// 4. Inline code: `` `...` ``
// 5. Italic: `*...*`

export default function MarkdownRenderer({ content, isUser = false }: Props) {
  if (!content) return null;

  // Split content by code blocks first
  const blocks = splitBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={`block-${idx}`} code={block.text} lang={block.lang} />;
        } else if (block.type === 'quote') {
          return (
            <View key={`block-${idx}`} style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                {renderInlineText(block.text, isUser)}
              </Text>
            </View>
          );
        } else if (block.type === 'header') {
          return (
            <View key={`block-${idx}`} style={styles.headerBox}>
              <Text
                style={[
                  styles.headerText,
                  (block.level ?? 1) === 1 && styles.h1,
                  (block.level ?? 1) === 2 && styles.h2,
                  (block.level ?? 1) >= 3 && styles.h3,
                ]}
              >
                {renderInlineText(block.text, isUser)}
              </Text>
            </View>
          );
        } else if (block.type === 'list') {
          return (
            <View key={`block-${idx}`} style={styles.listRow}>
              <Text style={styles.listBullet}>{block.bullet}</Text>
              <Text style={[styles.bodyText, isUser ? styles.userText : styles.assistantText, styles.listContent]}>
                {renderInlineText(block.text, isUser)}
              </Text>
            </View>
          );
        } else {
          return (
            <Text key={`block-${idx}`} style={[styles.bodyText, isUser ? styles.userText : styles.assistantText]}>
              {renderInlineText(block.text, isUser)}
            </Text>
          );
        }
      })}
    </View>
  );
}

// Parse block-level markdown structures
interface BlockItem {
  type: 'paragraph' | 'code' | 'quote' | 'header' | 'list';
  text: string;
  lang?: string;
  level?: number;
  bullet?: string;
}

function splitBlocks(text: string): BlockItem[] {
  const result: BlockItem[] = [];
  const lines = text.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code fence
    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch && !inCode) {
      inCode = true;
      codeLang = codeMatch[1] || '';
      codeBuffer = [];
      continue;
    } else if (line.startsWith('```') && inCode) {
      inCode = false;
      result.push({
        type: 'code',
        text: codeBuffer.join('\n'),
        lang: codeLang,
      });
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Skip empty lines or push spacer
    if (!line.trim()) {
      continue;
    }

    // Header
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      result.push({
        type: 'header',
        level: hMatch[1].length,
        text: hMatch[2],
      });
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      result.push({
        type: 'quote',
        text: line.replace(/^>\s*/, ''),
      });
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      result.push({
        type: 'list',
        bullet: '• ',
        text: bulletMatch[3],
      });
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\s*)(\d+\.)\s+(.+)$/);
    if (numMatch) {
      result.push({
        type: 'list',
        bullet: `${numMatch[2]} `,
        text: numMatch[3],
      });
      continue;
    }

    // Regular paragraph
    result.push({
      type: 'paragraph',
      text: line,
    });
  }

  if (inCode && codeBuffer.length > 0) {
    result.push({
      type: 'code',
      text: codeBuffer.join('\n'),
      lang: codeLang,
    });
  }

  return result;
}

const handleOpenUrl = async (url: string) => {
  if (!url) return;
  try {
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('/')) {
      cleanUrl = `https://firekeeper.site${cleanUrl}`;
    } else if (!/^https?:\/\/|mailto:/i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    await Linking.openURL(cleanUrl);
  } catch {
    Alert.alert('Cannot Open Link', `Unable to open: ${url}`);
  }
};

interface InlineToken {
  type: 'text' | 'link' | 'tag' | 'bold' | 'code' | 'italic';
  value?: string;
  text?: string;
  url?: string;
}

function tokenizeLine(line: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      // Check for bare URLs in textBuffer (e.g. https://example.com)
      const urlRegex = /(https?:\/\/[^\s<>"'()]+)/g;
      let lastUrlIdx = 0;
      let urlMatch: RegExpExecArray | null;
      while ((urlMatch = urlRegex.exec(textBuffer)) !== null) {
        if (urlMatch.index > lastUrlIdx) {
          tokens.push({ type: 'text', value: textBuffer.slice(lastUrlIdx, urlMatch.index) });
        }
        tokens.push({ type: 'link', text: urlMatch[1], url: urlMatch[1] });
        lastUrlIdx = urlMatch.index + urlMatch[0].length;
      }
      if (lastUrlIdx < textBuffer.length) {
        tokens.push({ type: 'text', value: textBuffer.slice(lastUrlIdx) });
      }
      textBuffer = '';
    }
  };

  while (i < line.length) {
    // 1. Check for markdown link: [anchor](url)
    if (line[i] === '[') {
      const closeBracket = line.indexOf(']', i + 1);
      if (closeBracket !== -1 && line[closeBracket + 1] === '(') {
        // Find matching closing paren, accounting for balanced parens in URLs
        let parenDepth = 0;
        let closeParen = -1;
        for (let p = closeBracket + 1; p < line.length; p++) {
          if (line[p] === '(') parenDepth++;
          else if (line[p] === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              closeParen = p;
              break;
            }
          } else if (line[p] === ' ' || line[p] === '\n') {
            break;
          }
        }

        if (closeParen !== -1) {
          const anchor = line.slice(i + 1, closeBracket);
          const rawUrl = line.slice(closeBracket + 2, closeParen).trim();
          if (
            rawUrl.startsWith('http://') ||
            rawUrl.startsWith('https://') ||
            rawUrl.startsWith('/') ||
            rawUrl.startsWith('mailto:') ||
            rawUrl.startsWith('www.')
          ) {
            flushText();
            tokens.push({ type: 'link', text: anchor.trim() || rawUrl, url: rawUrl });
            i = closeParen + 1;
            continue;
          }
        }
      }

      // 2. Check for Taxonomy Tag: [TAG]
      if (closeBracket !== -1 && closeBracket - i <= 35) {
        const tagContent = line.slice(i + 1, closeBracket).trim();
        const meta = normalizeTaxonomy(tagContent);
        if (meta) {
          flushText();
          tokens.push({ type: 'tag', value: tagContent });
          i = closeBracket + 1;
          continue;
        }
      }
    }

    // 3. Bold: **text**
    if (line.slice(i, i + 2) === '**') {
      const closeBold = line.indexOf('**', i + 2);
      if (closeBold !== -1) {
        flushText();
        tokens.push({ type: 'bold', value: line.slice(i + 2, closeBold) });
        i = closeBold + 2;
        continue;
      }
    }

    // 4. Inline code: `code`
    if (line[i] === '`') {
      const closeCode = line.indexOf('`', i + 1);
      if (closeCode !== -1) {
        flushText();
        tokens.push({ type: 'code', value: line.slice(i + 1, closeCode) });
        i = closeCode + 1;
        continue;
      }
    }

    // 5. Italic: *text* (single *)
    if (line[i] === '*' && line[i + 1] !== '*') {
      const closeItalic = line.indexOf('*', i + 1);
      if (closeItalic !== -1 && line[closeItalic + 1] !== '*') {
        flushText();
        tokens.push({ type: 'italic', value: line.slice(i + 1, closeItalic) });
        i = closeItalic + 1;
        continue;
      }
    }

    // Regular character
    textBuffer += line[i];
    i++;
  }

  flushText();
  return tokens;
}

// Tokenize a line of text into inline elements (Taxonomy badges, clickable links, bold, inline code, normal text)
function renderInlineText(text: string, isUser: boolean): React.ReactNode[] {
  const tokens = tokenizeLine(text);

  return tokens.map((tok, idx) => {
    if (tok.type === 'link') {
      return (
        <Text
          key={`inline-${idx}`}
          style={styles.linkText}
          onPress={() => handleOpenUrl(tok.url || '')}
        >
          {tok.text || tok.url}
        </Text>
      );
    }

    if (tok.type === 'tag') {
      const meta = normalizeTaxonomy(tok.value || '');
      if (meta) {
        return (
          <Text
            key={`inline-${idx}`}
            style={[
              styles.taxonomyTag,
              {
                color: meta.textColor,
                backgroundColor: meta.bgColor,
                borderColor: meta.borderColor,
              },
            ]}
          >
            {` ${meta.label} `}
          </Text>
        );
      }
      return (
        <Text key={`inline-${idx}`} style={isUser ? styles.userText : styles.assistantText}>
          {`[${tok.value}]`}
        </Text>
      );
    }

    if (tok.type === 'bold') {
      return (
        <Text key={`inline-${idx}`} style={styles.boldText}>
          {tok.value}
        </Text>
      );
    }

    if (tok.type === 'code') {
      return (
        <Text key={`inline-${idx}`} style={styles.inlineCode}>
          {` ${tok.value} `}
        </Text>
      );
    }

    if (tok.type === 'italic') {
      return (
        <Text key={`inline-${idx}`} style={styles.italicText}>
          {tok.value}
        </Text>
      );
    }

    return (
      <Text key={`inline-${idx}`} style={isUser ? styles.userText : styles.assistantText}>
        {tok.value}
      </Text>
    );
  });
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.codeContainer}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLang}>{lang || 'code'}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copySmallBtn}>
          <Text style={styles.copySmallText}>{copied ? 'Copied ✓' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollViewWrapper>
        <Text style={styles.codeContent}>{code}</Text>
      </ScrollViewWrapper>
    </View>
  );
}

function ScrollViewWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      nestedScrollEnabled={true}
      contentContainerStyle={styles.codeScroll}
    >
      {children}
    </ScrollView>
  );
}

const monoFont = Platform.OS === 'android' ? 'monospace' : 'Menlo';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 6,
    flexShrink: 1,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e5e7eb',
  },
  boldText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#d1d5db',
  },
  linkText: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  quoteText: {
    color: '#fed7aa',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  taxonomyTag: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '800',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    includeFontPadding: false,
  },
  inlineCode: {
    fontFamily: monoFont,
    fontSize: 13,
    color: '#fb923c',
    backgroundColor: '#262626',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#404040',
    overflow: 'hidden',
  },
  headerBox: {
    marginTop: 10,
    marginBottom: 4,
  },
  headerText: {
    fontWeight: '800',
    color: '#f97316',
  },
  h1: { fontSize: 20, lineHeight: 28, color: '#fb923c' },
  h2: { fontSize: 17, lineHeight: 24, color: '#fed7aa' },
  h3: { fontSize: 15, lineHeight: 22, color: '#ffffff' },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
    backgroundColor: '#1f1610',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginVertical: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  listBullet: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
    lineHeight: 23,
  },
  listContent: {
    flex: 1,
    marginBottom: 0,
  },
  codeContainer: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  codeLang: {
    color: '#9ca3af',
    fontSize: 11,
    fontFamily: monoFont,
    textTransform: 'uppercase',
  },
  copySmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#262626',
    borderRadius: 4,
  },
  copySmallText: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '600',
  },
  codeScroll: {
    padding: 12,
  },
  codeContent: {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 19,
    color: '#e2e8f0',
  },
});

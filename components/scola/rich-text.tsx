'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import {
  Fragment,
  useEffect,
  useRef,
  type ClipboardEvent,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Value } from '@/lib/entities';

const richTextPrefix = 'SCOLA_RICH_TEXT_V1:';

type RichTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type RichTextDocument = {
  version: 1;
  runs: RichTextRun[];
};

const formattingActions = [
  { Icon: Bold, label: 'Negra', command: 'bold' },
  { Icon: Italic, label: 'Cursiva', command: 'italic' },
  { Icon: Underline, label: 'Subliñado', command: 'underline' },
] as const;

const plainDocument = (value: string): RichTextDocument => ({
  version: 1,
  runs: value ? [{ text: value }] : [],
});

function parseRichText(value: Value | undefined): RichTextDocument {
  const stored = String(value ?? '');
  if (!stored.startsWith(richTextPrefix)) return plainDocument(stored);

  try {
    const parsed = JSON.parse(stored.slice(richTextPrefix.length)) as Partial<RichTextDocument>;
    if (parsed.version !== 1 || !Array.isArray(parsed.runs)) return plainDocument(stored);
    const runs = parsed.runs
      .filter((run): run is RichTextRun => Boolean(run) && typeof run.text === 'string')
      .map((run) => ({
        text: run.text,
        ...(run.bold ? { bold: true } : {}),
        ...(run.italic ? { italic: true } : {}),
        ...(run.underline ? { underline: true } : {}),
      }));
    return { version: 1, runs };
  } catch {
    return plainDocument(stored);
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function documentHtml(value: Value | undefined): string {
  return parseRichText(value).runs
    .map((run) => {
      let content = escapeHtml(run.text).replaceAll('\n', '<br>');
      if (run.underline) content = `<u>${content}</u>`;
      if (run.italic) content = `<em>${content}</em>`;
      if (run.bold) content = `<strong>${content}</strong>`;
      return content;
    })
    .join('');
}

function serializeEditor(root: HTMLDivElement): string {
  const runs: RichTextRun[] = [];
  const append = (text: string, marks: Omit<RichTextRun, 'text'>) => {
    if (!text) return;
    const previous = runs.at(-1);
    if (
      previous &&
      Boolean(previous.bold) === Boolean(marks.bold) &&
      Boolean(previous.italic) === Boolean(marks.italic) &&
      Boolean(previous.underline) === Boolean(marks.underline)
    ) {
      previous.text += text;
    } else {
      runs.push({ text, ...marks });
    }
  };
  const addLineBreak = () => {
    if (!runs.length || runs.at(-1)?.text.endsWith('\n')) return;
    append('\n', {});
  };
  const visit = (node: Node, marks: Omit<RichTextRun, 'text'> = {}) => {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent ?? '', marks);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      append('\n', marks);
      return;
    }

    const block = ['DIV', 'P', 'LI'].includes(node.tagName);
    if (block && runs.length) addLineBreak();
    const nextMarks = {
      ...marks,
      ...(['B', 'STRONG'].includes(node.tagName) ? { bold: true } : {}),
      ...(['I', 'EM'].includes(node.tagName) ? { italic: true } : {}),
      ...(node.tagName === 'U' ? { underline: true } : {}),
    };
    node.childNodes.forEach((child) => visit(child, nextMarks));
    if (block) addLineBreak();
  };

  root.childNodes.forEach((child) => visit(child));
  while (runs.at(-1)?.text.endsWith('\n')) {
    const last = runs.at(-1)!;
    last.text = last.text.slice(0, -1);
    if (!last.text) runs.pop();
  }
  if (!runs.length) return '';
  return `${richTextPrefix}${JSON.stringify({ version: 1, runs })}`;
}

function formatRun(run: RichTextRun, index: number): ReactNode {
  let content: ReactNode = run.text;
  if (run.underline) content = <u>{content}</u>;
  if (run.italic) content = <em>{content}</em>;
  if (run.bold) content = <strong>{content}</strong>;
  return <Fragment key={index}>{content}</Fragment>;
}

export function RichText({ value, className = '' }: { value: Value | undefined; className?: string }) {
  const runs = parseRichText(value).runs;
  return <div className={`rich-text-content ${className}`.trim()}>{runs.map(formatRun)}</div>;
}

export function RichTextEditor({
  id,
  name,
  value,
  invalid,
  onChange,
  onBlur,
  inputRef,
}: {
  id: string;
  name: string;
  value: Value | undefined;
  invalid?: boolean;
  onChange: (value: string) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  inputRef?: (element: HTMLDivElement | null) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && serializeEditor(editor) !== String(value ?? '')) {
      editor.innerHTML = documentHtml(value);
    }
  }, [value]);

  const sync = () => {
    if (editorRef.current) onChange(serializeEditor(editorRef.current));
  };
  const applyFormat = (command: 'bold' | 'italic' | 'underline') => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return;

    const wrapper = document.createElement(
      command === 'bold' ? 'strong' : command === 'italic' ? 'em' : 'u',
    );
    try {
      range.surroundContents(wrapper);
    } catch {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
    }
    range.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(range);
    sync();
    editor.focus();
  };
  const pastePlainText = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    const text = document.createTextNode(event.clipboardData.getData('text/plain'));
    range.deleteContents();
    range.insertNode(text);
    range.setStartAfter(text);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    sync();
  };

  return (
    <div className="rich-text-editor" data-invalid={invalid || undefined}>
      <div className="editor-toolbar" role="toolbar" aria-label="Formato do texto">
        {formattingActions.map(({ Icon, label, command }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyFormat(command)}
          >
            <Icon size={17} />
          </Button>
        ))}
      </div>
      <div
        id={id}
        ref={(element) => {
          editorRef.current = element;
          inputRef?.(element);
        }}
        className="rich-text-input"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Notas e observacións"
        aria-multiline="true"
        aria-invalid={invalid}
        data-placeholder="Escribe as notas e observacións…"
        data-name={name}
        onInput={sync}
        onBlur={(event) => {
          sync();
          onBlur(event);
        }}
        onPaste={pastePlainText}
      />
    </div>
  );
}

import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Add notes...',
  rows = 6,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync external value changes to editor
    if (editorRef.current && !isFocused) {
      const htmlContent = value || '';
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    handleInput();
  };

  const insertBulletList = () => {
    document.execCommand('insertUnorderedList', false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    if (linkUrl.trim()) {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || 'Link';
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const link = document.createElement('a');
        link.href = linkUrl.trim();
        link.textContent = selectedText || linkUrl.trim();
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        try {
          range.deleteContents();
          range.insertNode(link);
          
          // Move cursor after the link
          const newRange = document.createRange();
          newRange.setStartAfter(link);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          handleInput();
          setLinkUrl('');
          setShowLinkInput(false);
          if (editorRef.current) {
            editorRef.current.focus();
          }
        } catch (error) {
          console.error('Error inserting link:', error);
        }
      }
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertLink();
    } else if (e.key === 'Escape') {
      setShowLinkInput(false);
      setLinkUrl('');
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl/Cmd + K to insert link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowLinkInput(true);
      setTimeout(() => {
        linkInputRef.current?.focus();
      }, 0);
    }
    // Ctrl/Cmd + Shift + L for bullet list
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      insertBulletList();
    }
  };

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <button
          type="button"
          onClick={insertBulletList}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          title="Insert bullet list (Ctrl+Shift+L)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => {
            setShowLinkInput(true);
            setTimeout(() => {
              linkInputRef.current?.focus();
            }, 0);
          }}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          title="Insert link (Ctrl+K)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Link
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <input
            ref={linkInputRef}
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            onKeyDown={handleLinkKeyDown}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={insertLink}
            disabled={!linkUrl.trim()}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: linkUrl.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              cursor: linkUrl.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
              editorRef.current?.focus();
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleEditorKeyDown}
        style={{
          minHeight: `${rows * 24}px`,
          padding: '10px 12px',
          fontSize: '14px',
          color: '#111827',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          outline: 'none',
          overflowY: 'auto',
          maxHeight: '400px',
          boxSizing: 'border-box',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        div[contenteditable] ul {
          margin: 0;
          padding-left: 24px;
          list-style-type: disc;
        }
        div[contenteditable] ul li {
          margin: 4px 0;
        }
        div[contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        div[contenteditable] a:hover {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
};


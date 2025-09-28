import React, { useRef, useEffect, useState } from 'react';
import SuccessAlert from './SuccessAlert';

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter your content here...', 
  height = '200px',
  onImageUpload,
  className = '',
  disabled = false
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // 'success' or 'error'
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Apply formatting using document.execCommand
  const applyFormatting = (format) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    
    // Use document.execCommand for actual formatting
    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'h1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) document.execCommand('createLink', false, url);
        break;
      default:
        return;
    }
    
    // Update the value after formatting
    onChange && onChange(editor.innerHTML);
  };

  // Handle input with clean LTR enforcement
  const handleInput = (e) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    onChange && onChange(editor.innerHTML);
  };

  // Handle image upload
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setAlertMessage('Uploading image...');
    setAlertType('info');

    try {
      let imageUrl;
      if (onImageUpload) {
        imageUrl = await onImageUpload(file);
      } else {
        // Fallback to base64
        imageUrl = await convertToBase64(file);
      }

      // Insert image at cursor position or at the end if no selection
      const editor = editorRef.current;
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '8px 0';

      const selection = window.getSelection();
      if (selection.rangeCount > 0 && editor.contains(selection.focusNode)) {
        // Insert at cursor position if editor has focus
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Insert at the end if no selection or editor not focused
        editor.appendChild(img);
        // Set cursor after the image
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
      }

      onChange && onChange(editor.innerHTML);
      
      // Show success message
      setAlertType('success');
      setAlertMessage('Image uploaded successfully!');
      
    } catch (error) {
      console.error('Image upload failed:', error);
      setAlertType('error');
      setAlertMessage(`Image upload failed: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }

    // Clear file input
    e.target.value = '';
  };

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle paste events (including images)
  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    // Check for images in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        
        if (file) {
          setIsUploadingImage(true);
          setAlertMessage('Uploading pasted image...');
          setAlertType('info');

          try {
            let imageUrl;
            if (onImageUpload) {
              imageUrl = await onImageUpload(file);
            } else {
              imageUrl = await convertToBase64(file);
            }

            // Insert image at cursor position
            const editor = editorRef.current;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const img = document.createElement('img');
              img.src = imageUrl;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.display = 'block';
              img.style.margin = '8px 0';
              range.insertNode(img);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            onChange && onChange(editor.innerHTML);
            
            // Show success message
            setAlertType('success');
            setAlertMessage('Pasted image uploaded successfully!');
            
          } catch (error) {
            console.error('Pasted image upload failed:', error);
            setAlertType('error');
            setAlertMessage(`Failed to upload pasted image: ${error.message}`);
          } finally {
            setIsUploadingImage(false);
          }
        }
        return;
      }
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Alert Messages */}
      {alertMessage && (
        <div className="mb-3">
          {alertType === 'success' ? (
            <SuccessAlert 
              message={alertMessage} 
              onClose={() => setAlertMessage('')}
              autoDismissMs={3000}
            />
          ) : alertType === 'info' ? (
            <div className="rounded border px-3 py-2 text-sm border-blue-300 bg-blue-50 text-blue-700 flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {alertMessage}
            </div>
          ) : (
            <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-700">
              {alertMessage}
              <button 
                onClick={() => setAlertMessage('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Toolbar */}
      <div className="bg-gray-50 border border-gray-300 rounded-t-lg p-2 flex flex-wrap gap-1">
        <button type="button" onClick={() => applyFormatting('bold')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100 font-bold">B</button>
        <button type="button" onClick={() => applyFormatting('italic')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100 italic">I</button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button type="button" onClick={() => applyFormatting('h1')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">H1</button>
        <button type="button" onClick={() => applyFormatting('h2')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">H2</button>
        <button type="button" onClick={() => applyFormatting('h3')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">H3</button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button type="button" onClick={() => applyFormatting('link')} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">🔗</button>
        <button 
          type="button" 
          onClick={handleImageUpload} 
          disabled={isUploadingImage}
          className={`px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100 flex items-center ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploadingImage ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              📤
            </>
          ) : (
            '🖼️'
          )}
        </button>
        
        <div className="ml-auto">
          <button type="button" onClick={() => setShowPreview(true)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Preview</button>
        </div>
      </div>

      {/* ContentEditable Editor with Strong LTR */}
      <div
        ref={editorRef}
        className="border border-t-0 border-gray-300 rounded-b-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full"
        style={{ 
          minHeight: height,
          direction: 'ltr !important',
          textAlign: 'left !important',
          unicodeBidi: 'plaintext !important'
        }}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        dir="ltr"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        suppressContentEditableWarning={true}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Preview</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh] prose max-w-none">
              {editorRef.current?.innerHTML ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: editorRef.current.innerHTML }}
                />
              ) : (
                <div className="text-gray-500 italic">No content to preview</div>
              )}
            </div>
            <div className="p-4 border-t text-right">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>💡 <strong>Tip:</strong> You can paste images directly (Ctrl+V)</span>
          <span>📋 Copy content from Word, Excel, Canva, or PDFs</span>
          <span>🖼️ Click the image icon to upload files</span>
        </div>
      </div>

      <style jsx>{`
        .rich-text-editor [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: plaintext !important;
        }
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          direction: ltr;
          text-align: left;
        }
        .rich-text-editor [contenteditable] * {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: plaintext !important;
        }
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
          display: block;
        }
        .rich-text-editor h1, .rich-text-editor h2, .rich-text-editor h3 {
          margin: 16px 0 8px 0;
          font-weight: bold;
        }
        .rich-text-editor h1 { font-size: 1.5em; }
        .rich-text-editor h2 { font-size: 1.3em; }
        .rich-text-editor h3 { font-size: 1.1em; }
        .rich-text-editor ul, .rich-text-editor ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .rich-text-editor p {
          margin: 8px 0;
        }
        .rich-text-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .rich-text-editor b, .rich-text-editor strong {
          font-weight: bold;
        }
        .rich-text-editor i, .rich-text-editor em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

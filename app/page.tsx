'use client'

import { useState, useRef, KeyboardEvent, useEffect } from 'react'

type Command = {
  trigger: string
  replacement: string
  label: string
  description: string
}

const COMMANDS: Command[] = [
  { trigger: '/todo', replacement: '☐ ', label: '/todo', description: 'Add a checkbox' },
  { trigger: '/h1', replacement: '# ', label: '/h1', description: 'Large heading' },
  { trigger: '/h2', replacement: '## ', label: '/h2', description: 'Medium heading' },
  { trigger: '/h3', replacement: '### ', label: '/h3', description: 'Small heading' },
]

export default function Home() {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const editorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handleInput = () => {
      const selection = window.getSelection()
      if (!selection || !selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const textNode = range.startContainer

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const text = textNode.textContent
        const offset = range.startOffset

        // Find the start of the current line
        const beforeCursor = text.substring(0, offset)
        const lineStart = beforeCursor.lastIndexOf('\n') + 1
        const currentLine = text.substring(lineStart, offset)

        // Show menu if line starts with "/"
        if (currentLine.startsWith('/') && currentLine.length > 0) {
          const rect = range.getBoundingClientRect()
          setMenuPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX
          })
          setShowMenu(true)
        } else {
          setShowMenu(false)
          setSelectedIndex(0)
        }
      } else {
        setShowMenu(false)
        setSelectedIndex(0)
      }
    }

    editor.addEventListener('input', handleInput)
    return () => editor.removeEventListener('input', handleInput)
  }, [])

  const executeCommand = (command: Command) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const textNode = range.startContainer

    if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
      const text = textNode.textContent
      const offset = range.startOffset

      // Find the start of the current line and the command
      const beforeCursor = text.substring(0, offset)
      const lineStart = beforeCursor.lastIndexOf('\n') + 1
      const afterLineStart = text.substring(lineStart)

      // Replace the command with its replacement
      const commandIndex = afterLineStart.indexOf(command.trigger)
      if (commandIndex !== -1) {
        const newText =
          text.substring(0, lineStart + commandIndex) +
          command.replacement +
          text.substring(lineStart + commandIndex + command.trigger.length)

        textNode.textContent = newText

        // Set cursor position after replacement
        const newOffset = lineStart + commandIndex + command.replacement.length
        range.setStart(textNode, newOffset)
        range.setEnd(textNode, newOffset)
      }
    }

    setShowMenu(false)
    setSelectedIndex(0)
    editor.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current
    if (!editor) return

    // Handle menu navigation
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % COMMANDS.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + COMMANDS.length) % COMMANDS.length)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        executeCommand(COMMANDS[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowMenu(false)
        setSelectedIndex(0)
        return
      }
    }

    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
      return
    }

    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      document.execCommand('italic', false)
      return
    }

    // Handle Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault()
      document.execCommand('underline', false)
      return
    }

    // Handle Enter key for checkboxes
    if (e.key === 'Enter') {
      const selection = window.getSelection()
      if (!selection || !selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const container = range.startContainer
      const textContent = container.textContent || ''

      // Check if current line has a checkbox
      const beforeCursor = textContent.substring(0, range.startOffset)
      const lineStart = beforeCursor.lastIndexOf('\n') + 1
      const currentLine = textContent.substring(lineStart, range.startOffset)

      if (currentLine.trim().startsWith('☐') || currentLine.trim().startsWith('☑')) {
        e.preventDefault()
        document.execCommand('insertText', false, '\n☐ ')
        return
      }
    }

    // Handle Ctrl/Cmd + Enter to toggle checkbox
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const selection = window.getSelection()
      if (!selection || !selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const textNode = range.startContainer

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const text = textNode.textContent
        const offset = range.startOffset

        // Find the current line
        const beforeCursor = text.substring(0, offset)
        const afterCursor = text.substring(offset)
        const lineStart = beforeCursor.lastIndexOf('\n') + 1
        const lineEnd = afterCursor.indexOf('\n')
        const actualLineEnd = lineEnd === -1 ? text.length : offset + lineEnd

        const currentLine = text.substring(lineStart, actualLineEnd)

        let newLine = currentLine
        if (currentLine.includes('☐')) {
          newLine = currentLine.replace('☐', '☑')
        } else if (currentLine.includes('☑')) {
          newLine = currentLine.replace('☑', '☐')
        }

        if (newLine !== currentLine) {
          const newText = text.substring(0, lineStart) + newLine + text.substring(actualLineEnd)
          textNode.textContent = newText

          // Restore cursor position
          range.setStart(textNode, offset)
          range.setEnd(textNode, offset)
        }
      }
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>
      <div
        ref={editorRef}
        contentEditable
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        style={{
          width: '100%',
          height: '100%',
          fontSize: '2rem',
          lineHeight: '1.6',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          color: '#2c2416',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowY: 'auto'
        }}
        data-placeholder="Start typing..."
      />

      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: '#fff',
            border: '2px solid #2c2416',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(44, 36, 22, 0.15)',
            zIndex: 1000,
            minWidth: '280px',
          }}
        >
          {COMMANDS.map((command, index) => (
            <div
              key={command.trigger}
              onClick={() => executeCommand(command)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: index === selectedIndex ? '#f5f1e8' : 'transparent',
                borderRadius: '4px',
                marginBottom: index < COMMANDS.length - 1 ? '4px' : '0',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#2c2416',
                marginBottom: '2px',
              }}>
                {command.label}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#6b5d4f',
              }}>
                {command.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

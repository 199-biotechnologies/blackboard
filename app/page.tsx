'use client'

import { useState, useRef, KeyboardEvent, MouseEvent } from 'react'

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

  const getCurrentLineInfo = () => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return null

    const range = selection.getRangeAt(0)
    const editor = editorRef.current
    if (!editor) return null

    // Get all text content
    const fullText = editor.textContent || ''

    // Find cursor position in full text
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editor)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    const caretOffset = preCaretRange.toString().length

    // Find current line
    const textBeforeCursor = fullText.substring(0, caretOffset)
    const lastNewline = textBeforeCursor.lastIndexOf('\n')
    const lineStart = lastNewline + 1
    const textAfterCursor = fullText.substring(caretOffset)
    const nextNewline = textAfterCursor.indexOf('\n')
    const lineEnd = nextNewline === -1 ? fullText.length : caretOffset + nextNewline

    const currentLine = fullText.substring(lineStart, caretOffset)

    return {
      fullText,
      caretOffset,
      lineStart,
      lineEnd,
      currentLine,
      range
    }
  }

  const replaceCurrentCommand = (command: Command) => {
    const editor = editorRef.current
    if (!editor) return

    const lineInfo = getCurrentLineInfo()
    if (!lineInfo) return

    const { currentLine, lineStart, caretOffset } = lineInfo

    const commandIndex = currentLine.lastIndexOf(command.trigger)
    if (commandIndex === -1) return

    const selection = window.getSelection()
    if (!selection) return

    // Create range to select the command text
    const range = document.createRange()

    // Find the actual position in the DOM
    const commandStartOffset = lineStart + commandIndex
    const commandEndOffset = commandStartOffset + command.trigger.length

    // Walk through the text nodes to find the right position
    let currentOffset = 0
    let startNode: Node | null = null
    let startOffset = 0
    let endNode: Node | null = null
    let endOffset = 0

    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0

      if (startNode === null && currentOffset + nodeLength > commandStartOffset) {
        startNode = node
        startOffset = commandStartOffset - currentOffset
      }

      if (endNode === null && currentOffset + nodeLength >= commandEndOffset) {
        endNode = node
        endOffset = commandEndOffset - currentOffset
        break
      }

      currentOffset += nodeLength
    }

    if (startNode && endNode) {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      selection.removeAllRanges()
      selection.addRange(range)

      // Use execCommand to maintain undo history
      document.execCommand('insertText', false, command.replacement)
    }

    setShowMenu(false)
    setSelectedIndex(0)
    editor.focus()
  }

  const checkForSlashCommand = () => {
    const lineInfo = getCurrentLineInfo()
    if (!lineInfo) {
      setShowMenu(false)
      return
    }

    const { currentLine, range } = lineInfo

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
  }

  const handleInput = () => {
    checkForSlashCommand()
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const text = target.textContent || ''

    // Check if clicked on a checkbox
    if (text === '☐' || text === '☑') {
      e.preventDefault()
      const newText = text === '☐' ? '☑' : '☐'

      // Replace the checkbox
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.selectNodeContents(target)
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand('insertText', false, newText)
      }
    }
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
        replaceCurrentCommand(COMMANDS[selectedIndex])
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
      const lineInfo = getCurrentLineInfo()
      if (!lineInfo) return

      const { currentLine } = lineInfo

      if (currentLine.trim().startsWith('☐') || currentLine.trim().startsWith('☑')) {
        e.preventDefault()
        document.execCommand('insertText', false, '\n☐ ')
        return
      }
    }

    // Handle Ctrl/Cmd + Enter to toggle checkbox
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const lineInfo = getCurrentLineInfo()
      if (!lineInfo) return

      const { fullText, lineStart, lineEnd } = lineInfo
      const currentLine = fullText.substring(lineStart, lineEnd)

      if (currentLine.includes('☐') || currentLine.includes('☑')) {
        const selection = window.getSelection()
        if (!selection) return

        // Find and select the checkbox in the current line
        const checkboxOffset = currentLine.indexOf('☐') !== -1
          ? currentLine.indexOf('☐')
          : currentLine.indexOf('☑')

        if (checkboxOffset !== -1) {
          const absoluteOffset = lineStart + checkboxOffset

          // Walk through text nodes to find the checkbox
          let currentOffset = 0
          const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null
          )

          let node: Node | null
          while ((node = walker.nextNode())) {
            const nodeLength = node.textContent?.length || 0

            if (currentOffset + nodeLength > absoluteOffset) {
              const localOffset = absoluteOffset - currentOffset
              const range = document.createRange()
              range.setStart(node, localOffset)
              range.setEnd(node, localOffset + 1)
              selection.removeAllRanges()
              selection.addRange(range)

              const currentChar = node.textContent?.charAt(localOffset)
              const newChar = currentChar === '☐' ? '☑' : '☐'
              document.execCommand('insertText', false, newChar)
              break
            }

            currentOffset += nodeLength
          }
        }
      }
    }
  }

  const exportToMarkdown = () => {
    const editor = editorRef.current
    if (!editor) return

    const htmlContent = editor.innerHTML

    // Convert HTML to markdown-like format
    let markdown = htmlContent
      // Bold
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      // Italic
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      // Underline
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      // Line breaks
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<br>/g, '\n')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()

    // Create download
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blackboard-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        onInput={handleInput}
        onClick={handleClick}
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
              onClick={() => replaceCurrentCommand(command)}
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

      <button
        onClick={exportToMarkdown}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '12px 24px',
          background: '#fff',
          border: '2px solid #2c2416',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#2c2416',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(44, 36, 22, 0.1)',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 36, 22, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(44, 36, 22, 0.1)'
        }}
      >
        Export MD
      </button>
    </div>
  )
}

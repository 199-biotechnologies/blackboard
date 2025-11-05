'use client'

import { useState, useRef, KeyboardEvent } from 'react'

export default function Home() {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const textBefore = content.substring(0, cursorPos)
    const textAfter = content.substring(selectionEnd)
    const selectedText = content.substring(cursorPos, selectionEnd)

    // Handle Space key for commands
    if (e.key === ' ') {
      const lines = textBefore.split('\n')
      const currentLine = lines[lines.length - 1]

      // /todo command
      if (currentLine === '/todo') {
        e.preventDefault()
        const newText = textBefore.substring(0, textBefore.lastIndexOf('/todo')) + '☐ ' + textAfter
        setContent(newText)
        setTimeout(() => {
          const newPos = textBefore.lastIndexOf('/todo') + 2
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }

      // /h1 command
      if (currentLine === '/h1') {
        e.preventDefault()
        const newText = textBefore.substring(0, textBefore.lastIndexOf('/h1')) + '# ' + textAfter
        setContent(newText)
        setTimeout(() => {
          const newPos = textBefore.lastIndexOf('/h1') + 2
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }

      // /h2 command
      if (currentLine === '/h2') {
        e.preventDefault()
        const newText = textBefore.substring(0, textBefore.lastIndexOf('/h2')) + '## ' + textAfter
        setContent(newText)
        setTimeout(() => {
          const newPos = textBefore.lastIndexOf('/h2') + 3
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }

      // /h3 command
      if (currentLine === '/h3') {
        e.preventDefault()
        const newText = textBefore.substring(0, textBefore.lastIndexOf('/h3')) + '### ' + textAfter
        setContent(newText)
        setTimeout(() => {
          const newPos = textBefore.lastIndexOf('/h3') + 4
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }
    }

    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      if (selectedText) {
        const newText = textBefore + '**' + selectedText + '**' + textAfter
        setContent(newText)
        setTimeout(() => {
          textarea.selectionStart = cursorPos + 2
          textarea.selectionEnd = selectionEnd + 2
        }, 0)
      }
      return
    }

    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      if (selectedText) {
        const newText = textBefore + '*' + selectedText + '*' + textAfter
        setContent(newText)
        setTimeout(() => {
          textarea.selectionStart = cursorPos + 1
          textarea.selectionEnd = selectionEnd + 1
        }, 0)
      }
      return
    }

    // Handle Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault()
      if (selectedText) {
        const newText = textBefore + '__' + selectedText + '__' + textAfter
        setContent(newText)
        setTimeout(() => {
          textarea.selectionStart = cursorPos + 2
          textarea.selectionEnd = selectionEnd + 2
        }, 0)
      }
      return
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      const lines = textBefore.split('\n')
      const currentLine = lines[lines.length - 1]

      // Check if we're on a line with a checkbox
      if (currentLine.trim().startsWith('☐') || currentLine.trim().startsWith('☑')) {
        e.preventDefault()
        const newText = textBefore + '\n☐ ' + textAfter
        setContent(newText)

        setTimeout(() => {
          const newPos = cursorPos + 3
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }
    }

    // Toggle checkbox on current line with Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const lines = textBefore.split('\n')
      const currentLineIndex = lines.length - 1
      const currentLine = lines[currentLineIndex]

      let newLine = currentLine
      if (currentLine.includes('☐')) {
        newLine = currentLine.replace('☐', '☑')
      } else if (currentLine.includes('☑')) {
        newLine = currentLine.replace('☑', '☐')
      }

      const linesBeforeCurrent = lines.slice(0, currentLineIndex).join('\n')
      const prefix = linesBeforeCurrent ? linesBeforeCurrent + '\n' : ''
      const newText = prefix + newLine + textAfter
      setContent(newText)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos
      }, 0)
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing... (/todo /h1 /h2 /h3 + space | Ctrl+B/I/U)"
        style={{
          width: '100%',
          height: '100%',
          fontSize: '2rem',
          lineHeight: '1.6',
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          color: '#2c2416'
        }}
      />
    </div>
  )
}

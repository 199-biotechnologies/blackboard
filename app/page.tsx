'use client'

import { useState, useRef, KeyboardEvent } from 'react'

export default function Home() {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    if (e.key === 'Enter') {
      const cursorPos = textarea.selectionStart
      const textBefore = content.substring(0, cursorPos)
      const textAfter = content.substring(cursorPos)

      // Check if the line starts with /todo
      const lines = textBefore.split('\n')
      const currentLine = lines[lines.length - 1]

      if (currentLine.trim() === '/todo') {
        e.preventDefault()
        const newText = textBefore.substring(0, textBefore.lastIndexOf('/todo')) + '☐ ' + textAfter
        setContent(newText)

        setTimeout(() => {
          const newPos = textBefore.lastIndexOf('/todo') + 2
          textarea.selectionStart = textarea.selectionEnd = newPos
        }, 0)
        return
      }

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
      const cursorPos = textarea.selectionStart
      const textBefore = content.substring(0, cursorPos)
      const textAfter = content.substring(cursorPos)
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
        placeholder="Start typing... (type /todo for checkboxes)"
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

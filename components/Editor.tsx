'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function Editor() {
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  })

  const exportToMarkdown = async () => {
    const blocks = editor.document
    let markdown = ''

    const convertBlockToMarkdown = (block: any, indent = 0): string => {
      const indentation = '  '.repeat(indent)
      let result = ''

      switch (block.type) {
        case 'heading':
          const level = block.props?.level || 1
          result += '#'.repeat(level) + ' ' + (block.content?.[0]?.text || '') + '\n\n'
          break
        case 'paragraph':
          const text = block.content?.map((c: any) => {
            let t = c.text || ''
            if (c.styles?.bold) t = `**${t}**`
            if (c.styles?.italic) t = `*${t}*`
            if (c.styles?.underline) t = `__${t}__`
            return t
          }).join('') || ''
          result += indentation + text + '\n\n'
          break
        case 'bulletListItem':
          const bulletText = block.content?.map((c: any) => c.text || '').join('') || ''
          result += indentation + '- ' + bulletText + '\n'
          break
        case 'numberedListItem':
          const numberedText = block.content?.map((c: any) => c.text || '').join('') || ''
          result += indentation + '1. ' + numberedText + '\n'
          break
        case 'checkListItem':
          const checkText = block.content?.map((c: any) => c.text || '').join('') || ''
          const checked = block.props?.checked ? 'x' : ' '
          result += indentation + `- [${checked}] ` + checkText + '\n'
          break
        default:
          const defaultText = block.content?.map((c: any) => c.text || '').join('') || ''
          if (defaultText) result += indentation + defaultText + '\n\n'
      }

      // Process children recursively
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          result += convertBlockToMarkdown(child, indent + 1)
        }
      }

      return result
    }

    for (const block of blocks) {
      markdown += convertBlockToMarkdown(block)
    }

    // Create download
    const blob = new Blob([markdown.trim()], { type: 'text/markdown' })
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
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f5f1e8',
        padding: '2rem',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          fontFamily: 'Crimson Text, serif',
        }}
      >
        <BlockNoteView
          editor={editor}
          theme="light"
          data-theme-override={{
            colors: {
              editor: {
                background: '#f5f1e8',
                text: '#2c2416',
              },
              menu: {
                background: '#ffffff',
                text: '#2c2416',
              },
              tooltip: {
                background: '#2c2416',
                text: '#f5f1e8',
              },
              hovered: {
                background: '#e8e4d8',
                text: '#2c2416',
              },
              selected: {
                background: '#d8d4c8',
                text: '#2c2416',
              },
              disabled: {
                background: '#f5f1e8',
                text: '#a89f91',
              },
              shadow: 'rgba(44, 36, 22, 0.15)',
              border: '#2c2416',
              sideMenu: '#2c2416',
            },
            borderRadius: 8,
            fontFamily: 'Crimson Text, serif',
          }}
        />
      </div>

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
          fontFamily: 'Crimson Text, serif',
          zIndex: 1000,
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

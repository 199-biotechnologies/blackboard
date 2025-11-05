'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { SuggestionMenuController } from '@blocknote/react'
import { getDefaultReactSlashMenuItems } from '@blocknote/react'
import { useEffect } from 'react'

const STORAGE_KEY = 'blackboard-content'

export default function Editor() {
  // Remove unwanted blocks from schema
  const {
    audio,
    image,
    video,
    file,
    table,
    ...remainingBlockSpecs
  } = defaultBlockSpecs

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
    },
  })

  // Load initial content from localStorage
  const loadInitialContent = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved content:', e)
        }
      }
    }
    return [{ type: 'paragraph', content: [] }]
  }

  const editor = useCreateBlockNote({
    schema,
    initialContent: loadInitialContent()
  })

  // Auto-save to localStorage on changes
  useEffect(() => {
    if (!editor) return

    const saveContent = () => {
      const content = editor.document
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
    }

    // Save on every change with debounce
    let timeoutId: NodeJS.Timeout
    const handleChange = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(saveContent, 500)
    }

    // Listen to editor changes
    const unsubscribe = editor.onChange(handleChange)

    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [editor])

  const getCustomSlashMenuItems = (editorInstance: any) => {
    const defaultItems = getDefaultReactSlashMenuItems(editorInstance)

    // Filter out unwanted items
    return defaultItems.filter((item) => {
      const title = item.title.toLowerCase()
      return !title.includes('image') &&
             !title.includes('video') &&
             !title.includes('audio') &&
             !title.includes('file') &&
             !title.includes('table') &&
             !title.includes('code') &&
             !title.includes('heading 4') &&
             !title.includes('heading 5') &&
             !title.includes('heading 6')
    })
  }

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
        background: 'transparent',
        padding: '3rem',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <style>{`
        .bn-container .bn-block-content {
          font-size: 2rem !important;
          line-height: 1.6 !important;
        }

        .bn-container h1 {
          font-size: 2.5rem !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }

        .bn-container h2 {
          font-size: 2.2rem !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }

        .bn-container h3 {
          font-size: 2rem !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
        }

        .bn-container * {
          font-family: 'Crimson Text', serif !important;
        }

        /* Fix checkbox vertical alignment */
        .bn-container [data-content-type="checkListItem"] {
          display: flex !important;
          align-items: center !important;
        }

        .bn-container [data-content-type="checkListItem"] input[type="checkbox"] {
          margin-top: 0 !important;
          margin-right: 0.5rem !important;
          flex-shrink: 0 !important;
          transform: translateY(0) !important;
        }

        /* Fix drag handle and + button vertical alignment for all blocks */
        .bn-container [data-node-type="block-outer"] {
          display: flex !important;
          align-items: flex-start !important;
        }

        .bn-side-menu {
          display: flex !important;
          align-items: center !important;
          align-self: flex-start !important;
          margin-top: 0.5rem !important;
        }

        /* Adjust side menu position for headings */
        [data-content-type="heading"] + .bn-side-menu,
        [data-content-type="heading"] ~ .bn-side-menu {
          margin-top: 1rem !important;
        }

        .bn-side-menu button {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .bn-drag-handle-menu {
          display: flex !important;
          align-items: center !important;
        }

        /* Ensure block content and side menu are aligned */
        .bn-block-outer {
          display: flex !important;
          align-items: flex-start !important;
        }
      `}</style>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <BlockNoteView
          editor={editor}
          theme="light"
          slashMenu={false}
        >
          <SuggestionMenuController
            triggerCharacter={"/"}
            getItems={async (query) =>
              filterSuggestionItems(getCustomSlashMenuItems(editor), query)
            }
          />
        </BlockNoteView>
      </div>

      <button
        onClick={exportToMarkdown}
        style={{
          position: 'fixed',
          bottom: '3rem',
          right: '3rem',
          padding: '14px 28px',
          background: '#2c2416',
          border: 'none',
          fontSize: '1rem',
          fontWeight: 400,
          color: '#faf8f3',
          cursor: 'pointer',
          fontFamily: 'Crimson Text, serif',
          zIndex: 1000,
          letterSpacing: '0.5px',
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        Export MD
      </button>
    </div>
  )
}

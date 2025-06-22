'use client'

import { Heading1, Heading2, Heading3, Heading4, Title } from '@/components/global/editor/compontents/Headings'
import { ContentItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import React, { useCallback } from 'react'
import DropZone from './DropZone'
import Paragraph from '@/components/global/editor/compontents/Paragraph'
import TableComponent from '@/components/global/editor/compontents/TableComponent'
import ColumnComponent from '@/components/global/editor/compontents/ColumnComponent'


type MasterRecursiveComponentProps = {
  content: ContentItem
  onContentChange: (
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void
  isPreview?: boolean
  isEditable?: boolean
  slideId: string
  index?: number
}

const ContentRenderer: React.FC<MasterRecursiveComponentProps> = React.memo(
  ({ content, onContentChange, slideId, index, isEditable, isPreview }: MasterRecursiveComponentProps) => {

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onContentChange(content.id, e.target.value)
    }, [content.id, onContentChange])

    const commonProps = {
      placeholder: content.placeholder,
      value: content.content as string,
      onchange: handleChange,
      isPreview: isPreview,
    }

    const animationProps = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 },
    }

    // Work Remaining

    switch (content.type) {
      case 'heading1':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Heading1 {...commonProps} />
          </motion.div>
        )

      case 'heading2':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Heading2 {...commonProps} />
          </motion.div>
        )

      case 'heading3':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Heading3 {...commonProps} />
          </motion.div>
        )

      case 'heading4':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Heading4 {...commonProps} />
          </motion.div>
        )


      case 'title':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Title {...commonProps} />
          </motion.div>
        )

      case 'paragraph':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <Paragraph {...commonProps} />
          </motion.div>
        )


      case 'table':
        return (
          <motion.div {...animationProps} className='w-full h-full'>
            <TableComponent 
            content={content.content as string[][] } 
            onChange={(newContent)=> (
              onContentChange(
                content.id,
                newContent !== null ? newContent : ''
              )
            )}
            initialColSize={content.initialRows}
            initialRowSize={content.initialColumns}
            isPreview={isPreview}
            isEditable={isEditable}
            />
          </motion.div>
        )

      case 'resizable-column':
        if(Array.isArray(content.content)){
          return (
            <motion.div {...animationProps} className='w-full h-full'>
              <ColumnComponent 
              content={content.content as ContentItem[] }
              className={content.className}
              onContentChange={onContentChange}
              slideId={slideId}
              isPreview={isPreview}
              isEditable={isEditable}

              />
            </motion.div>
          )
        }
        return null;
        

      case 'column':
        if (Array.isArray(content.content)) {
          return (
            <motion.div {...animationProps} className={cn('w-full h-full', content.className)}>
              {content.content.length > 0 ? (
                content.content as ContentItem[]).map((subItem: ContentItem, subIndex: number) => (

                  <React.Fragment key={subItem.id}>
                    {!isPreview && !subItem.restrictToDrop && subIndex === 0 && isEditable && <DropZone index={0} parentId={content.id} slideId={slideId} />}

                    <MasterRecursiveComponent
                      index={subIndex}
                      content={subItem}
                      isPreview={isPreview}
                      slideId={slideId}
                      isEditable={isEditable}
                      onContentChange={onContentChange} />

                    {!isPreview && !subItem.restrictToDrop && isEditable &&
                      (<DropZone
                        index={subIndex + 1}
                        parentId={content.id}
                        slideId={slideId}
                      />)}
                  </React.Fragment>

                )) : isEditable ? (
                  <DropZone
                    index={0}
                    parentId={content.id}
                    slideId={slideId}
                  />
                ) : null}
              <Heading1 {...commonProps} />
            </motion.div>
          )

        }

        return null

      default:
        return null

    }

  })

ContentRenderer.displayName = 'ContentRenderer'



export const MasterRecursiveComponent: React.FC<MasterRecursiveComponentProps> = React.memo(
  ({
    content,
    onContentChange,
    slideId,
    index,
    isPreview = false,
    isEditable = true,
  }) => {
    if (isPreview) {
      return (
        <ContentRenderer
          content={content}
          onContentChange={onContentChange}
          isPreview={isPreview}
          isEditable={isEditable}
          slideId={slideId}
          index={index}
        />
      )
    }

    return (
      <React.Fragment>
        <ContentRenderer
          content={content}
          onContentChange={onContentChange}
          isPreview={isPreview}
          isEditable={isEditable}
          slideId={slideId}
          index={index}
        />
      </React.Fragment>
    )
  }
)

MasterRecursiveComponent.displayName = 'MasterRecursiveComponent'
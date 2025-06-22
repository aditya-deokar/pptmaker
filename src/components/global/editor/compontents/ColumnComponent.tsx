import { MasterRecursiveComponent } from '@/app/(protected)/presentation/[presentationId]/_components/editor/MasterRecursiveComponent'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ContentItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import React, { useEffect, useState } from 'react'
import { v4 as  uuidv4 } from 'uuid'

type Props = {
    content: ContentItem[]
    className?: string
    isPreview?: boolean
    slideId: string
    onContentChange: (
        contentId: string,
        newContent: string | string[] | string[][]
    ) => void
    isEditable?: boolean
}
const ColumnComponent = ({ content, onContentChange, slideId, className, isEditable = true, isPreview = false }: Props) => {
    const [columns, setColumns] = useState<ContentItem[]>([])

    const createDefualtColumns =(count:number) => {
        return Array(count).fill(null).map(()=>(
           {
                id: uuidv4(),
                type:'paragraph' as const,
                name: 'Paragraph',
                content:'',
                placeholder: 'Start typing...',
           }
        ))
    }

    useEffect(() => {
      if(content.length ===0 ){
        setColumns(createDefualtColumns(2))
      } else {
        setColumns(content)
      }
    }, [content])
    

    return (
        <div className='relative w-full h-full '>
            <ResizablePanelGroup direction='horizontal'
                className={cn(
                    'h-full w-full flex',
                    !isEditable && '!bottom-0',
                    className
                )}>
                {columns.map((item, index) => (
                    <React.Fragment key={index}>
                        <ResizablePanel maxSize={20}
                            defaultSize={100 / columns.length}
                        >
                            <div className={cn('h-full w-full ', item.className)}>
                                <MasterRecursiveComponent
                                    content={item}
                                    isPreview={isPreview}
                                    slideId={slideId}
                                    isEditable={isEditable}
                                    onContentChange={onContentChange}
                                />
                            </div>
                        </ResizablePanel>

                        {index < columns.length - 1 && isEditable && (
                            <ResizableHandle withHandle={!isPreview}/>
                        )}
                    </React.Fragment>
                ))}
            </ResizablePanelGroup>
        </div>
    )
}

export default ColumnComponent
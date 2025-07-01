import { ScrollArea } from '@/components/ui/scroll-area'
import { component } from '@/lib/constants'
import React from 'react'
import ComponentCard from './components-tab/ComponentPreview'

const TextTypography = () => {
  return (
    <ScrollArea className="h-[400px]">
                            <div className="p-4 flex flex-col space-y-6">
                                {component.map((group, idx) => (
                                    <div className="space-y-2" key={idx}>
                                        <h3 className="text-sm font-medium text-muted-foreground px-1">
                                            {group.name}
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {group.components.map((item) => (
                                                <ComponentCard key={item.componentType} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
  )
}

export default TextTypography
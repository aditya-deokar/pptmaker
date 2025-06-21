'use client'
import { useSlideStore } from '@/store/useSlideStore'
import React, { useState } from 'react'

interface TableComponentProps {
    content:string[][]
    onChange:(newContent:string [][])=> void
    isPreview?:boolean
    isEditable?:boolean
    initialRowSize?: number
    initialColSize?:number
}
const TableComponent = ({content, onChange, initialColSize, initialRowSize, isEditable, isPreview}:TableComponentProps) => {
  
    const { currentTheme }=useSlideStore()
    const [colSizes, setColSizes] = useState<number[]>([])
    const [rowSizes, setRowSizes] = useState<number[]>([])
    const [tableData, setTableData] = useState<string[][]>(()=>{
        if(content.length === 0 || content[0].length ===0 ){
            return Array(initialRowSize).fill(Array(initialColSize).fill(''))
        }

        return content
    });

    if(isPreview){
        return(
            <div className='w-full overflow-auto text-xs'>
        <table className='w-full'>
            <thead>
                <tr>
                    {tableData[0].map((cell, index)=>(
                        <th
                        key={index}
                        className='p-2 border'
                        style={{ width:`${colSizes[index]}%`}}
                        >{cell || 'Type here'}</th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {tableData.slice(1).map((row, rowIndex)=>(
                    <tr 
                    key={rowIndex}
                    style={{ height:`${rowSizes[rowIndex + 1]}%`}}>
                        {row.map((cell, cellIndex)=>(
                            <td key={cellIndex}
                            className='p-2 border'
                            >
                                {cell || 'Type here'}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
        )
    }

    return (
        <div className='w-full h-full relative'
        style={{
            background:currentTheme.gradientBackground || currentTheme.backgroundColor,
            borderRadius:'8px',
        }}
        >
            
        </div>
    )
  
    
}

export default TableComponent
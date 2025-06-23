import React, { KeyboardEvent } from 'react'


type ListItemProps={
    item:string
    index:number
    onChange: (index:number, value:string)=> void
    onKeyDown: (e:KeyboardEvent<HTMLInputElement>, index:number)=> void
    isEditable: boolean
    fontColor:string
}
const ListItem = ({ fontColor, index,  isEditable=true, item, onChange, onKeyDown}:ListItemProps) => {
  return (
    <input type="text" value={item} 
    onChange={(e)=> onChange(index, e.target.value)}
    onKeyDown={(e)=> onKeyDown(e, index)}
    className='bg-transparent outline-none w-full py-1'
    style={{
        color: fontColor
    }}
    readOnly={!isEditable}
    />
  )
}

export default ListItem
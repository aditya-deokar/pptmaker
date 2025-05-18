import React from 'react'

type Props = {
    children:React.ReactNode
}

const layout = (props: Props) => {
  return (
    <div className='h-full w-full overflow-hidden '>{props.children}</div>
  )
}

export default layout
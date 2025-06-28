import Image from 'next/image'
import React from 'react'
import UploadImage from './UploadImage'

type Props= {
    src: string
    alt:string
    className?:string 
    isPreview?:boolean
    contentId:string
    onContentChange:(
        contentId: string,
        newContent: string | string[] | string[][]
    )=>void
    isEditable?: boolean
}

const ImageComponent = ({alt, contentId, onContentChange, src , className, isEditable=true, isPreview= false}:Props) => {
  return (
    <div className={`relative group w-full h-full rounded-lg`}>
        <Image 
        src={'/file.svg'} 
        // src={src} 
        alt={alt} 
        width={isPreview ? 48 : 800}
        height={isPreview ? 48 : 800}
        className={`object-cover w-full h-full rounded-lg ${className}`}
        ></Image>

        {!isPreview && isEditable && (
            <div className='absolute top-0 left-0 hidden group-hover:block'>
                <UploadImage/>
            </div>
        ) 
            
        }
    </div>
  )
}

export default ImageComponent
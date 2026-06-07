'use client';

import { cn } from '@/lib/utils';
import { useSlideStore } from '@/store/useSlideStore';
import React from 'react';

type ListProps = {
    items: string[];
    onChange: (newItems: string[]) => void;
    className?: string;
    isEditable?: boolean;
}

type ListItemProps = {
    item: string;
    index: number;
    onChange: (index: number, value: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
    isEditable: boolean;
    fontColor: string;
}

const ListItem: React.FC<ListItemProps> = ({
    item,
    index,
    onChange,
    onKeyDown,
    isEditable,
    fontColor,
}) => (
    <input
        type="text"
        value={item}
        onChange={(e) => onChange(index, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, index)}
        className="bg-transparent outline-hidden w-full py-1.5 text-[clamp(0.875rem,1.5cqw,1.125rem)] leading-relaxed tracking-wide placeholder:text-gray-300/50 focus:placeholder:text-transparent transition-all"
        style={{ color: fontColor }}
        readOnly={!isEditable}
        placeholder="List item..."
    />
)

/**
 * Premium Numbered List — uses accent-colored circled numbers
 */
const ListComponents: React.FC<ListProps> = ({
    items,
    onChange,
    className,
    isEditable = true,
}) => {
    const { currentTheme } = useSlideStore()

    const handleChange = (index: number, value: string) => {
        if (isEditable) {
            const newItems = [...items]
            newItems[index] = value
            onChange(newItems)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>,
        index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index + 1, 0, '')
            onChange(newItems)
            setTimeout(() => {
                const nextInput = document.querySelector(
                    `li:nth-child(${index + 2}) input`
                ) as HTMLInputElement
                if (nextInput) nextInput.focus()
            }, 0)
        } else if (e.key === 'Backspace' && items[index] === '' &&
            items.length > 1) {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index, 1)
            onChange(newItems)
        }
    }

    return (
        <ol
            className={cn('list-none space-y-3 pl-0', className)}
            style={{ color: currentTheme.fontColor }}
        >
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                    {/* Accent-colored circled number */}
                    <span
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1 transition-all duration-300 group-hover:scale-110"
                        style={{
                            backgroundColor: `${currentTheme.accentColor}18`,
                            color: currentTheme.accentColor,
                            border: `1.5px solid ${currentTheme.accentColor}30`,
                        }}
                    >
                        {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <ListItem
                            item={item}
                            index={index}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            isEditable={isEditable}
                            fontColor={currentTheme.fontColor}
                        />
                    </div>
                </li>
            ))}
        </ol>
    )
}

export default ListComponents


/**
 * Premium Bullet List — uses accent-colored dot bullets with hover effects
 */
export const BulletList: React.FC<ListProps> = ({
    items,
    onChange,
    className,
    isEditable = true,
}) => {
    const { currentTheme } = useSlideStore()

    const handleChange = (index: number, value: string) => {
        if (isEditable) {
            const newItems = [...items];
            newItems[index] = value;
            onChange(newItems);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>,
        index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index + 1, 0, '')
            onChange(newItems)
            setTimeout(() => {
                const nextInput = document.querySelector(
                    `li:nth-child(${index + 2}) input`
                ) as HTMLInputElement
                if (nextInput) nextInput.focus()
            }, 0)
        } else if (e.key === 'Backspace' && items[index] === '' &&
            items.length > 1) {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index, 1)
            onChange(newItems)
        }
    }

    return (
        <ul
            className={cn('list-none space-y-3 pl-0', className)}
            style={{ color: currentTheme.fontColor }}
        >
            {items.map((item, index) => (
                <li
                    key={index}
                    className="flex items-start gap-3 group"
                >
                    {/* Custom accent-colored bullet */}
                    <span
                        className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-2.5 transition-all duration-300 group-hover:scale-125 group-hover:shadow-sm"
                        style={{
                            backgroundColor: currentTheme.accentColor,
                            opacity: 0.7,
                            boxShadow: `0 0 0 3px ${currentTheme.accentColor}10`,
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <ListItem
                            item={item}
                            index={index}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            isEditable={isEditable}
                            fontColor={currentTheme.fontColor}
                        />
                    </div>
                </li>
            ))}
        </ul>
    )
}

/**
 * Premium Todo List — custom toggle checkbox with smooth transitions
 */
export const TodoList: React.FC<ListProps> = ({
    items,
    onChange,
    className,
    isEditable = true,
}) => {
    const { currentTheme } = useSlideStore()

    const toggleCheckbox = (index: number) => {
        if (isEditable) {
            const newItems = [...items];
            newItems[index] = newItems[index].startsWith('[x] ')
                ? newItems[index].replace('[x] ', '[ ] ')
                : newItems[index].replace('[ ] ', '[x] ');
            onChange(newItems);
        }
    }

    const handleChange = (index: number, value: string) => {
        if (isEditable) {
            const newItems = [...items]
            newItems[index] =
                value.startsWith('[ ] ') || value.startsWith('[x] ')
                    ? value
                    : `[ ] ${value}`
            onChange(newItems)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index + 1, 0, '[ ] ')
            onChange(newItems)
            setTimeout(() => {
                const nextInput = document.querySelector(
                    `li:nth-child(${index + 2}) input`
                ) as HTMLInputElement
                if (nextInput) nextInput.focus()
            }, 0)
        } else if (
            e.key === 'Backspace' &&
            items[index] === '[ ] ' &&
            items.length > 1
        ) {
            e.preventDefault()
            const newItems = [...items]
            newItems.splice(index, 1)
            onChange(newItems)
        }
    }

    return (
        <ul
            className={cn('space-y-3', className)}
            style={{ color: currentTheme.fontColor }}
        >
            {items.map((item, index) => {
                const isChecked = item.startsWith('[x] ');

                return (
                    <li
                        key={index}
                        className="flex items-center gap-3 group"
                    >
                        {/* Custom checkbox with accent color */}
                        <button
                            onClick={() => toggleCheckbox(index)}
                            disabled={!isEditable}
                            className={cn(
                                "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 border-2",
                                isEditable && "cursor-pointer hover:scale-110",
                            )}
                            style={{
                                borderColor: isChecked ? currentTheme.accentColor : `${currentTheme.fontColor}30`,
                                backgroundColor: isChecked ? currentTheme.accentColor : 'transparent',
                            }}
                        >
                            {isChecked && (
                                <svg
                                    width="10"
                                    height="8"
                                    viewBox="0 0 10 8"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M1 4L3.5 6.5L9 1"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>

                        <div className={cn(
                            "flex-1 transition-all duration-300",
                            isChecked ? "opacity-45 line-through" : "opacity-100"
                        )}>
                            <ListItem
                                item={item.replace(/^\[[ x]\] /, '')}
                                index={index}
                                onChange={(index, value) =>
                                    handleChange(
                                        index,
                                        `${isChecked ? '[x] ' : '[ ] '}${value}`
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                isEditable={isEditable}
                                fontColor={currentTheme.fontColor}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    )
}

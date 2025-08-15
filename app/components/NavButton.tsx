'use client'

import Link from 'next/link'
import { ComponentProps } from 'react'

type Props =
    | ({ href: string } & Omit<ComponentProps<'a'>, 'href'>)
    | ({ onClick: () => void } & Omit<ComponentProps<'button'>, 'onClick'>)

type CommonProps = {
    label: string
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    className?: string
}

export default function NavButton(props: Props & CommonProps) {
    const baseClass =
        'flex items-center gap-1 px-4 py-2 text-sm text-white font-medium bg-blue-200/10 border border-blue-300/20 rounded-lg shadow-md hover:bg-blue-300/20 hover:text-white transition-all backdrop-blur-md'

    const content = (
        <>
            <span className="inline-flex items-center gap-2 leading-none">
                {props.iconLeft && <span className="text-lg flex items-center">{props.iconLeft}</span>}
                <span className="block">{props.label}</span>
                {props.iconRight && <span className="text-lg flex items-center">{props.iconRight}</span>}
            </span>
        </>
    )

    if ('href' in props) {
        const { label, iconLeft, iconRight, className, href, ...rest } = props
        return (
            <Link href={href} className={`${baseClass} ${className ?? ''}`} {...rest}>
                {content}
            </Link>
        )
    } else {
        const { label, iconLeft, iconRight, className, onClick, ...rest } = props
        return (
            <button onClick={onClick} className={`${baseClass} ${className ?? ''}`} {...rest}>
                {content}
            </button>
        )
    }
}

import { clsx } from "clsx"
import React from "react"

interface MarqueeProps {
    children: React.ReactNode
    direction?: "left" | "right"
    speed?: number // 像素每秒 (近似值，用于计算持续时间)
    className?: string
    pauseOnHover?: boolean
}

export const Marquee: React.FC<MarqueeProps> = ({
    children,
    direction = "left",
    speed = 30, // 像素每秒
    className,
    pauseOnHover = false
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [duration, setDuration] = React.useState(0)

    React.useEffect(() => {
        const calculateDuration = () => {
            if (contentRef.current) {
                const contentWidth = contentRef.current.getBoundingClientRect().width
                if (contentWidth > 0) {
                    // 持续时间 (秒) = 距离 (px) / 速度 (px/s)
                    setDuration(contentWidth / speed)
                }
            }
        }

        // 初次计算
        calculateDuration()

        // 监听内容变化（如果内容是动态加载的）
        if (!contentRef.current) return
        const resizeObserver = new ResizeObserver(calculateDuration)
        resizeObserver.observe(contentRef.current)

        return () => resizeObserver.disconnect()
    }, [speed, children])

    return (
        <div
            ref={containerRef}
            className={clsx(
                "group flex overflow-hidden select-none",
                className
            )}
            style={{
                "--duration": `${duration}s`,
                "--direction": direction === "left" ? "normal" : "reverse"
            } as React.CSSProperties}
        >
            <div
                ref={contentRef}
                className={clsx(
                    "flex shrink-0 justify-around min-w-full",
                    "animate-marquee",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
                style={{ animationDirection: "var(--direction)" }}
            >
                {children}
            </div>
            <div
                aria-hidden="true"
                className={clsx(
                    "flex shrink-0 justify-around min-w-full",
                    "animate-marquee",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
                style={{ animationDirection: "var(--direction)" }}
            >
                {children}
            </div>
        </div>
    )
}

export default Marquee

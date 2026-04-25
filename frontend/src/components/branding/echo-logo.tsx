import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type EchoLogoProps = {
  href?: string
  className?: string
  markClassName?: string
  imageClassName?: string
  compact?: boolean
  showDescriptor?: boolean
  priority?: boolean
}

export function EchoLogo({
  href = "/",
  className,
  markClassName,
  imageClassName,
  compact = false,
  showDescriptor = false,
  priority = true,
}: EchoLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("relative flex shrink-0 items-center justify-center", markClassName)}>
        {compact ? (
          <Image
            src="/brand/echo-mark-final.png"
            alt="Echo"
            width={64}
            height={64}
            className={cn("h-9 w-9 object-contain", imageClassName)}
            priority={priority}
          />
        ) : (
          <Image
            src="/brand/echo-logo-final.png"
            alt="Echo"
            width={512}
            height={144}
            className={cn("h-10 w-auto object-contain", imageClassName)}
            priority={priority}
          />
        )}
      </span>
      {showDescriptor && !compact ? <span className="text-sm text-muted-foreground">AI support agent</span> : null}
    </span>
  )

  return <Link href={href}>{content}</Link>
}

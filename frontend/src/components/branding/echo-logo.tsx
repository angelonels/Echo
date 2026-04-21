import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type EchoLogoProps = {
  href?: string
  className?: string
  markClassName?: string
  compact?: boolean
}

export function EchoLogo({
  href = "/",
  className,
  markClassName,
  compact = false,
}: EchoLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("relative flex shrink-0 items-center justify-center", markClassName)}>
        {compact ? (
          <Image
            src="/brand/echo-mark-v2.png"
            alt="Echo"
            width={34}
            height={34}
            className="h-[34px] w-[34px] object-contain drop-shadow-[0_10px_24px_rgba(17,181,164,0.22)]"
            priority
          />
        ) : (
          <Image
            src="/brand/echo-wordmark-v2.png"
            alt="Echo"
            width={160}
            height={52}
            className="h-[44px] w-auto object-contain drop-shadow-[0_12px_30px_rgba(17,181,164,0.18)]"
            priority
          />
        )}
      </span>
      {!compact ? <span className="text-sm text-muted-foreground">AI support Agent</span> : null}
    </span>
  )

  return <Link href={href}>{content}</Link>
}

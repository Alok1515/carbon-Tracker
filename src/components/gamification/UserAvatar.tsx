import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles } from "lucide-react"

interface UserAvatarProps {
  name: string
  email?: string
  avatarUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  frameClass?: string
  titleText?: string
  titleColor?: string
  titleBold?: boolean
  titleItalic?: boolean
  showTitle?: boolean
  className?: string
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = "md",
  frameClass,
  titleText,
  titleColor,
  titleBold,
  titleItalic,
  showTitle = true,
  className = ""
}: UserAvatarProps) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  }

  const textSizeMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={frameClass || ""}>
        <Avatar className={sizeMap[size]}>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className={textSizeMap[size]}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold truncate ${textSizeMap[size]}`}>{name}</p>
          {showTitle && titleText && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${titleBold ? 'font-bold' : ''} ${titleItalic ? 'italic' : ''}`}
              style={{ 
                backgroundColor: `${titleColor}20`,
                color: titleColor 
              }}
            >
              <Sparkles className="h-3 w-3" />
              {titleText}
            </span>
          )}
        </div>
        {email && (
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        )}
      </div>
    </div>
  )
}

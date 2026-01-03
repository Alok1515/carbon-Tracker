"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useQuestProgress } from "@/hooks/useQuestProgress"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-foreground underline decoration-primary/30">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function MessageFormatter({ content }: { content: string }) {
  // Simple markdown-like parser for bold and lists
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const text = line.trim().substring(2);
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{parseBold(text)}</span>
            </div>
          );
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+\.)\s(.*)/);
          if (match) {
            return (
              <div key={i} className="flex gap-2 items-start pl-1">
                <span className="text-primary font-bold text-xs mt-0.5 w-4 flex-shrink-0">{match[1]}</span>
                <span className="text-sm">{parseBold(match[2])}</span>
              </div>
            );
          }
        }

        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-1" />;
        }

        // Normal paragraph
        return (
          <p key={i} className="text-sm leading-relaxed">
            {parseBold(line)}
          </p>
        );
      })}
    </div>
  );
}

export function CarbonChatbot() {
  const { data: session } = useSession()
  const { trackProgress } = useQuestProgress(session?.user?.id)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your Carbon Assistant powered by AI. I can help you reduce your carbon footprint, analyze emission data, and provide personalized tips. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
      // Focus input after image selection so user can type immediately
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !selectedImage) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: selectedImage 
        ? `[Image uploaded: ${selectedImage.name}] ${input || "Can you analyze this image for carbon emissions?"}`
        : input,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Call AI API with userId
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          userId: session?.user?.id, // Pass userId for personalized analysis
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle API errors with specific messages
        throw new Error(data.error || data.details || "Failed to get AI response")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      // Track quest progress for chatting with assistant
      await trackProgress('chat_with_assistant', 1)
      
    } catch (error) {
      console.error("Error:", error)
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      
      // Show toast for quota errors
      if (errorMsg.includes("quota") || errorMsg.includes("429")) {
        toast.error("API quota exceeded. Please wait a moment before trying again.")
      }
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      // Clear image and file input in finally block to ensure it always happens
      setSelectedImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setIsLoading(false)
      // Refocus input after loading
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const quickActions = [
    "How can I reduce my carbon footprint?",
    "Analyze my emissions",
    "Sustainable travel tips",
    "Home energy savings"
  ]

  const handleQuickAction = (action: string) => {
    setInput(action)
    // Focus input after setting quick action
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // Focus input after removing image
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Carbon Assistant
            </CardTitle>
            <CardDescription>AI-powered personalized tips</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
        <ScrollArea className="flex-1 p-4 h-full">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                  <div
                    className={`rounded-2xl p-4 max-w-[85%] shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/50 backdrop-blur-sm border border-border/50 rounded-tl-none assistant-bubble"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MessageFormatter content={message.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                      <p className={`text-[10px] opacity-50 mt-2 flex items-center gap-1 ${
                        message.role === "user" ? "justify-end text-primary-foreground/80" : "justify-start"
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                  </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="text-xs"
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex-shrink-0 bg-background relative z-10">
          {selectedImage && (
            <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {selectedImage.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                disabled={isLoading}
              >
                ✕
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isLoading}
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about carbon reduction..."
              disabled={isLoading}
              className="flex-1"
              autoComplete="off"
              tabIndex={0}
            />
            
            <Button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
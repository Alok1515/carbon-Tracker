"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Trophy, Heart, MessageCircle, Target, TrendingDown, UserPlus, Search, Send, ThumbsUp, Flag, Swords, CalendarDays, Trash2, MoreVertical, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useRef } from "react"

export default function SocialPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [activeTab, setActiveTab] = useState("feed")

  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [pledges, setPledges] = useState<any[]>([])
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false)
  const [pledgeDialogOpen, setPledgeDialogOpen] = useState(false)
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null)

  const [selectedChatFriend, setSelectedChatFriend] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const [newPost, setNewPost] = useState({ type: "tip", content: "" })
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    description: "",
    type: "1v1",
    goal: 10,
    metric: "reduction_percentage",
    startDate: "",
    endDate: ""
  })
  const [newPledge, setNewPledge] = useState({
    title: "",
    description: "",
    targetReduction: 50,
    deadline: ""
  })

  const [bearerToken, setBearerToken] = useState<string | null>(null)

  const loadData = async (tokenOverride?: string) => {
    const token = tokenOverride ?? bearerToken ?? localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const [friendsRes, pendingRes, challengesRes, feedRes, pledgesRes] = await Promise.all([
        fetch("/api/friends?status=accepted", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/friends?status=pending", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/challenges", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/social-feed", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/pledges", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (friendsRes.ok) setFriends(await friendsRes.json())
      if (pendingRes.ok) {
        const pending = await pendingRes.json()
        setPendingRequests(pending.filter((r: any) => r.isIncoming))
      }
      if (challengesRes.ok) setChallenges(await challengesRes.json())
      if (feedRes.ok) setFeed(await feedRes.json())
      if (pledgesRes.ok) setPledges(await pledgesRes.json())
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  useEffect(() => {
    const ensureToken = async () => {
      if (!session?.user) return

      const existing = localStorage.getItem("bearer_token")
      if (existing) {
        setBearerToken(existing)
        return
      }

      try {
        const tokenRes = await fetch("/api/auth/get-token", { credentials: "include" })
        if (!tokenRes.ok) return

        const { token } = await tokenRes.json()
        if (token) {
          localStorage.setItem("bearer_token", token)
          setBearerToken(token)
        }
      } catch (err) {
        console.error("Failed to fetch token:", err)
      }
    }

    ensureToken()
  }, [session?.user])

  useEffect(() => {
    if (session?.user && bearerToken) {
      loadData(bearerToken)
      
      const interval = setInterval(() => {
        // Only poll friends for unread counts when not chatting
        // (Chatting has its own polling for messages)
        const token = localStorage.getItem("bearer_token")
        if (token) {
          fetch("/api/friends?status=accepted", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setFriends(data))
            .catch(err => console.error("Error polling friends:", err))
        }
      }, 10000) // Poll every 10 seconds

      return () => clearInterval(interval)
    }
  }, [session?.user, bearerToken])

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setSearchResults(await res.json())
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      })

      if (res.ok) {
        toast.success("Friend request sent!")
        setSearchQuery("")
        setSearchResults([])
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send request")
      }
    } catch (error) {
      toast.error("Error sending friend request")
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequest = async (friendshipId: string, action: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendshipId, action })
      })

      if (res.ok) {
        toast.success(`Friend request ${action}ed`)
        loadData()
      }
    } catch (error) {
      toast.error("Error handling friend request")
    }
  }

  const createPost = async () => {
    if (!newPost.content.trim()) {
      toast.error("Content is required")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please sign out and sign back in")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/social-feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      })

      if (res.ok) {
        toast.success("Post created!")
        setNewPost({ type: "tip", content: "" })
        loadData()
      }
    } catch (error) {
      toast.error("Error creating post")
    } finally {
      setLoading(false)
    }
  }

  const likePost = async (postId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const res = await fetch("/api/social-feed", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ postId, action: "like" })
      })

      if (res.ok) {
        loadData()
      }
    } catch (error) {
      toast.error("Error liking post")
    }
  }

  const deletePost = async (postId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(`/api/social-feed?postId=${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast.success("Post deleted")
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete post")
      }
    } catch (error) {
      toast.error("Error deleting post")
    } finally {
      setLoading(false)
    }
  }

  const deleteChallenge = async (challengeId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(`/api/challenges?challengeId=${challengeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast.success("Challenge deleted")
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete challenge")
      }
    } catch (error) {
      toast.error("Error deleting challenge")
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setJoiningChallengeId(challengeId)
    try {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId }),
      })

      if (res.ok) {
        toast.success("Joined challenge!")
        loadData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to join challenge")
      }
    } catch (error) {
      toast.error("Error joining challenge")
    } finally {
      setJoiningChallengeId(null)
    }
  }

  const createChallenge = async () => {
    if (!newChallenge.name || !newChallenge.description || !newChallenge.startDate || !newChallenge.endDate) {
      toast.error("All fields are required")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newChallenge)
      })

      if (res.ok) {
        toast.success("Challenge created!")
        setNewChallenge({
          name: "",
          description: "",
          type: "1v1",
          goal: 10,
          metric: "reduction_percentage",
          startDate: "",
          endDate: ""
        })
        setChallengeDialogOpen(false)
        loadData()
      }
    } catch (error) {
      toast.error("Error creating challenge")
    } finally {
      setLoading(false)
    }
  }

  const createPledge = async () => {
    if (!newPledge.title || !newPledge.description || !newPledge.deadline) {
      toast.error("All fields are required")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPledge)
      })

      if (res.ok) {
        toast.success("Pledge created!")
        setNewPledge({
          title: "",
          description: "",
          targetReduction: 50,
          deadline: ""
        })
        setPledgeDialogOpen(false)
        loadData()
      }
    } catch (error) {
      toast.error("Error creating pledge")
    } finally {
      setLoading(false)
    }
  }

  const supportPledge = async (pledgeId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const res = await fetch("/api/pledges", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pledgeId, action: "support" })
      })

      if (res.ok) {
        loadData()
      }
    } catch (error) {
      toast.error("Error supporting pledge")
    }
  }

  const deletePledge = async (pledgeId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(`/api/pledges?pledgeId=${pledgeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast.success("Pledge deleted")
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete pledge")
      }
    } catch (error) {
      toast.error("Error deleting pledge")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (friendId: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const res = await fetch(`/api/chat?friendId=${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setChatMessages(await res.json())
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !selectedChatFriend) return

    const token = localStorage.getItem("bearer_token")
    if (!token) return

    setChatLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedChatFriend.userId,
          content: newChatMessage
        })
      })

      if (res.ok) {
        setNewChatMessage("")
        fetchMessages(selectedChatFriend.userId)
      }
    } catch (error) {
      toast.error("Error sending message")
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    let interval: any
    if (selectedChatFriend) {
      fetchMessages(selectedChatFriend.userId)
      interval = setInterval(() => fetchMessages(selectedChatFriend.userId), 5000)
    }
    return () => clearInterval(interval)
  }, [selectedChatFriend])

  if (isPending) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session?.user) {
    router.push("/")
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Social Hub</h1>
            <p className="text-muted-foreground">Connect, compete, and reduce emissions together</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users className="h-5 w-5 mr-2" />
          {friends.length} Friends
        </Badge>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-300">Pending Friend Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.image} />
                    <AvatarFallback>{request.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleFriendRequest(request.id, "accept")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFriendRequest(request.id, "reject")}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">
            <MessageCircle className="h-4 w-4 mr-2" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="pledges">
            <Target className="h-4 w-4 mr-2" />
            Pledges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={newPost.type} onValueChange={(val) => setNewPost({ ...newPost, type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Share your thoughts..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={3}
              />
              <Button onClick={createPost} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </CardContent>
          </Card>

            <div className="space-y-4">
              {feed.map((post) => {
                const authorId = post.author?.id ?? null
                const sessionId = session?.user?.id ?? null
                const isAuthor = Boolean(authorId && sessionId && String(authorId) === String(sessionId))

                const authorName = post.author?.name ?? "Unknown User"
                const authorImage = post.author?.image ?? ""
                const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""
                const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0

                return (
                  <Card key={post.id ?? post.postId ?? authorId ?? createdAt}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={authorImage} />
                            <AvatarFallback>{authorName[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{authorName}</p>
                            <p className="text-sm text-muted-foreground">{createdAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{post.type ?? "post"}</Badge>
                          {isAuthor && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePost(post.postId)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>{post.content}</p>
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePost(post.postId)}
                          className={post.isLiked ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                          {post.likes ?? 0}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {commentsCount}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.image} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => sendFriendRequest(user.id)} disabled={loading}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Friends ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.image} />
                          <AvatarFallback>{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        {friend.unreadCount > 0 && (
                          <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-500"
                          >
                            {friend.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setSelectedChatFriend(friend)
                        // Locally clear unread count for immediate feedback
                        setFriends(prev => prev.map(f => f.id === friend.id ? { ...f, unreadCount: 0 } : f))
                      }}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-500 cursor-pointer"
                            onClick={() => handleFriendRequest(friend.id, "remove")}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Friend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {friends.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No friends yet. Search above to add friends!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Swords className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Challenge</DialogTitle>
                <DialogDescription>Challenge friends to reduce emissions together</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newChallenge.name}
                    onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                    placeholder="E.g. May Carbon Reduction Challenge"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    placeholder="Challenge details..."
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newChallenge.type} onValueChange={(val) => setNewChallenge({ ...newChallenge, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1v1">1v1</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newChallenge.startDate}
                      onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newChallenge.endDate}
                      onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Goal (%)</Label>
                  <Input
                    type="number"
                    value={newChallenge.goal}
                    onChange={(e) => setNewChallenge({ ...newChallenge, goal: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createChallenge} disabled={loading}>
                  Create Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
                {challenges.map((challenge) => {
                  const createdById = challenge.createdBy?.id ?? null
                  const sessionId = session?.user?.id ?? null
                  const canDelete = Boolean(createdById && sessionId && String(createdById) === String(sessionId))
                  const isCreator = canDelete
                  const isParticipant = Boolean(challenge.isParticipant)
                  const startDate = challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : ""

                const endDate = challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : ""
                const participants = challenge.participants ?? 0
                const status = challenge.status ?? "active"
                const goal = challenge.goal ?? 0
                const joinId = String(challenge.challengeId ?? "")
                const canJoin = Boolean(joinId) && !isCreator && !isParticipant && status === "active"

                return (
                  <Card key={challenge.id ?? challenge.challengeId ?? challenge.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle>{challenge.name ?? "Challenge"}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteChallenge(challenge.challengeId)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {startDate} - {endDate}
                        </div>
                        <Badge variant="outline">{challenge.type ?? "1v1"}</Badge>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {participants} participants
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Goal: {goal}% reduction</p>
                        <div className="flex items-center gap-2">
                          {isParticipant && <Badge variant="secondary">Joined</Badge>}
                          {canJoin && (
                            <Button
                              size="sm"
                              onClick={() => joinChallenge(joinId)}
                              disabled={loading || joiningChallengeId === joinId}
                            >
                              Join Challenge
                            </Button>
                          )}
                          {challenge.winner && (
                            <Badge variant="default" className="bg-yellow-500">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}


            {challenges.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No challenges yet. Create one to start competing!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pledges" className="space-y-4">
          <Dialog open={pledgeDialogOpen} onOpenChange={setPledgeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Flag className="h-4 w-4 mr-2" />
                Make a Pledge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Pledge</DialogTitle>
                <DialogDescription>Make a public commitment to reduce emissions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newPledge.title}
                    onChange={(e) => setNewPledge({ ...newPledge, title: e.target.value })}
                    placeholder="E.g. Go Car-Free for June"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newPledge.description}
                    onChange={(e) => setNewPledge({ ...newPledge, description: e.target.value })}
                    placeholder="Pledge details..."
                  />
                </div>
                <div>
                  <Label>Target Reduction (kg CO2)</Label>
                  <Input
                    type="number"
                    value={newPledge.targetReduction}
                    onChange={(e) => setNewPledge({ ...newPledge, targetReduction: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={newPledge.deadline}
                    onChange={(e) => setNewPledge({ ...newPledge, deadline: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createPledge} disabled={loading}>
                  Create Pledge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
              {pledges.map((pledge) => {
                const authorId = pledge.author?.id ?? null
                const sessionId = session?.user?.id ?? null
                const canDelete = Boolean(authorId && sessionId && String(authorId) === String(sessionId))
                const authorName = pledge.author?.name ?? "Unknown User"
                const authorImage = pledge.author?.image ?? ""
                const title = pledge.title ?? "Pledge"
                const status = pledge.status ?? "active"
                const progress = pledge.progress ?? 0
                const target = pledge.targetReduction ?? 0
                const supporters = pledge.supporters ?? 0
                const isSupporting = Boolean(pledge.isSupporting)

                return (
                  <Card key={pledge.id ?? pledge.pledgeId ?? title}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={authorImage} />
                            <AvatarFallback>{authorName[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{authorName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={status === "active" ? "default" : status === "completed" ? "default" : "destructive"}>
                            {status}
                          </Badge>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePledge(pledge.pledgeId)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>{pledge.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-muted-foreground">
                            <TrendingDown className="h-4 w-4 inline mr-1" />
                            Target: {target} kg CO2
                          </div>
                          {pledge.deadline && (
                            <div className="text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4 inline mr-1" />
                              Deadline: {new Date(pledge.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isSupporting ? "default" : "outline"}
                          onClick={() => supportPledge(pledge.pledgeId)}
                        >
                          <ThumbsUp className={`h-4 w-4 mr-1 ${isSupporting ? "fill-current" : ""}`} />
                          {supporters} Support
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}


            {pledges.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pledges yet. Make your first public commitment!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedChatFriend} onOpenChange={(open) => !open && setSelectedChatFriend(null)}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b flex-row items-center gap-3 space-y-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedChatFriend?.image} />
              <AvatarFallback>{selectedChatFriend?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{selectedChatFriend?.name}</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain scroll-smooth">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                  No messages yet. Say hi!
                </div>
              )}
              {chatMessages.map((msg: any) => {
                const isMe = msg.senderId === session?.user?.id
                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all hover:shadow-md ${
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                    }`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="p-4 border-t bg-background">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                sendChatMessage()
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="icon" disabled={chatLoading || !newChatMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    )
  }

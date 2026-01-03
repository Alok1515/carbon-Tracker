"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Sparkles, Info, Eye, Trophy, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InventoryItem {
  _id: string
  userId: string
  itemId: string
  purchasedAt: string
  equipped: boolean
  item: {
    itemId: string
    name: string
      type: 'avatar_frame' | 'title'
      cssClass?: string
    metadata?: any
    rarity: string
  }
}

interface UserProfile {
  userId: string
  equippedFrame?: string
  equippedTitle?: string
  displayName?: string
  bio?: string
  totalPointsEarned: number
  totalPointsSpent: number
}

interface ProfileCustomizationProps {
  userId: string
  userName: string
  userEmail: string
  onEquipChange?: () => void
}

export function ProfileCustomization({ userId, userName, userEmail, onEquipChange }: ProfileCustomizationProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchInventory()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user-profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setDisplayName(data.displayName || userName)
        setBio(data.bio || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/user-inventory?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handleEquipItem = async (itemId: string, currentlyEquipped: boolean) => {
    try {
      const response = await fetch('/api/user-inventory/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        },
        body: JSON.stringify({ userId, itemId, equip: !currentlyEquipped })
      })

      if (response.ok) {
        toast.success(currentlyEquipped ? 'Item unequipped! Check your header.' : 'Item equipped! Check your header.')
        fetchProfile()
        fetchInventory()
        
        // Trigger header refresh
        if (onEquipChange) {
          onEquipChange()
        }
      } else {
        toast.error('Failed to equip item')
      }
    } catch (error) {
      console.error('Error equipping item:', error)
      toast.error('Failed to equip item')
    }
  }

  const getEquippedFrame = () => {
    return inventory.find(item => item.itemId === profile?.equippedFrame)
  }

  const getEquippedTitle = () => {
    return inventory.find(item => item.itemId === profile?.equippedTitle)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const frames = inventory.filter(item => item.item?.type === 'avatar_frame')
  const titles = inventory.filter(item => item.item?.type === 'title')

  const equippedFrame = getEquippedFrame()
  const equippedTitle = getEquippedTitle()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Customization</h2>
        <p className="text-muted-foreground">Customize your profile with items from your inventory</p>
      </div>

      {/* Help Guide */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Where do my customizations appear?</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="h-4 w-4 text-primary" />
            <span><strong>Avatar Frames & Titles:</strong> Visible in the header dropdown (click your profile icon), leaderboard, and profile preview below</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            <span><strong>Leaderboard:</strong> Go to the Leaderboard tab to see your equipped frame and title displayed to all users</span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Profile Preview */}
      <Card className="border-2 border-primary/20 transition-all duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span>Live Preview</span>
          </CardTitle>
          <CardDescription>
            This is how your profile looks to others on the leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className={equippedFrame?.item?.cssClass || 'p-1'}>
              <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                <AvatarFallback className="text-2xl">
                  {(displayName || userName).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  {displayName || userName}
                </h3>
                {equippedTitle && (
                  <div 
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${equippedTitle.item?.metadata?.bold ? 'font-bold' : ''} ${equippedTitle.item?.metadata?.italic ? 'italic' : ''}`}
                    style={{ 
                      backgroundColor: `${equippedTitle.item?.metadata?.color}20`,
                      color: equippedTitle.item?.metadata?.color 
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    {equippedTitle.item?.name}
                  </div>
                )}
                <p className="text-muted-foreground">
                  {userEmail}
                </p>
                {bio && <p className="text-sm">{bio}</p>}
              </div>
            </div>
          </div>
          
          {(!equippedFrame && !equippedTitle) && (
            <div className="text-center py-4 border-t">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Equip an avatar frame or title below to see them here!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory - Avatar Frames */}
      {frames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avatar Frames ({frames.length})</CardTitle>
            <CardDescription>Choose a frame for your avatar - appears as a border around your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {frames.map((item) => (
                <div key={item._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-center">
                    <div className={item.item?.cssClass || 'p-1'}>
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{item.item?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.item?.rarity}</p>
                  </div>
                  <Button
                    onClick={() => handleEquipItem(item.itemId, item.equipped)}
                    variant={item.equipped ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                  >
                    {item.equipped ? '✓ Equipped' : 'Equip'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory - Titles */}
      {titles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Titles ({titles.length})</CardTitle>
            <CardDescription>Choose a title to display next to your name on the leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {titles.map((item) => (
                <div key={item._id} className="border rounded-lg p-4 space-y-3">
                  <div className="text-center py-4">
                    <div 
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${item.item?.metadata?.bold ? 'font-bold' : ''} ${item.item?.metadata?.italic ? 'italic' : ''}`}
                      style={{ 
                        backgroundColor: `${item.item?.metadata?.color}20`,
                        color: item.item?.metadata?.color 
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      {item.item?.name}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground capitalize">{item.item?.rarity}</p>
                  </div>
                  <Button
                    onClick={() => handleEquipItem(item.itemId, item.equipped)}
                    variant={item.equipped ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                  >
                    {item.equipped ? '✓ Equipped' : 'Equip'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {frames.length === 0 && titles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Visit the Rewards Shop to purchase customization items!
            </p>
            <Button variant="outline" onClick={() => {
              const shopTab = document.querySelector('[data-value="shop"]') as HTMLButtonElement
              shopTab?.click()
            }}>
              Go to Shop
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
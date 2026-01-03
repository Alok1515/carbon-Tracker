"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Crown, Zap, Check, Lock } from "lucide-react"
import { toast } from "sonner"

interface ShopItem {
  _id: string
  itemId: string
  name: string
  description: string
  type: 'avatar_frame' | 'title'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  imageUrl?: string
  cssClass?: string
  metadata?: any
  isActive: boolean
}

interface RewardsShopProps {
  userId: string
  availablePoints: number
  onPurchase: () => void
}

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500'
}

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
}

export function RewardsShop({ userId, availablePoints, onPurchase }: RewardsShopProps) {
  const [items, setItems] = useState<ShopItem[]>([])
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
    fetchInventory()
  }, [userId])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/shop/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching shop items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/user-inventory?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const owned = new Set(data.map((item: any) => item.itemId))
        setOwnedItems(owned)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handlePurchase = async (itemId: string, price: number) => {
    if (availablePoints < price) {
      toast.error('Insufficient quest points!')
      return
    }

    setPurchasing(itemId)
    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`
        },
        body: JSON.stringify({ userId, itemId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Item purchased successfully! 🎉')
        setOwnedItems(prev => new Set([...prev, itemId]))
        onPurchase()
      } else {
        toast.error(data.error || 'Failed to purchase item')
      }
    } catch (error) {
      console.error('Error purchasing item:', error)
      toast.error('Failed to purchase item')
    } finally {
      setPurchasing(null)
    }
  }

  const filterItemsByType = (type: string) => {
    return items.filter(item => item.type === type)
  }

  const renderItem = (item: ShopItem) => {
    const owned = ownedItems.has(item.itemId)
    const canAfford = availablePoints >= item.price

    return (
      <Card key={item.itemId} className="relative overflow-hidden">
        {item.rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />
        )}
        
        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {item.name}
                {item.rarity === 'legendary' && <Crown className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {item.description}
              </CardDescription>
            </div>
            <Badge className={`${rarityColors[item.rarity]} text-white`}>
              {rarityLabels[item.rarity]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
            {item.type === 'avatar_frame' && (
              <div className={`w-20 h-20 flex items-center justify-center ${item.cssClass}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full" />
              </div>
            )}
            {item.type === 'title' && (
              <div className="text-center">
                <span 
                  className={`text-lg font-bold ${item.metadata?.bold ? 'font-extrabold' : ''} ${item.metadata?.italic ? 'italic' : ''}`}
                  style={{ color: item.metadata?.color }}
                >
                  {item.name}
                </span>
              </div>
            )}
          </div>

          {/* Price and Purchase */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-bold">{item.price}</span>
              <span className="text-sm text-muted-foreground">points</span>
            </div>

            {owned ? (
              <Button disabled className="gap-2">
                <Check className="h-4 w-4" />
                Owned
              </Button>
            ) : (
              <Button
                onClick={() => handlePurchase(item.itemId, item.price)}
                disabled={!canAfford || purchasing === item.itemId}
                className="gap-2"
              >
                {purchasing === item.itemId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Purchasing...
                  </>
                ) : !canAfford ? (
                  <>
                    <Lock className="h-4 w-4" />
                    {item.price - availablePoints} more needed
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Purchase
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading shop...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rewards Shop</h2>
          <p className="text-muted-foreground">Spend your quest points on exclusive customizations</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-yellow-500" />
            {availablePoints}
          </div>
          <p className="text-sm text-muted-foreground">Available Points</p>
        </div>
      </div>

        <Tabs defaultValue="frames" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="frames">Avatar Frames</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
          </TabsList>

          <TabsContent value="frames" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterItemsByType('avatar_frame').map(renderItem)}
            </div>
          </TabsContent>

          <TabsContent value="titles" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterItemsByType('title').map(renderItem)}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}

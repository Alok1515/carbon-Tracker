import { useState, useEffect } from 'react'

interface EquippedItem {
  itemId: string
  name: string
  type: 'avatar_frame' | 'title'
  cssClass?: string
  metadata?: any
  rarity: string
}

interface UserProfileData {
  userId: string
  equippedFrame?: string
  equippedTitle?: string
  displayName?: string
  bio?: string
  totalPointsEarned: number
  totalPointsSpent: number
  frameItem?: EquippedItem
  titleItem?: EquippedItem
  accountType?: "individual" | "company" | "city"
}

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user-profile?userId=${userId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        const data = await response.json()
        
        // Fetch inventory to get equipped item details
        const inventoryRes = await fetch(`/api/user-inventory?userId=${userId}`)
        if (inventoryRes.ok) {
          const inventory = await inventoryRes.json()
          
            // Find equipped items
            const frameItem = inventory.find((item: any) => 
              item.itemId === data.equippedFrame && item.item?.type === 'avatar_frame'
            )
            const titleItem = inventory.find((item: any) => 
              item.itemId === data.equippedTitle && item.item?.type === 'title'
            )
            
            setProfile({
              ...data,
              frameItem: frameItem?.item,
              titleItem: titleItem?.item
            })
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const refetch = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/user-profile?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      
      const inventoryRes = await fetch(`/api/user-inventory?userId=${userId}`)
      if (inventoryRes.ok) {
        const inventory = await inventoryRes.json()
        
        const frameItem = inventory.find((item: any) => 
          item.itemId === data.equippedFrame && item.item?.type === 'avatar_frame'
        )
        const titleItem = inventory.find((item: any) => 
          item.itemId === data.equippedTitle && item.item?.type === 'title'
        )
        
        setProfile({
          ...data,
          frameItem: frameItem?.item,
          titleItem: titleItem?.item
        })
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError(err as Error)
    }
  }

  return { profile, loading, error, refetch }
}
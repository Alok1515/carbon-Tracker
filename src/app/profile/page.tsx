"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Mail, Lock, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  
  const [email, setEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [accountType, setAccountType] = useState<string>("")
  
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/")
    } else if (session?.user) {
      setEmail(session.user.email || "")
      const accountData = (session as any)?.session?.account
      setIsOAuthUser(accountData?.providerId === 'google' || accountData?.accountId?.includes('google'))
      
      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.accountType) {
            setAccountType(data.accountType)
          }
        })
        .catch(err => console.error('Failed to fetch account type:', err))
    }
  }, [session, isPending, router])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newName || newName.trim().length === 0) {
      toast.error("Please enter a valid name")
      return
    }

    setIsUpdatingName(true)
    try {
      const checkResponse = await fetch(`/api/auth/check-name?name=${encodeURIComponent(newName.trim())}&userId=${session?.user?.id}`)
      const checkData = await checkResponse.json()
      
      if (checkData.exists) {
        toast.error("This name is already taken. Please choose another name.")
        setIsUpdatingName(false)
        return
      }

        const { data, error } = await authClient.updateUser({
          name: newName.trim(),
        })
  
        if (error) {
          toast.error(error.message || "Failed to update name")
        } else {
          // Also update name in UserProfile for consistency
          try {
            const token = localStorage.getItem("bearer_token")
            await fetch("/api/user-profile", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: session?.user?.id,
                displayName: newName.trim()
              }),
            })
          } catch (err) {
            console.error("Failed to update UserProfile display name:", err)
          }

          toast.success("Name updated successfully!")
          setNewName("")
          window.location.reload()
        }

    } catch (error) {
      console.error("Name update error:", error)
      toast.error("Failed to update name")
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsUpdatingEmail(true)
    try {
      const { data, error } = await authClient.changeEmail({
        newEmail: newEmail,
      })

      if (error) {
        toast.error(error.message || "Failed to update email")
      } else {
        toast.success("Verification email sent! Please check your new email address.")
        setNewEmail("")
      }
    } catch (error) {
      console.error("Email update error:", error)
      toast.error("Failed to update email")
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }
    
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { data, error } = await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: currentPassword,
        revokeOtherSessions: false,
      })

      if (error) {
        toast.error(error.message || "Failed to update password")
      } else {
        toast.success("Password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      console.error("Password update error:", error)
      toast.error("Failed to update password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

    const handleDeleteAccount = async () => {
      if (!isOAuthUser && !deletePassword) {
        toast.error("Please enter your password to confirm deletion")
        return
      }

      setIsDeletingAccount(true)
      try {
        if (!isOAuthUser) {
          const verifyResponse = await authClient.changePassword({
            newPassword: deletePassword,
            currentPassword: deletePassword,
            revokeOtherSessions: false,
          })

          if (verifyResponse.error) {
            toast.error("Incorrect password")
            setIsDeletingAccount(false)
            return
          }
        }

        const { error } = await authClient.deleteUser()

        if (error) {
          toast.error(error.message || "Failed to delete account")
        } else {
          toast.success("Account deleted successfully")
          localStorage.removeItem("bearer_token")
          router.push("/")
        }
      } catch (error) {
        console.error("Account deletion error:", error)
        toast.error("Failed to delete account")
      } finally {
        setIsDeletingAccount(false)
        setDeletePassword("")
      }
    }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-xl font-bold">Profile Settings</h1>
          
          <div className="w-32" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={session.user.name || "Not set"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input 
                  value={accountType ? accountType.charAt(0).toUpperCase() + accountType.slice(1) : "Loading..."} 
                  disabled 
                  className="capitalize"
                />
              </div>
            </CardContent>
          </Card>

          {/* Update Name */}
          <Card>
            <CardHeader>
              <CardTitle>Update Name</CardTitle>
              <CardDescription>
                Change your display name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">New Name</Label>
                  <Input
                    id="newName"
                    type="text"
                    placeholder="John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isUpdatingName || !newName}>
                  {isUpdatingName ? "Updating..." : "Update Name"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Update Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Update Email Address
              </CardTitle>
              <CardDescription>
                Change your email address. You'll receive a verification email at your new address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="new.email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isUpdatingEmail || !newEmail}>
                  {isUpdatingEmail ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

            {/* Update Password */}
            {!isOAuthUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Update Password
                  </CardTitle>
                  <CardDescription>
                    Change your account password. Use a strong password with at least 8 characters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isUpdatingPassword || !currentPassword || !newPassword}>
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {isOAuthUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Update Password
                  </CardTitle>
                  <CardDescription>
                    Password management is not available for Google accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      You're signed in with Google. To manage your password, please visit your Google Account settings.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

          {/* Delete Account */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Warning: This will permanently delete your account, including all emissions data, badges, achievements, and progress. This action is irreversible.
                </AlertDescription>
              </Alert>
              
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </p>
                        {!isOAuthUser && (
                          <div className="space-y-2">
                            <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                            <Input
                              id="deletePassword"
                              type="password"
                              placeholder="Your password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                            />
                          </div>
                        )}
                        {isOAuthUser && (
                          <p className="text-sm text-muted-foreground">
                            Click confirm below to permanently delete your Google-linked account.
                          </p>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletePassword("")}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || (!isOAuthUser && !deletePassword)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeletingAccount ? "Deleting..." : "Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

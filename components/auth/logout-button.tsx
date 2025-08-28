'use client'

import { Button } from '@/components/ui/button'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children,
  className
}: LogoutButtonProps) {
  const { signOut, isLoading } = useAuthActions()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {children || (isLoading ? 'Signing out...' : 'Sign Out')}
    </Button>
  )
}

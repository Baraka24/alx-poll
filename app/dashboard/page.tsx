import { UserProfile } from '@/components/dashboard/user-profile'
import { UserPolls } from '@/components/dashboard/user-polls'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your polls and view your activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <UserProfile />
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-6">
            <DashboardStats />
            <UserPolls />
          </div>
        </div>
      </div>
    </div>
  )
}

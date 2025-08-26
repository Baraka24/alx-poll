'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function PollFilters() {
  return (
    <div className="space-y-4">
      {/* Desktop: vertical layout, Mobile: horizontal layout */}
      <div className="lg:space-y-4 lg:block flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 lg:flex-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search polls..."
            className="pl-10 w-full"
          />
        </div>

        {/* Filter by Status */}
        <div className="w-full sm:w-[180px] lg:w-full">
          <Select defaultValue="all">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Polls</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort by */}
        <div className="w-full sm:w-[180px] lg:w-full">
          <Select defaultValue="newest">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="votes">Most Votes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="w-full sm:w-auto lg:w-full">
          <Button variant="outline" className="w-full">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Desktop only: Additional filter options */}
      <div className="hidden lg:block space-y-4 pt-4 border-t">
        <div>
          <h3 className="font-medium text-sm text-gray-700 mb-3">Categories</h3>
          <div className="space-y-2">
            {['Technology', 'Politics', 'Sports', 'Entertainment', 'Science', 'Business'].map((category) => (
              <label key={category} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-gray-700 mb-3">Date Range</h3>
          <Select defaultValue="all-time">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

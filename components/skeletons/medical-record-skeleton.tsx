"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface MedicalRecordListSkeletonProps {
  count?: number
}

export function MedicalRecordSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MedicalRecordListSkeleton({ count = 3 }: MedicalRecordListSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <MedicalRecordSkeleton key={i} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[100px]" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
        </div>
      </div>
    </div>
  )
} 
"use client";

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-shimmer rounded-xl ${className}`} 
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-card rounded-[32px] border border-border" />
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 w-48 bg-muted rounded-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card rounded-[32px] border border-border" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted rounded-lg" />
          <div className="h-80 bg-card rounded-[32px] border border-border" />
        </div>
      </div>
    </div>
  );
}

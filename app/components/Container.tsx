'use client'
import { cn } from "@/lib/utils";
import { ReactNode } from "react"

export const Container = ({ children, className }: {
  children: ReactNode;
  className?: string
}) => {
  return (
    <div className={cn("max-w-screen-xl w-full mx-auto px-2 md:py-2", className)}>
      {children}
    </div>
  )
}

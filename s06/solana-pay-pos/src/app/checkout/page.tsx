'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, QrCode } from 'lucide-react'

export default function Checkout() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Scan to Pay with Solana</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <QrCode size={200} />
        </CardContent>
      </Card>
    </div>
  )
}
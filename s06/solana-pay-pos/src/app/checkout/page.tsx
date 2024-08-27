"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalAmount = parseFloat(searchParams.get("amount") || "0");

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="mb-4 p-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
      </Button>

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="text-6xl font-bold mb-1">
            {totalAmount.toFixed(4)}
          </div>
          <div className="text-xl mb-6">SOL</div>

          <div className="w-64 h-64 relative mb-6">
            <Image
              src="/placeholder.svg"
              alt="Solana Pay QR Code"
              layout="fill"
              objectFit="contain"
            />
          </div>

          <p className="text-center mb-1">
            Scan this code with your Solana Pay wallet
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            You&apos;ll be asked to approve the transaction
          </p>

          <div className="flex items-center text-sm text-gray-500">
            Powered by
            <Image
              src="/solana-pay-logo.svg"
              alt="Solana Pay Logo"
              width={60}
              height={20}
              className="ml-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import { createQR, encodeURL } from "@solana/pay";
import { Keypair, PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalAmount = new BigNumber(searchParams.get("amount") || "0");
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);


  if (qrRef.current && !qrGenerated) {
    const recipient = new PublicKey("dw1MtDSqudTcVzDPddQwTAFRsXt8gjw8CqEzoBDTSVM"); 
    const reference = new Keypair().publicKey;
    const label = "Solana POS Purchase";
    const message = "Thanks for your purchase!";
    
    let memoCounter = 100000;
    const generateMemo = (): string => {
      memoCounter += 1;
      return `#${memoCounter}`;
    }

    const memo = generateMemo();

    const url = encodeURL({
      recipient,
      reference,
      amount: totalAmount,
      label,
      message,
      memo,
    });

    const qr = createQR(url, 320, "white","black");
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
    setQrGenerated(true);

    // Set up transaction confirmation polling
  }

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

          <div ref={qrRef} className="relative mb-6"></div>

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
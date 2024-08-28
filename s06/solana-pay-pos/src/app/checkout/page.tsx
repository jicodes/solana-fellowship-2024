"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";

import { createQR, encodeURL } from "@solana/pay";
import { Keypair, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalAmount = new BigNumber(searchParams.get("amount") || "0");
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [signature, setSignature] = useState<string | null>(null);

  const recipient = new PublicKey(
    "dw1MtDSqudTcVzDPddQwTAFRsXt8gjw8CqEzoBDTSVM",
  );
  const reference = useRef(new Keypair().publicKey);
  const memo = useRef(`#${Date.now()}`);

  useEffect(() => {
    if (qrRef.current && !qrGenerated) {
      const label = "Solana POS Purchase";
      const message = "Thanks for your purchase!";

      const url = encodeURL({
        recipient,
        amount: totalAmount,
        reference: reference.current,
        label,
        message,
        memo: memo.current,
      });

      const qr = createQR(url, 320, "white", "black");
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        qr.append(qrRef.current);
      }
      setQrGenerated(true);

      // Polling for payment verification
      const pollInterval = setInterval(async () => {
        const verificationResult = await verifyPayment();
        setPaymentStatus(verificationResult.status);
        if (verificationResult.status === "success") {
          setSignature(verificationResult.signature);
          clearInterval(pollInterval);
        } else if (verificationResult.status === "error") {
          clearInterval(pollInterval);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, []);

  const verifyPayment = async () => {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipient.toBase58(),
          amount: totalAmount.toString(),
          reference: reference.current.toBase58(),
          memo: memo.current,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error verifying payment:", error);
      return { status: "error", message: "Payment verification failed" };
    }
  };

  const getExplorerLink = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  };

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

          {paymentStatus === "pending" && (
            <>
              <div ref={qrRef} className="relative mb-6"></div>
              <p className="text-center mb-1">
                Scan this code with your Solana Pay wallet
              </p>
              <p className="text-center text-sm text-gray-500 mb-6">
                You&apos;ll be asked to approve the transaction
              </p>
            </>
          )}

          {paymentStatus === "success" && (
            <div className="text-center mb-6">
              <div className="text-green-500 font-bold text-xl mb-2">
                Payment Verified Successfully!
              </div>
              <a
                href={getExplorerLink(signature!)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center justify-center"
              >
                View on Solana Explorer
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          )}

          {paymentStatus === "invalid" && (
            <div className="text-red-500 font-bold text-xl mb-6">
              Payment found but is invalid. Please try again.
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="text-red-500 font-bold text-xl mb-6">
              Error verifying payment. Please try again.
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500">
            Powered by
            <Image
              src="solana-pay-logo.svg"
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

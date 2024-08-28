import { NextResponse } from "next/server";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { findReference, validateTransfer } from "@solana/pay";
import BigNumber from "bignumber.js";

const connection = new Connection(clusterApiUrl("devnet"));

export async function POST(request: Request) {
  try {
    const { recipient, amount, reference, memo } = await request.json();

    const recipientPublicKey = new PublicKey(recipient);
    const referencePublicKey = new PublicKey(reference);
    const amountBN = new BigNumber(amount);

    console.log("Verifying the payment");

    let signatureInfo;
    try {
      signatureInfo = await findReference(connection, referencePublicKey, {
        finality: "confirmed",
      });
    } catch (findReferenceError) {
      console.log("findReference error:", findReferenceError);
      // If findReference fails, it means the transaction hasn't been made yet
      return NextResponse.json({
        status: "pending",
        message: "Payment not found.",
      });
    }

    console.log("Found signature:", signatureInfo.signature);

    try {
      const response = await validateTransfer(
        connection,
        signatureInfo.signature,
        {
          recipient: recipientPublicKey,
          amount: amountBN,
          splToken: undefined,
          reference: referencePublicKey,
          memo,
        },
        { commitment: "confirmed" },
      );

      if (response.meta && !response.meta.err) {
        return NextResponse.json({
          status: "success",
          message: "Payment verified successfully",
          signature: signatureInfo.signature,
        });
      } else {
        return NextResponse.json({
          status: "invalid",
          message: "Transaction failed or invalid",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return NextResponse.json(
        { status: "error", message: "Error validating payment" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error && error.message === "No match found") {
      return NextResponse.json({
        status: "pending",
        message: "Payment not found.",
      });
    }
    return NextResponse.json(
      { status: "error", message: "Error processing request" },
      { status: 500 },
    );
  }
}

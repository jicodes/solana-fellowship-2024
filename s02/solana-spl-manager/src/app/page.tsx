import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to Solana</h1>
      <Image
        src="https://cryptologos.cc/logos/solana-sol-logo.svg"
        alt="Solana logo"
        width={50}
        height={50}
      />
    </main>
  );
}

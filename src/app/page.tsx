import MetaMaskWallet from "../components/MetaMaskWallet";
import TurboRates from "../components/TurboRates";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Turbo SDK Next.js Demo
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Connect your MetaMask wallet to view your Turbo balance, upload files
          to Arweave, and test upload cost calculations
        </p>

        <div className="space-y-8">
          <MetaMaskWallet />
          <TurboRates />
        </div>
      </div>
    </main>
  );
}

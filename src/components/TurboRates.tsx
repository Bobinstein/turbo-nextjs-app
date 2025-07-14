"use client"; // Required for Next.js App Router

import { TurboFactory } from "@ardrive/turbo-sdk/web";
import { useEffect, useState } from "react";

export default function TurboRates() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [turbo, setTurbo] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rates, setRates] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadCost, setUploadCost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize unauthenticated Turbo client
    const initTurbo = async () => {
      try {
        setError(null);
        const turboClient = TurboFactory.unauthenticated();
        setTurbo(turboClient);

        // Fetch current rates
        const currentRates = await turboClient.getFiatRates();
        setRates(currentRates);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Failed to initialize Turbo:", error);
        setError(`Failed to initialize: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    initTurbo();
  }, []);

  const calculateUploadCost = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !turbo) return;

    try {
      setError(null);
      const cost = await turbo.getUploadCosts({
        bytes: [file.size],
      });
      setUploadCost(cost[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error calculating cost:", error);
      setError(`Error calculating cost: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="text-center">Loading Turbo rates...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Turbo Upload Cost Calculator</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {rates && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Current Rates (per GiB):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(rates.fiat, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="file" className="block text-sm font-medium mb-2">
          Select File to Calculate Upload Cost:
        </label>
        <input
          type="file"
          id="file"
          onChange={calculateUploadCost}
          className="block w-full text-sm border rounded-lg p-2"
        />
      </div>

      {uploadCost && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p>
            <strong>Upload Cost:</strong> {uploadCost.winc} winc
          </p>
          <p>
            <strong>File Size:</strong> {uploadCost.adjustedBytes} bytes
          </p>
        </div>
      )}
    </div>
  );
}

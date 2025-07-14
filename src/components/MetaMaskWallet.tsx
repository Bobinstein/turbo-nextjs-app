"use client";

import { TurboFactory } from "@ardrive/turbo-sdk/web";
import {
  createData,
  InjectedEthereumSigner,
  DataItem,
} from "@dha-team/arbundles";
import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";

export default function MetaMaskWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const connectMetaMask = useCallback(async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        setError("MetaMask is not installed!");
        return;
      }

      // Request account access
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Get the current account
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
      }
    } catch (error: unknown) {
      console.error("Failed to connect to MetaMask:", error);
      setError(
        `Failed to connect: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!connected || !address) return;

    setLoading(true);
    setError(null);

    try {
      // Create Ethereum signer using MetaMask
      if (!window.ethereum) {
        setError("MetaMask is not available");
        return;
      }

      // Ensure we're connected to the right network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      console.log("Current chain ID:", chainId);

      // Add delay to prevent MetaMask spam filter
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a provider wrapper for InjectedEthereumSigner
      const providerWrapper = {
        getSigner: () => ({
          signMessage: async (message: string | Uint8Array) => {
            // Add delay before account request to prevent spam filter
            await new Promise((resolve) => setTimeout(resolve, 300));

            const accounts = await window.ethereum!.request({
              method: "eth_accounts",
            });
            if (accounts.length === 0) {
              throw new Error("No accounts available");
            }

            // Add delay before signing to prevent spam filter
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Convert message to hex if it's Uint8Array with enhanced Firefox compatibility
            let messageToSign: string;
            if (typeof message === "string") {
              messageToSign = message;
              console.log(
                "Balance: Signing string message, length:",
                message.length
              );
            } else {
              // Enhanced conversion for Firefox compatibility
              const uint8Array = message; // TypeScript knows this is Uint8Array

              messageToSign =
                "0x" +
                Array.from(uint8Array, (byte) =>
                  byte.toString(16).padStart(2, "0")
                ).join("");

              console.log("Balance: Signing binary message:", {
                uint8ArrayLength: uint8Array.length,
                hexLength: messageToSign.length,
                preview: messageToSign.slice(0, 50) + "...",
              });
            }

            const signature = await window.ethereum!.request({
              method: "personal_sign",
              params: [messageToSign, accounts[0]],
            });

            console.log("Balance: Signature created:", {
              signatureLength: signature.length,
              signaturePreview: signature.slice(0, 20) + "...",
            });

            return signature;
          },
        }),
      };
      const ethersSigner = await new BrowserProvider(
        window.ethereum
      ).getSigner();
      // Create the signer
      const providerWrapper2 = {
        getSigner: () => ({
          signMessage: async (message: string | Uint8Array) => {
            const result = await ethersSigner.signMessage(message);
            console.log("this is the result of the signMessage", result);
            return result;
          },
        }),
      };
      const signer = new InjectedEthereumSigner(providerWrapper2);
      console.log("Signer created successfully");
      console.log("this is the fork we are going down");
      console.log(signer);

      const turbo = TurboFactory.authenticated({
        signer,
        token: "ethereum", // Important: specify token type for Ethereum
      });
      console.log("Turbo client created successfully");

      // Get balance
      const balanceResult = await turbo.getBalance();
      console.log("Balance result:", balanceResult);
      setBalance(balanceResult.winc);
    } catch (error: unknown) {
      console.error("Failed to fetch balance:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setError(
        `Failed to fetch balance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [connected, address]);

  const uploadWithMetaMask = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !connected) return;

      setUploading(true);
      setError(null);

      try {
        // Add delay to prevent MetaMask spam filter from previous balance check
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Create Ethereum signer using MetaMask
        if (!window.ethereum) {
          setError("MetaMask is not available");
          return;
        }

        // Browser detection
        const userAgent = navigator.userAgent;
        const isFirefox = userAgent.indexOf("Firefox") > -1;

        console.log("Browser detection:", {
          isFirefox,
          userAgent,
        });

        // Create a provider wrapper for InjectedEthereumSigner
        const providerWrapper = {
          getSigner: () => ({
            signMessage: async (message: string | Uint8Array) => {
              // Add delay before account request to prevent spam filter
              await new Promise((resolve) => setTimeout(resolve, 400));

              const accounts = await window.ethereum!.request({
                method: "eth_accounts",
              });
              if (accounts.length === 0) {
                throw new Error("No accounts available");
              }

              // Add delay before signing to prevent spam filter
              await new Promise((resolve) => setTimeout(resolve, 400));

              // Convert message to hex if it's Uint8Array with enhanced Firefox compatibility
              let messageToSign: string;
              if (typeof message === "string") {
                messageToSign = message;
                console.log("Signing string message, length:", message.length);
              } else {
                // Enhanced conversion for Firefox compatibility
                // At this point, TypeScript knows message is Uint8Array since it's not a string
                const uint8Array = message;

                messageToSign =
                  "0x" +
                  Array.from(uint8Array, (byte: number) =>
                    byte.toString(16).padStart(2, "0")
                  ).join("");

                console.log("Signing binary message:", {
                  originalType: typeof message,
                  uint8ArrayLength: uint8Array.length,
                  hexLength: messageToSign.length,
                  preview: messageToSign.slice(0, 50) + "...",
                });
              }

              const signature = await window.ethereum!.request({
                method: "personal_sign",
                params: [messageToSign, accounts[0]],
              });

              console.log("Signature created:", {
                signatureLength: signature.length,
                signaturePreview: signature.slice(0, 20) + "...",
              });

              return signature;
            },
          }),
        };

        // Create the signer using InjectedEthereumSigner with additional error handling
        let signer;
        try {
          const ethersSigner = await new BrowserProvider(
            window.ethereum
          ).getSigner();
          const providerWrapper2 = {
            getSigner: () => ({
              signMessage: async (message: string | Uint8Array) => {
                const result = await ethersSigner.signMessage(message);
                console.log("this is the result of the signMessage", result);
                return result;
              },
            }),
          };

          signer = new InjectedEthereumSigner(providerWrapper2);
          await signer.setPublicKey();
          console.log("Signer created successfully", { isFirefox });

          console.log(signer);
        } catch (signerError) {
          console.error("Failed to create signer:", signerError);
          throw new Error(
            `Signer creation failed: ${
              signerError instanceof Error
                ? signerError.message
                : "Unknown error"
            }`
          );
        }

        const turbo = TurboFactory.authenticated({
          signer,
          token: "ethereum", // Important: specify token type for Ethereum
        });

        console.log("Turbo client created successfully for upload", {
          isFirefox,
        });

        // Small delay to ensure signer is fully ready (helps with Firefox timing issues)
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isFirefox) {
          console.log(
            "Applying Firefox-specific workaround - Override axios adapter"
          );

          // Firefox Fix: The turbo-sdk forces adapter: 'fetch' which corrupts ReadableStreams in Firefox
          // We need to override axios.create before the turbo-sdk uses it

          // Store the original axios create function
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const axios = (await import("axios")).default;
          const originalAxiosCreate = axios.create;

          // Override axios.create globally to intercept turbo-sdk's usage
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          axios.create = function (config: any = {}) {
            console.log(
              "Firefox: Intercepting axios.create to override adapter"
            );

            // If this looks like turbo-sdk config (has adapter: 'fetch'), override it
            const firefoxConfig = {
              ...config,
              adapter: config.adapter === "fetch" ? "xhr" : config.adapter, // Force XMLHttpRequest adapter instead of fetch
            };

            console.log(
              "Firefox: Using XMLHttpRequest adapter instead of fetch"
            );
            return originalAxiosCreate.call(this, firefoxConfig);
          };

          try {
            // Use standard Turbo SDK - it will now use XHR adapter instead of fetch

            const dataItem = await createData(
              new Uint8Array(await file.arrayBuffer()),
              signer,
              {
                tags: [
                  { name: "Content-Type", value: file.type },
                  { name: "App-Name", value: "My-Next-App" },
                  { name: "Funded-By", value: "Ethereum" },
                  { name: "File-Name", value: file.name },
                ],
              }
            );
            await dataItem.sign(signer);
            console.log("Data item signed");
            console.log(dataItem.signature);
            console.log(await DataItem.verify(dataItem.getRaw()));

            const manualPost = await fetch(
              "https://upload.ardrive.io/v1/tx/ethereum",
              {
                method: "POST",
                body: dataItem.getRaw(),
                headers: {
                  "Content-Type": "application/octet-stream",
                },
              }
            );
            console.log("manualPost json", await manualPost.json());


            const signDataTest = await turbo.uploadSignedDataItem({
              dataItemStreamFactory: () =>
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(dataItem.getRaw());
                    controller.close();
                  },
                }),
              dataItemSizeFactory: () => dataItem.getRaw().byteLength,
            });
            console.log("signDataTest", signDataTest);

            const poop = await file.arrayBuffer();
            const result = await turbo.uploadFile({
              fileStreamFactory: () =>
                new Uint8Array(poop) as unknown as Buffer,
              fileSizeFactory: () => file.size,
              signal: AbortSignal.timeout(10000),
              dataItemOpts: {
                tags: [
                  { name: "Content-Type", value: file.type },
                  { name: "App-Name", value: "My-Next-App" },
                  { name: "Funded-By", value: "Ethereum" },
                  { name: "File-Name", value: file.name },
                ],
              },
              events: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onProgress: (progress: any) => {
                  const percent = Math.round(
                    (progress.processedBytes / progress.totalBytes) * 100
                  );
                  console.log(`Firefox upload: ${percent}%`);
                },
                onError: (error: Error) => {
                  console.error(`Firefox upload error:`, error);
                },
              },
            });

            console.log("Firefox: Upload successful with XHR adapter:", result);
            setUploadResult(result);
          } catch (firefoxError) {
            console.error("Firefox workaround failed:", firefoxError);
            // Fall back to standard approach
          } finally {
            // Restore original axios.create
            axios.create = originalAxiosCreate;
            console.log("Firefox: Restored original axios.create");
          }
        } else {
          // Standard upload for non-Firefox browsers
          console.log("Using standard Turbo upload for non-Firefox browser");

          const dataItem = await createData(
            new Uint8Array(await file.arrayBuffer()),
            signer,
            {
              tags: [
                { name: "Content-Type", value: file.type },
                { name: "App-Name", value: "My-Next-App" },
                { name: "Funded-By", value: "Ethereum" },
                { name: "File-Name", value: file.name },
              ],
            }
          );
          await dataItem.sign(signer);
          console.log("Data item signed");
          console.log(dataItem.signature);
          console.log(await DataItem.verify(dataItem.getRaw()));

          const poop2 = await file.arrayBuffer();

          const manualPost = await fetch(
            "https://turbo.ardrive.io/tx/ethereum",
            {
              method: "POST",
              body: dataItem.getRaw(),
              headers: {
                "Content-Type": "application/octet-stream",
              },
            }
          );
          console.log("manualPost", await manualPost.json());


          const signDataTest = await turbo.uploadSignedDataItem({
            dataItemStreamFactory: () =>
              new ReadableStream({
                start(controller) {
                  controller.enqueue(dataItem.getRaw());
                  controller.close();
                },
              }),
            dataItemSizeFactory: () => dataItem.getRaw().byteLength,
          });
          console.log("signDataTest", signDataTest);
          const result = await turbo.uploadFile({
            fileStreamFactory: () => new Uint8Array(poop2) as unknown as Buffer,
            fileSizeFactory: () => file.size,
            signal: AbortSignal.timeout(10000),
            dataItemOpts: {
              tags: [
                { name: "Content-Type", value: file.type },
                { name: "App-Name", value: "My-Next-App" },
                { name: "Funded-By", value: "Ethereum" },
                { name: "File-Name", value: file.name },
              ],
            },
            events: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onProgress: (progress: any) => {
                const percent = Math.round(
                  (progress.processedBytes / progress.totalBytes) * 100
                );
                console.log(`Firefox upload: ${percent}%`);
              },
              onError: (error: Error) => {
                console.error(`Firefox upload error:`, error);
              },
            },
          });

          console.log("Standard upload successful:", result);
          setUploadResult(result);
        }
      } catch (error: unknown) {
        console.error("Upload failed:", error);
        setError(
          `Upload failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setUploading(false);
      }
    },
    [connected]
  );

  // Fetch balance when connected
  useEffect(() => {
    if (connected && address) {
      fetchBalance();
    }
  }, [connected, address, fetchBalance]);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">MetaMask Wallet</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!connected ? (
        <button
          onClick={connectMetaMask}
          className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
        >
          Connect MetaMask
        </button>
      ) : (
        <div>
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-semibold">✅ Connected</p>
            <p className="text-sm break-all">
              Address: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Turbo Balance:</span>
              <button
                onClick={fetchBalance}
                disabled={loading}
                className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="p-3 bg-gray-100 rounded text-center">
                Loading balance...
              </div>
            ) : balance !== null ? (
              <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                <p className="text-lg font-mono">{balance} winc</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-100 rounded text-center">
                Click refresh to load balance
              </div>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="metamask-file"
              className="block text-sm font-medium mb-2"
            >
              Select File to Upload:
            </label>
            <input
              type="file"
              id="metamask-file"
              onChange={(e) => uploadWithMetaMask(e)}
              disabled={uploading}
              className="block w-full text-sm border rounded-lg p-2"
            />
          </div>

          {uploading && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              🔄 Uploading... Please confirm transaction in MetaMask
            </div>
          )}

          {uploadResult && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-semibold">✅ Upload Successful!</p>
              <p className="text-sm break-all">
                <strong>Transaction ID:</strong> {uploadResult.id}
              </p>
              <p className="text-sm">
                <strong>Data Size:</strong> {uploadResult.totalBytes} bytes
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setConnected(false);
              setAddress("");
              setBalance(null);
              setUploadResult(null);
            }}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

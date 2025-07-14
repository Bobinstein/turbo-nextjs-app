# Turbo SDK Next.js Documentation Analysis

## Overview

Analysis of discrepancies between `/home/stephen/Documents/code/pub-docs/docs/src/docs/turbo/turbo-sdk/frameworks/next.md` and the actual working implementation for MetaMask integration.

## Critical Errors in Documentation

### 1. Incorrect Signer Class Usage

**Documentation (INCORRECT):**

```tsx
import { TurboFactory, EthereumSigner } from "@ardrive/turbo-sdk/web";

// Later in code:
const signer = new EthereumSigner(window.ethereum);
```

**Working Implementation (CORRECT):**

```tsx
import { TurboFactory } from "@ardrive/turbo-sdk/web";
import { InjectedEthereumSigner } from "@dha-team/arbundles";

// Later in code:
const providerWrapper = {
  getSigner: () => ({
    signMessage: async (message: string | Uint8Array) => {
      const accounts = await window.ethereum!.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        throw new Error("No accounts available");
      }

      const messageToSign =
        typeof message === "string"
          ? message
          : "0x" +
            Array.from(message)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");

      return await window.ethereum!.request({
        method: "personal_sign",
        params: [messageToSign, accounts[0]],
      });
    },
  }),
};

const signer = new InjectedEthereumSigner(providerWrapper);
```

**Error Analysis:**

- `EthereumSigner` expects a private key string, not a browser wallet provider object
- `EthereumSigner` is designed for server-side use with private keys
- Browser wallet integration requires `InjectedEthereumSigner` from `@dha-team/arbundles`
- `InjectedEthereumSigner` expects a provider with a `getSigner()` method, but `window.ethereum` doesn't have this
- The provider wrapper must implement the `signMessage` interface correctly

### 2. Missing Dependency Information

**Documentation:**
Only mentions `@ardrive/turbo-sdk` as primary dependency, with polyfills as dev dependencies.

**Working Implementation:**
Requires explicit import from `@dha-team/arbundles`, which is a peer dependency of `@ardrive/turbo-sdk`.

**Required Dependencies (Actual):**

```json
{
  "dependencies": {
    "@ardrive/turbo-sdk": "^1.28.3"
  },
  "devDependencies": {
    "buffer": "^6.0.3",
    "crypto-browserify": "^3.12.1",
    "process": "^0.11.10",
    "stream-browserify": "^3.0.0"
  }
}
```

Note: `@dha-team/arbundles` is available as peer dependency via `@ardrive/turbo-sdk` but requires explicit import.

### 3. Interface Compatibility Issues

**Documentation Issue:**
Does not address that `window.ethereum` provider interface is incompatible with `InjectedEthereumSigner` expectations.

**Required Solution:**
Must create provider wrapper that:

1. Implements `getSigner()` method
2. Returns object with `signMessage()` method
3. Handles both string and Uint8Array message types
4. Uses MetaMask's `personal_sign` method with correct parameters
5. Properly formats hex-encoded messages for Uint8Array inputs

### 4. Error Handling for Browser Wallet Integration

**Documentation:**
Shows basic error handling but doesn't account for:

- Missing accounts after connection
- Message type conversion requirements
- Network/chain validation
- Proper error message extraction from wallet rejections

**Working Implementation Additions:**

- Account availability validation
- Message type detection and conversion
- Network chain ID logging for debugging
- Comprehensive error logging with JSON serialization

## Required Documentation Changes

### 1. Update Import Statement

```tsx
// CHANGE FROM:
import { TurboFactory, EthereumSigner } from "@ardrive/turbo-sdk/web";

// CHANGE TO:
import { TurboFactory } from "@ardrive/turbo-sdk/web";
import { InjectedEthereumSigner } from "@dha-team/arbundles";
```

### 2. Replace Signer Implementation Section

Replace entire signer creation code block (lines ~247-252 in docs) with:

```tsx
// Create a provider wrapper for InjectedEthereumSigner
const providerWrapper = {
  getSigner: () => ({
    signMessage: async (message: string | Uint8Array) => {
      const accounts = await window.ethereum!.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        throw new Error("No accounts available");
      }

      // Convert message to hex if it's Uint8Array
      const messageToSign =
        typeof message === "string"
          ? message
          : "0x" +
            Array.from(message)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");

      return await window.ethereum!.request({
        method: "personal_sign",
        params: [messageToSign, accounts[0]],
      });
    },
  }),
};

// Create the signer
const signer = new InjectedEthereumSigner(providerWrapper);
```

### 3. Add Dependency Information

Add note about `@dha-team/arbundles` import requirement and that it's available as peer dependency.

### 4. Add Network Validation Section

Add example of chain ID validation:

```tsx
// Ensure we're connected to the right network
const chainId = await window.ethereum.request({ method: "eth_chainId" });
console.log("Current chain ID:", chainId);
```

## Verification

This analysis is based on comparing the documentation at:

- File: `/home/stephen/Documents/code/pub-docs/docs/src/docs/turbo/turbo-sdk/frameworks/next.md`
- Lines: 207-252 (MetaMask Integration section)
- Working implementation: `/home/stephen/Documents/code/nextTest/turbo-nextjs-app/src/components/MetaMaskWallet.tsx`

The working implementation successfully:

- Connects to MetaMask wallet
- Creates authenticated Turbo client
- Fetches user balance using `turbo.getBalance()`
- Handles errors gracefully
- Compiles without TypeScript errors
- Runs in Next.js 15 development server

## Impact

The documentation errors prevent successful MetaMask integration and will cause runtime errors for developers following the current instructions. The `TypeError: e.startsWith is not a function` error specifically indicates the signer constructor parameter type mismatch.

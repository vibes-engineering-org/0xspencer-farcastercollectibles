"use client";

import { useState, useEffect, useCallback } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';

interface MintEvent {
  tokenId: string;
  to: string;
  fid: string;
  castHash: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  [key: string]: unknown;
}

interface RecentMintNFT {
  tokenId: string;
  to: string;
  fid: string;
  castHash: string;
  metadata: NFTMetadata | null;
  contractAddress: string;
  chain: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
  minterFarcasterUser?: FarcasterUser | null;
}

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface UseRecentMintEventsReturn {
  recentMints: RecentMintNFT[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const CONTRACT_ADDRESS = '0xc011Ec7Ca575D4f0a2eDA595107aB104c7Af7A09';
const MINT_EVENT_TOPIC = '0xcf6fbb9dcea7d07263ab4f5c3a92f53af33dffc421d9d121e1c74b307e68189d';

export function useRecentMintEvents(): UseRecentMintEventsReturn {
  const [recentMints, setRecentMints] = useState<RecentMintNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Alchemy SDK
  const getAlchemy = () => {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_ALCHEMY_KEY is not configured');
    }
    const settings = {
      apiKey: apiKey,
      network: Network.BASE_MAINNET,
    };
    return new Alchemy(settings);
  };

  // Function to fetch NFT metadata
  const fetchNFTMetadata = useCallback(async (tokenId: string): Promise<NFTMetadata | null> => {
    try {
      const alchemy = getAlchemy();
      const nft = await alchemy.nft.getNftMetadata(CONTRACT_ADDRESS, tokenId);
      return (nft as any).metadata || nft.raw?.metadata || null;
    } catch (error) {
      console.warn(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  }, []);

  // Function to fetch Farcaster user by address using Neynar API
  const fetchFarcasterUserByAddress = useCallback(async (address: string): Promise<FarcasterUser | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!apiKey) {
        console.warn('No Neynar API key found');
        return null;
      }

      const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(address)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          api_key: apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.warn(`Neynar API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // The response is an object with addresses as keys
      for (const [addr, userList] of Object.entries(data)) {
        if (addr.toLowerCase() === address.toLowerCase() && Array.isArray(userList) && userList.length > 0) {
          const user = userList[0] as any;
          return {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name,
            pfp_url: user.pfp_url,
          };
        }
      }

      return null;
    } catch (error) {
      console.warn(`Error fetching Farcaster user for address ${address}:`, error);
      return null;
    }
  }, []);

  // Function to parse mint event logs
  const parseMintEventLog = (log: any): MintEvent | null => {
    try {
      // The log should have topics array where:
      // topics[0] is the event signature hash
      // topics[1] is the 'to' address (indexed)
      // topics[2] is the tokenId (indexed)  
      // topics[3] is the fid (indexed)
      // data contains the castHash (not indexed)
      
      if (!log.topics || log.topics.length < 4) {
        console.warn('Invalid mint event log structure:', log);
        return null;
      }

      // Extract indexed parameters from topics
      const to = '0x' + log.topics[1].slice(26); // Remove padding from address
      const tokenId = BigInt(log.topics[2]).toString(); // Convert hex to decimal using BigInt
      const fid = parseInt(log.topics[3], 16).toString(); // Convert hex to decimal
      
      // Extract castHash from data (first 32 bytes after removing 0x)
      const castHash = log.data && log.data.length > 2 ? log.data.slice(0, 66) : '';

      return {
        tokenId,
        to,
        fid,
        castHash,
        blockNumber: parseInt(log.blockNumber, 16),
        transactionHash: log.transactionHash
      };
    } catch (error) {
      console.warn('Error parsing mint event log:', error, log);
      return null;
    }
  };

  // Function to get the latest block number
  const getLatestBlockNumber = useCallback(async (): Promise<number> => {
    const alchemy = getAlchemy();
    const blockNumber = await alchemy.core.getBlockNumber();
    return blockNumber;
  }, []);

  // Function to fetch logs for a specific block range
  const fetchLogsForRange = useCallback(async (fromBlock: number, toBlock: number) => {
    const alchemy = getAlchemy();
    const logs = await alchemy.core.getLogs({
      fromBlock: fromBlock,
      toBlock: toBlock,
      address: CONTRACT_ADDRESS,
      topics: [MINT_EVENT_TOPIC],
    });
    return logs;
  }, []);

  // Function to fetch recent mint events
  const fetchRecentMints = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the latest block number
      const latestBlock = await getLatestBlockNumber();
      let allLogs: any[] = [];
      let currentToBlock = latestBlock;
      let currentFromBlock = latestBlock - 498;

      // Keep fetching until we get at least 10 logs
      while (allLogs.length < 10 && currentFromBlock >= 0) {
        const logs = await fetchLogsForRange(currentFromBlock, currentToBlock);
        allLogs = allLogs.concat(logs);

        // If we have enough logs, break
        if (allLogs.length >= 10) {
          break;
        }

        // Move to the next range
        currentToBlock = currentFromBlock;
        currentFromBlock = currentFromBlock - 498;
      }
      
      // Parse the mint events
      const mintEvents: MintEvent[] = allLogs
        .map((log: any) => parseMintEventLog(log))
        .filter((event: MintEvent | null): event is MintEvent => event !== null)
        .sort((a: MintEvent, b: MintEvent) => b.blockNumber - a.blockNumber) // Sort by block number descending (most recent first)
        .slice(0, 10); // Take only the top 10

      // Fetch metadata and Farcaster user data for each mint event
      const recentMintsWithMetadata: RecentMintNFT[] = [];
      
      for (const event of mintEvents) {
        try {
          // Fetch metadata and Farcaster user in parallel
          const [metadata, minterFarcasterUser] = await Promise.all([
            fetchNFTMetadata(event.tokenId),
            fetchFarcasterUserByAddress(event.to)
          ]);

          recentMintsWithMetadata.push({
            ...event,
            metadata,
            minterFarcasterUser,
            contractAddress: CONTRACT_ADDRESS,
            chain: 'base'
          });
        } catch (error) {
          console.warn(`Failed to fetch data for token ${event.tokenId}:`, error);
          // Still add the event without metadata or minter info
          recentMintsWithMetadata.push({
            ...event,
            metadata: null,
            minterFarcasterUser: null,
            contractAddress: CONTRACT_ADDRESS,
            chain: 'base'
          });
        }
      }

      setRecentMints(recentMintsWithMetadata);
    } catch (error) {
      console.error('Error fetching recent mint events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recent mint events');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNFTMetadata, fetchFarcasterUserByAddress, getLatestBlockNumber, fetchLogsForRange]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchRecentMints();
  }, [fetchRecentMints]);

  // Initial data fetch
  useEffect(() => {
    fetchRecentMints();
  }, [fetchRecentMints]);

  return {
    recentMints,
    isLoading,
    error,
    refetch,
  };
}
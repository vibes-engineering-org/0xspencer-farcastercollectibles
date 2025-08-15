"use client";

import { useState, useEffect, useCallback } from 'react';

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

  // Function to get Alchemy API URL
  const getAlchemyUrl = () => {
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
    if (!alchemyKey) {
      throw new Error('NEXT_PUBLIC_ALCHEMY_KEY is not configured');
    }
    return `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  };

  // Function to fetch NFT metadata
  const fetchNFTMetadata = useCallback(async (tokenId: string): Promise<NFTMetadata | null> => {
    try {
      const url = `${getAlchemyUrl()}/getNFTMetadata?contractAddress=${CONTRACT_ADDRESS}&tokenId=${tokenId}&tokenType=ERC721`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch metadata for token ${tokenId}`);
        return null;
      }

      const data = await response.json();
      return data.metadata || null;
    } catch (error) {
      console.warn(`Error fetching metadata for token ${tokenId}:`, error);
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
      const tokenId = parseInt(log.topics[2], 16).toString(); // Convert hex to decimal
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
    const response = await fetch(getAlchemyUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: []
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch latest block number');
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return parseInt(data.result, 16);
  }, []);

  // Function to fetch logs for a specific block range
  const fetchLogsForRange = useCallback(async (fromBlock: number, toBlock: number) => {
    const response = await fetch(getAlchemyUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          address: CONTRACT_ADDRESS,
          topics: [MINT_EVENT_TOPIC],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch mint event logs');
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result || [];
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
      let currentFromBlock = latestBlock - 500;

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
        currentFromBlock = currentFromBlock - 500;
      }
      
      // Parse the mint events
      const mintEvents: MintEvent[] = allLogs
        .map((log: any) => parseMintEventLog(log))
        .filter((event: MintEvent | null): event is MintEvent => event !== null)
        .sort((a: MintEvent, b: MintEvent) => b.blockNumber - a.blockNumber) // Sort by block number descending (most recent first)
        .slice(0, 10); // Take only the top 10

      // Fetch metadata for each mint event
      const recentMintsWithMetadata: RecentMintNFT[] = [];
      
      for (const event of mintEvents) {
        try {
          const metadata = await fetchNFTMetadata(event.tokenId);
          recentMintsWithMetadata.push({
            ...event,
            metadata,
            contractAddress: CONTRACT_ADDRESS,
            chain: 'base'
          });
        } catch (error) {
          console.warn(`Failed to fetch metadata for token ${event.tokenId}:`, error);
          // Still add the event without metadata
          recentMintsWithMetadata.push({
            ...event,
            metadata: null,
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
  }, [fetchNFTMetadata, getLatestBlockNumber, fetchLogsForRange]);

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
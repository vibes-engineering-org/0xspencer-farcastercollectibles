"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

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

interface NFTToken {
  tokenId: string;
  metadata: NFTMetadata | null;
  contractAddress: string;
  chain: string;
  mintTime?: string;
}

interface UseContractNFTsReturn {
  userNFTs: NFTToken[];
  recentNFTs: NFTToken[];
  isLoadingUserNFTs: boolean;
  isLoadingRecentNFTs: boolean;
  error: string | null;
  loadMoreRecent: () => void;
  hasMoreRecent: boolean;
  isLoadingMoreRecent: boolean;
}

const CONTRACT_ADDRESS = '0xc011Ec7Ca575D4f0a2eDA595107aB104c7Af7A09';
const ITEMS_PER_PAGE = 10;

export function useContractNFTs(): UseContractNFTsReturn {
  const { address, isConnected } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFTToken[]>([]);
  const [recentNFTs, setRecentNFTs] = useState<NFTToken[]>([]);
  const [isLoadingUserNFTs, setIsLoadingUserNFTs] = useState(false);
  const [isLoadingRecentNFTs, setIsLoadingRecentNFTs] = useState(false);
  const [isLoadingMoreRecent, setIsLoadingMoreRecent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOffset, setRecentOffset] = useState(0);
  const [hasMoreRecent, setHasMoreRecent] = useState(true);

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


  // Fetch user's NFTs from the contract
  const fetchUserNFTs = useCallback(async () => {
    if (!address || !isConnected) {
      setUserNFTs([]);
      return;
    }

    setIsLoadingUserNFTs(true);
    setError(null);

    try {
      const url = `${getAlchemyUrl()}/getNFTs?owner=${address}&contractAddresses[]=${CONTRACT_ADDRESS}&withMetadata=true`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user NFTs: ${response.status}`);
      }

      const data = await response.json();
      const nfts: NFTToken[] = [];

      for (const nft of data.ownedNfts || []) {
        const metadata = nft.metadata || await fetchNFTMetadata(nft.tokenId);
        nfts.push({
          tokenId: nft.tokenId,
          metadata,
          contractAddress: CONTRACT_ADDRESS,
          chain: 'base'
        });
      }

      setUserNFTs(nfts);
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user NFTs');
    } finally {
      setIsLoadingUserNFTs(false);
    }
  }, [address, isConnected, fetchNFTMetadata]);

  // Fetch recently minted NFTs
  const fetchRecentNFTs = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!append) {
      setIsLoadingRecentNFTs(true);
    } else {
      setIsLoadingMoreRecent(true);
    }
    setError(null);

    try {
      // Get contract info to find total supply
      const contractUrl = `${getAlchemyUrl()}/getContractMetadata?contractAddress=${CONTRACT_ADDRESS}`;
      const contractResponse = await fetch(contractUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!contractResponse.ok) {
        throw new Error('Failed to fetch contract metadata');
      }

      const contractData = await contractResponse.json();
      const totalSupply = contractData.totalSupply ? parseInt(contractData.totalSupply, 16) : 1000;

      // Calculate token IDs for the most recent NFTs
      const startTokenId = Math.max(1, totalSupply - offset - ITEMS_PER_PAGE + 1);
      const endTokenId = Math.max(1, totalSupply - offset);
      
      if (startTokenId > endTokenId || startTokenId <= 0) {
        setHasMoreRecent(false);
        return;
      }

      const nfts: NFTToken[] = [];

      // Fetch NFTs in reverse order (most recent first)
      for (let tokenId = endTokenId; tokenId >= startTokenId; tokenId--) {
        try {
          const metadata = await fetchNFTMetadata(tokenId.toString());
          nfts.push({
            tokenId: tokenId.toString(),
            metadata,
            contractAddress: CONTRACT_ADDRESS,
            chain: 'base'
          });
        } catch (error) {
          console.warn(`Failed to fetch token ${tokenId}:`, error);
        }
      }

      if (append) {
        setRecentNFTs(prev => [...prev, ...nfts]);
      } else {
        setRecentNFTs(nfts);
      }

      // Check if there are more NFTs to load
      if (startTokenId <= 1) {
        setHasMoreRecent(false);
      }

    } catch (error) {
      console.error('Error fetching recent NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recent NFTs');
    } finally {
      if (!append) {
        setIsLoadingRecentNFTs(false);
      } else {
        setIsLoadingMoreRecent(false);
      }
    }
  }, [fetchNFTMetadata]);

  // Load more recent NFTs
  const loadMoreRecent = useCallback(() => {
    if (!isLoadingMoreRecent && hasMoreRecent) {
      const newOffset = recentOffset + ITEMS_PER_PAGE;
      setRecentOffset(newOffset);
      fetchRecentNFTs(newOffset, true);
    }
  }, [recentOffset, isLoadingMoreRecent, hasMoreRecent, fetchRecentNFTs]);

  // Initial data fetch
  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs]);

  useEffect(() => {
    fetchRecentNFTs(0, false);
    setRecentOffset(0);
    setHasMoreRecent(true);
  }, [fetchRecentNFTs]);

  return {
    userNFTs,
    recentNFTs,
    isLoadingUserNFTs,
    isLoadingRecentNFTs,
    error,
    loadMoreRecent,
    hasMoreRecent,
    isLoadingMoreRecent,
  };
}
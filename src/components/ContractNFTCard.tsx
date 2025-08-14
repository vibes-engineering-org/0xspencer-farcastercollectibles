"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "~/lib/utils";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  external_url?: string;
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
}

interface ContractNFTCardProps {
  nft: NFTToken;
  className?: string;
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4=";

export function ContractNFTCard({ nft, className }: ContractNFTCardProps) {
  const [imageError, setImageError] = useState(false);

  // Get the image URL from metadata
  const imageUrl = nft.metadata?.image || nft.metadata?.image_url || PLACEHOLDER_IMAGE;
  
  // Clean the token ID by removing "cast by @{author}" prefix
  const cleanTokenId = (tokenId: string): string => {
    // Remove "cast by @username" pattern from the beginning of the token ID
    const castByPattern = /^cast by @[^,\s]+,?\s*/i;
    return tokenId.replace(castByPattern, '').trim();
  };

  // Clean the NFT name by removing "cast by @{author}" prefix
  const cleanNFTName = (name: string): string => {
    // Remove "cast by @username" pattern from the beginning of the name
    const castByPattern = /^cast by @[^,\s]+,?\s*/i;
    return name.replace(castByPattern, '').trim();
  };
  
  const displayTokenId = cleanTokenId(nft.tokenId);
  const rawNftName = nft.metadata?.name || `NFT #${displayTokenId}`;
  const nftName = cleanNFTName(rawNftName);
  
  // Find author attribute from metadata
  const getAuthorInfo = () => {
    if (!nft.metadata?.attributes) return null;
    
    const authorAttribute = nft.metadata.attributes.find(
      (attr) => attr.trait_type?.toLowerCase() === 'author'
    );
    
    if (!authorAttribute) return null;
    
    const authorValue = String(authorAttribute.value);
    
    // Check if it's a numeric FID
    const fid = parseInt(authorValue, 10);
    if (!isNaN(fid) && fid > 0) {
      return { type: 'fid', value: fid, display: `FID ${fid}` };
    }
    
    // Otherwise treat as username
    return { type: 'username', value: authorValue, display: `@${authorValue}` };
  };

  const authorInfo = getAuthorInfo();

  const handleAuthorClick = () => {
    if (authorInfo) {
      const authorValue = authorInfo.type === 'username' ? authorInfo.value : authorInfo.value.toString();
      const farcasterUrl = `https://farcaster.xyz/${authorValue}`;
      window.open(farcasterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = () => {
    if (nft.metadata?.external_url) {
      window.open(nft.metadata.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-3 w-full min-w-0", className)}>
      {/* NFT Image */}
      <div 
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800",
          nft.metadata?.external_url && "cursor-pointer hover:opacity-80 transition-opacity"
        )}
        onClick={handleImageClick}
      >
        <Image
          src={imageError ? PLACEHOLDER_IMAGE : imageUrl}
          alt={nftName}
          fill
          className="object-cover"
          unoptimized={true}
          onError={handleImageError}
        />
      </div>

      {/* NFT Info */}
      <div className="space-y-2">
        {/* Name and Token ID */}
        <div>
          <h3 className="font-semibold text-sm text-foreground truncate">
            {nftName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {displayTokenId}
          </p>
        </div>

        {/* Description */}
        {nft.metadata?.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {nft.metadata.description}
          </p>
        )}

        {/* Author */}
        {authorInfo && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Author:</span>
            <button
              className="text-xs text-primary underline decoration-primary/60 underline-offset-2 font-medium active:text-primary/80 transition-colors"
              onClick={handleAuthorClick}
            >
              {authorInfo.display}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
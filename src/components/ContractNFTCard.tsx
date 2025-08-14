"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useProfile } from "~/hooks/use-profile";
import { Button } from "~/components/ui/button";

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
}

interface ContractNFTCardProps {
  nft: NFTToken;
  className?: string;
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4=";

export function ContractNFTCard({ nft, className }: ContractNFTCardProps) {
  const [imageError, setImageError] = useState(false);
  const { viewProfile } = useProfile();

  // Get the image URL from metadata
  const imageUrl = nft.metadata?.image || nft.metadata?.image_url || PLACEHOLDER_IMAGE;
  const nftName = nft.metadata?.name || `NFT #${nft.tokenId}`;
  
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
    if (authorInfo?.type === 'fid' && typeof authorInfo.value === 'number') {
      viewProfile(authorInfo.value);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-3", className)}>
      {/* NFT Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
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
            Token ID: {nft.tokenId}
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
            {authorInfo.type === 'fid' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary hover:underline"
                onClick={handleAuthorClick}
              >
                {authorInfo.display}
              </Button>
            ) : (
              <span className="text-xs text-foreground">
                {authorInfo.display}
              </span>
            )}
          </div>
        )}

        {/* Additional Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Attributes:</p>
            <div className="grid grid-cols-2 gap-1">
              {nft.metadata.attributes
                .filter(attr => attr.trait_type?.toLowerCase() !== 'author')
                .slice(0, 4)
                .map((attr, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-muted-foreground">{attr.trait_type}:</span>
                    <br />
                    <span className="text-foreground font-medium">{attr.value}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
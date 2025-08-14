"use client";

import { useContractNFTs } from "~/hooks/use-contract-nfts";
import { ContractNFTCard } from "~/components/ContractNFTCard";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Loader2 } from "lucide-react";

export function NFTCollectionViewer() {
  const { isConnected } = useAccount();
  const {
    userNFTs,
    isLoadingUserNFTs,
    error,
  } = useContractNFTs();

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <p className="font-medium">Error loading NFTs:</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 overflow-x-hidden">
      {/* User's NFTs Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {isConnected ? "Your Cast Collectibles" : "Connect Wallet to View Your Cast Collectibles"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <p className="text-center text-muted-foreground py-8">
                Please connect your wallet to view your Cast Collectibles from this collection.
              </p>
            ) : isLoadingUserNFTs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading your Cast Collectibles...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You don&apos;t own any Cast Collectibles from this collection yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {userNFTs.map((nft) => (
                  <ContractNFTCard key={`user-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
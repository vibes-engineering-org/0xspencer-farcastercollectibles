"use client";

import { useContractNFTs } from "~/hooks/use-contract-nfts";
import { ContractNFTCard } from "~/components/ContractNFTCard";
import { Button } from "~/components/ui/button";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Loader2 } from "lucide-react";

export function NFTCollectionViewer() {
  const { isConnected, address } = useAccount();
  const {
    userNFTs,
    recentNFTs,
    isLoadingUserNFTs,
    isLoadingRecentNFTs,
    error,
    loadMoreRecent,
    hasMoreRecent,
    isLoadingMoreRecent,
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
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      {/* User's NFTs Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {isConnected ? "Your NFTs" : "Connect Wallet to View Your NFTs"}
            </CardTitle>
            {isConnected && address && (
              <p className="text-sm text-muted-foreground">
                From contract: 0xc011Ec7Ca575D4f0a2eDA595107aB104c7Af7A09
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <p className="text-center text-muted-foreground py-8">
                Please connect your wallet to view your NFTs from this collection.
              </p>
            ) : isLoadingUserNFTs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading your NFTs...</span>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You don't own any NFTs from this collection yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userNFTs.map((nft) => (
                  <ContractNFTCard key={`user-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Minted Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Recently Minted Casts
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Browse the latest NFTs from this collection, sorted by most recent first.
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingRecentNFTs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading recent NFTs...</span>
              </div>
            ) : recentNFTs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent NFTs found in this collection.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentNFTs.map((nft) => (
                    <ContractNFTCard key={`recent-${nft.tokenId}`} nft={nft} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMoreRecent && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMoreRecent}
                      disabled={isLoadingMoreRecent}
                      variant="outline"
                    >
                      {isLoadingMoreRecent ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading more...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
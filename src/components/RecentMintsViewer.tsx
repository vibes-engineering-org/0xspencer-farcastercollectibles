"use client";

import { useRecentMintEvents } from "~/hooks/use-recent-mint-events";
import { ContractNFTCard } from "~/components/ContractNFTCard";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export function RecentMintsViewer() {
  const {
    recentMints,
    isLoading,
    error,
    refetch,
  } = useRecentMintEvents();

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <p className="font-medium">Error loading recent mints:</p>
              <p>{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 overflow-x-hidden">
      {/* Recent Mints Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Recent Mints
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              The 10 most recently minted Cast Collectibles from contract events
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading recent mints...</span>
              </div>
            ) : recentMints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent mints found. Try refreshing or check back later.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {recentMints.map((nft) => (
                  <ContractNFTCard 
                    key={`recent-${nft.tokenId}-${nft.transactionHash}`} 
                    nft={{
                      tokenId: nft.tokenId,
                      metadata: nft.metadata,
                      contractAddress: nft.contractAddress,
                      chain: nft.chain
                    }} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
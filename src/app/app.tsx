"use client";

import { useState } from "react";
import { NFTCollectionViewer } from "~/components/NFTCollectionViewer";
import { RecentMintsViewer } from "~/components/RecentMintsViewer";
import { Button } from "~/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "recent-mints">("home");

  return (
    <div className="min-h-screen bg-background">
      {/* TEMPLATE_CONTENT_START - Replace content below */}
      <div className="w-full">
        {/* Navigation Header */}
        <div className="w-full border-b bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            {currentView === "home" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("recent-mints")}
                className="flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                <span>Recent Mints</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Collection</span>
              </Button>
            )}
            <div className="text-sm font-medium text-muted-foreground">
              {currentView === "home" ? "Your Collection" : "Recent Mints"}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {currentView === "home" ? (
          <NFTCollectionViewer />
        ) : (
          <RecentMintsViewer />
        )}
      </div>
      {/* TEMPLATE_CONTENT_END */}
    </div>
  );
}

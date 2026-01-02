import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Globe } from "lucide-react";
import GMBSearchModule from "./GMBSearchModule";
import PlatformSearchModule from "./PlatformSearchModule";

const SearchModule = () => {
  const [activeTab, setActiveTab] = useState("gmb");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-14 p-1 bg-secondary/50 border border-border rounded-xl mb-6">
          <TabsTrigger
            value="gmb"
            className="flex items-center gap-2 h-full data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
          >
            <Building2 className="w-5 h-5" />
            <span className="hidden sm:inline">Google My Business</span>
            <span className="sm:hidden">GMB</span>
          </TabsTrigger>
          <TabsTrigger
            value="platform"
            className="flex items-center gap-2 h-full data-[state=active]:bg-card data-[state=active]:shadow-md rounded-lg transition-all"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline">Platform Detection</span>
            <span className="sm:hidden">Platforms</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gmb" className="mt-0">
          <GMBSearchModule />
        </TabsContent>

        <TabsContent value="platform" className="mt-0">
          <PlatformSearchModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchModule;

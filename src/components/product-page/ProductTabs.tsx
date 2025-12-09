"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SizingGuide from "@/components/shared/SizingGuide";

interface ProductTabsProps {
  description: string;
  technicalSpecifications: {
    title: string;
    description: string;
  }[];
  isClothing?: boolean;
  sizingGuide?: {
    title: string;
    headers: string[];
    rows: {
      size: string;
      measurements: string[];
    }[];
  };
}

export function ProductTabs({
  description,
  technicalSpecifications,
  isClothing,
  sizingGuide,
}: ProductTabsProps) {
  return (
    <Tabs
      defaultValue="description"
      className="space-y-6"
    >
      <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-8 pb-4 text-base font-medium text-muted-foreground data-[state=active]:text-primary transition-all"
        >
          Descriere
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-8 pb-4 text-base font-medium text-muted-foreground data-[state=active]:text-primary transition-all"
        >
          Detalii Produs
        </TabsTrigger>
        {isClothing && sizingGuide && (
          <TabsTrigger
            value="sizing"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-8 pb-4 text-base font-medium text-muted-foreground data-[state=active]:text-primary transition-all"
          >
            Ghid Mărimi
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent
        value="description"
        className="prose prose-gray max-w-none mt-6"
      >
        <div
          className="text-base leading-relaxed text-gray-600"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </TabsContent>
      <TabsContent
        value="specifications"
        className="mt-6"
      >
        {technicalSpecifications.length > 0 ? (
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                {technicalSpecifications.map((spec, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "transition-colors hover:bg-gray-50",
                      index !== technicalSpecifications.length - 1 &&
                        "border-b border-gray-100"
                    )}
                  >
                    <td className="py-5 px-6 align-top font-medium text-gray-900 w-[240px]">
                      {spec.title}
                    </td>
                    <td className="py-5 px-6 text-gray-600 leading-relaxed">
                      {spec.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-100 p-6 text-center">
            <p className="text-gray-500">
              Nu există specificații tehnice disponibile
            </p>
          </div>
        )}
      </TabsContent>
      {isClothing && sizingGuide && (
        <TabsContent
          value="sizing"
          className="mt-6"
        >
          <SizingGuide
            title={sizingGuide.title}
            headers={sizingGuide.headers}
            rows={sizingGuide.rows}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

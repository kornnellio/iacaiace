"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductResponse } from "@/lib/database/models/models";
import { cn } from "@/lib/utils";

interface PaddleConfiguration {
  materialId: string;
  shaftTypeId: string;
  bladeAngleId: string;
  lengthId: string;
  partsId: string;
  finalPrice: number;
  configurationSummary: {
    material: string;
    shaftType: string;
    bladeAngle: string;
    length: string;
    parts: string;
  };
}

interface PaddleConfiguratorProps {
  product: ProductResponse;
  selectedVariant: {
    price: number;
    current_sale_percentage: number;
  };
  onConfigurationChange: (config: PaddleConfiguration) => void;
}

export default function PaddleConfigurator({
  product,
  selectedVariant,
  onConfigurationChange,
}: PaddleConfiguratorProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedShaftType, setSelectedShaftType] = useState<string>("");
  const [selectedBladeAngle, setSelectedBladeAngle] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [selectedParts, setSelectedParts] = useState<string>("");

  const configurator = product.paddleConfigurator;

  // Calculate final price based on selections using product variant price as base
  const calculatePrice = () => {
    if (!configurator) return selectedVariant.price;
    
    let totalPrice = selectedVariant.price;

    if (selectedMaterial) {
      const material = configurator.materials.find(m => m.id === selectedMaterial);
      if (material) totalPrice += material.priceModifier;
    }

    if (selectedShaftType) {
      const shaftType = configurator.shaftTypes.find(s => s.id === selectedShaftType);
      if (shaftType) totalPrice += shaftType.priceModifier;
    }

    if (selectedBladeAngle) {
      const bladeAngle = configurator.bladeAngles.find(a => a.id === selectedBladeAngle);
      if (bladeAngle) totalPrice += bladeAngle.priceModifier;
    }

    if (selectedLength) {
      const length = configurator.lengths.find(l => l.id === selectedLength);
      if (length) totalPrice += length.priceModifier;
    }

    if (selectedParts) {
      const parts = configurator.parts.find(p => p.id === selectedParts);
      if (parts) totalPrice += parts.priceModifier;
    }

    return Math.max(0, totalPrice);
  };

  // Check if all required selections are made
  const isConfigurationComplete = () => {
    return selectedMaterial && selectedShaftType && selectedBladeAngle && selectedLength && selectedParts;
  };

  // Update configuration when selections change
  useEffect(() => {
    if (configurator && isConfigurationComplete()) {
      const material = configurator.materials.find(m => m.id === selectedMaterial);
      const shaftType = configurator.shaftTypes.find(s => s.id === selectedShaftType);
      const bladeAngle = configurator.bladeAngles.find(a => a.id === selectedBladeAngle);
      const length = configurator.lengths.find(l => l.id === selectedLength);
      const parts = configurator.parts.find(p => p.id === selectedParts);

      if (material && shaftType && bladeAngle && length && parts) {
        const configuration: PaddleConfiguration = {
          materialId: selectedMaterial,
          shaftTypeId: selectedShaftType,
          bladeAngleId: selectedBladeAngle,
          lengthId: selectedLength,
          partsId: selectedParts,
          finalPrice: calculatePrice(),
          configurationSummary: {
            material: material.name,
            shaftType: shaftType.name,
            bladeAngle: `${bladeAngle.name} (${bladeAngle.angle}°)`,
            length: `${length.name} (${length.length} cm)`,
            parts: `${parts.name} (${parts.pieces} bucăți)`,
          },
        };

        onConfigurationChange(configuration);
      }
    }
  }, [selectedMaterial, selectedShaftType, selectedBladeAngle, selectedLength, selectedParts, configurator, onConfigurationChange]);

  if (!configurator || !configurator.enabled) {
    return null;
  }

  const finalPrice = calculatePrice();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>Configurează-ți vasla</span>
          <Badge variant="outline" className="text-sm">
            {new Intl.NumberFormat("ro-RO", {
              style: "currency",
              currency: "RON",
            }).format(finalPrice)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Material Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Material</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {configurator?.materials.map((material) => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material.id)}
                className={cn(
                  "min-h-[4rem] sm:w-16 sm:h-16 border rounded-lg text-center transition-colors relative flex flex-col items-center justify-center p-2",
                  selectedMaterial === material.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                title={material.name + (material.description ? ` - ${material.description}` : '')}
              >
                <div className="font-medium text-xs leading-tight break-words">{material.name}</div>
                {material.priceModifier !== 0 && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    {material.priceModifier > 0 ? "+" : ""}
                    {material.priceModifier}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Shaft Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Tipul mânerului</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {configurator?.shaftTypes.map((shaftType) => (
              <button
                key={shaftType.id}
                onClick={() => setSelectedShaftType(shaftType.id)}
                className={cn(
                  "min-h-[4rem] sm:w-16 sm:h-16 border rounded-lg text-center transition-colors relative flex flex-col items-center justify-center p-2",
                  selectedShaftType === shaftType.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                title={shaftType.name + (shaftType.description ? ` - ${shaftType.description}` : '')}
              >
                <div className="font-medium text-xs leading-tight break-words">{shaftType.name}</div>
                {shaftType.priceModifier !== 0 && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    {shaftType.priceModifier > 0 ? "+" : ""}
                    {shaftType.priceModifier}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Blade Angle Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Unghiul lamei</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {configurator?.bladeAngles.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedBladeAngle(angle.id)}
                className={cn(
                  "min-h-[4rem] sm:w-16 sm:h-16 border rounded-lg text-center transition-colors flex flex-col items-center justify-center p-2",
                  selectedBladeAngle === angle.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                title={`${angle.name} - ${angle.angle}°`}
              >
                <div className="font-medium text-xs leading-tight break-words">{angle.name}</div>
                <div className="text-xs text-gray-500">{angle.angle}°</div>
              </button>
            ))}
          </div>
        </div>

        {/* Length Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Lungimea</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {configurator?.lengths.map((length) => (
              <button
                key={length.id}
                onClick={() => setSelectedLength(length.id)}
                className={cn(
                  "min-h-[4rem] sm:w-16 sm:h-16 border rounded-lg text-center transition-colors flex flex-col items-center justify-center p-2",
                  selectedLength === length.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                title={`${length.name} - ${length.length} cm`}
              >
                <div className="font-medium text-xs leading-tight break-words">{length.name}</div>
                <div className="text-xs text-gray-500">{length.length}cm</div>
              </button>
            ))}
          </div>
        </div>

        {/* Parts Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Numărul de bucăți</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {configurator?.parts.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedParts(part.id)}
                className={cn(
                  "min-h-[4rem] sm:w-16 sm:h-16 border rounded-lg text-center transition-colors flex flex-col items-center justify-center p-2",
                  selectedParts === part.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                title={`${part.name} - ${part.pieces} bucăți`}
              >
                <div className="font-medium text-xs leading-tight break-words">{part.name}</div>
                <div className="text-xs text-gray-500">{part.pieces}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Summary */}
        {isConfigurationComplete() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Configurația ta:</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div>Material: {configurator?.materials.find(m => m.id === selectedMaterial)?.name}</div>
              <div>Tip mâner: {configurator?.shaftTypes.find(s => s.id === selectedShaftType)?.name}</div>
              <div>Unghi: {configurator?.bladeAngles.find(a => a.id === selectedBladeAngle)?.name} ({configurator?.bladeAngles.find(a => a.id === selectedBladeAngle)?.angle}°)</div>
              <div>Lungime: {configurator?.lengths.find(l => l.id === selectedLength)?.name} ({configurator?.lengths.find(l => l.id === selectedLength)?.length} cm)</div>
              <div>Bucăți: {configurator?.parts.find(p => p.id === selectedParts)?.name} ({configurator?.parts.find(p => p.id === selectedParts)?.pieces} bucăți)</div>
            </div>
            <div className="text-lg font-bold text-blue-900 mt-3">
              Preț total: {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
              }).format(finalPrice)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
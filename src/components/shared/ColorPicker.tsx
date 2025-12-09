"use client"

import React from 'react';
import {Button} from "@/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Input} from "@/components/ui/input"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"

interface Color {
    name: string;
    hex: string;
}

interface ColorPickerProps {
    color?: Partial<Color>;
    onChangeAction: (color: Color) => Promise<void>;
}

const PRESET_COLORS: Color[] = [
    {name: "Red", hex: "#EF4444"},
    {name: "Blue", hex: "#3B82F6"},
    {name: "Green", hex: "#10B981"},
    {name: "Yellow", hex: "#F59E0B"},
    {name: "Purple", hex: "#8B5CF6"},
    {name: "Pink", hex: "#EC4899"},
    {name: "Gray", hex: "#6B7280"},
    {name: "Black", hex: "#000000"},
    {name: "White", hex: "#FFFFFF"},
    {name: "Custom", hex: "#000000"},
];

export default function ColorPicker({color = {}, onChangeAction}: ColorPickerProps) {
    const [customColor, setCustomColor] = React.useState<Color>({
        name: color?.name ?? "",
        hex: color?.hex ?? "#000000"
    });
    const [isCustomDialogOpen, setIsCustomDialogOpen] = React.useState(false);

    // Update customColor when prop color changes
    React.useEffect(() => {
        setCustomColor({
            name: color?.name ?? "",
            hex: color?.hex ?? "#000000"
        });
    }, [color?.name, color?.hex]);

    const handleCustomColorSubmit = async () => {
        try {
            // Only submit if we have both a name and a hex color
            if (customColor.name && customColor.hex) {
                await onChangeAction({
                    name: customColor.name,
                    hex: customColor.hex
                });
                setIsCustomDialogOpen(false);
            }
        } catch (error) {
            console.error('Error updating color:', error);
        }
    };

    const handlePresetColorSelect = async (presetColor: Color) => {
        if (presetColor.name === "Custom") {
            setCustomColor({
                name: color?.name ?? "",
                hex: color?.hex ?? "#000000"
            });
            setIsCustomDialogOpen(true);
        } else {
            try {
                await onChangeAction(presetColor);
            } catch (error) {
                console.error('Error updating color:', error);
            }
        }
    };

    return (
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full border"
                                style={{backgroundColor: color?.hex ?? "#000000"}}
                            />
                            {color?.name || "Select a color"}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    {PRESET_COLORS.map((presetColor) => (
                        <DropdownMenuItem
                            key={presetColor.name}
                            onClick={() => handlePresetColorSelect(presetColor)}
                            className="flex items-center gap-2"
                        >
                            <div
                                className="w-4 h-4 rounded-full border"
                                style={{backgroundColor: presetColor.hex}}
                            />
                            {presetColor.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Custom Color</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="custom-color-name">Color Name</Label>
                            <Input
                                id="custom-color-name"
                                value={customColor.name}
                                onChange={(e) => setCustomColor(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                placeholder="Enter color name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-color-hex">Color Hex Code</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColor.hex}
                                    onChange={(e) => setCustomColor(prev => ({
                                        ...prev,
                                        hex: e.target.value
                                    }))}
                                    className="w-12 p-1 h-10"
                                />
                                <Input
                                    id="custom-color-hex"
                                    value={customColor.hex}
                                    onChange={(e) => setCustomColor(prev => ({
                                        ...prev,
                                        hex: e.target.value
                                    }))}
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => void handleCustomColorSubmit()}
                            className="w-full mt-2"
                            disabled={!customColor.name || !customColor.hex}
                        >
                            Apply Custom Color
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
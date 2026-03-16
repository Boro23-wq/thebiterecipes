"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  Receipt,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { addPantryItemsBatch } from "@/app/dashboard/pantry/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ============================================
// TYPES
// ============================================

interface ParsedItem {
  name: string;
  amount?: string;
  unit?: string;
  category?: string;
  selected: boolean;
}

interface PantryReceiptScannerProps {
  onItemsAdded: () => void;
}

// ============================================
// CATEGORY STYLING
// ============================================

const CATEGORY_PILL: Record<string, string> = {
  produce: "bg-green-100 text-green-700",
  meat: "bg-red-100 text-red-700",
  dairy: "bg-blue-100 text-blue-700",
  pantry: "bg-amber-100 text-amber-700",
  frozen: "bg-cyan-100 text-cyan-700",
  other: "bg-gray-100 text-gray-600",
};

// ============================================
// COMPONENT
// ============================================

export default function PantryReceiptScanner({
  onItemsAdded,
}: PantryReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [step, setStep] = useState<"capture" | "preview">("capture");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setPreviewImage(null);
    setParsedItems([]);
    setStep("capture");
    setIsParsing(false);
    setIsAdding(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) resetState();
    },
    [resetState],
  );

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large — max 10MB");
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    setPreviewImage(URL.createObjectURL(file));
    setIsParsing(true);

    try {
      const response = await fetch("/api/pantry/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });

      if (!response.ok) throw new Error("Failed to parse receipt");

      const { items } = await response.json();

      if (!items || items.length === 0) {
        toast.error("No grocery items found in this image");
        setIsParsing(false);
        return;
      }

      setParsedItems(
        items.map(
          (item: {
            name: string;
            amount?: string;
            unit?: string;
            category?: string;
          }) => ({
            ...item,
            selected: true,
          }),
        ),
      );
      setStep("preview");
    } catch (error) {
      toast.error("Failed to scan receipt — try again");
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
      e.target.value = "";
    },
    [processImage],
  );

  const toggleItem = useCallback((index: number) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const selectAll = useCallback(() => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setParsedItems((prev) =>
      prev.map((item) => ({ ...item, selected: false })),
    );
  }, []);

  const updateItem = useCallback(
    (index: number, updates: Partial<Omit<ParsedItem, "selected">>) => {
      setParsedItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
      );
    },
    [],
  );

  const handleAddItems = useCallback(async () => {
    const selectedItems = parsedItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    setIsAdding(true);

    try {
      await addPantryItemsBatch(
        selectedItems.map((item) => ({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          source: "receipt" as const,
        })),
      );

      toast.success(
        `Added ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} to pantry`,
      );
      onItemsAdded();
      setIsOpen(false);
      resetState();
    } catch (error) {
      toast.error("Failed to add items");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  }, [parsedItems, onItemsAdded, resetState]);

  const selectedCount = parsedItems.filter((item) => item.selected).length;

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        className="shrink-0 border-border-light"
        title="Scan receipt"
      >
        <Receipt className="h-4 w-4" />
      </Button>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Scanner dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md rounded-sm border-border-light p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
          <DialogTitle className="sr-only">Scan receipt</DialogTitle>

          <AnimatePresence mode="wait">
            {step === "capture" && !isParsing && (
              <motion.div
                key="capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center px-6 pt-8 pb-6"
              >
                <div className="w-14 h-14 rounded-sm bg-brand-200 flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-brand" />
                </div>

                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  Scan your receipt
                </h3>
                <p className="text-xs text-text-muted text-center mb-6 leading-relaxed">
                  Take a photo or upload a picture of your grocery receipt.
                  We&apos;ll extract all the items automatically.
                </p>

                <div className="w-full space-y-2">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="brand"
                    className="w-full rounded-sm gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Take a photo
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full rounded-sm gap-2 border-border-light"
                  >
                    <Upload className="h-4 w-4" />
                    Upload a photo
                  </Button>
                </div>
              </motion.div>
            )}

            {isParsing && (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center px-6 py-12"
              >
                {previewImage && (
                  <div className="relative w-16 h-20 rounded-sm overflow-hidden border border-border-light mb-4 opacity-60">
                    <Image
                      src={previewImage}
                      alt="Receipt"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <Loader2 className="h-8 w-8 text-brand animate-spin mb-3" />
                <p className="text-sm font-medium text-text-secondary">
                  Scanning receipt...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Extracting grocery items with AI
                </p>
              </motion.div>
            )}

            {step === "preview" && !isParsing && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col max-h-[85vh]"
              >
                {/* Header — clean, no select/deselect here */}
                <div className="px-4 pt-4 pb-3 border-b border-border-light">
                  <h3 className="text-sm font-semibold text-text-primary mb-0.5">
                    Found {parsedItems.length} item
                    {parsedItems.length !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-[12px] text-text-muted">
                    Uncheck items you don&apos;t want to add
                  </p>
                </div>

                {/* Item list */}
                <div className="flex-1 overflow-y-auto divide-y divide-border-light/50">
                  {parsedItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition",
                        !item.selected && "opacity-40",
                      )}
                    >
                      <button
                        onClick={() => toggleItem(index)}
                        className={cn(
                          "w-5 h-5 rounded-sm border-2 flex items-center cursor-pointer justify-center shrink-0 transition",
                          item.selected
                            ? "bg-brand border-brand"
                            : "border-gray-300 bg-white",
                        )}
                      >
                        {item.selected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>

                      {editingIndex === index ? (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <Input
                            value={item.amount || ""}
                            onChange={(e) =>
                              updateItem(index, { amount: e.target.value })
                            }
                            placeholder="Qty"
                            className="h-7 w-16 text-xs rounded-sm border-border-light"
                          />
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              updateItem(index, { name: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingIndex(null);
                            }}
                            className="h-7 flex-1 text-xs rounded-sm border-border-light"
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="shrink-0 p-1 hover:bg-green-50 rounded-sm transition cursor-pointer"
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {item.amount && (
                                <span className="text-brand font-semibold mr-1">
                                  {item.amount}
                                  {item.unit ? ` ${item.unit}` : ""}
                                </span>
                              )}
                              <span>{item.name}</span>
                            </p>
                          </div>

                          {item.category && (
                            <span
                              className={cn(
                                "text-[9px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 capitalize",
                                CATEGORY_PILL[item.category] ||
                                  CATEGORY_PILL.other,
                              )}
                            >
                              {item.category}
                            </span>
                          )}

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => setEditingIndex(index)}
                              className="p-1.5 hover:bg-muted/50 rounded-sm cursor-pointer transition"
                            >
                              <Edit2 className="h-3 w-3 text-text-muted" />
                            </button>
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1.5 hover:bg-red-50 rounded-sm cursor-pointer transition"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer — select/deselect + counter + actions */}
                <div className="px-4 py-4 border-t border-border-light space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={
                        selectedCount === parsedItems.length
                          ? deselectAll
                          : selectAll
                      }
                      className="text-[11px] text-brand font-medium hover:underline cursor-pointer"
                    >
                      {selectedCount === parsedItems.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                    <span className="text-[11px] text-text-muted">
                      {selectedCount} of {parsedItems.length} selected
                    </span>
                  </div>

                  <Button
                    onClick={handleAddItems}
                    disabled={selectedCount === 0 || isAdding}
                    variant="brand"
                    className="w-full rounded-sm"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""} to pantry`
                    )}
                  </Button>
                  <Button
                    onClick={resetState}
                    variant="text"
                    className="w-full rounded-sm text-text-secondary"
                    disabled={isAdding}
                  >
                    Scan another receipt
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

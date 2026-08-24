"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, RotateCcw, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutlineCard, Theme } from "@/lib/types";
import { containerVariants, itemVariants, themes } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { CardList } from "../common/CardList";
import useScratchStore from "@/store/useScratchStore";
import InlineThemeSelector from "../common/InlineThemeSelector";
import { useAgenticGenerationV2 } from "@/hooks/useAgenticGenerationV2";
import AgenticWorkflowDialog from "@/components/global/agentic-workflow/AgenticWorkflowDialog";
import { useUsageLimit } from "@/hooks/use-usage-limit";

interface ScratchPageProps {
  onBack: () => void;
}

export default function ScratchPage({ onBack }: ScratchPageProps) {
  const { toast } = useToast();
  const [editText, setEditText] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  const { outlines, resetOutlines, addOutline, addMultipleOutlines } =
    useScratchStore();
  const { checkUsage, UsageModal } = useUsageLimit();

  const {
    generate,
    isGenerating,
    progress,
    currentAgentName,
    currentAgentDescription,
    agentSteps,
    runId,
    stream,
  } = useAgenticGenerationV2();

  const handleAddCard = () => {
    const newCard: OutlineCard = {
      id: uuidv4(),
      title: editText || "New Section",
      order: outlines.length + 1,
    };
    setEditText("");
    addOutline(newCard);
  };

  const resetCards = () => {
    setEditText("");
    resetOutlines();
  };

  const handleBack = () => {
    resetOutlines();
    onBack();
  };

  const handleGenerate = async () => {
    if (outlines.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one card to generate PPT",
        variant: "destructive",
      });
      return;
    }

    const canGenerate = await checkUsage();
    if (!canGenerate) return;

    const selectedOutlines = outlines.map((outline) => outline.title);
    const deckTitle = outlines[0]?.title || "Custom Presentation";
    const fullTopic = `${deckTitle}: ${selectedOutlines.join(", ")}`;

    try {
      await generate(
        fullTopic,
        undefined,
        selectedTheme.name,
        selectedOutlines
      );

      toast({
        title: "Success",
        description: "Presentation generation started",
      });

      resetOutlines();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate presentation",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <motion.div
        className="space-y-6 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-left">
          Build Your Outline
        </h1>
        <motion.div
          className="bg-primary/10 p-4 rounded-xl"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center rounded-xl">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter a section title and add it to the deck..."
              className="text-base sm:text-xl border-0 focus-visible:ring-0 shadow-none p-0 bg-transparent grow"
              disabled={isGenerating}
            />

            <div className="flex items-center gap-3">
              <Select
                value={outlines.length > 0 ? outlines.length.toString() : "0"}
                disabled
              >
                <SelectTrigger className="w-fit gap-2 font-semibold shadow-xl">
                  <SelectValue placeholder="Number of cards" />
                </SelectTrigger>
                <SelectContent className="w-fit">
                  {outlines.length === 0 ? (
                    <SelectItem value="0" className="font-semibold">
                      No cards
                    </SelectItem>
                  ) : (
                    Array.from(
                      { length: outlines.length },
                      (_, idx) => idx + 1
                    ).map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="font-semibold"
                      >
                        {num} {num === 1 ? "Card" : "Cards"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                onClick={resetCards}
                size="icon"
                aria-label="Reset cards"
                disabled={isGenerating}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <CardList
          outlines={outlines}
          addOutline={addOutline}
          addMultipleOutlines={addMultipleOutlines}
          editingCard={editingCard}
          selectedCard={selectedCard}
          editText={editText}
          onEditChange={setEditText}
          onCardSelect={setSelectedCard}
          onCardDoubleClick={(id, title) => {
            setEditingCard(id);
            setEditText(title);
          }}
          setEditText={setEditText}
          setEditingCard={setEditingCard}
          setSelectedCard={setSelectedCard}
        />

        <Button
          onClick={handleAddCard}
          variant={"secondary"}
          className="w-full bg-primary-10"
          disabled={isGenerating}
        >
          Add Card
        </Button>

        {outlines.length > 0 && (
          <motion.div variants={itemVariants}>
            <InlineThemeSelector
              themes={themes}
              selectedTheme={selectedTheme}
              onThemeSelect={setSelectedTheme}
              disabled={isGenerating}
            />
          </motion.div>
        )}

        {outlines?.length > 0 && (
          <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Generating...
              </>
            ) : (
              "Generate Presentation"
            )}
          </Button>
        )}
      </motion.div>

      <AgenticWorkflowDialog
        open={isGenerating}
        onOpenChange={() => {}}
        topic={outlines[0]?.title || "Your Presentation"}
        steps={agentSteps}
        currentProgress={progress}
        currentAgentName={currentAgentName}
        currentAgentDescription={currentAgentDescription}
        runId={runId}
        stream={stream}
      />
      <UsageModal />
    </>
  );
}

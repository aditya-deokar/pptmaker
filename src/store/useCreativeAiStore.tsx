import { OutlineCard } from "@/lib/types";
import { create } from "zustand";
import {  persist } from "zustand/middleware";

type CreativeAIStore = {
  currentAiPrompt: string;
  setCurrentAiPrompt: (prompt: string) => void;
  outlines: OutlineCard[] | [];
  addOutline: (outline: OutlineCard) => void;
  addMultipleOutlines: (outlines: OutlineCard[]) => void;
  resetOutlines: () => void;
};

const useCreativeAIStore = create<CreativeAIStore>()(
    persist(
      (set) => ({
        currentAiPrompt: "",
        setCurrentAiPrompt: (prompt: string) => {
          set({ currentAiPrompt: prompt });
        },
        outlines: [],
        addMultipleOutlines: (outlines: OutlineCard[]) => {
          set(() => ({
            outlines: [...outlines],
          }));
        },
        
        addOutline: (outline: OutlineCard) => {
          set((state) => ({
            outlines: [outline, ...state.outlines],
          }));
        },
        resetOutlines: () => {
          set({ outlines: [] });
        },
      }),
      {
        name: "creative-ai", // storage key for the persisted store
      }
    )

);

export default useCreativeAIStore;

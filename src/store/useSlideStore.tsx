import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { ContentItem, Slide, Theme } from "@/lib/types";
import { Project } from "@/generated/prisma";


interface SlideState {
  project: Project | null;
  setProject: (id: Project | null) => void;
  slides: Slide[];
  setSlides: (slides:any) => void;
  currentSlide: number;
  currentTheme: Theme;
  addSlide: (slide: Slide) => void;
  removeSlide: (id: string) => void;
  updateSlide: (id: string, content: ContentItem) => void;
  setCurrentSlide: (index: number) => void;
  updateContentItem: (
    slideId: string,
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void;
  getOrderedSlides: () => Slide[];
  setCurrentTheme: (theme: Theme) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  addSlideAtIndex: (slide: Slide, index: number) => void;
  addComponentInSlide: (
    slideId: string,
    item: ContentItem,
    parentId: string,
    index: number
  ) => void;
  resetSlideStore: () => void;
}

const defaultTheme: Theme = {
  name: "Default",
  fontFamily: "'Inter', sans-serif",
  fontColor: "#333333",
  backgroundColor: "#f0f0f0",
  slideBackgroundColor: "#ffffff",
  accentColor: "#3b82f6",
  type: "light",
};

export const useSlideStore = create(
  persist<SlideState>(
    (set, get) => ({
      project: null,
      setProject: (project) => set({ project }),
      slides: [],
      setSlides: (slides: any) => set({ slides }),
      currentSlide: 0,
      currentTheme: defaultTheme,
      addSlide: (slide: Slide) =>
        set((state) => {
          const newSlides = [...state.slides];
          const insertIndex = slide.slideOrder;
          newSlides.splice(insertIndex, 0, { ...slide, id: uuidv4() });

          for (let i = insertIndex; i < newSlides.length; i++) {
            newSlides[i].slideOrder = i;
          }

          return { slides: newSlides, currentSlide: insertIndex };
        }),
      removeSlide: (id) =>
        set((state) => ({
          slides: state.slides.filter((slide) => slide.id !== id),
        })),
      updateSlide: (id, content) =>
        set((state) => ({
          slides: state.slides.map((slide) =>
            slide.id === id ? { ...slide, content } : slide
          ),
        })),
      setCurrentSlide: (index) => set({ currentSlide: index }),
      updateContentItem: (slideId, contentId, newContent) =>
        set((state) => {
          const updateContentRecursively = (item: ContentItem): ContentItem => {
            if (item.id === contentId) {
              // Ensure newContent matches the correct type
              return { ...item, content: newContent };
            }
            if (
              Array.isArray(item.content) &&
              item.content.every((i) => typeof i !== "string")
            ) {
              return {
                ...item,
                content: item.content.map((subItem) => {
                  if (typeof subItem !== "string") {
                    return updateContentRecursively(subItem as ContentItem);
                  }
                  return subItem; // String remains unchanged
                }) as ContentItem[], // Explicitly type the content as ContentItem[]
              };
            }
            return item;
          };

          return {
            slides: state.slides.map((slide) =>
              slide.id === slideId
                ? { ...slide, content: updateContentRecursively(slide.content) }
                : slide
            ),
          };
        }),

      getOrderedSlides: () => {
        const state = get();
        return Array.isArray(state.slides)
          ? [...state.slides].sort((a, b) => a.slideOrder! - b.slideOrder!)
          : [];
      },
      setCurrentTheme: (theme: Theme) => set({ currentTheme: theme }),
      reorderSlides: (fromIndex: number, toIndex: number) =>
        set((state) => {
          const newSlides = [...state.slides];
          const [removed] = newSlides.splice(fromIndex, 1);
          newSlides.splice(toIndex, 0, removed);
          return {
            slides: newSlides.map((slide, index) => ({
              ...slide,
              slideOrder: index,
            })),
          };
        }),
      addSlideAtIndex: (slide: Slide, index: number) =>
        set((state) => {
          const newSlides = [...state.slides];
          newSlides.splice(index, 0, { ...slide, id: uuidv4() });

          newSlides.forEach((s, i) => {
            s.slideOrder = i;
          });

          return { slides: newSlides, currentSlide: index };
        }),
        addComponentInSlide: (
          slideId: string,
          item: ContentItem,
          parentId: string,
          index: number
        ) => {
          set((state) => {
            const updatedSlides = state.slides.map((slide) => {
              if (slide.id !== slideId) return slide;
        
              const updateContent = (content: ContentItem): ContentItem => {
                // Check if this is the direct parent
                if (content.id === parentId) {
                  return {
                    ...content,
                    content: [
                      ...(content.content as ContentItem[]).slice(0, index),
                      item,
                      ...(content.content as ContentItem[]).slice(index)
                    ]
                  };
                }
        
                // Recursively search nested content
                if (Array.isArray(content.content)) {
                  return {
                    ...content,
                    content: (content.content as ContentItem[]).map(updateContent)
                  };
                }
        
                return content;
              };
        
              return {
                ...slide,
                content: updateContent(slide.content)
              };
            });
        
            return { slides: updatedSlides };
          });
        },
      resetSlideStore: () => {
        console.log("🟢 Resetting slide store");
        set({
          project: null,
          slides: [],
          currentSlide: 0,
          currentTheme: defaultTheme,
        });
        localStorage.removeItem("slides-storage"); // 👈 Clears persisted data too
      },
    }),
    {
      name: "slides-storage",
    }
  )
);
"use client";

import { ContentItem } from "@/lib/types";
import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useDrag } from "react-dnd";
import { cn } from "@/lib/utils";
import DropZone from "./DropZone";
import { Heading1, Heading2, Heading3, Heading4, Title } from "@/components/global/editor/compontents/Headings";
import Paragraph from "@/components/global/editor/compontents/Paragraph";
import ColumnComponent from "@/components/global/editor/compontents/ColumnComponent";
import BlockQuote from "@/components/global/editor/compontents/BlockQuote";
import ListComponents, { BulletList, TodoList } from "@/components/global/editor/compontents/ListComponents";
import CalloutBox from "@/components/global/editor/compontents/CalloutBox";
import CodeBlock from "@/components/global/editor/compontents/CodeBlock";
import TableOfContents from "@/components/global/editor/compontents/TableOfContents";
import Divider from "@/components/global/editor/compontents/Divider";
import CustomImage from "@/components/global/editor/compontents/ImageComponent";
import TableComponent from "@/components/global/editor/compontents/TableComponent";
import StatBox from "@/components/global/editor/compontents/StatBox";
import TimelineCard from "@/components/global/editor/compontents/TimelineCard";
import {
  getComponentAccessibility,
  getComponentStyling,
  canEditComponent,
} from "@/lib/slideComponents";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSlideStore } from "@/store/useSlideStore";
import { AnimatePresence } from "framer-motion";
import ResizableComponent from "./ResizableComponent";

type MasterRecursiveComponentProps = {
  content: ContentItem;
  onContentChange: (
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void;
  isPreview?: boolean;
  isEditable?: boolean;
  slideId: string;
  index?: number;
};

/**
 * Enhanced animation configurations for different component types
 */
const getAnimationConfig = (contentType: string) => {
  const baseVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const animations: Record<string, any> = {
    heading1: {
      hidden: { opacity: 0, scale: 0.9, y: 10 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, type: "spring", stiffness: 100, damping: 20 } },
    },
    title: {
      hidden: { opacity: 0, y: -30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.7, type: "spring", damping: 15 } },
    },
    image: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
    },
    calloutBox: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
    },
  };

  return {
    variants: animations[contentType] || baseVariants,
    initial: "hidden",
    animate: "visible",
  };
};

const ContentRenderer: React.FC<MasterRecursiveComponentProps> = React.memo(
  ({ content, onContentChange, slideId, index, isPreview, isEditable }) => {
    // Safety check: if content or content.type is undefined, return null early
    if (!content || !content.type) {
      // Don't spam console - silently skip invalid content
      return null;
    }

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onContentChange(content.id, e.target.value);
      },
      [content.id, onContentChange]
    );

    const commonProps = {
      placeholder: content.placeholder,
      value: content.content as string,
      onChange: handleChange,
      isPreview: isPreview,
      styles: {
        fontSize: content.fontSize,
        fontWeight: content.fontWeight,
        fontStyle: content.fontStyle,
        textDecoration: content.textDecoration,
        color: content.color,
        textAlign: content.textAlign as any,
      }
    };

    const animationProps = getAnimationConfig(content.type);

    // Get accessibility attributes from advanced component system
    const getAccessibilityProps = (contentType: string) => {
      try {
        const a11y = getComponentAccessibility({ type: contentType } as any);
        return {
          role: a11y?.role,
          'aria-label': a11y?.ariaLabel,
        };
      } catch {
        return {};
      }
    };

    // Get styling classes from advanced component system
    const getStylingClasses = (contentType: string) => {
      try {
        const styling = getComponentStyling({ type: contentType } as any);
        return styling?.defaultClasses || '';
      } catch {
        return '';
      }
    };

    // Enhanced heading components with accessibility
    const renderHeading = (
      HeadingComponent: React.ComponentType<any>,
      level: number
    ) => (
      <motion.div
        className="w-full h-fit"
        {...animationProps}
        {...getAccessibilityProps(`heading${level}`)}
      >
        <HeadingComponent {...commonProps} />
      </motion.div>
    );

    switch (content.type) {
      case "heading1":
        return renderHeading(Heading1, 1);

      case "heading2":
        return renderHeading(Heading2, 2);

      case "heading3":
        return renderHeading(Heading3, 3);

      case "heading4":
        return renderHeading(Heading4, 4);

      case "title":
        return (
          <motion.div
            className="w-full h-fit"
            {...animationProps}
            {...getAccessibilityProps('title')}
          >
            <Title {...commonProps} />
          </motion.div>
        );

      case "paragraph":
        return (
          <motion.div
            className="w-full h-fit"
            {...animationProps}
            {...getAccessibilityProps('paragraph')}
          >
            <Paragraph {...commonProps} />
          </motion.div>
        );

      case "table":
        return (
          <motion.div {...getAccessibilityProps('table')}>
            <TableComponent
              content={content.content as string[][]}
              onChange={(newContent) =>
                onContentChange(
                  content.id,
                  newContent !== null ? newContent : ""
                )
              }
              initialRowSize={content.initialColumns}
              initialColSize={content.initialRows}
              isPreview={isPreview}
              isEditable={isEditable}
            />
          </motion.div>
        );

      case "resizable-column":
        if (Array.isArray(content.content)) {
          return (
            <motion.div {...animationProps} className="w-full h-full">
              <ColumnComponent
                content={content.content as ContentItem[]}
                onContentChange={onContentChange}
                slideId={slideId}
                isPreview={isPreview}
                isEditable={isEditable}
              />
            </motion.div>
          );
        }
        return null;

      case "image":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-full"
            {...getAccessibilityProps('image')}
          >
            <CustomImage
              src={(content.content as string) || "/placeholder.svg"}
              alt={content.alt || "image"}
              className={content.className}
              isPreview={isPreview}
              contentId={content.id}
              onContentChange={onContentChange}
              isEditable={isEditable}
            />
          </motion.div>
        );

      case "blockquote":
        return (
          <motion.div
            {...animationProps}
            className={cn("w-full h-fit flex flex-col", content.className)}
            {...getAccessibilityProps('blockquote')}
          >
            <BlockQuote>
              <Paragraph {...commonProps} />
            </BlockQuote>
          </motion.div>
        );

      case "numberedList":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('numberedList')}
          >
            <ListComponents
              items={content.content as string[]}
              onChange={(newItems) => onContentChange(content.id, newItems)}
              className={content.className}
            />
          </motion.div>
        );

      case "bulletList":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('bulletList')}
          >
            <BulletList
              items={content.content as string[]}
              onChange={(newItems) => onContentChange(content.id, newItems)}
              className={content.className}
            />
          </motion.div>
        );

      case "todoList":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('todoList')}
          >
            <TodoList
              items={content.content as string[]}
              onChange={(newItems) => onContentChange(content.id, newItems)}
              className={content.className}
            />
          </motion.div>
        );

      case "calloutBox":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('calloutBox')}
          >
            <CalloutBox
              type={content.callOutType || "info"}
              className={content.className}
            >
              <Paragraph {...commonProps} />
            </CalloutBox>
          </motion.div>
        );

      case "codeBlock":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('codeBlock')}
          >
            <CodeBlock
              code={content.code}
              language={content.language}
              onChange={() => { }}
              className={content.className}
            />
          </motion.div>
        );

      case "tableOfContents":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('tableOfContents')}
          >
            <TableOfContents
              items={content.content as string[]}
              onItemClick={(id) => {
                console.log(`Navigate to section: ${id}`);
              }}
              className={content.className}
            />
          </motion.div>
        );

      case "divider":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('divider')}
          >
            <Divider className={content.className as string} />
          </motion.div>
        );

      case "statBox":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('statBox')}
          >
            <StatBox
              className={content.className}
              icon={content.icon}
              label={content.label}
              value={typeof content.content === 'string' ? content.content : "0"}
              isPreview={isPreview}
              isEditable={isEditable}
              onChange={(_field, val) => {
                if (_field === 'value') onContentChange(content.id, val);
                // In a fully featured editor, we would dispatch updateComponent(slideId, content.id, { [_field]: val })
              }}
            />
          </motion.div>
        );

      case "timelineCard":
        return (
          <motion.div
            {...animationProps}
            className="w-full h-fit"
            {...getAccessibilityProps('timelineCard')}
          >
            <TimelineCard
              className={content.className}
              title={typeof content.content === 'string' ? content.content : "Milestone"}
              isPreview={isPreview}
              isEditable={isEditable}
              onChange={(_field, val) => {
                if (_field === 'title') onContentChange(content.id, val);
              }}
            />
          </motion.div>
        );

      case "column":
        if (Array.isArray(content.content)) {
          return (
            <motion.div
              {...animationProps}
              className={cn("w-full h-full flex flex-col", content.className)}
            >
              {content.content.length > 0 ? (
                (content.content as ContentItem[]).map(
                  (subItem: ContentItem, subIndex: number) => (
                    <React.Fragment key={subItem.id || `item-${subIndex}`}>
                      {!isPreview &&
                        !subItem.restrictToDrop &&
                        subIndex === 0 &&
                        isEditable && (
                          <DropZone
                            index={0}
                            parentId={content.id}
                            slideId={slideId}
                          />
                        )}
                      <MasterRecursiveComponent
                        content={subItem}
                        onContentChange={onContentChange}
                        isPreview={isPreview}
                        slideId={slideId}
                        index={subIndex}
                        isEditable={isEditable}
                      />
                      {!isPreview && !subItem.restrictToDrop && isEditable && (
                        <DropZone
                          index={subIndex + 1}
                          parentId={content.id}
                          slideId={slideId}
                        />
                      )}
                    </React.Fragment>
                  )
                )
              ) : !isPreview && isEditable ? (
                <DropZone index={0} parentId={content.id} slideId={slideId} />
              ) : null}
            </motion.div>
          );
        }
        return null;

      default:
        // Fallback for unknown component types
        console.warn(`Unknown component type: ${content.type}`);
        return null;
    }
  }
);
ContentRenderer.displayName = "ContentRenderer";

export const MasterRecursiveComponent: React.FC<MasterRecursiveComponentProps> =
  React.memo(
    ({
      content,
      onContentChange,
      slideId,
      index,
      isPreview = false,
      isEditable = true,
    }) => {
      const { removeComponentFromSlide, selectedComponentId, setSelectedComponent } = useSlideStore();
      const isSelected = selectedComponentId === content.id;

      if (isPreview) {
        return (
          <ResizableComponent
            content={content}
            slideId={slideId}
            isEditable={isEditable}
            isPreview={isPreview}
          >
            <ContentRenderer
              content={content}
              onContentChange={onContentChange}
              isPreview={isPreview}
              isEditable={isEditable}
              slideId={slideId}
              index={index}
            />
          </ResizableComponent>
        );
      }

      const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeComponentFromSlide(slideId, content.id);
      };

      const [{ isDragging }, drag] = useDrag({
        type: 'SLIDE_ITEM',
        item: { type: 'move', id: content.id },
        canDrag: isEditable && !content.restrictToDrop,
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      });

      return (
        <ResizableComponent
          content={content}
          slideId={slideId}
          isEditable={isEditable}
          isPreview={isPreview}
        >
          <motion.div
            layout
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => {
                if (isEditable) {
                    e.stopPropagation();
                    setSelectedComponent(content.id);
                }
            }}
            className={cn(
              "group/item relative w-full h-full transition-all duration-300 rounded-lg",
              isDragging && "opacity-50",
              isSelected ? "ring-2 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "hover:ring-1 hover:ring-primary/30"
            )}
          >
            <ContentRenderer
              content={content}
              onContentChange={onContentChange}
              isPreview={isPreview}
              isEditable={isEditable}
              slideId={slideId}
              index={index}
            />
            {isEditable && (
              <div className="absolute -top-2 -right-2 opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-50 flex gap-1">
                <div
                  ref={drag as unknown as React.RefObject<HTMLDivElement>}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 rounded-full shadow-md hover:bg-blue-100"
                  >
                    <GripVertical className="h-3 w-3 text-blue-600" />
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full shadow-md"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </motion.div>
        </ResizableComponent>
      );
    }
  );

MasterRecursiveComponent.displayName = "MasterRecursiveComponent";

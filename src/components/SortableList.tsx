import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="cursor-move">
        {children}
      </div>
    </div>
  );
}

interface SortableListProps<T> {
  items: T[];
  onReorder: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  enabled?: boolean;
}

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className = '',
  enabled = true,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => keyExtractor(item) === active.id);
      const newIndex = items.findIndex(item => keyExtractor(item) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          await onReorder(oldIndex, newIndex);
        } catch (error) {
          console.error('Failed to reorder items:', error);
        }
      }
    }
  };

  // If not enabled, render normal list
  if (!enabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={keyExtractor(item)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(keyExtractor)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableItem key={keyExtractor(item)} id={keyExtractor(item)}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

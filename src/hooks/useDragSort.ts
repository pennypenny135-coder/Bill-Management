import { useRef, useState } from 'react';

/**
 * Generic drag-to-reorder hook using HTML5 Drag & Drop API.
 * No external dependencies required.
 *
 * Usage:
 *   const drag = useDragSort(items, (from, to) => reorderFn(from, to));
 *   <div {...drag.containerProps}>
 *     {items.map((item, i) => (
 *       <div key={item.id} {...drag.itemProps(i)} style={drag.itemStyle(i)}>
 *         <GripVertical {...drag.handleProps} />
 *         ...
 *       </div>
 *     ))}
 *   </div>
 */
export function useDragSort<T>(
  _items: T[],
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const dragIndex  = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const containerProps = {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
  };

  const itemProps = (index: number) => ({
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      dragIndex.current = index;
      e.dataTransfer.effectAllowed = 'move';
      // Slight delay so the ghost image renders before the style changes
      setTimeout(() => setOverIndex(index), 0);
    },
    onDragEnter: () => setOverIndex(index),
    onDragEnd: () => {
      if (dragIndex.current !== null && overIndex !== null && dragIndex.current !== overIndex) {
        onReorder(dragIndex.current, overIndex);
      }
      dragIndex.current = null;
      setOverIndex(null);
    },
  });

  // Visual feedback: highlight drop target
  const itemStyle = (index: number): React.CSSProperties => ({
    opacity: dragIndex.current === index ? 0.4 : 1,
    borderTop: overIndex === index && dragIndex.current !== null && dragIndex.current !== index
      ? '2px solid #6366f1'
      : '2px solid transparent',
    transition: 'opacity 150ms, border-top 80ms',
    cursor: 'grab',
  });

  // Attach to the drag handle icon
  const handleProps = {
    style: { cursor: 'grab' } as React.CSSProperties,
  };

  return { containerProps, itemProps, itemStyle, handleProps, draggingIndex: dragIndex.current, overIndex };
}

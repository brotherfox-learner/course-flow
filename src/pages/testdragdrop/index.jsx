import React, { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

import { Column } from './Column.jsx';
import { Item } from './Item.jsx';

export default function App() {
  const [items, setItems] = useState({
    A: ['A0', 'A1', 'A2'],
    B: ['B0', 'B1'],
    C: [],
  });

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const column = active.data.current.column;

    if (active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev[column].indexOf(active.id);
        const newIndex = prev[column].indexOf(over.id);

        return {
          ...prev,
          [column]: arrayMove(prev[column], oldIndex, newIndex),
        };
      });
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="Root">
        {Object.entries(items).map(([column, columnItems]) => (
          <SortableContext
            key={column}
            items={columnItems}
          >
            <Column id={column}>
              {columnItems.map((id, index) => (
                <Item
                  key={id}
                  id={id}
                  index={index}
                  column={column}
                />
              ))}
            </Column>
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
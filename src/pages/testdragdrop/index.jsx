import React, {useState} from 'react';
import {DragDropProvider} from '@dnd-kit/react';
import { arrayMove } from '@dnd-kit/sortable';
import { Column } from './Column';
import { Item } from './item';

export default function App() {
  const [items] = useState({
    A: ['A0', 'A1', 'A2'],
    B: ['B0', 'B1'],
    C: [],
  });

  return (
    <DragDropProvider
      onDragOver={(event) => {
        setItems((items) => arrayMove(items, event));
      }}
    >
      <div className="Root">
        {Object.entries(items).map(([column, items]) => (
          <Column key={column} id={column}>
            {items.map((id, index) => (
              <Item key={id} id={id} index={index} column={column} />
            ))}
          </Column>
        ))}
      </div>
    </DragDropProvider>
  );
}
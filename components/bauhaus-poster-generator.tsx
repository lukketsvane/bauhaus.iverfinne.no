"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const GRID_COLS = 4;
const GRID_ROWS = 5;
const POSTER_ASPECT_RATIO = GRID_COLS / GRID_ROWS; // Determined by grid
const MIN_SHAPES = 5;
const MAX_SHAPES = 9; // Slightly more shapes might be needed for grid density
const MIN_SPAN = 1;
const MAX_SPAN = 2; // Max span for width/height to avoid overly dominant shapes

const BAUHAUS_PALETTE = {
  yellow: "#F2CC0C",
  blue: "#1D71B8",
  red: "#E30613",
  black: "#000000",
  background: "#F7F3E8",
};

const SHAPE_COLORS = [
  BAUHAUS_PALETTE.yellow,
  BAUHAUS_PALETTE.blue,
  BAUHAUS_PALETTE.red,
  BAUHAUS_PALETTE.black,
];

// --- Helper Functions ---
const getRandom = (min, max) => Math.random() * (max - min) + min;
const getRandomInt = (min, max) => Math.floor(getRandom(min, max + 1));
const getRandomColor = () => SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];

// --- Shape Interface (TypeScript - optional but good practice) ---
interface GridShape {
  id: string;
  type: 'rectangle' | 'circle';
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  color: string;
}

// --- Grid-Based Shape Generation Logic ---
const generateGridShapes = (): GridShape[] => {
  const numShapes = getRandomInt(MIN_SHAPES, MAX_SHAPES);
  const newShapes: GridShape[] = [];
  // Optional: Keep track of occupied cells if strict non-overlap is needed
  // const occupied = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false));

  for (let i = 0; i < numShapes; i++) {
    let colStart, rowStart, colSpan, rowSpan;
    let validPlacement = false;
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops if grid gets too full

    // --- Find a valid placement (basic random placement with overlap allowed) ---
    // For more complex logic (e.g., preventing overlap), this loop would be needed.
    // For simple overlap, we just calculate randomly once.
    colStart = getRandomInt(1, GRID_COLS);
    rowStart = getRandomInt(1, GRID_ROWS);

    // Ensure span doesn't exceed grid boundaries from the start position
    const maxPossibleColSpan = Math.min(MAX_SPAN, GRID_COLS - colStart + 1);
    const maxPossibleRowSpan = Math.min(MAX_SPAN, GRID_ROWS - rowStart + 1);

    colSpan = getRandomInt(MIN_SPAN, maxPossibleColSpan);
    rowSpan = getRandomInt(MIN_SPAN, maxPossibleRowSpan);

    const type = Math.random() > 0.35 ? 'rectangle' : 'circle'; // More likely rectangle

    // If Circle, try to make it squarish if possible within spans
    let finalColSpan = colSpan;
    let finalRowSpan = rowSpan;
    if (type === 'circle') {
        const minDim = Math.min(finalColSpan, finalRowSpan);
        // Optional: Force circles to be square grid areas?
        // finalColSpan = minDim;
        // finalRowSpan = minDim;
         // Make circles prefer square aspect ratios if span allows
        if (finalColSpan > 1 || finalRowSpan > 1) {
            const size = Math.min(finalColSpan, finalRowSpan);
            finalColSpan = size;
            finalRowSpan = size;
        }
    }


    newShapes.push({
      id: uuidv4(),
      type,
      colStart,
      rowStart,
      colSpan: finalColSpan,
      rowSpan: finalRowSpan,
      color: getRandomColor(),
    });
  }

  // Optional: Sort shapes for predictable overlap (e.g., smaller shapes on top)
  // newShapes.sort((a, b) => (a.colSpan * a.rowSpan) - (b.colSpan * b.rowSpan));

  return newShapes;
};


// --- React Component ---
export default function BauhausGridGenerator() {
  const [shapes, setShapes] = useState<GridShape[]>([]);

  // Generate initial shapes
  useEffect(() => {
    setShapes(generateGridShapes());
  }, []);

  const regenerateLayout = () => {
    setShapes(generateGridShapes());
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col justify-center items-center p-5 sm:p-10"
      style={{ backgroundColor: BAUHAUS_PALETTE.background }}
    >
      {/* Poster Container */}
      <div
        className="relative w-full max-w-md bg-black shadow-lg cursor-pointer mb-6 p-1" // Black background for gaps, padding creates border
        style={{
          aspectRatio: POSTER_ASPECT_RATIO,
          // Use grid layout here
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          gap: '2px', // Creates the grid lines using the container's bg color
        }}
        onClick={regenerateLayout}
        aria-label="Generative Bauhaus Grid Poster. Click to regenerate."
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') regenerateLayout(); }}
      >
        {/* Shape Rendering using Grid Positioning */}
        {/* Use AnimatePresence to animate shapes entering/leaving */}
        <AnimatePresence>
          {shapes.map((shape, index) => (
            <motion.div
              key={shape.id} // Unique ID for animation tracking
              layout // Enables smooth layout transitions
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: 1,
                scale: 1,
                backgroundColor: shape.color,
                borderRadius: shape.type === 'circle' ? '50%' : '0%',
                // Grid positioning styles are applied directly here
                gridColumnStart: shape.colStart,
                gridColumnEnd: shape.colStart + shape.colSpan,
                gridRowStart: shape.rowStart,
                gridRowEnd: shape.rowStart + shape.rowSpan,
                // zIndex: index // Helps control overlap if needed, rendered order often suffices
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              // Style is applied by animate, but set defaults
              style={{
                 backgroundColor: shape.color, // Initial color needed
                 borderRadius: shape.type === 'circle' ? '50%' : '0%',
                 // Ensure grid properties are set for initial render if needed, though animate handles it
                 gridColumnStart: shape.colStart,
                 gridColumnEnd: shape.colStart + shape.colSpan,
                 gridRowStart: shape.rowStart,
                 gridRowEnd: shape.rowStart + shape.rowSpan,
                 zIndex: index, // Control stacking order explicitly
              }}
              // className="w-full h-full" // Ensure div tries to fill its grid area
            />
          ))}
        </AnimatePresence>
         {/* Render empty divs for unoccupied cells if you want hover effects etc. */}
         {/* Or rely on the container background and gap */}
      </div>

      {/* Text Area Below Poster (Same as before) */}
      <div className="w-full max-w-md text-center px-2">
        <h2
            className="font-sans font-bold text-2xl sm:text-3xl tracking-wide mb-2"
            style={{ color: BAUHAUS_PALETTE.black }}
         >
            BAUHAUS AUSSTELLUNG
         </h2>
         <div className="flex justify-between items-end mt-1">
            <p
                className="text-xs sm:text-sm text-left font-sans"
                style={{ color: BAUHAUS_PALETTE.black, lineHeight: '1.4' }}
            >
                The Staatliches Bauhaus, commonly known as the Bauhaus,
                was a German art school operational from 1919 to 1933
                that combined crafts and the fine arts.
            </p>
            <p
                className="text-lg sm:text-xl font-bold font-sans ml-4 flex-shrink-0"
                style={{ color: BAUHAUS_PALETTE.black }}
            >
                1923
                <span className="block text-xs font-normal -mt-1">July - September</span>
            </p>
         </div>
      </div>
    </div>
  );
}


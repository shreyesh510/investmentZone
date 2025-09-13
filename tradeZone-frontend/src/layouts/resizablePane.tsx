import { memo, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface ResizablePaneProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  initialLeftWidth?: number; // Percentage (0-100)
  minLeftWidth?: number; // Percentage (0-100)
  maxLeftWidth?: number; // Percentage (0-100)
  isDarkMode?: boolean;
  className?: string;
}

const ResizablePane = memo(function ResizablePane({
  leftPane,
  rightPane,
  initialLeftWidth = 70,
  minLeftWidth = 30,
  maxLeftWidth = 80,
  isDarkMode = false,
  className = ''
}: ResizablePaneProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate new left width as percentage
    const newLeftWidth = (mouseX / containerWidth) * 100;
    
    // Constrain within min/max bounds
    const constrainedWidth = Math.max(
      minLeftWidth,
      Math.min(maxLeftWidth, newLeftWidth)
    );
    
    setLeftWidth(constrainedWidth);
  }, [isResizing, minLeftWidth, maxLeftWidth]);

  // Mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResize, stopResize]);

  const rightWidth = 100 - leftWidth;

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      {/* Left Pane */}
      <div 
        style={{ width: `${leftWidth}%` }}
        className="overflow-hidden"
      >
        {leftPane}
      </div>

      {/* Resizable Divider */}
      <div
        className={`
          relative w-1 cursor-col-resize group hover:w-2 transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-600 hover:bg-blue-500' 
            : 'bg-gray-300 hover:bg-blue-500'
          }
          ${isResizing ? 'bg-blue-500 w-2' : ''}
        `}
        onMouseDown={startResize}
      >
        {/* Drag handle - visible on hover */}
        <div className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-1 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${isDarkMode ? 'bg-white' : 'bg-gray-600'}
          ${isResizing ? 'opacity-100' : ''}
        `}>
          {/* Grip dots */}
          <div className="flex flex-col items-center justify-center h-full space-y-0.5">
            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} />
            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} />
            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} />
          </div>
        </div>

        {/* Tooltip */}
        <div className={`
          absolute top-1/2 left-6 transform -translate-y-1/2 px-2 py-1 rounded text-xs
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
          whitespace-nowrap z-50
          ${isDarkMode 
            ? 'bg-gray-800 text-white border border-gray-600' 
            : 'bg-white text-gray-800 border border-gray-200'
          }
          ${isResizing ? 'opacity-100' : ''}
        `}>
          Drag to resize
        </div>
      </div>

      {/* Right Pane */}
      <div 
        style={{ width: `${rightWidth}%` }}
        className="overflow-hidden"
      >
        {rightPane}
      </div>
    </div>
  );
});

export default ResizablePane;

export interface DragAndDropOptions {
  index: number;
  onDragStart?: (index: number) => void;
  onDragEnter?: (index: number) => void;
  onDrop?: (e: DragEvent, index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function dragAndDrop(node: HTMLElement, options: DragAndDropOptions) {
  let { index, onDragStart, onDragEnter, onDrop, onDragEnd, isDragging, isDragOver } = options;

  const isFormElement = (element: HTMLElement) => {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT';
  };

  const handleDragStart = (e: DragEvent) => {
    // Prevent drag if it originated from an input, textarea, or select element
    const target = e.target as HTMLElement;
    if (isFormElement(target)) {
      e.preventDefault();
      return;
    }
    onDragStart?.(index);
  };

  const handleDragEnter = () => {
    onDragEnter?.(index);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    onDrop?.(e, index);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  // Disable draggable when focusing on form elements (fixes Firefox input interaction)
  const handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (isFormElement(target)) {
      node.setAttribute('draggable', 'false');
    }
  };

  const handleFocusOut = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (isFormElement(target)) {
      node.setAttribute('draggable', 'true');
    }
  };

  node.setAttribute('draggable', 'true');
  node.setAttribute('role', 'button');
  node.setAttribute('tabindex', '0');

  node.addEventListener('dragstart', handleDragStart);
  node.addEventListener('dragenter', handleDragEnter);
  node.addEventListener('dragover', handleDragOver);
  node.addEventListener('drop', handleDrop);
  node.addEventListener('dragend', handleDragEnd);
  node.addEventListener('focusin', handleFocusIn);
  node.addEventListener('focusout', handleFocusOut);

  // Update classes based on drag state
  const updateClasses = (dragging: boolean, dragOver: boolean) => {
    // Remove all drag-related classes first
    node.classList.remove('opacity-50', 'border-gray-400', 'dark:border-gray-500', 'border-solid');

    // Add back only the active ones
    if (dragging) {
      node.classList.add('opacity-50');
    }

    if (dragOver) {
      node.classList.add('border-gray-400', 'dark:border-gray-500', 'border-solid');
      node.classList.remove('border-transparent');
    } else {
      node.classList.add('border-transparent');
    }
  };

  updateClasses(isDragging || false, isDragOver || false);

  return {
    update(newOptions: DragAndDropOptions) {
      index = newOptions.index;
      onDragStart = newOptions.onDragStart;
      onDragEnter = newOptions.onDragEnter;
      onDrop = newOptions.onDrop;
      onDragEnd = newOptions.onDragEnd;

      const newIsDragging = newOptions.isDragging || false;
      const newIsDragOver = newOptions.isDragOver || false;

      if (newIsDragging !== isDragging || newIsDragOver !== isDragOver) {
        isDragging = newIsDragging;
        isDragOver = newIsDragOver;
        updateClasses(isDragging, isDragOver);
      }
    },
    destroy() {
      node.removeEventListener('dragstart', handleDragStart);
      node.removeEventListener('dragenter', handleDragEnter);
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('drop', handleDrop);
      node.removeEventListener('dragend', handleDragEnd);
      node.removeEventListener('focusin', handleFocusIn);
      node.removeEventListener('focusout', handleFocusOut);
    },
  };
}

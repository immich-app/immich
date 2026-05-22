import type { Attachment } from 'svelte/attachments';

export interface DragAndDropOptions {
  index: number;
  onDragStart?: (index: number) => void;
  onDragEnter?: (index: number) => void;
  onDrop?: (e: DragEvent, index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function dragAndDrop(options: DragAndDropOptions): Attachment {
  return (node: Element) => {
    const element = node as HTMLElement;
    const { index, onDragStart, onDragEnter, onDrop, onDragEnd, isDragging, isDragOver } = options;

    const isFormElement = (el: HTMLElement) => {
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
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
        element.setAttribute('draggable', 'false');
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isFormElement(target)) {
        element.setAttribute('draggable', 'true');
      }
    };

    // Update classes based on drag state
    const updateClasses = (dragging: boolean, dragOver: boolean) => {
      // Remove all drag-related classes first
      element.classList.remove('opacity-50', 'border-light-500', 'border-solid');

      // Add back only the active ones
      if (dragging) {
        element.classList.add('opacity-50');
      }

      if (dragOver) {
        element.classList.add('border-light-500', 'border-solid');
        element.classList.remove('border-transparent');
      } else {
        element.classList.add('border-transparent');
      }
    };

    element.setAttribute('draggable', 'true');
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragend', handleDragEnd);
    element.addEventListener('focusin', handleFocusIn);
    element.addEventListener('focusout', handleFocusOut);

    updateClasses(isDragging || false, isDragOver || false);

    return () => {
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
      element.removeEventListener('dragend', handleDragEnd);
      element.removeEventListener('focusin', handleFocusIn);
      element.removeEventListener('focusout', handleFocusOut);
    };
  };
}

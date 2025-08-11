function makeDraggableAndResizable(element) {
    // Add event listeners for dragging
    let isDragging = false;
    let startX, startY, startLeft, startTop;
  
    element.addEventListener('mousedown', (e) => {
      if (e.target === element) { // Only drag when clicking the main element
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(window.getComputedStyle(element).left) || 0;
        startTop = parseInt(window.getComputedStyle(element).top) || 0;
        element.style.zIndex = 1000; // Bring the dragged item to the top
      }
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = `${startLeft + dx}px`;
        element.style.top = `${startTop + dy}px`;
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.style.zIndex = ''; // Reset z-index
    });
  
    // Add CSS resize support
    element.style.resize = 'both';
    element.style.overflow = 'hidden';
  }
  
  // Initialize on elements with class "draggable-resizable"
  document.querySelectorAll('.draggable-resizable').forEach((el) => {
    makeDraggableAndResizable(el);
  });
  
  // SAVING & LOADING LAYOUTS

  // Use localStorage (or a backend database if you want persistence across sessions) 
  // to save element sizes and positions.

  // save layout
  function saveLayout() {
    const elements = document.querySelectorAll('.draggable-resizable');
    const layout = Array.from(elements).map(el => ({
      id: el.id, // Make sure each element has a unique ID
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
    }));
    localStorage.setItem('layout', JSON.stringify(layout));
  }
  
  // load layout
  function loadLayout() {
    const layout = JSON.parse(localStorage.getItem('layout'));
    if (layout) {
      layout.forEach(({ id, left, top, width, height }) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.left = left;
          el.style.top = top;
          el.style.width = width;
          el.style.height = height;
        }
      });
    }
  }
  
  // Call these functions appropriately
  window.onload = loadLayout;
  document.getElementById('save-button').addEventListener('click', saveLayout);
  
// ImageCropModal Component - Interactive, High-Fidelity Artwork Cropper & Editor
window.uBMS = window.uBMS || {};

function ImageCropModal({ imageSrc, onSave, onClose }) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = React.useState(false);
  const [flipV, setFlipV] = React.useState(false);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = React.useState('free'); // 'free', 'original', '1:1', '2:3', '1:2', '3:4'
  const [showHoleSimulation, setShowHoleSimulation] = React.useState(true);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [exportDimensions, setExportDimensions] = React.useState({ width: 0, height: 0 });
  const [activeCursor, setActiveCursor] = React.useState('grab');

  // Viewport dimensions
  const vpWidth = 400;
  const vpHeight = 400;

  // Crop Box state: position and size within viewport
  const [cropBox, setCropBox] = React.useState({ x: 70, y: 50, width: 260, height: 300 });

  // Interaction dragging state
  const dragRef = React.useRef({
    isDragging: false,
    mode: 'pan', // 'pan', 'move', 'nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'
    startX: 0,
    startY: 0,
    initialPan: { x: 0, y: 0 },
    initialCrop: { x: 0, y: 0, width: 0, height: 0 },
    initialPinchDist: 0,
    initialPinchZoom: 1
  });

  const canvasRef = React.useRef(null);
  const previewCanvasRef = React.useRef(null);
  const imageRef = React.useRef(null);

  // Initialize and load image
  React.useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setPan({ x: 0, y: 0 });
      setAspectRatio('free');
      updateCropBoxForAspect('free', img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Update Crop Box based on aspect ratio preset
  const updateCropBoxForAspect = (ratioKey, img = imageRef.current) => {
    const maxW = 320;
    const maxH = 320;
    if (ratioKey === 'free') {
      const w = 260;
      const h = 300;
      const x = Math.round((vpWidth - w) / 2);
      const y = Math.round((vpHeight - h) / 2);
      setCropBox({ x, y, width: w, height: h });
      return;
    }
    let targetRatio = 2 / 3;
    if (ratioKey === 'original' && img) {
      targetRatio = img.naturalWidth / img.naturalHeight;
    } else if (ratioKey === '1:1') targetRatio = 1.0;
    else if (ratioKey === '2:3') targetRatio = 2 / 3;
    else if (ratioKey === '1:2') targetRatio = 1 / 2;
    else if (ratioKey === '3:4') targetRatio = 3 / 4;

    let w, h;
    if (targetRatio <= 1) {
      // Portrait
      h = maxH;
      w = Math.round(h * targetRatio);
      if (w > maxW) {
        w = maxW;
        h = Math.round(w / targetRatio);
      }
    } else {
      // Landscape / Square
      w = maxW;
      h = Math.round(w / targetRatio);
      if (h > maxH) {
        h = maxH;
        w = Math.round(h * targetRatio);
      }
    }
    const x = Math.round((vpWidth - w) / 2);
    const y = Math.round((vpHeight - h) / 2);
    setCropBox({ x, y, width: w, height: h });
  };

  // Re-calculate and render whenever transformations change
  React.useEffect(() => {
    if (imageRef.current) {
      renderCrop();
    }
  }, [zoom, rotation, flipH, flipV, pan, cropBox, showHoleSimulation]);

  // Attach non-passive wheel event listener for smooth zooming
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(prev => Math.min(5, Math.max(0.2, +(prev * zoomFactor).toFixed(3))));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Keyboard navigation & shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y - step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPan(p => ({ ...p, y: p.y + step }));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x - step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPan(p => ({ ...p, x: p.x + step }));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(5, +(z + 0.1).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)));
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotateCW();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewUrl]);

  // Main Canvas Render & High-Resolution Export Sync
  const renderCrop = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    canvas.width = vpWidth;
    canvas.height = vpHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, vpWidth, vpHeight);

    // 1. Draw Background grid & fill
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, vpWidth, vpHeight);

    // Grid pattern
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= vpWidth; x += 20) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, vpHeight);
    }
    for (let y = 0; y <= vpHeight; y += 20) {
      ctx.moveTo(0, y);
      ctx.lineTo(vpWidth, y);
    }
    ctx.stroke();

    // 2. Draw Transformed Artwork
    ctx.save();
    ctx.translate(vpWidth / 2 + pan.x, vpHeight / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

    // Calculate base draw dimensions fitting within 280px standard box
    const baseSize = 280;
    const drawWidth = img.naturalWidth >= img.naturalHeight ? baseSize : (baseSize * img.naturalWidth) / img.naturalHeight;
    const drawHeight = img.naturalHeight >= img.naturalWidth ? baseSize : (baseSize * img.naturalHeight) / img.naturalWidth;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // 3. Darkened Overlay outside crop box (Dimmer)
    const { x: cx, y: cy, width: cw, height: ch } = cropBox;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, vpWidth, vpHeight);
    ctx.rect(cx + cw, cy, -cw, ch); // Cut-out hole
    ctx.fill('evenodd');

    // 4. Crop Box Border & Guidelines
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical
    ctx.moveTo(cx + cw / 3, cy);
    ctx.lineTo(cx + cw / 3, cy + ch);
    ctx.moveTo(cx + (2 * cw) / 3, cy);
    ctx.lineTo(cx + (2 * cw) / 3, cy + ch);
    // Horizontal
    ctx.moveTo(cx, cy + ch / 3);
    ctx.lineTo(cx + cw, cy + ch / 3);
    ctx.moveTo(cx, cy + (2 * ch) / 3);
    ctx.lineTo(cx + cw, cy + (2 * ch) / 3);
    ctx.stroke();

    // Optional simulated tag punch hole (at top center of crop box)
    if (showHoleSimulation) {
      ctx.save();
      const holeRadius = 6;
      const holeX = cx + cw / 2;
      const holeY = cy + 18;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw 8 Interactive Resize Handles
    const handleSize = 8;
    const halfH = handleSize / 2;
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    const handles = [
      { x: cx, y: cy }, // nw
      { x: cx + cw / 2, y: cy }, // n
      { x: cx + cw, y: cy }, // ne
      { x: cx + cw, y: cy + ch / 2 }, // e
      { x: cx + cw, y: cy + ch }, // se
      { x: cx + cw / 2, y: cy + ch }, // s
      { x: cx, y: cy + ch }, // sw
      { x: cx, y: cy + ch / 2 } // w
    ];

    handles.forEach(h => {
      ctx.fillRect(h.x - halfH, h.y - halfH, handleSize, handleSize);
      ctx.strokeRect(h.x - halfH, h.y - halfH, handleSize, handleSize);
    });

    // 6. Generate Pixel-Perfect High-Resolution Cropped Output
    generateHighResCrop(img, baseSize, drawWidth, drawHeight);
  };

  // Generate crisp export using exact canvas transform mapping
  const generateHighResCrop = (img, baseSize, drawWidth, drawHeight) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    // Calculate export scale (min 2x, up to 4x or source resolution)
    const exportScale = Math.min(4, Math.max(2, Math.round((img.naturalWidth || 800) / baseSize)));
    const outWidth = Math.round(cropBox.width * exportScale);
    const outHeight = Math.round(cropBox.height * exportScale);

    previewCanvas.width = outWidth;
    previewCanvas.height = outHeight;
    const pCtx = previewCanvas.getContext('2d');
    pCtx.clearRect(0, 0, outWidth, outHeight);

    // Clean background fill
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, outWidth, outHeight);

    pCtx.save();
    // Map screen cropBox origin (cropBox.x, cropBox.y) to (0, 0) on exportCanvas
    pCtx.translate(-cropBox.x * exportScale, -cropBox.y * exportScale);

    // Apply the exact same transformation hierarchy scaled by exportScale
    pCtx.translate((vpWidth / 2 + pan.x) * exportScale, (vpHeight / 2 + pan.y) * exportScale);
    pCtx.rotate((rotation * Math.PI) / 180);
    pCtx.scale(
      (flipH ? -zoom : zoom) * exportScale,
      (flipV ? -zoom : zoom) * exportScale
    );

    // Draw high-resolution artwork directly from image source
    pCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    pCtx.restore();

    setExportDimensions({ width: outWidth, height: outHeight });
    try {
      const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error('Error generating crop preview:', err);
    }
  };

  // Hit test mouse location to determine drag mode & cursor
  const getHitTest = (mx, my) => {
    const { x, y, width: w, height: h } = cropBox;
    const threshold = 12;

    // Corner handles
    if (Math.abs(mx - x) <= threshold && Math.abs(my - y) <= threshold) return 'nw';
    if (Math.abs(mx - (x + w)) <= threshold && Math.abs(my - y) <= threshold) return 'ne';
    if (Math.abs(mx - (x + w)) <= threshold && Math.abs(my - (y + h)) <= threshold) return 'se';
    if (Math.abs(mx - x) <= threshold && Math.abs(my - (y + h)) <= threshold) return 'sw';

    // Edge handles
    if (aspectRatio === 'free') {
      if (Math.abs(my - y) <= threshold && mx >= x && mx <= x + w) return 'n';
      if (Math.abs(my - (y + h)) <= threshold && mx >= x && mx <= x + w) return 's';
      if (Math.abs(mx - x) <= threshold && my >= y && my <= y + h) return 'w';
      if (Math.abs(mx - (x + w)) <= threshold && my >= y && my <= y + h) return 'e';
    }

    // Inside crop box -> move crop box
    if (mx > x && mx < x + w && my > y && my < y + h) {
      return 'move';
    }

    // Outside crop box -> pan image
    return 'pan';
  };

  // Get CSS cursor string from hit mode
  const getCursorForMode = (mode) => {
    switch (mode) {
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      case 'move': return 'move';
      case 'pan': return 'grab';
      default: return 'default';
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = getHitTest(mx, my);
    dragRef.current = {
      isDragging: true,
      mode: hit,
      startX: mx,
      startY: my,
      initialPan: { ...pan },
      initialCrop: { ...cropBox }
    };
    setActiveCursor(hit === 'pan' ? 'grabbing' : getCursorForMode(hit));
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (!dragRef.current.isDragging) {
      const hoverHit = getHitTest(mx, my);
      setActiveCursor(getCursorForMode(hoverHit));
      return;
    }

    const { mode, startX, startY, initialPan, initialCrop } = dragRef.current;
    const dx = mx - startX;
    const dy = my - startY;

    if (mode === 'pan') {
      // Panning artwork
      setPan({
        x: initialPan.x + dx,
        y: initialPan.y + dy
      });
    } else if (mode === 'move') {
      // Moving crop box within viewport bounds
      const newX = Math.max(0, Math.min(vpWidth - initialCrop.width, initialCrop.x + dx));
      const newY = Math.max(0, Math.min(vpHeight - initialCrop.height, initialCrop.y + dy));
      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else {
      // Resizing crop box handles
      handleResizeDrag(mode, dx, dy, initialCrop);
    }
  };

  const handleResizeDrag = (mode, dx, dy, init) => {
    let newX = init.x;
    let newY = init.y;
    let newW = init.width;
    let newH = init.height;
    const minSize = 60;

    const ratio = aspectRatio !== 'free' ? (init.width / init.height) : null;

    if (mode === 'se') {
      newW = Math.max(minSize, Math.min(vpWidth - init.x, init.width + dx));
      newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, Math.min(vpHeight - init.y, init.height + dy));
      if (newY + newH > vpHeight) {
        newH = vpHeight - newY;
        if (ratio) newW = Math.round(newH * ratio);
      }
    } else if (mode === 'sw') {
      newW = Math.max(minSize, init.width - dx);
      if (init.x + init.width - newW < 0) newW = init.x + init.width;
      newX = init.x + init.width - newW;
      newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, Math.min(vpHeight - init.y, init.height + dy));
      if (newY + newH > vpHeight) {
        newH = vpHeight - newY;
        if (ratio) {
          newW = Math.round(newH * ratio);
          newX = init.x + init.width - newW;
        }
      }
    } else if (mode === 'ne') {
      newW = Math.max(minSize, Math.min(vpWidth - init.x, init.width + dx));
      newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, init.height - dy);
      if (init.y + init.height - newH < 0) newH = init.y + init.height;
      newY = init.y + init.height - newH;
      if (ratio && newX + newW > vpWidth) {
        newW = vpWidth - newX;
        newH = Math.round(newW / ratio);
        newY = init.y + init.height - newH;
      }
    } else if (mode === 'nw') {
      newW = Math.max(minSize, init.width - dx);
      if (init.x + init.width - newW < 0) newW = init.x + init.width;
      newX = init.x + init.width - newW;
      newH = ratio ? Math.round(newW / ratio) : Math.max(minSize, init.height - dy);
      if (init.y + init.height - newH < 0) newH = init.y + init.height;
      newY = init.y + init.height - newH;
    } else if (mode === 'e' && !ratio) {
      newW = Math.max(minSize, Math.min(vpWidth - init.x, init.width + dx));
    } else if (mode === 'w' && !ratio) {
      newW = Math.max(minSize, init.width - dx);
      newX = init.x + init.width - newW;
    } else if (mode === 's' && !ratio) {
      newH = Math.max(minSize, Math.min(vpHeight - init.y, init.height + dy));
    } else if (mode === 'n' && !ratio) {
      newH = Math.max(minSize, init.height - dy);
      newY = init.y + init.height - newH;
    }

    setCropBox({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH)
    });
  };

  const handleMouseUp = () => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      setActiveCursor('grab');
    }
  };

  // Touch Support (Drag & Pinch-to-Zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;

      const hit = getHitTest(mx, my);
      dragRef.current = {
        isDragging: true,
        mode: hit,
        startX: mx,
        startY: my,
        initialPan: { ...pan },
        initialCrop: { ...cropBox }
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      dragRef.current.initialPinchDist = dist;
      dragRef.current.initialPinchZoom = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && dragRef.current.isDragging) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;

      const { mode, startX, startY, initialPan, initialCrop } = dragRef.current;
      const dx = mx - startX;
      const dy = my - startY;

      if (mode === 'pan') {
        setPan({ x: initialPan.x + dx, y: initialPan.y + dy });
      } else if (mode === 'move') {
        const newX = Math.max(0, Math.min(vpWidth - initialCrop.width, initialCrop.x + dx));
        const newY = Math.max(0, Math.min(vpHeight - initialCrop.height, initialCrop.y + dy));
        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      } else {
        handleResizeDrag(mode, dx, dy, initialCrop);
      }
    } else if (e.touches.length === 2 && dragRef.current.initialPinchDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / dragRef.current.initialPinchDist;
      setZoom(Math.min(5, Math.max(0.2, +(dragRef.current.initialPinchZoom * ratio).toFixed(2))));
    }
  };

  const handleTouchEnd = () => {
    dragRef.current.isDragging = false;
    dragRef.current.initialPinchDist = 0;
  };

  // Transformation actions
  const handleRotateCW = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateCCW = () => {
    setRotation(prev => (prev + 270) % 360);
  };

  const handleFlipH = () => {
    setFlipH(prev => !prev);
  };

  const handleFlipV = () => {
    setFlipV(prev => !prev);
  };

  // Alignment actions: Fit, Fill, Center
  const handleFitArtwork = () => {
    const img = imageRef.current;
    if (!img) return;
    const baseSize = 280;
    const imgW = (rotation === 90 || rotation === 270) ? img.naturalHeight : img.naturalWidth;
    const imgH = (rotation === 90 || rotation === 270) ? img.naturalWidth : img.naturalHeight;

    const scaleW = cropBox.width / (baseSize * (imgW / Math.max(imgW, imgH)));
    const scaleH = cropBox.height / (baseSize * (imgH / Math.max(imgW, imgH)));
    const newZoom = Math.min(scaleW, scaleH);

    setZoom(+newZoom.toFixed(2));
    setPan({
      x: cropBox.x + cropBox.width / 2 - vpWidth / 2,
      y: cropBox.y + cropBox.height / 2 - vpHeight / 2
    });
  };

  const handleFillArtwork = () => {
    const img = imageRef.current;
    if (!img) return;
    const baseSize = 280;
    const imgW = (rotation === 90 || rotation === 270) ? img.naturalHeight : img.naturalWidth;
    const imgH = (rotation === 90 || rotation === 270) ? img.naturalWidth : img.naturalHeight;

    const scaleW = cropBox.width / (baseSize * (imgW / Math.max(imgW, imgH)));
    const scaleH = cropBox.height / (baseSize * (imgH / Math.max(imgW, imgH)));
    const newZoom = Math.max(scaleW, scaleH);

    setZoom(+newZoom.toFixed(2));
    setPan({
      x: cropBox.x + cropBox.width / 2 - vpWidth / 2,
      y: cropBox.y + cropBox.height / 2 - vpHeight / 2
    });
  };

  const handleCenterArtwork = () => {
    setPan({
      x: cropBox.x + cropBox.width / 2 - vpWidth / 2,
      y: cropBox.y + cropBox.height / 2 - vpHeight / 2
    });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPan({ x: 0, y: 0 });
    setAspectRatio('free');
    updateCropBoxForAspect('free');
  };

  // Apply and save cropped image
  const handleApply = () => {
    if (previewUrl) {
      onSave(previewUrl);
    } else if (previewCanvasRef.current) {
      onSave(previewCanvasRef.current.toDataURL('image/jpeg', 0.95));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shadow-xs font-bold">
              ✂️
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Crop &amp; Optimize Tag Artwork
              </h2>
              <p className="text-[11px] text-slate-500">
                Drag handles to resize crop box • Scroll mouse wheel to zoom • Drag artwork to position
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Top Bar: Aspect Ratio Preset Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 mr-1">Aspect Ratio:</span>
              {[
                { id: 'free', label: 'Free Crop (Default)' },
                { id: '2:3', label: '2:3 Standard Tag' },
                { id: '1:2', label: '1:2 Slim Tag' },
                { id: '3:4', label: '3:4 Compact' },
                { id: '1:1', label: '1:1 Square' },
                { id: 'original', label: 'Original' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAspectRatio(opt.id);
                    updateCropBoxForAspect(opt.id);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                    aspectRatio === opt.id
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Simulated Hole Punch Toggle */}
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHoleSimulation}
                onChange={(e) => setShowHoleSimulation(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
              />
              <span>Simulate Tag Hole Punch</span>
            </label>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left Column (7 cols): Interactive Canvas Workspace */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div 
                className="relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-sm select-none"
                style={{ width: vpWidth, height: vpHeight, cursor: activeCursor }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <canvas 
                  ref={canvasRef} 
                  width={vpWidth} 
                  height={vpHeight} 
                  className="block" 
                />

                {/* Corner Help Badges */}
                <div className="absolute top-2.5 left-2.5 bg-slate-900/75 text-white text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-md pointer-events-none font-mono">
                  {Math.round(zoom * 100)}% • {rotation}° {flipH ? '• Flip H' : ''} {flipV ? '• Flip V' : ''}
                </div>

                <div className="absolute bottom-2.5 right-2.5 bg-slate-900/75 text-white text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-md pointer-events-none">
                  Scroll wheel zooms • Drag handles resize
                </div>
              </div>

              {/* Bottom Quick Tools Toolbar under canvas */}
              <div className="w-full max-w-[400px] flex items-center justify-between gap-1.5 mt-3 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleFitArtwork}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    title="Fit artwork inside crop box"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={handleFillArtwork}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    title="Scale artwork to completely fill crop box"
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={handleCenterArtwork}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    title="Center artwork"
                  >
                    Center
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleRotateCCW}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer font-bold"
                    title="Rotate 90° CCW"
                  >
                    ↶ 90°
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateCW}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer font-bold"
                    title="Rotate 90° CW"
                  >
                    ↷ 90°
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipH}
                    className={`px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      flipH ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                    title="Flip Horizontally"
                  >
                    ⇄
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipV}
                    className={`px-2 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      flipV ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                    title="Flip Vertically"
                  >
                    ⇅
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Live Preview & Adjustment Sliders */}
            <div className="md:col-span-5 space-y-4">
              {/* Live Tag Preview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="uppercase tracking-wider">Live Tag Preview</span>
                  {exportDimensions.width > 0 && (
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {exportDimensions.width} × {exportDimensions.height} px
                    </span>
                  )}
                </div>

                <div className="relative flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs min-h-[190px]">
                  {previewUrl ? (
                    <div className="relative inline-block group">
                      <img 
                        src={previewUrl} 
                        alt="Cropped Preview" 
                        className="max-h-48 max-w-full object-contain rounded-lg shadow-sm border border-slate-200" 
                      />
                      {showHoleSimulation && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-slate-900/60 border border-white shadow-xs pointer-events-none"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Rendering preview...</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Preset: <strong>{aspectRatio}</strong></span>
                  <span>Scale: <strong>{Math.round(zoom * 100)}%</strong></span>
                </div>
              </div>

              {/* Zoom & Fine Tuning Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                {/* Zoom Controls */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-800 font-semibold mb-1.5">
                    <span className="flex items-center space-x-1.5">
                      <span>🔍</span>
                      <span>Zoom Level</span>
                    </span>
                    <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Zoom Out (-)"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="0.2"
                      max="4"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.min(5, +(z + 0.1).toFixed(2)))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Zoom In (+)"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Reset & Quick Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    ↺ Reset Adjustments
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Shift + Drag / Arrows for fast pan
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Hidden Preview Canvas used for export */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleApply}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Apply &amp; Save Cropped Tag</span>
              <span>✓</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

window.uBMS.ImageCropModal = ImageCropModal;

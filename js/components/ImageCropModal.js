// ImageCropModal Component - Interactive In-Browser Artwork Cropper
window.uBMS = window.uBMS || {};

function ImageCropModal({ imageSrc, onSave, onClose }) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0); // 0, 90, 180, 270
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = React.useState('2:3'); // 'free', '1:1', '2:3', '1:2', '3:4'
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = React.useState('');

  const canvasRef = React.useRef(null);
  const previewCanvasRef = React.useRef(null);
  const imageRef = React.useRef(null);

  // Load Image
  React.useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      renderCrop();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Rerender whenever zoom, rotation, pan, or aspectRatio changes
  React.useEffect(() => {
    if (imageRef.current) {
      renderCrop();
    }
  }, [zoom, rotation, pan, aspectRatio]);

  // Calculate target aspect ratio float
  const getAspectFloat = () => {
    switch (aspectRatio) {
      case '1:1': return 1.0;
      case '2:3': return 2 / 3;
      case '1:2': return 1 / 2;
      case '3:4': return 3 / 4;
      default: return 2 / 3;
    }
  };

  // Render crop box & preview
  const renderCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    // Viewport dimensions
    const vpWidth = 360;
    const vpHeight = 360;

    // Aspect ratio box inside viewport
    const targetAspect = getAspectFloat();
    let cropWidth, cropHeight;
    if (targetAspect <= 1) {
      // Portrait
      cropHeight = 280;
      cropWidth = cropHeight * targetAspect;
    } else {
      // Landscape / Square
      cropWidth = 280;
      cropHeight = cropWidth / targetAspect;
    }

    const cropX = (vpWidth - cropWidth) / 2;
    const cropY = (vpHeight - cropHeight) / 2;

    // Draw on Main Canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = vpWidth;
      canvas.height = vpHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, vpWidth, vpHeight);

      // Save context
      ctx.save();

      // Background grid/fill
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, vpWidth, vpHeight);

      // Clip outside overlay (dimmed)
      // First draw image
      ctx.save();
      ctx.translate(vpWidth / 2 + pan.x, vpHeight / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered
      const drawWidth = img.width > img.height ? 280 : (280 * img.width) / img.height;
      const drawHeight = img.height >= img.width ? 280 : (280 * img.height) / img.width;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Darken outside crop zone
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.beginPath();
      ctx.rect(0, 0, vpWidth, vpHeight);
      ctx.rect(cropX + cropWidth, cropY, -cropWidth, cropHeight); // cut hole
      ctx.fill('evenodd');

      // Crop border & guidelines
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

      // Rule of thirds grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // vertical lines
      ctx.moveTo(cropX + cropWidth / 3, cropY);
      ctx.lineTo(cropX + cropWidth / 3, cropY + cropHeight);
      ctx.moveTo(cropX + (2 * cropWidth) / 3, cropY);
      ctx.lineTo(cropX + (2 * cropWidth) / 3, cropY + cropHeight);
      // horizontal lines
      ctx.moveTo(cropX, cropY + cropHeight / 3);
      ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 3);
      ctx.moveTo(cropX, cropY + (2 * cropHeight) / 3);
      ctx.lineTo(cropX + cropWidth, cropY + (2 * cropHeight) / 3);
      ctx.stroke();

      // Corner handles
      ctx.fillStyle = '#2563eb';
      const handleSize = 8;
      ctx.fillRect(cropX - 4, cropY - 4, handleSize, handleSize);
      ctx.fillRect(cropX + cropWidth - 4, cropY - 4, handleSize, handleSize);
      ctx.fillRect(cropX - 4, cropY + cropHeight - 4, handleSize, handleSize);
      ctx.fillRect(cropX + cropWidth - 4, cropY + cropHeight - 4, handleSize, handleSize);

      ctx.restore();
    }

    // Generate Cropped Output on Preview Canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const outWidth = Math.round(cropWidth * 2);
      const outHeight = Math.round(cropHeight * 2);
      previewCanvas.width = outWidth;
      previewCanvas.height = outHeight;
      const pCtx = previewCanvas.getContext('2d');
      pCtx.clearRect(0, 0, outWidth, outHeight);

      // Fill clean background
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, outWidth, outHeight);

      pCtx.save();
      // Translate to preview center, apply same transform scaled by 2
      pCtx.translate(outWidth / 2, outHeight / 2);
      pCtx.rotate((rotation * Math.PI) / 180);
      pCtx.scale(zoom * 2, zoom * 2);

      const drawWidth = img.width > img.height ? 280 : (280 * img.width) / img.height;
      const drawHeight = img.height >= img.width ? 280 : (280 * img.height) / img.width;

      pCtx.drawImage(
        img,
        -drawWidth / 2 + pan.x / zoom,
        -drawHeight / 2 + pan.y / zoom,
        drawWidth,
        drawHeight
      );
      pCtx.restore();

      setPreviewUrl(previewCanvas.toDataURL('image/jpeg', 0.92));
    }
  };

  // Drag / Pan Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Reset
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setAspectRatio('2:3');
  };

  // Apply Crop
  const handleApply = () => {
    if (previewUrl) {
      onSave(previewUrl);
    } else if (previewCanvasRef.current) {
      onSave(previewCanvasRef.current.toDataURL('image/jpeg', 0.92));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col animate-fade-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Crop &amp; Frame Tag Artwork</h3>
            <p className="text-[11px] text-slate-500">Pan, zoom, or select a tag ratio to frame your tag design accurately</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Aspect Ratio Selector Pills */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Tag Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '2:3', label: '2:3 Standard Hangtag (2" × 3")', desc: 'Most popular price/brand tag' },
                { id: '1:1', label: '1:1 Square (2" × 2")', desc: 'Square tags & garment badges' },
                { id: '1:2', label: '1:2 Slim Tag (1.5" × 3")', desc: 'Long bookmark / slim label' },
                { id: '3:4', label: '3:4 Card Tag', desc: 'Larger multi-care card' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                    aspectRatio === ratio.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={ratio.desc}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center Work Area: Crop Viewport + Realtime Preview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-center">
            
            {/* Left 3 cols: Interactive Canvas */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div 
                className="relative bg-slate-100 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing select-none"
                style={{ width: 360, height: 360 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <canvas ref={canvasRef} width={360} height={360} className="block" />
                
                <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-sm">
                  Drag to pan artwork
                </div>
              </div>
            </div>

            {/* Right 2 cols: Live Preview & Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Tag Preview
                </div>
                <div className="flex items-center justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-xs min-h-[160px]">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Cropped Preview" 
                      className="max-h-40 max-w-full object-contain rounded shadow-xs border border-slate-100" 
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Rendering preview...</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Aspect Ratio: <span className="font-bold text-slate-900">{aspectRatio}</span>
                </div>
              </div>

              {/* Quick Adjustment Controls */}
              <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                {/* Zoom Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                    <span>Zoom</span>
                    <span className="font-mono text-slate-900">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Actions: Rotate & Reset */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium py-2 px-2.5 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 text-xs font-medium py-2 px-3 rounded-xl transition-colors"
                    title="Reset all adjustments"
                  >
                    Reset
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Hidden Preview Canvas used for export */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleApply}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-medium shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>Apply &amp; Save Cropped Tag</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

window.uBMS.ImageCropModal = ImageCropModal;

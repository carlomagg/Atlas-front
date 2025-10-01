import React, { useState, useRef } from "react";

export default function ImageBackgroundEditor({ onImageProcessed, className = "" }) {
  const [preview, setPreview] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [selectedBg, setSelectedBg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Predefined background options
  const backgroundOptions = [
    {
      id: 'white',
      name: 'White',
      style: { backgroundColor: '#ffffff' },
      preview: '#ffffff'
    },
    {
      id: 'gradient1',
      name: 'Blue Gradient',
      style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'gradient2',
      name: 'Sunset',
      style: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'gradient3',
      name: 'Ocean',
      style: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'pattern1',
      name: 'Dots',
      style: { 
        backgroundColor: '#f8f9fa',
        backgroundImage: 'radial-gradient(circle, #e9ecef 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      },
      preview: '#f8f9fa'
    },
    {
      id: 'texture1',
      name: 'Subtle Texture',
      style: { 
        backgroundColor: '#f1f3f4',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e8eaed" fill-opacity="0.4"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3Ccircle cx="27" cy="7" r="1"/%3E%3Ccircle cx="47" cy="7" r="1"/%3E%3Ccircle cx="7" cy="27" r="1"/%3E%3Ccircle cx="27" cy="27" r="1"/%3E%3Ccircle cx="47" cy="27" r="1"/%3E%3Ccircle cx="7" cy="47" r="1"/%3E%3Ccircle cx="27" cy="47" r="1"/%3E%3Ccircle cx="47" cy="47" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      },
      preview: '#f1f3f4'
    }
  ];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image_file", file);

      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": import.meta.env.VITE_REMOVE_BG_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} - ${res.statusText}`);
      }

      const blob = await res.blob();
      const processedUrl = URL.createObjectURL(blob);
      setProcessed(processedUrl);
      
      // Auto-select white background initially
      setSelectedBg(backgroundOptions[0]);
      
    } catch (err) {
      console.error('Background removal failed:', err);
      setError(err.message || 'Failed to remove background');
    } finally {
      setLoading(false);
    }
  };

  const generateFinalImage = async () => {
    if (!processed || !selectedBg) return null;

    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Apply background
      if (selectedBg.style.backgroundColor) {
        ctx.fillStyle = selectedBg.style.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (selectedBg.style.background && selectedBg.style.background.includes('gradient')) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (selectedBg.id === 'gradient1') {
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
        } else if (selectedBg.id === 'gradient2') {
          gradient.addColorStop(0, '#f093fb');
          gradient.addColorStop(1, '#f5576c');
        } else if (selectedBg.id === 'gradient3') {
          gradient.addColorStop(0, '#4facfe');
          gradient.addColorStop(1, '#00f2fe');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Load and draw the processed image
      const img = new Image();
      img.onload = () => {
        // Center the image on canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Convert to blob and resolve
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      };
      img.src = processed;
    });
  };

  const handleSave = async () => {
    if (!processed || !selectedBg) return;

    try {
      setLoading(true);
      const finalBlob = await generateFinalImage();
      
      if (finalBlob && onImageProcessed) {
        // Create a File object from the blob
        const finalFile = new File([finalBlob], 'processed-image.png', { type: 'image/png' });
        onImageProcessed(finalFile);
      }
    } catch (err) {
      console.error('Failed to generate final image:', err);
      setError('Failed to generate final image');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setProcessed(null);
    setSelectedBg(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Background Remover & Editor
        </h3>
        <p className="text-sm text-gray-600">
          Upload an image to remove its background and add a new one
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-sm text-blue-600">Processing image...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Preview */}
        {preview && (
          <div>
            <p className="font-medium text-gray-900 mb-2">Original Image:</p>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <img src={preview} alt="Original" className="w-full h-48 object-contain" />
            </div>
          </div>
        )}

        {/* Background Removed */}
        {processed && (
          <div>
            <p className="font-medium text-gray-900 mb-2">Background Removed:</p>
            <div className="border rounded-lg overflow-hidden bg-gray-50 bg-opacity-50" 
                 style={{backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}}>
              <img src={processed} alt="Processed" className="w-full h-48 object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* Background Selection */}
      {processed && (
        <div className="mt-6">
          <p className="font-medium text-gray-900 mb-3">Choose New Background:</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            {backgroundOptions.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBg(bg)}
                className={`relative h-16 rounded-lg border-2 transition-all ${
                  selectedBg?.id === bg.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={bg.style}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 bg-white bg-opacity-75 px-1 rounded">
                    {bg.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Preview with Selected Background */}
          {selectedBg && (
            <div className="mb-4">
              <p className="font-medium text-gray-900 mb-2">Preview:</p>
              <div
                className="border rounded-lg overflow-hidden h-64 flex items-center justify-center"
                style={selectedBg.style}
              >
                <img src={processed} alt="Final Preview" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedBg || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Use This Image'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

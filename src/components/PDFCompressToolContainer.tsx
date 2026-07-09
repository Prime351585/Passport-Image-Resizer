import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PDFCompressToolContainer({ className = '' }: { className?: string }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{original: number, compressed: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setCompressedPdfUrl(null);
        setCompressionStats(null);
      }
    }
  };

  const handleCompress = async () => {
    if (!pdfFile) return;
    
    setIsCompressing(true);
    setCompressedPdfUrl(null);
    setCompressionStats(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      // Load the PDF. We don't update metadata to keep it small.
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      // Basic "compression" using pdf-lib. True image downsampling isn't 
      // straightforward in pure JS without external WASM libraries, 
      // but re-saving drops unused objects and some metadata.
      const compressedBytes = await pdf.save({ useObjectStreams: false });
      
      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCompressedPdfUrl(url);
      setCompressionStats({
        original: pdfFile.size,
        compressed: blob.size
      });
      
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("An error occurred while compressing the PDF. It might be corrupted or encrypted.");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadPdf = () => {
    if (!compressedPdfUrl) return;
    const link = document.createElement('a');
    link.href = compressedPdfUrl;
    link.download = `compressed-${pdfFile?.name || 'document.pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getSavingsPercentage = () => {
    if (!compressionStats) return 0;
    const { original, compressed } = compressionStats;
    if (compressed >= original) return 0;
    return Math.round(((original - compressed) / original) * 100);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      
      {!pdfFile ? (
        <div 
          className="bg-white border-2 border-dashed border-primary/40 rounded-2xl p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="application/pdf" 
            className="sr-only" 
          />
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-crimson font-semibold text-gray-900 mb-2">Select a PDF to Compress</h3>
          <p className="text-gray-500">Click to browse or drag and drop a file here</p>
          <p className="text-sm text-gray-400 mt-4">100% Secure. Processing happens locally in your browser.</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-8">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 truncate max-w-[200px] md:max-w-md">
                  {pdfFile.name}
                </h3>
                <p className="text-gray-500">{formatBytes(pdfFile.size)}</p>
              </div>
            </div>
            
            <button 
              onClick={() => { setPdfFile(null); setCompressedPdfUrl(null); setCompressionStats(null); }}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {!compressedPdfUrl ? (
            <div className="border-t border-gray-100 pt-8">
              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-4 px-6 rounded-xl font-medium text-lg transition-colors flex items-center justify-center space-x-3"
              >
                {isCompressing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Compressing...</span>
                  </>
                ) : (
                  <span>Compress PDF</span>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Note: In-browser compression optimizes PDF structure. Highly image-heavy PDFs might require advanced tools for significant reduction.
              </p>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-8 space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-sm text-gray-500 mb-1">Original Size</p>
                  <p className="font-semibold text-gray-900">{formatBytes(compressionStats?.original || 0)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                  <p className="text-sm text-green-600 mb-1">Compressed Size</p>
                  <p className="font-semibold text-green-700">{formatBytes(compressionStats?.compressed || 0)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 bg-primary/5 rounded-xl p-4 border border-primary/20 text-center flex flex-col justify-center">
                  <p className="text-sm text-primary mb-1">Savings</p>
                  <p className="font-semibold text-primary">{getSavingsPercentage()}%</p>
                </div>
              </div>

              <button
                onClick={downloadPdf}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl font-medium text-lg transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download Compressed PDF</span>
              </button>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}

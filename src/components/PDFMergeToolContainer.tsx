import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PDFMergeToolContainer({ className = '' }: { className?: string }) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (filesList: FileList | File[]) => {
    const files = Array.from(filesList).filter(f => f.type === 'application/pdf');
    setPdfFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMergedPdfUrl(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
    setMergedPdfUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPdfFiles(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setMergedPdfUrl(null);
  };

  const moveDown = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    setPdfFiles(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setMergedPdfUrl(null);
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) return;
    
    setIsMerging(true);
    setMergedPdfUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of pdfFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("An error occurred while merging the PDFs. Please try again with valid PDF files.");
    } finally {
      setIsMerging(false);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedPdfUrl) return;
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = `merged-document-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      
      {/* Upload Zone */}
      <div 
        className={`bg-white border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-primary/40 hover:bg-primary/5'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="application/pdf" 
          multiple 
          className="hidden" 
        />
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </div>
        <h3 className="text-xl font-crimson font-semibold text-gray-900 mb-2">Select PDF Files</h3>
        <p className="text-gray-500">Click to browse or drag and drop files here</p>
      </div>

      {/* File List */}
      {pdfFiles.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-crimson font-semibold text-gray-900 mb-4">
            Files to Merge ({pdfFiles.length})
          </h3>
          
          <div className="space-y-3">
            {pdfFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-gray-400 hover:text-primary disabled:opacity-30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === pdfFiles.length - 1} className="p-1 text-gray-400 hover:text-primary disabled:opacity-30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                  </div>
                  <button onClick={() => removeFile(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
            {!mergedPdfUrl ? (
              <button
                onClick={handleMerge}
                disabled={pdfFiles.length < 2 || isMerging}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isMerging ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Merging PDFs...</span>
                  </>
                ) : (
                  <span>Merge {pdfFiles.length} PDFs</span>
                )}
              </button>
            ) : (
              <button
                onClick={downloadMergedPdf}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download Merged PDF</span>
              </button>
            )}
          </div>
          
          {pdfFiles.length < 2 && !mergedPdfUrl && (
            <p className="text-sm text-amber-600 text-center">Add at least {2 - pdfFiles.length} more file(s) to merge.</p>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface FileViewerProps {
  fileUrl?: string;
  type: 'image' | 'document';
  alt?: string;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  fileUrl, 
  type,
  alt = 'File', 
  className = ''
}) => {
  const [error, setError] = useState(false);
  
  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">No file available</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-sm text-red-500">Failed to load file</p>
      </div>
    );
  }
  
  // Handle images (profile photos)
  if (type === 'image') {
    return (
      <div className={`overflow-hidden rounded-lg ${className}`}>
        <img 
          src={fileUrl} 
          alt={alt} 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }
  
  // Handle documents (PDF or other files)
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Preview for PDF documents */}
      {fileUrl.includes('pdf') ? (
        <div className="mb-2">
          <iframe
            src={fileUrl}
            className="w-full h-64 rounded border border-gray-200"
            title={alt}
            onError={() => setError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 mb-2">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {/* Download link for all document types */}
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 text-sm flex justify-center items-center"
      >
        Download/View Document
      </a>
    </div>
  );
};

export default FileViewer; 
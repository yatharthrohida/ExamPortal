import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import examService from '../../services/examService';
import Button from '../common/Button';

export const DocumentUploader = ({ onParsedQuestions }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file) => {
    setError(null);
    setSuccessInfo(null);
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const isExtensionValid =
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc');

    if (!validTypes.includes(file.type) && !isExtensionValid) {
      setError('Please upload a valid .pdf or .docx document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleParseDocument = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = await examService.parseDocument(selectedFile);
      setSuccessInfo(
        `Successfully extracted ${data.questions.length} questions from ${data.fileName}`
      );
      if (onParsedQuestions) {
        onParsedQuestions(data.questions);
      }
    } catch (err) {
      setError(err.message || 'Failed to parse assessment document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          Document Upload & Question Parser
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Upload question papers in PDF or DOCX format to automatically extract questions and options.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-neutral-900 bg-neutral-100'
            : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 hover:border-neutral-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center mx-auto mb-2 shadow-sm">
          <FileUp size={20} />
        </div>

        <div className="text-xs font-semibold text-neutral-800 mb-1">
          {selectedFile ? selectedFile.name : 'Click to select or drag and drop a question paper'}
        </div>

        <div className="text-[11px] text-neutral-500">
          {selectedFile
            ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready to extract`
            : 'Supported formats: PDF, DOCX (up to 10MB)'}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successInfo && (
        <div className="mt-3 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {selectedFile && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            loading={isUploading}
            onClick={handleParseDocument}
          >
            Extract Questions
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;

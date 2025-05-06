"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "./ui/button";
import { ImageIcon } from "lucide-react";

interface MultiImagePickerProps {
  onImagesPick: (base64Images: string[]) => void;
  disabled: boolean
}

// async function renderPdfToImage(pdfUrl: string): Promise<string[]> {
async function renderPdfToImage(file: File): Promise<string> {
  // @ts-ignore
  const pdfjs = globalThis.pdfjsLib;
  // console.log('pdfjs', pdfjs);
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const imageData = canvas.toDataURL('image/png');
    images.push(imageData);
  }

  return images[0]; // only one page now
  // TODO: return images; // base64 PNGs
}

const MultiImagePicker: React.FC<MultiImagePickerProps> = ({ onImagesPick, disabled }) => {
  const convertToBase64 = (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      return renderPdfToImage(file);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        const base64Images = await Promise.all(acceptedFiles.map(convertToBase64));
        onImagesPick(base64Images);
      } catch (error) {
        console.error("Error converting images to base64:", error);
      }
    },
    [onImagesPick]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    multiple: true, // Allow multiple file selection
    maxSize: 10485760, // 10 MB per file
  });

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input disabled={disabled} {...getInputProps()} />
      <Button disabled={disabled} type="button" variant="ghost" size="icon" className="rounded-full shrink-0">
        <ImageIcon className="w-5 h-5" />
        {isDragActive && <span className="sr-only">Drop the images here</span>}
      </Button>
    </div>
  );
};

export default MultiImagePicker;

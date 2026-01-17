'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { addAnswer } from "@/lib/data";
import { ImagePlus, Loader2, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
    upload,
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    Image,
} from "@imagekit/next";
import { Progress } from "@/components/ui/progress";

export default function AnswerForm({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size (e.g., 4MB)
    if (file.size > 4 * 1024 * 1024) { 
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 4MB.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setPhotoDataUrl(null); // Clear previous image

    try {
      const authResponse = await fetch('/api/imagekit/auth');
      if (!authResponse.ok) {
        throw new Error('Failed to authenticate with ImageKit.');
      }
      const { signature, expire, token } = await authResponse.json();

      const uploadResult = await upload({
        file,
        fileName: file.name,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        signature,
        token,
        expire,
        folder: `/neighbornets/answers/${questionId}`,
        tags: ["answer_photo", questionId],
        useUniqueFileName: true,
        onProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        }
      });
      
      setPhotoDataUrl(uploadResult.url ?? "");

    } catch (error) {
        console.error("ImageKit upload error:", error);
        let title = "Upload Failed";
        let description = "There was a problem uploading your photo. Please try again.";

        if (error instanceof ImageKitAbortError) {
            title = "Upload Cancelled";
            description = `The upload was cancelled: ${error.reason}`;
        } else if (error instanceof ImageKitInvalidRequestError) {
             title = "Invalid Request";
             description = `The upload request was invalid: ${error.message}`;
        } else if (error instanceof ImageKitUploadNetworkError) {
             title = "Network Error";
             description = `A network error occurred during upload: ${error.message}`;
        } else if (error instanceof ImageKitServerError) {
             title = "Server Error";
             description = `The server returned an error: ${error.message}`;
        }
        
        toast({
            title,
            description,
            variant: 'destructive',
        });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadProgress(0);
  }

  const handleSubmit = async () => {
    if (!user) {
       toast({
        title: 'Please log in',
        description: 'You need to be logged in to answer a question.',
        variant: 'destructive'
      });
      return;
    }
    if (!answerText.trim() && !photoDataUrl) {
        toast({
            title: 'Empty answer',
            description: 'Please write some text or add a photo.',
            variant: 'destructive'
        });
        return;
    }

    setIsSubmitting(true);
    try {
        await addAnswer(questionId, { text: answerText, user, photoDataUrl: photoDataUrl || "" });
        
        setAnswerText('');
        handleRemoveImage();
        toast({ title: 'Thank you!', description: 'Your answer has been posted.'});
        router.refresh();
    } catch (error) {
        console.error("Error submitting answer:", error);
        toast({ title: 'Error', description: 'Could not post your answer.', variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-4">
      <Textarea 
        placeholder={user ? "Share your recommendation..." : "Please log in to answer."}
        rows={4}
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        disabled={!user || isSubmitting || isUploading}
      />
       <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/gif" 
        disabled={isUploading}
      />

      {isUploading && (
        <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center animate-pulse">Uploading... {Math.round(uploadProgress)}%</p>
        </div>
      )}

      {photoDataUrl && !isUploading && (
          <div className="relative w-32 h-32">
              <Image
                urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                src={photoDataUrl}
                alt="Answer photo preview"
                fill
                className="object-cover rounded-md border"
              />
              <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={handleRemoveImage} disabled={isSubmitting}>
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
              </Button>
          </div>
      )}

      <div className='flex justify-between items-center'>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || isUploading}>
          <ImagePlus className="mr-2 h-4 w-4" />
          {photoDataUrl ? "Change Photo" : "Add Photo"}
        </Button>
         <Button onClick={handleSubmit} disabled={!user || isSubmitting || isUploading || (!answerText.trim() && !photoDataUrl)}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Answer
        </Button>
      </div>
    </div>
  )
}

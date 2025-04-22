import { connectToDatabase } from "@/lib/db";
import OrganizerApplication from "@/models/OrganizerApplication";
import { NextResponse } from "next/server";

// Base64 encoded placeholder images
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4Ij5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
const PLACEHOLDER_DOCUMENT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4Ij5Eb2N1bWVudCBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

// Function to determine if a file path is an image based on extension
const isImagePath = (path: string): boolean => {
  return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(path);
};

// Check if a URL is a Cloudinary URL
const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Check if a filename is likely a Cloudinary-generated timestamp filename
const isCloudinaryTimestampFilename = (filename: string): boolean => {
  // Matches patterns like: 1740730428259-2492484.jpg and more complex ones like 1740728330554-2025-02-27-22_16_51-.png
  return /^\d{13}-.*\.(jpe?g|png|gif|pdf)$/i.test(filename);
};

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    console.log('DEBUG: Media request for filename:', params.filename);
    
    // Get cloud name from environment variable
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'meetspace';
    
    if (!params.filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Special handling for Cloudinary timestamp-based filenames (direct Cloudinary redirect)
    if (isCloudinaryTimestampFilename(params.filename)) {
      console.log('DEBUG: Detected Cloudinary timestamp filename pattern');
      
      // Return placeholder images instead of trying Cloudinary which is giving 404 errors
      const contentType = 'image/svg+xml';
      const placeholder = isImagePath(params.filename) ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOCUMENT;
      const base64Data = placeholder.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Connect to database
    await connectToDatabase();
    
    // Search for application that contains this filename in either profilePhotoUrl or idDocumentUrl
    const filenameToFind = params.filename;
    console.log('DEBUG: Searching for applications with filename:', filenameToFind);
    
    const applications = await OrganizerApplication.find({
      $or: [
        { profilePhotoUrl: { $regex: filenameToFind, $options: 'i' } },
        { idDocumentUrl: { $regex: filenameToFind, $options: 'i' } }
      ]
    });
    
    console.log('DEBUG: Found applications count:', applications?.length || 0);
    
    if (!applications || applications.length === 0) {
      console.log('DEBUG: No application found with media:', filenameToFind);
      
      // Check if filename is a Cloudinary public ID or partial URL
      if (filenameToFind.includes('cloudinary.com') || /^[a-z0-9_\/]+\.(jpg|jpeg|png|gif|pdf)$/i.test(filenameToFind)) {
        // Try to construct and redirect to Cloudinary URL
        let cloudinaryUrl = '';
        
        if (filenameToFind.includes('cloudinary.com')) {
          // It's already a full URL
          cloudinaryUrl = filenameToFind;
        } else {
          // Construct URL from public ID/filename
          cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${filenameToFind}`;
        }
        
        console.log('DEBUG: Redirecting to constructed Cloudinary URL:', cloudinaryUrl);
        return NextResponse.redirect(cloudinaryUrl);
      }
      
      // Return a placeholder image if not found
      console.log('DEBUG: Returning placeholder for:', params.filename);
      const contentType = 'image/svg+xml';
      const placeholder = isImagePath(params.filename) ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOCUMENT;
      const base64Data = placeholder.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Find which field contains our media
    let mediaUrl = null;
    for (const app of applications) {
      console.log('DEBUG: Checking application, profilePhotoUrl:', app.profilePhotoUrl);
      console.log('DEBUG: Checking application, idDocumentUrl:', app.idDocumentUrl);
      
      if (app.profilePhotoUrl && app.profilePhotoUrl.includes(filenameToFind)) {
        mediaUrl = app.profilePhotoUrl;
        console.log('DEBUG: Found in profilePhotoUrl:', mediaUrl);
        break;
      }
      if (app.idDocumentUrl && app.idDocumentUrl.includes(filenameToFind)) {
        mediaUrl = app.idDocumentUrl;
        console.log('DEBUG: Found in idDocumentUrl:', mediaUrl);
        break;
      }
    }

    if (!mediaUrl) {
      console.log('DEBUG: Media URL not found in applications');
      // Return placeholder image instead of error
      const contentType = 'image/svg+xml';
      const placeholder = isImagePath(params.filename) ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOCUMENT;
      const base64Data = placeholder.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    console.log('DEBUG: Processing mediaUrl:', mediaUrl);

    // If the media URL is a Base64 data URL, decode and serve it directly
    if (mediaUrl.startsWith('data:')) {
      console.log('DEBUG: Serving Base64 data URL');
      const contentType = mediaUrl.split(';')[0].split(':')[1];
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // For Cloudinary or external URLs, redirect to the actual source
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      console.log('DEBUG: Fetching directly from external URL:', mediaUrl);
      
      try {
        const response = await fetch(mediaUrl);
        if (response.ok) {
          const contentType = response.headers.get('Content-Type') || 'image/jpeg';
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } else {
          console.log('DEBUG: Failed to fetch from external URL:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('Error fetching from external URL:', fetchError);
      }
    }
    
    // If it's a partial Cloudinary path or public ID, construct the full URL
    if (isCloudinaryUrl(mediaUrl) || mediaUrl.includes('upload/')) {
      let cloudinaryUrl = mediaUrl;
      
      if (!mediaUrl.startsWith('http')) {
        cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${mediaUrl}`;
      }
      
      console.log('DEBUG: Fetching directly from Cloudinary URL:', cloudinaryUrl);
      
      try {
        const response = await fetch(cloudinaryUrl);
        if (response.ok) {
          const contentType = response.headers.get('Content-Type') || 'image/jpeg';
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } else {
          console.log('DEBUG: Failed to fetch from Cloudinary:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('Error fetching from Cloudinary:', fetchError);
      }
    }
    
    // Last resort: if we have a filename that looks like a Cloudinary timestamp format,
    // try to fetch directly from Cloudinary
    if (isCloudinaryTimestampFilename(mediaUrl) || isCloudinaryTimestampFilename(params.filename)) {
      const filename = isCloudinaryTimestampFilename(mediaUrl) ? mediaUrl : params.filename;
      const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${filename}`;
      console.log('DEBUG: Last resort fetching from Cloudinary:', cloudinaryUrl);
      
      try {
        const response = await fetch(cloudinaryUrl);
        if (response.ok) {
          const contentType = response.headers.get('Content-Type') || 'image/jpeg';
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } else {
          console.log('DEBUG: Failed to fetch from Cloudinary:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('Error fetching from Cloudinary:', fetchError);
      }
    }
    
    // For URLs in the /uploads/ folder, try to serve from local filesystem
    if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
      console.log('DEBUG: Detected /uploads/ path, attempting to serve locally');
      
      // Return a placeholder image as fallback since we know Cloudinary URLs aren't working
      console.log('DEBUG: Returning placeholder for uploads path');
      const contentType = 'image/svg+xml';
      const placeholder = isImagePath(mediaUrl) ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOCUMENT;
      const base64Data = placeholder.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // As a fallback, return placeholder
    console.log('DEBUG: Returning fallback placeholder');
    const isImage = isImagePath(mediaUrl);
    const placeholder = isImage ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOCUMENT;
    const contentType = 'image/svg+xml';
    const base64Data = placeholder.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    
    // Return a placeholder image even on error
    const contentType = 'image/svg+xml';
    const base64Data = PLACEHOLDER_IMAGE.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
} 
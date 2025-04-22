import { OrganizerApplication } from '@/types/applications';

/**
 * Utility for migrating base64 encoded files to cloud storage
 * Note: This is a placeholder implementation. 
 * You'll need to implement the actual upload function using your cloud storage provider.
 */

// Placeholder upload function - replace with actual cloud storage implementation
async function uploadToCloudStorage(
  base64Data: string,
  filename: string,
  contentType: string
): Promise<string> {
  // Remove data URI prefix if present
  const base64Content = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;
  
  console.log(`Would upload file ${filename} of type ${contentType}`);
  
  // IMPLEMENT YOUR CLOUD STORAGE UPLOAD HERE
  // Example for AWS S3:
  // const buffer = Buffer.from(base64Content, 'base64');
  // const s3 = new AWS.S3();
  // const result = await s3.upload({
  //   Bucket: 'your-bucket-name',
  //   Key: filename,
  //   Body: buffer,
  //   ContentType: contentType,
  //   ACL: 'public-read'
  // }).promise();
  // return result.Location;
  
  // Return placeholder URL for now
  return `https://your-cloud-storage.example.com/${filename}`;
}

// Function to update application field in database
async function updateApplicationField(
  applicationId: string | number,
  field: string,
  value: string
): Promise<void> {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [field]: value }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update application: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error updating ${field} for application ${applicationId}:`, error);
    throw error;
  }
}

/**
 * Migrates base64 encoded files to cloud storage
 * @param application The application with potential base64 encoded files
 * @returns Updated application with file URLs
 */
export async function migrateFilesToCloudStorage(
  application: OrganizerApplication
): Promise<OrganizerApplication> {
  if (!application || !application.id) {
    throw new Error('Invalid application data');
  }
  
  const updatedApplication = { ...application };
  const applicationId = String(application.id);
  
  // Process profile photo if it's a base64 string
  if (
    application.profilePhotoUrl && 
    (application.profilePhotoUrl.startsWith('data:') || 
     !application.profilePhotoUrl.startsWith('http'))
  ) {
    try {
      // Generate a unique filename
      const filename = `profile-photos/${applicationId}-${Date.now()}.jpg`;
      
      // Determine content type
      const contentType = application.profilePhotoUrl.startsWith('data:') 
        ? application.profilePhotoUrl.split(';')[0].split(':')[1] 
        : 'image/jpeg';
      
      // Upload to cloud storage
      const photoUrl = await uploadToCloudStorage(
        application.profilePhotoUrl,
        filename, 
        contentType
      );
      
      // Update application with new URL
      updatedApplication.profilePhotoUrl = photoUrl;
      
      // Update database
      await updateApplicationField(applicationId, 'profilePhoto', photoUrl);
      console.log(`Migrated profile photo for application ${applicationId}`);
    } catch (error) {
      console.error('Failed to migrate profile photo:', error);
    }
  }
  
  // Process ID document if it's a base64 string
  if (
    application.idDocumentUrl && 
    (application.idDocumentUrl.startsWith('data:') || 
     !application.idDocumentUrl.startsWith('http'))
  ) {
    try {
      // Generate a unique filename
      const filename = `id-documents/${applicationId}-${Date.now()}.pdf`;
      
      // Determine content type
      const contentType = application.idDocumentUrl.startsWith('data:') 
        ? application.idDocumentUrl.split(';')[0].split(':')[1] 
        : 'application/pdf';
      
      // Upload to cloud storage
      const documentUrl = await uploadToCloudStorage(
        application.idDocumentUrl,
        filename,
        contentType
      );
      
      // Update application with new URL
      updatedApplication.idDocumentUrl = documentUrl;
      
      // Update database
      await updateApplicationField(applicationId, 'idDocument', documentUrl);
      console.log(`Migrated ID document for application ${applicationId}`);
    } catch (error) {
      console.error('Failed to migrate ID document:', error);
    }
  }
  
  return updatedApplication;
}

export default migrateFilesToCloudStorage; 
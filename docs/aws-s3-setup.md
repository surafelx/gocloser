# Setting Up AWS S3 as a Fallback for Cloudinary

This guide explains how to set up AWS S3 as a fallback storage solution when Cloudinary uploads fail.

## Why Use S3 as a Fallback?

Cloudinary is an excellent service for media storage and processing, but like any cloud service, it can occasionally experience issues. Having AWS S3 as a fallback ensures your application remains operational even when Cloudinary is unavailable.

## Prerequisites

1. An AWS account
2. Basic familiarity with AWS services
3. AWS CLI installed (optional, for testing)

## Step 1: Create an S3 Bucket

1. Log in to the [AWS Management Console](https://aws.amazon.com/console/)
2. Navigate to the S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., `your-app-name-media-fallback`)
5. Select the AWS Region closest to your users
6. Configure bucket settings:
   - Block all public access (recommended for security)
   - Enable versioning (optional, but recommended)
   - Enable server-side encryption (recommended)
7. Click "Create bucket"

## Step 2: Create an IAM User with S3 Access

1. Navigate to the IAM service in the AWS Management Console
2. Go to "Users" and click "Add user"
3. Choose a username (e.g., `s3-fallback-user`)
4. Select "Programmatic access" for Access type
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select "AmazonS3FullAccess" (or create a custom policy with more limited permissions for better security)
8. Click through the remaining steps and create the user
9. **Important**: Save the Access Key ID and Secret Access Key that are displayed. You will not be able to view the Secret Access Key again.

## Step 3: Configure CORS for the S3 Bucket

If your application needs to access the S3 bucket from a browser, you'll need to configure CORS:

1. Go to your S3 bucket in the AWS Management Console
2. Click on the "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and add a CORS configuration like this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Replace `https://your-domain.com` with your application's domain. For development, you can use `http://localhost:3000`.

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```

```

## Step 5: Test the S3 Fallback

The application is now configured to use S3 as a fallback when Cloudinary uploads fail. To test this:

1. Temporarily disable your Cloudinary credentials in `.env.local`
2. Upload a file through your application
3. Check the server logs to confirm the file was uploaded to S3
4. Restore your Cloudinary credentials

## Security Considerations

- Never commit your AWS credentials to version control
- Consider using more restrictive IAM policies than `AmazonS3FullAccess`
- Set up bucket policies to restrict access further
- Enable encryption for sensitive data
- Regularly rotate your AWS access keys

## Troubleshooting

If you encounter issues with the S3 fallback:

1. Check that your AWS credentials are correct
2. Verify that the IAM user has the necessary permissions
3. Ensure the S3 bucket exists and is in the correct region
4. Check the CORS configuration if accessing files directly from a browser
5. Look for detailed error messages in your application logs

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)

import aws from 'aws-sdk';

// https://www.phmu.de/en/blog/how-to-upload-directly-from-the-front-end-of-a-vue-app-into-an-aws-bucket-with-signedurls/

let s3;

let documentsBucketName;

function bootstrap(awsConfig) {
  documentsBucketName = process.env.DOCUMENTS_BUCKET_NAME;
  if (!s3) {
    s3 = new aws.S3(awsConfig);
  }
}

function getUploadUrl(filePath, fileType = 'application/pdf') {
  return s3.getSignedUrl('putObject', {
    Bucket: documentsBucketName,
    Key: filePath,
    ContentType: fileType,
    /* ContentDisposition: 'inline', */
    Expires: 60,
  });
}

function getDownloadUrl(filePath) {
  return s3.getSignedUrl('getObject', {
    Bucket: documentsBucketName,
    Key: filePath,
    Expires: 3600,
  });
}

async function deleteDocument(filePath) {
  return s3
    .deleteObject({
      Bucket: documentsBucketName,
      Key: filePath,
    })
    .promise();
}

export default {
  bootstrap,
  getUploadUrl,
  getDownloadUrl,
  deleteDocument,
};

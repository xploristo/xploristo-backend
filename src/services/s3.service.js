import aws from 'aws-sdk';

// https://www.phmu.de/en/blog/how-to-upload-directly-from-the-front-end-of-a-vue-app-into-an-aws-bucket-with-signedurls/

let s3;

const documentsBucketName = process.env.DOCUMENTS_BUCKET_NAME;

function bootstrap(awsConfig) {
  s3 = new aws.S3(awsConfig);
}

function getUploadUrl(fileName, fileType = 'application/pdf') {
  return s3.getSignedUrl('putObject', {
    Bucket: documentsBucketName,
    Key: fileName,
    ContentType: fileType,
    /* ContentDisposition: 'inline', */
    Expires: 60,
  });
}

function getDownloadUrl(fileName) {
  return s3.getSignedUrl('getObject', {
    Bucket: documentsBucketName,
    Key: fileName,
    Expires: 60,
  });
}


export default {
  bootstrap,
  getUploadUrl,
  getDownloadUrl
};

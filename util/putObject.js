const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials");



exports.putObject = async(file,fileName) =>{
try{
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `fileName`,
        Body: file,
        ContentType: "image/jpg,jpeg,png"

    }
    const command = new PutObjectCommand(params)
    const data = await s3Client.send(command)
    if(data.$metadata.httpStatusCode !== 200){
        return
    }
    let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${params.Key}`
    return {url,key:params.Key}
}catch(err){

}
}
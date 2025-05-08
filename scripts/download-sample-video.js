// download-sample-video.js
// A script to download a sample MP4 video for testing

const fs = require("fs");
const path = require("path");
const https = require("https");

const sampleVideoUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
const outputPath = path.join(__dirname, "sample-video.mp4");

console.log(`Downloading sample video from: ${sampleVideoUrl}`);
console.log(`Saving to: ${outputPath}`);

const file = fs.createWriteStream(outputPath);

https.get(sampleVideoUrl, (response) => {
  response.pipe(file);

  file.on("finish", () => {
    file.close();
    console.log("Download completed!");
    console.log("\nNow upload the video to S3:");
    console.log("node scripts/upload-video-to-s3.js scripts/sample-video.mp4");
  });
}).on("error", (err) => {
  fs.unlink(outputPath, () => {}); // Delete the file on error
  console.error(`Error downloading sample video: ${err.message}`);
});
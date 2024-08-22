const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// Get command-line arguments
const args = process.argv.slice(2);
const [outputDir, size, borderRadius] = args;

if (!outputDir || !size || !borderRadius) {
  console.error(
    "Usage: node processImages.js <outputDir> <size> <borderRadius>"
  );
  process.exit(1);
}

const inputDir = "./original";
const imageSize = parseInt(size, 10);
const radius = parseInt(borderRadius, 10);

// Ensure the output directory exists
fs.ensureDirSync(outputDir);

function createRoundedRectMask(canvas, radius) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
  ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
  ctx.arcTo(0, canvas.height, 0, 0, radius);
  ctx.arcTo(0, 0, canvas.width, 0, radius);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-in";
}

async function processImage(filePath) {
  try {
    const image = await loadImage(filePath);
    const canvas = createCanvas(imageSize, imageSize);
    const ctx = canvas.getContext("2d");

    // Create and apply the rounded rectangle mask
    ctx.clearRect(0, 0, imageSize, imageSize);
    createRoundedRectMask(canvas, radius);

    // Draw the image with the mask applied
    ctx.drawImage(image, 0, 0, imageSize, imageSize);

    // Save the processed image
    const outputFilePath = path.join(outputDir, path.basename(filePath));
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputFilePath, buffer);

    console.log(`Processed: ${outputFilePath}`);
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error);
  }
}

// Process all images in the input directory
async function processAllImages() {
  try {
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter((file) => /\.(png|jpg|jpeg)$/i.test(file));

    for (const file of imageFiles) {
      await processImage(path.join(inputDir, file));
    }

    console.log("All images processed.");
  } catch (error) {
    console.error("Error processing images:", error);
  }
}

processAllImages();

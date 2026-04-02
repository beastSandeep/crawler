const fs = require("fs");
const readline = require("readline");

// Input and output files
const inputFile = "./sitemap copy.xml";
const outputFile = "./sitemap_decoded.xml";

// Create read and write streams
const readStream = fs.createReadStream(inputFile, { encoding: "utf8" });
const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

// Use readline for memory-efficient line-by-line processing
const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  // Decode any URL inside <loc> tags
  const decodedLine = line.replace(
    /<loc>(.*?)<\/loc>/g,
    (_, url) => `<loc>${decodeURI(url)}</loc>`,
  );

  writeStream.write(decodedLine + "\n");
});

rl.on("close", () => {
  writeStream.end();
  console.log("✅ XML URLs decoded and saved to", outputFile);
});

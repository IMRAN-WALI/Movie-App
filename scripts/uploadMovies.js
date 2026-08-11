// scripts/uploadMovies.js
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Supabase credentials
const supabaseUrl = "https://obnhtbeqxdyaldkcwoli.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibmh0YmVxeGR5YWxka2N3b2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA5Mjc0NCwiZXhwIjoyMDk5NjY4NzQ0fQ.k0HhWWRsh38J_OlHvQDxiT5Sgj-s1USPCS-iu8NuGkQ";
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAllMovies() {
  const moviesFolder = "./movies";

  if (!fs.existsSync(moviesFolder)) {
    console.error(`❌ Folder not found: ${moviesFolder}`);
    console.log(
      '📁 Please create a "movies" folder in project root and put all movie files there.',
    );
    return;
  }

  const files = fs.readdirSync(moviesFolder);
  const movieFiles = files.filter(
    (f) => f.startsWith("movie_") && f.endsWith(".mp4"),
  );

  if (movieFiles.length === 0) {
    console.log("❌ No movie_*.mp4 files found in movies folder");
    return;
  }

  console.log(`📤 Found ${movieFiles.length} movie files to upload`);

  for (const fileName of movieFiles) {
    const filePath = path.join(moviesFolder, fileName);
    const fileBuffer = fs.readFileSync(filePath);

    console.log(
      `📤 Uploading: ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`,
    );

    // Supabase Storage mein upload karo
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(fileName, fileBuffer, {
        contentType: "video/mp4",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
    } else {
      console.log(`✅ Uploaded: ${fileName}`);
    }
  }

  console.log("🎉 All movies uploaded successfully!");
}

// Run karo
uploadAllMovies().catch(console.error);

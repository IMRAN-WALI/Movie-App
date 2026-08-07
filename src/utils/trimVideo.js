import { trim } from "react-native-video-trim";

/**
 * Trims a video (local file:// uri OR a remote https:// stream url) down
 * to the given [startSeconds, endSeconds] range and returns a local
 * file:// uri pointing at the trimmed output.
 *
 * react-native-video-trim's trim() expects times in MILLISECONDS, while
 * the rest of the app works in seconds — this handles the conversion.
 *
 * If trimming fails for any reason, it logs the error and falls back to
 * returning the original uri untouched, so callers never hard-crash.
 */
export async function trimVideoToRange(inputUri, startSeconds, endSeconds) {
  try {
    console.log(
      `✂️ Trimming ${inputUri} from ${startSeconds}s to ${endSeconds}s`,
    );

    const result = await trim(inputUri, {
      startTime: Math.round(startSeconds * 1000),
      endTime: Math.round(endSeconds * 1000),
    });

    const outputPath = result?.outputPath;
    if (!outputPath) {
      console.log("⚠️ trim() returned no outputPath, using original video");
      return inputUri;
    }

    const finalUri = outputPath.startsWith("file://")
      ? outputPath
      : `file://${outputPath}`;

    console.log("✅ Trim success:", finalUri);
    return finalUri;
  } catch (error) {
    console.log("❌ trim() failed, falling back to full video:", error);
    return inputUri;
  }
}

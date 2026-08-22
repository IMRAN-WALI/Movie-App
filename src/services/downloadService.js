import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const DOWNLOADS_KEY = "downloads";

// ============================================================
// 🔥 APNI REAL IP DAALEIN - jo backend run kar raha hai
// ============================================================

// ✅ .env file se IP uthayein (production aur development dono ke liye best hai)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:5000";

console.log("🌐 API_BASE_URL:", API_BASE_URL);

export { API_BASE_URL };  

export const downloadStates = {
  QUEUED: "queued",
  DOWNLOADING: "downloading",
  PAUSED: "paused",
  COMPLETED: "completed",
  FAILED: "failed",
};

class DownloadManager {
  constructor() {
    this.downloads = [];
    this.activeDownloads = new Map();
    this.listeners = new Set();
    this.saveInProgress = false;
    this.saveQueued = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.downloads.map(item => ({ ...item }));
    this.listeners.forEach(listener => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("[ERROR] Download listener error:", error);
      }
    });
  }

  async getDownloads() {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
      const parsed = data ? JSON.parse(data) : [];
      
      if (this.activeDownloads.size === 0) {
        this.downloads = Array.isArray(parsed) ? parsed : [];
      }
      
      this.notify();
      return this.downloads;
    } catch (error) {
      console.error("[ERROR] Get downloads error:", error);
      return this.downloads;
    }
  }

  async saveDownloads() {
    this.saveQueued = true;
    if (this.saveInProgress) return;
    
    this.saveInProgress = true;
    try {
      while (this.saveQueued) {
        this.saveQueued = false;
        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(this.downloads));
      }
    } catch (error) {
      console.error("[ERROR] Save downloads error:", error);
    } finally {
      this.saveInProgress = false;
    }
  }

  // ============================================================
  // ADD DOWNLOAD
  // ============================================================

  async addDownload(movieId, title, posterUrl) {
    try {
      const existing = this.downloads.find(
        d => String(d.movieId) === String(movieId) &&
          d.status !== downloadStates.COMPLETED &&
          d.status !== downloadStates.FAILED
      );

      if (existing) {
        throw new Error("Already downloading");
      }

      const fullUrl = `${API_BASE_URL}/api/movies/${movieId}/download`;
      console.log("[DOWNLOAD] URL:", fullUrl);

      // Test connectivity - pehle check karo backend reachable hai?
      try {
        const testResponse = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: 5000, // 5 second timeout
        });
        console.log("[OK] Backend reachable:", testResponse.status);
      } catch (testError) {
        console.error("[ERROR] Backend NOT reachable:", testError.message);
        console.error("[FIX] Check:");
        console.error("  1. Is backend running? (npm start)");
        console.error("  2. Is IP correct?", API_BASE_URL);
        console.error("  3. Run 'ipconfig' and update IP in code");
        throw new Error(`Cannot reach backend at ${API_BASE_URL}. Please check your connection.`);
      }

      const download = {
        id: Date.now().toString(),
        movieId: movieId,
        title: title || `Movie ${movieId}`,
        posterUrl: posterUrl || null,
        videoUrl: fullUrl,
        status: downloadStates.QUEUED,
        progress: 0,
        totalSize: 0,
        downloadedSize: 0,
        fileUri: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.downloads.unshift(download);
      await this.saveDownloads();
      this.notify();

      console.log("[OK] DOWNLOAD CREATED:", {
        id: download.id,
        movieId: download.movieId,
        title: download.title,
        url: download.videoUrl,
      });

      this.startDownload(download);
      return download;

    } catch (error) {
      console.error("[ERROR] Add download error:", error);
      throw error;
    }
  }

  // ============================================================
  // START DOWNLOAD
  // ============================================================

  async startDownload(download) {
    if (!download) {
      console.error("[ERROR] startDownload: missing download");
      return;
    }

    if (this.activeDownloads.has(download.id)) {
      console.log("[WARN] Already active:", download.title);
      return;
    }

    try {
      download.status = downloadStates.DOWNLOADING;
      download.progress = 0;
      download.updatedAt = new Date().toISOString();
      this.notify();
      await this.saveDownloads();

      const safeTitle = String(download.title || "movie")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 80);

      const fileName = `${safeTitle}_${download.movieId}.mp4`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      console.log("[FILE] LOCAL:", fileUri);

      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          console.log("[FILE] Deleting existing...");
          await FileSystem.deleteAsync(fileUri);
        }
      } catch (error) {
        console.log("[FILE] No existing file");
      }

      let lastProgressSaved = 0;

      const downloadResumable = FileSystem.createDownloadResumable(
        download.videoUrl,
        fileUri,
        {
          headers: {
            'Accept': 'video/mp4',
          },
        },
        (progressData) => {
          const written = Number(progressData.totalBytesWritten) || 0;
          const expected = Number(progressData.totalBytesExpectedToWrite) || 0;

          let progress = 0;
          if (expected > 0) {
            progress = written / expected;
          }
          progress = Math.max(0, Math.min(1, progress));

          download.downloadedSize = written;
          download.totalSize = expected;
          download.progress = progress;
          download.status = downloadStates.DOWNLOADING;
          download.updatedAt = new Date().toISOString();

          this.notify();

          const mb = written / 1024 / 1024;
          console.log(`[PROGRESS] ${download.title}: ${(progress * 100).toFixed(1)}% (${mb.toFixed(2)} MB)`);

          const now = Date.now();
          if (now - lastProgressSaved > 500) {
            lastProgressSaved = now;
            this.saveDownloads();
          }
        }
      );

      this.activeDownloads.set(download.id, downloadResumable);

      const result = await downloadResumable.downloadAsync();

      this.activeDownloads.delete(download.id);

      if (!result || result.status < 200 || result.status >= 300) {
        console.error("[ERROR] HTTP:", result?.status);
        download.status = downloadStates.FAILED;
        download.progress = 0;
        download.updatedAt = new Date().toISOString();
        await this.saveDownloads();
        this.notify();
        return;
      }

      if (!result.uri) {
        throw new Error("Local URI is missing.");
      }

      download.status = downloadStates.COMPLETED;
      download.progress = 1;
      download.fileUri = result.uri;
      if (download.totalSize > 0) {
        download.downloadedSize = download.totalSize;
      }
      download.updatedAt = new Date().toISOString();

      console.log("[OK] COMPLETED:", download.title);
      console.log("[FILE] MP4:", result.uri);

      await this.saveDownloads();
      this.notify();

    } catch (error) {
      console.error("[ERROR] DOWNLOAD ERROR:", error);
      this.activeDownloads.delete(download.id);
      download.status = downloadStates.FAILED;
      download.updatedAt = new Date().toISOString();
      await this.saveDownloads();
      this.notify();
    }
  }

  // ============================================================
  // PAUSE, RESUME, DELETE, CLEAR
  // ============================================================

  async pauseDownload(downloadId) {
    const download = this.downloads.find(d => d.id === downloadId);
    const resumable = this.activeDownloads.get(downloadId);

    if (!download || !resumable) return;

    try {
      await resumable.pauseAsync();
      download.status = downloadStates.PAUSED;
      download.updatedAt = new Date().toISOString();
      await this.saveDownloads();
      this.notify();
      console.log("[PAUSED]:", download.title);
    } catch (error) {
      console.error("[ERROR] PAUSE:", error);
    }
  }

  async resumeDownload(downloadId) {
    const download = this.downloads.find(d => d.id === downloadId);
    if (!download || download.status !== downloadStates.PAUSED) return;

    download.status = downloadStates.QUEUED;
    download.updatedAt = new Date().toISOString();
    await this.saveDownloads();
    this.notify();
    this.startDownload(download);
  }

  async deleteDownload(downloadId) {
    const resumable = this.activeDownloads.get(downloadId);
    if (resumable) {
      try {
        await resumable.pauseAsync();
      } catch (error) {}
      this.activeDownloads.delete(downloadId);
    }

    const download = this.downloads.find(d => d.id === downloadId);
    if (download?.fileUri) {
      try {
        await FileSystem.deleteAsync(download.fileUri, { idempotent: true });
        console.log("[DELETED]:", download.fileUri);
      } catch (error) {
        console.error("[ERROR] Delete file:", error);
      }
    }

    this.downloads = this.downloads.filter(d => d.id !== downloadId);
    await this.saveDownloads();
    this.notify();
  }

  async clearCompleted() {
    const completed = this.downloads.filter(d => d.status === downloadStates.COMPLETED);
    for (const download of completed) {
      if (download.fileUri) {
        try {
          await FileSystem.deleteAsync(download.fileUri, { idempotent: true });
        } catch (error) {}
      }
    }

    this.downloads = this.downloads.filter(d => d.status !== downloadStates.COMPLETED);
    await this.saveDownloads();
    this.notify();
  }

  async clearAll() {
    for (const [id, resumable] of this.activeDownloads.entries()) {
      try {
        await resumable.pauseAsync();
      } catch (error) {}
    }
    this.activeDownloads.clear();

    for (const download of this.downloads) {
      if (download.fileUri) {
        try {
          await FileSystem.deleteAsync(download.fileUri, { idempotent: true });
        } catch (error) {}
      }
    }

    this.downloads = [];
    await this.saveDownloads();
    this.notify();
  }
}

export const downloadManager = new DownloadManager();
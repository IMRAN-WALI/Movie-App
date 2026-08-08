import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const DOWNLOADS_KEY = "downloads";

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

    this.saveTimer = null;
    this.saveInProgress = false;
    this.saveQueued = false;
  }

  // =====================================================
  // LISTENERS
  // =====================================================

  subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const snapshot = this.downloads.map((item) => ({
      ...item,
    }));

    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("❌ Download listener error:", error);
      }
    });
  }

  // =====================================================
  // LOAD FROM STORAGE
  // =====================================================

  async getDownloads() {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);

      const parsed = data ? JSON.parse(data) : [];

      /*
       * IMPORTANT:
       *
       * Do NOT overwrite active downloads
       * while a real download is running.
       *
       * This was the reason your progress
       * was returning to 0%.
       */

      if (this.activeDownloads.size === 0) {
        this.downloads = Array.isArray(parsed) ? parsed : [];
      }

      this.notify();

      return this.downloads;
    } catch (error) {
      console.error("❌ Get downloads error:", error);

      return this.downloads;
    }
  }

  // =====================================================
  // SAVE TO STORAGE
  // =====================================================

  async saveDownloads() {
    /*
     * Don't write AsyncStorage hundreds of times
     * per second.
     *
     * Progress gets updated in memory immediately.
     * Storage is persisted shortly afterwards.
     */

    this.saveQueued = true;

    if (this.saveInProgress) {
      return;
    }

    this.saveInProgress = true;

    try {
      while (this.saveQueued) {
        this.saveQueued = false;

        await AsyncStorage.setItem(
          DOWNLOADS_KEY,
          JSON.stringify(this.downloads),
        );
      }
    } catch (error) {
      console.error("❌ Save downloads error:", error);
    } finally {
      this.saveInProgress = false;
    }
  }

  // =====================================================
  // ADD DOWNLOAD
  // =====================================================

  async addDownload(movieId, title, posterUrl, videoUrl) {
    /*
     * Load only if we don't currently have
     * an active download.
     */

    if (this.downloads.length === 0 && this.activeDownloads.size === 0) {
      await this.getDownloads();
    }

    const existing = this.downloads.find(
      (d) =>
        String(d.movieId) === String(movieId) &&
        d.status !== downloadStates.COMPLETED &&
        d.status !== downloadStates.FAILED,
    );

    if (existing) {
      throw new Error("Already downloading");
    }

    if (!videoUrl) {
      throw new Error("No video URL available");
    }

    const download = {
      id: Date.now().toString(),

      movieId,

      title,

      posterUrl: posterUrl || null,

      videoUrl,

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

    console.log("📦 DOWNLOAD RECORD CREATED:", {
      id: download.id,
      title: download.title,
      videoUrl: download.videoUrl,
    });

    /*
     * IMPORTANT:
     *
     * Pass the actual object/reference.
     * Do NOT reload AsyncStorage here.
     */

    this.startDownload(download);

    return download;
  }

  // =====================================================
  // START DOWNLOAD
  // =====================================================

  async startDownload(download) {
    if (!download) {
      console.error("❌ startDownload: missing download");

      return;
    }

    if (this.activeDownloads.has(download.id)) {
      console.log("⚠️ Already active:", download.title);

      return;
    }

    try {
      console.log("🚀 Starting download:", {
        id: download.id,
        title: download.title,
        videoUrl: download.videoUrl,
      });

      // =================================================
      // DOWNLOADING STATE
      // =================================================

      download.status = downloadStates.DOWNLOADING;

      download.progress = 0;

      download.updatedAt = new Date().toISOString();

      this.notify();

      await this.saveDownloads();

      // =================================================
      // LOCAL FILE
      // =================================================

      const fileName = `movie_${download.movieId}_${Date.now()}.mp4`;

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      console.log("📁 LOCAL FILE:", fileUri);

      // =================================================
      // PROGRESS CALLBACK
      // =================================================

      let lastProgressSaved = 0;

      const downloadResumable = FileSystem.createDownloadResumable(
        download.videoUrl,

        fileUri,

        {},

        (progressData) => {
          const written = Number(progressData.totalBytesWritten) || 0;

          const expected = Number(progressData.totalBytesExpectedToWrite) || 0;

          let progress = 0;

          if (expected > 0) {
            progress = written / expected;
          }

          progress = Math.max(0, Math.min(1, progress));

          /*
           * VERY IMPORTANT:
           *
           * Update the same active object.
           * Don't replace it with getDownloads().
           */

          download.downloadedSize = written;

          download.totalSize = expected;

          download.progress = progress;

          download.status = downloadStates.DOWNLOADING;

          download.updatedAt = new Date().toISOString();

          // UI gets immediate update
          this.notify();

          console.log(
            `📥 ${download.title}: ${(progress * 100).toFixed(1)}% (${(
              written /
              1024 /
              1024
            ).toFixed(2)} MB)`,
          );

          /*
           * Save at most roughly every 300ms
           * instead of racing AsyncStorage
           * on every callback.
           */

          const now = Date.now();

          if (now - lastProgressSaved > 300) {
            lastProgressSaved = now;

            this.saveDownloads();
          }
        },
      );

      this.activeDownloads.set(download.id, downloadResumable);

      // =================================================
      // DOWNLOAD
      // =================================================

      const result = await downloadResumable.downloadAsync();

      console.log("✅ DOWNLOAD RESULT:", result);

      // =================================================
      // REMOVE FROM ACTIVE
      // =================================================

      this.activeDownloads.delete(download.id);

      // =================================================
      // HTTP STATUS CHECK
      // =================================================

      if (!result || result.status < 200 || result.status >= 300) {
        console.error("❌ DOWNLOAD HTTP ERROR:", result?.status);

        download.status = downloadStates.FAILED;

        download.progress = 0;

        download.updatedAt = new Date().toISOString();

        await this.saveDownloads();

        this.notify();

        return;
      }

      // =================================================
      // SUCCESS
      // =================================================

      if (!result.uri) {
        throw new Error(
          "Download completed but no local file URI was returned.",
        );
      }

      download.status = downloadStates.COMPLETED;

      download.progress = 1;

      download.fileUri = result.uri;

      if (download.totalSize > 0) {
        download.downloadedSize = download.totalSize;
      }

      download.updatedAt = new Date().toISOString();

      console.log("🎉 DOWNLOAD COMPLETED:", download.title);

      console.log("📁 LOCAL MP4:", result.uri);

      /*
       * NO MediaLibrary.
       *
       * NO Gallery.
       *
       * File remains inside app storage.
       */

      await this.saveDownloads();

      this.notify();

      console.log("✅ DOWNLOAD RECORD SAVED:", {
        title: download.title,

        status: download.status,

        progress: download.progress,

        fileUri: download.fileUri,
      });
    } catch (error) {
      console.error("❌ DOWNLOAD ERROR:", error);

      console.error("❌ ERROR MESSAGE:", error?.message);

      this.activeDownloads.delete(download.id);

      download.status = downloadStates.FAILED;

      download.updatedAt = new Date().toISOString();

      await this.saveDownloads();

      this.notify();
    }
  }

  // =====================================================
  // PAUSE
  // =====================================================

  async pauseDownload(downloadId) {
    const download = this.downloads.find((d) => d.id === downloadId);

    const resumable = this.activeDownloads.get(downloadId);

    if (!download || !resumable) {
      return;
    }

    try {
      await resumable.pauseAsync();

      download.status = downloadStates.PAUSED;

      download.updatedAt = new Date().toISOString();

      await this.saveDownloads();

      this.notify();

      console.log("⏸️ PAUSED:", download.title);
    } catch (error) {
      console.error("❌ PAUSE ERROR:", error);
    }
  }

  // =====================================================
  // RESUME
  // =====================================================

  async resumeDownload(downloadId) {
    const download = this.downloads.find((d) => d.id === downloadId);

    if (!download || download.status !== downloadStates.PAUSED) {
      return;
    }

    download.status = downloadStates.QUEUED;

    download.updatedAt = new Date().toISOString();

    await this.saveDownloads();

    this.notify();

    this.startDownload(download);
  }

  // =====================================================
  // DELETE
  // =====================================================

  async deleteDownload(downloadId) {
    const resumable = this.activeDownloads.get(downloadId);

    if (resumable) {
      try {
        await resumable.pauseAsync();
      } catch (error) {}

      this.activeDownloads.delete(downloadId);
    }

    const download = this.downloads.find((d) => d.id === downloadId);

    if (download?.fileUri) {
      try {
        await FileSystem.deleteAsync(download.fileUri, {
          idempotent: true,
        });

        console.log("🗑️ LOCAL FILE DELETED:", download.fileUri);
      } catch (error) {
        console.error("❌ Delete file error:", error);
      }
    }

    this.downloads = this.downloads.filter((d) => d.id !== downloadId);

    await this.saveDownloads();

    this.notify();
  }

  // =====================================================
  // CLEAR COMPLETED
  // =====================================================

  async clearCompleted() {
    const completed = this.downloads.filter(
      (d) => d.status === downloadStates.COMPLETED,
    );

    for (const download of completed) {
      if (download.fileUri) {
        try {
          await FileSystem.deleteAsync(download.fileUri, {
            idempotent: true,
          });
        } catch (error) {}
      }
    }

    this.downloads = this.downloads.filter(
      (d) => d.status !== downloadStates.COMPLETED,
    );

    await this.saveDownloads();

    this.notify();
  }

  // =====================================================
  // CLEAR ALL
  // =====================================================

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
          await FileSystem.deleteAsync(download.fileUri, {
            idempotent: true,
          });
        } catch (error) {}
      }
    }

    this.downloads = [];

    await this.saveDownloads();

    this.notify();
  }
}

export const downloadManager = new DownloadManager();

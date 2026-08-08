import { useCallback, useEffect, useState } from "react";

import { downloadManager } from "../services/downloadService";

export function useDownloads() {
  const [downloads, setDownloads] = useState([]);

  const [loading, setLoading] = useState(true);

  // ============================================
  // LOAD ONCE
  // ============================================

  const loadDownloads = useCallback(async () => {
    try {
      const data = await downloadManager.getDownloads();

      setDownloads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Load downloads error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // INITIAL LOAD + REAL-TIME LISTENER
  // ============================================

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const data = await downloadManager.getDownloads();

      if (mounted) {
        setDownloads(Array.isArray(data) ? data : []);

        setLoading(false);
      }
    };

    init();

    /*
     * IMPORTANT:
     *
     * No setInterval here.
     *
     * DownloadManager itself sends
     * progress updates.
     */

    const unsubscribe = downloadManager.subscribe((data) => {
      if (!mounted) {
        return;
      }

      setDownloads(Array.isArray(data) ? data : []);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ============================================
  // DOWNLOAD
  // ============================================

  const downloadMovie = useCallback(
    async (movieId, title, posterUrl, videoUrl) => {
      return downloadManager.addDownload(movieId, title, posterUrl, videoUrl);
    },
    [],
  );

  // ============================================
  // DELETE
  // ============================================

  const deleteDownload = useCallback(async (id) => {
    await downloadManager.deleteDownload(id);
  }, []);

  // ============================================
  // PAUSE
  // ============================================

  const pauseDownload = useCallback(async (id) => {
    await downloadManager.pauseDownload(id);
  }, []);

  // ============================================
  // RESUME
  // ============================================

  const resumeDownload = useCallback(async (id) => {
    await downloadManager.resumeDownload(id);
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    const data = await downloadManager.getDownloads();

    setDownloads(Array.isArray(data) ? data : []);
  }, []);

  return {
    downloads,

    loading,

    downloadMovie,

    deleteDownload,

    pauseDownload,

    resumeDownload,

    refresh,
  };
}

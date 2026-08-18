import { useCallback, useEffect, useState } from "react";

import { downloadManager } from "../services/downloadService";

export function useDownloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // LOAD DOWNLOADS
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
  // INITIAL LOAD + REAL-TIME UPDATES
  // ============================================

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const data = await downloadManager.getDownloads();

        if (mounted) {
          setDownloads(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Downloads init error:", error);

        if (mounted) {
          setDownloads([]);
          setLoading(false);
        }
      }
    };

    init();

    // DownloadManager already sends progress updates.
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
  // DOWNLOAD MOVIE
  // ============================================

  const downloadMovie = useCallback(
    async (movieId, title, posterUrl, videoUrl) => {
      if (!movieId) {
        throw new Error("Movie ID is required.");
      }

      if (!videoUrl) {
        throw new Error("Full movie download URL is missing.");
      }

      return await downloadManager.addDownload(
        movieId,
        title,
        posterUrl,
        videoUrl,
      );
    },
    [],
  );

  // ============================================
  // DELETE
  // ============================================

  const deleteDownload = useCallback(async (id) => {
    if (!id) {
      return;
    }

    await downloadManager.deleteDownload(id);
  }, []);

  // ============================================
  // PAUSE
  // ============================================

  const pauseDownload = useCallback(async (id) => {
    if (!id) {
      return;
    }

    await downloadManager.pauseDownload(id);
  }, []);

  // ============================================
  // RESUME
  // ============================================

  const resumeDownload = useCallback(async (id) => {
    if (!id) {
      return;
    }

    await downloadManager.resumeDownload(id);
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    try {
      const data = await downloadManager.getDownloads();

      setDownloads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Refresh downloads error:", error);
    }
  }, []);

  return {
    downloads,
    loading,

    downloadMovie,

    deleteDownload,
    pauseDownload,
    resumeDownload,

    refresh,
    loadDownloads,
  };
}
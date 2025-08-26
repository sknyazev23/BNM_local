import { useEffect, useState, useCallback } from "react";
import API from "../api";

/**
 * Хук работы со статусом Job (open/close)
 * Ожидаемые бэкенд-эндпоинты:
 *  GET  /jobs/:jobId/status   -> { closed: boolean }
 *  PATCH /jobs/:jobId/close   -> 200
 *  PATCH /jobs/:jobId/open    -> 200
 */
export default function useJobClosed(jobId) {
  const [isClosed, setIsClosed] = useState(false);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!jobId) { setIsClosed(false); return; }
    try {
      const res = await API.get(`/jobs/${jobId}/status`);
      setIsClosed(!!res.data?.closed);
    } catch {
      // если эндпоинта нет — просто не меняем состояние
    }
  }, [jobId]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async () => {
    if (!jobId || pending) return;
    setPending(true);
    try {
      if (isClosed) {
        await API.patch(`/jobs/${jobId}/open`);
        setIsClosed(false);
      } else {
        await API.patch(`/jobs/${jobId}/close`);
        setIsClosed(true);
      }
    } finally {
      setPending(false);
    }
  }, [jobId, isClosed, pending]);

  return { isClosed, pending, toggle, refresh, setIsClosed };
}

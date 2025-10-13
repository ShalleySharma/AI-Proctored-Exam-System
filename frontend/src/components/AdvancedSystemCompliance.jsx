import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * AdvancedSystemCompliance (fixed)
 *
 * Props:
 *  - onViolation(msg) : function to call when a violation occurs (ExamPage uses it)
 *  - isMonitoringActive : boolean (start/stop monitoring)
 *  - sessionId : used to persist violations locally per session
 *  - onStreamReady(stream) : called once when a stream is successfully acquired
 *
 * Major improvements:
 *  - Prevent repeated getUserMedia calls / restart loops
 *  - Deduplicate warnings per session
 *  - Persist violations & counts to localStorage
 *  - Use online/offline events for internet checks
 *  - Debounce repeated blur/visibility events
 */

const STORAGE_PREFIX = "proctor";

const AdvancedSystemCompliance = ({
  onViolation,
  isMonitoringActive = false,
  sessionId,
  onStreamReady,
}) => {
  const [cameraStatus, setCameraStatus] = useState("Initializing...");
  const [micStatus, setMicStatus] = useState("Initializing...");
  const [internetStatus, setInternetStatus] = useState("Checking...");
  const [tabStatus, setTabStatus] = useState("Active");
  const [warningsList, setWarningsList] = useState([]);
  const streamRef = useRef(null);
  const isStarting = useRef(false);
  const lastStatusRef = useRef({ camera: null, mic: null, tab: null, internet: null });
  const warningsSetRef = useRef(new Set()); // dedupe warnings this session
  const restartBackoffRef = useRef(0); // exponential backoff for retries

  // helper to persist violations & counts
  const persistViolations = (violations) => {
    if (!sessionId) return;
    localStorage.setItem(`${STORAGE_PREFIX}_violations_${sessionId}`, JSON.stringify(violations));
  };

  // Load existing warnings/violations on mount
  useEffect(() => {
    if (sessionId) {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}_violations_${sessionId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWarningsList(parsed);
          parsed.forEach(v => warningsSetRef.current.add(v.message)); // avoid duplicates
        } catch (e) {
          // ignore parse error
        }
      }
    }
  }, [sessionId]);

  // add a single warning (deduplicated)
  const addWarning = useCallback((message) => {
    if (warningsSetRef.current.has(message)) return; // already recorded
    warningsSetRef.current.add(message);

    const violation = { message, timestamp: new Date().toISOString() };
    setWarningsList(prev => {
      const updated = [...prev, violation];
      persistViolations(updated);
      return updated;
    });
    if (onViolation) onViolation(message);
  }, [onViolation, sessionId]);

  // safe function to stop current stream
  const stopCurrentStream = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => {
        try { t.stop(); } catch (e) { /* ignore */ }
      });
      streamRef.current = null;
    }
  }, []);

  // Start/get media only if not already active. Use guards to avoid rapid repeated calls.
  const startStream = useCallback(async () => {
    if (!isMonitoringActive) return;
    if (isStarting.current) return;
    // If a stream exists and has active tracks, don't restart
    const existing = streamRef.current;
    if (existing && existing.getTracks().some(t => t.readyState !== "ended")) {
      return;
    }

    isStarting.current = true;
    try {
      // request both video and audio
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // reset backoff on success
      restartBackoffRef.current = 0;

      streamRef.current = mediaStream;

      // call back so ExamPage video element can be assigned once
      if (onStreamReady) {
        onStreamReady(mediaStream);
      }

      // attach listeners for track ended to attempt restart gracefully
      mediaStream.getTracks().forEach(track => {
        // use onended to detect hardware/permission stop
        track.onended = () => {
          // Add a warning depending on track kind
          addWarning(track.kind === "video" ? "Camera turned off" : "Microphone turned off");
          // attempt restart with exponential backoff
          const backoff = Math.min(30000, (restartBackoffRef.current || 0) + 2000);
          restartBackoffRef.current = backoff;
          setTimeout(() => {
            // only restart if monitoring still active
            if (isMonitoringActive) startStream();
          }, backoff);
        };
      });

      setCameraStatus("✅ Camera On");
      setMicStatus("✅ Microphone On");
    } catch (err) {
      // If permission denied or other error, record a single warning
      addWarning("Failed to access camera or microphone. Please allow permissions.");
      setCameraStatus("❌ Camera not accessible");
      setMicStatus("❌ Microphone not accessible");
    } finally {
      isStarting.current = false;
    }
  }, [onStreamReady, addWarning, isMonitoringActive]);

  // INTERNET: use online/offline events + navigator.onLine
  useEffect(() => {
    const handleOnline = () => {
      setInternetStatus("✅ Internet OK");
    };
    const handleOffline = () => {
      setInternetStatus("❌ No Internet");
      addWarning("No internet connection.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // initial state
    if (navigator.onLine) setInternetStatus("✅ Internet OK");
    else {
      setInternetStatus("❌ No Internet");
      addWarning("No internet connection.");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addWarning]);

  // VISIBILITY & BLUR/FOCUS handling — dedup using lastStatusRef
  useEffect(() => {
    if (!isMonitoringActive) return;

    let blurTimeout = null;

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (lastStatusRef.current.tab !== "hidden") {
          lastStatusRef.current.tab = "hidden";
          setTabStatus("❌ Inactive (Tab switched)");
          addWarning("Tab switching detected!");
        }
      } else {
        if (lastStatusRef.current.tab !== "visible") {
          lastStatusRef.current.tab = "visible";
          setTabStatus("✅ Active");
        }
      }
    };

    const onBlur = () => {
      // sometimes focus/blur fires multiple times — debounce a little
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        if (lastStatusRef.current.tab !== "blurred") {
          lastStatusRef.current.tab = "blurred";
          setTabStatus("❌ Window inactive");
          addWarning("Window switched or minimized!");
        }
      }, 120);
    };

    const onFocus = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      if (lastStatusRef.current.tab !== "focused") {
        lastStatusRef.current.tab = "focused";
        setTabStatus("✅ Active");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // cleanup
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, [isMonitoringActive, addWarning]);

  // devicechange — e.g., user plugs/unplugs camera or changes browser permissions
  useEffect(() => {
    if (!isMonitoringActive) return;

    const handleDeviceChange = async () => {
      // enumerate devices to detect presence of camera/microphone
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === "videoinput");
        const hasAudio = devices.some(d => d.kind === "audioinput");

        if (!hasVideo) {
          setCameraStatus("❌ Camera not available");
          addWarning("No camera found.");
        }
        if (!hasAudio) {
          setMicStatus("❌ Microphone not available");
          addWarning("No microphone found.");
        }

        // If devices exist but we don't have a live stream, try to start it.
        const existing = streamRef.current;
        if ((hasVideo || hasAudio) && (!existing || existing.getTracks().every(t => t.readyState === "ended"))) {
          // small delay, then attempt start (guard inside startStream)
          setTimeout(() => startStream(), 800);
        }
      } catch (e) {
        // ignore enumerate errors
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      try {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      } catch (e) { /* some browsers require removeEventListener with same reference */ }
    };
  }, [isMonitoringActive, startStream, addWarning]);

  // Periodic sanity check (camera/mic states). This does NOT restart streams aggressively.
  useEffect(() => {
    if (!isMonitoringActive) return;

    const checkInterval = setInterval(() => {
      const s = streamRef.current;
      if (s) {
        const v = s.getVideoTracks()[0];
        const a = s.getAudioTracks()[0];

        const camOn = !!(v && v.enabled && v.readyState !== "ended");
        const micOn = !!(a && a.enabled && a.readyState !== "ended");

        if (camOn && lastStatusRef.current.camera !== "on") {
          lastStatusRef.current.camera = "on";
          setCameraStatus("✅ Camera On");
        }
        if (!camOn && lastStatusRef.current.camera !== "off") {
          lastStatusRef.current.camera = "off";
          setCameraStatus("❌ Camera Off");
          addWarning("Camera turned off or blocked.");
          // try restart once (startStream has guards)
          startStream();
        }

        if (micOn && lastStatusRef.current.mic !== "on") {
          lastStatusRef.current.mic = "on";
          setMicStatus("✅ Microphone On");
        }
        if (!micOn && lastStatusRef.current.mic !== "off") {
          lastStatusRef.current.mic = "off";
          setMicStatus("❌ Microphone Off");
          addWarning("Microphone turned off or blocked.");
          // try restart once
          startStream();
        }
      } else {
        // no stream present — attempt start once
        startStream();
      }
    }, 8000); // every 8 seconds

    return () => clearInterval(checkInterval);
  }, [isMonitoringActive, addWarning, startStream]);

  // Start/stop stream when monitoring toggled
  useEffect(() => {
    if (isMonitoringActive) {
      startStream();
    } else {
      // stop stream and cleanup
      stopCurrentStream();
      setCameraStatus("Not monitoring");
      setMicStatus("Not monitoring");
      setTabStatus("Not monitoring");
      setInternetStatus(navigator.onLine ? "✅ Internet OK" : "❌ No Internet");
    }
    // we intentionally do not include startStream/stopCurrentStream in deps to keep effect behavior predictable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonitoringActive]);

  // expose simple UI block
  return (
    <div style={{ textAlign: "center", padding: "12px" }}>
      <h4 style={{ marginBottom: 8 }}>🧩 System Compliance Monitor</h4>

      <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "left" }}>
        <p><strong>🎥 Camera:</strong> {cameraStatus}</p>
        <p><strong>🎤 Microphone:</strong> {micStatus}</p>
        <p><strong>🌐 Internet:</strong> {internetStatus}</p>
        <p><strong>🪟 Tab Status:</strong> {tabStatus}</p>
      </div>

      <div style={{ marginTop: 12 }}>
        {warningsList.length > 0 ? (
          <div style={{
            background: "#fff7ed",
            color: "#663c00",
            padding: "10px",
            borderRadius: 8,
            border: "1px solid #ffd8a8",
            maxWidth: 520,
            margin: "0 auto"
          }}>
            <strong>⚠️ Warnings</strong>
            <ul style={{ marginTop: 8 }}>
              {warningsList.map((w, i) => (
                <li key={i} style={{ fontSize: 13 }}>
                  {new Date(w.timestamp).toLocaleTimeString()} — {w.message}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ color: "#155724", background: "#d4edda", padding: "8px", borderRadius: 8, maxWidth: 360, margin: "0 auto" }}>
            ✅ All systems functional — You can proceed.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSystemCompliance;

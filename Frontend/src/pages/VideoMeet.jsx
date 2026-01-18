import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import server from "../environment";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

const server_url = `${server}`;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const silence = () => {
  let ctx = new AudioContext();
  let oscillator = ctx.createOscillator();
  let dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  ctx.resume();
  return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};

const black = ({ width = 640, height = 480 } = {}) => {
  let canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  });
  canvas.getContext("2d").fillRect(0, 0, width, height);
  let stream = canvas.captureStream();
  return Object.assign(stream.getVideoTracks()[0], { enabled: false });
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const { completeMeeting } = useContext(AuthContext);
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const videoRef = useRef([]);
  const chatDisplayRef = useRef(null);
  const userNamesMap = useRef({}); // Map socketId to username

  let [videos, setVideos] = useState([]);

  const callStartRef = useRef(null);
  const timerIdRef = useRef(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lobbyCountdown, setLobbyCountdown] = useState(30);
  const [permissionError, setPermissionError] = useState(null);

  // Prevent browser back navigation during active call
  useEffect(() => {
    if (isCallActive && !askForUsername) {
      const handlePopState = (e) => {
        e.preventDefault();
        setShowDisconnectDialog(true);
        window.history.pushState(null, "", window.location.href);
      };

      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isCallActive, askForUsername]);

  useEffect(() => {
    if (!askForUsername && isCallActive) {
      if (videos.length > 0 && !callStartRef.current) {
        callStartRef.current = Date.now();
        timerIdRef.current = setInterval(() => {
          const sec = Math.floor((Date.now() - callStartRef.current) / 1000);
          setElapsedSeconds(sec);
        }, 1000);
      }
      if (videos.length === 0 && callStartRef.current) {
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current);
          timerIdRef.current = null;
        }
        callStartRef.current = null;
        setElapsedSeconds(0);
      }
    }
  }, [videos, isCallActive, askForUsername]);

  // Store active call info in localStorage
  useEffect(() => {
    if (isCallActive && !askForUsername) {
      const meetingCode =
        window.location.pathname.substring(1) || window.location.href;
      localStorage.setItem(
        "activeCall",
        JSON.stringify({ meetingCode, username }),
      );
    } else {
      localStorage.removeItem("activeCall");
    }
  }, [isCallActive, askForUsername, username]);

  useEffect(() => {
    console.log("HELLO");
    // Only check permissions on mount; don't hold a stream open here.
    getPermissions();

    // Prevent navigation during active call
    const handleBeforeUnload = (e) => {
      if (isCallActive) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start preview when the user enters the lobby. We intentionally do NOT
  // include `lobbyCountdown` here to avoid restarting/stopping the preview
  // on every tick (that caused blinking). The preview will remain active
  // until the user leaves the lobby (askForUsername -> false) or navigates away.
  useEffect(() => {
    if (askForUsername && !isCallActive) {
      startPreview();
    }

    return () => {
      // Do not stop preview on every change; we'll stop explicitly when
      // leaving the lobby or unmounting.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askForUsername, isCallActive]);

  // Stop preview when the user leaves the lobby (e.g., enters the call)
  useEffect(() => {
    if (!askForUsername) {
      stopPreview();
    }
    // also stop on unmount
    return () => {
      // no-op
    };
  }, [askForUsername]);

  useEffect(() => {
    if (askForUsername) {
      const id = setInterval(() => {
        setLobbyCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [askForUsername]);

  // Intercept browser back button
  useEffect(() => {
    if (isCallActive && !askForUsername) {
      // Push state to prevent back navigation
      window.history.pushState(null, "", window.location.href);

      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        setShowDisconnectDialog(true);
        setPendingNavigation(() => () => {
          endCall();
          navigate("/home");
        });
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isCallActive, askForUsername, navigate]);

  useEffect(() => {
    const handleDeviceChange = () => {
      getPermissions();
    };
    if (
      navigator.mediaDevices &&
      "addEventListener" in navigator.mediaDevices
    ) {
      navigator.mediaDevices.addEventListener(
        "devicechange",
        handleDeviceChange,
      );
    }
    return () => {
      if (
        navigator.mediaDevices &&
        "removeEventListener" in navigator.mediaDevices
      ) {
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          handleDeviceChange,
        );
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject.getTracks().forEach((t) => t.stop());
        }
      } catch {}
      localStorage.setItem("cameraOn", "false");
      localStorage.setItem("microphoneOn", "false");
    };
  }, []);

  useEffect(() => {
    if (askForUsername) {
      const handlePopFromLobby = () => {
        // Use stopPreview to centrally handle cleanup
        stopPreview();
        localStorage.setItem("cameraOn", "false");
        localStorage.setItem("microphoneOn", "false");
      };
      window.addEventListener("popstate", handlePopFromLobby);
      return () => window.removeEventListener("popstate", handlePopFromLobby);
    }
  }, [askForUsername]);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    // Check permissions but don't keep a persistent stream open here.
    // Preview streams are started/stopped explicitly via startPreview/stopPreview.
    try {
      let videoGranted = false;
      let audioGranted = false;

      try {
        const videoPermission = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoPermission) {
          videoPermission.getTracks().forEach((track) => track.stop());
          videoGranted = true;
          setVideoAvailable(true);
          console.log("Video permission granted");
        }
      } catch (e) {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      try {
        const audioPermission = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (audioPermission) {
          audioPermission.getTracks().forEach((track) => track.stop());
          audioGranted = true;
          setAudioAvailable(true);
          console.log("Audio permission granted");
        }
      } catch (e) {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
    } catch (error) {
      console.log(error);
      setPermissionError(
        "Device permissions changed or denied. Please re-enable camera/microphone.",
      );
    }
  };

  // Preview control: start/stop a lightweight preview stream during lobby only.
  const previewActiveRef = useRef(false);

  const startPreview = async () => {
    if (previewActiveRef.current) return;
    try {
      // Only start video preview (no socket connections) so user can test devices.
      const constraints = { video: true, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      window.localStream = stream;
      if (localVideoref.current) localVideoref.current.srcObject = stream;
      previewActiveRef.current = true;
      localStorage.setItem("cameraOn", "true");
    } catch (e) {
      console.log("Failed to start preview", e);
    }
  };

  const stopPreview = () => {
    try {
      if (localVideoref.current && localVideoref.current.srcObject) {
        localVideoref.current.srcObject.getTracks().forEach((t) => t.stop());
        localVideoref.current.srcObject = null;
      }
    } catch (e) {
      console.log(e);
    }
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((t) => t.stop());
        window.localStream = null;
      }
    } catch (e) {
      console.log(e);
    }
    previewActiveRef.current = false;
    localStorage.setItem("cameraOn", "false");
  };

  const getSenderForKind = (pc, kind) => {
    try {
      if (!pc || !pc.getSenders) return null;
      return (
        pc.getSenders().find((s) => s.track && s.track.kind === kind) || null
      );
    } catch (e) {
      return null;
    }
  };

  const applyTrackSettings = async () => {
    // If we already have a local stream, enable/disable tracks instead of
    // re-acquiring a full stream to avoid blinking.
    if (window.localStream) {
      // VIDEO
      try {
        const vTracks = window.localStream.getVideoTracks();
        if (video) {
          if (vTracks.length > 0) {
            vTracks.forEach((t) => (t.enabled = true));
          } else {
            // obtain a fresh video track and add/replace
            try {
              const s = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              const newTrack = s.getVideoTracks()[0];
              window.localStream.addTrack(newTrack);
              if (localVideoref.current)
                localVideoref.current.srcObject = window.localStream;
              for (let id in connections) {
                const sender = getSenderForKind(connections[id], "video");
                if (sender && sender.replaceTrack) {
                  sender
                    .replaceTrack(newTrack)
                    .catch(() =>
                      connections[id].addTrack(newTrack, window.localStream),
                    );
                } else {
                  connections[id].addTrack(newTrack, window.localStream);
                }
              }
            } catch (e) {
              console.log("Failed to obtain video track", e);
            }
          }
        } else {
          vTracks.forEach((t) => (t.enabled = false));
        }
      } catch (e) {
        console.log(e);
      }

      // AUDIO
      try {
        const aTracks = window.localStream.getAudioTracks();
        if (audio) {
          if (aTracks.length > 0) {
            aTracks.forEach((t) => (t.enabled = true));
          } else {
            try {
              const s = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
              const newTrack = s.getAudioTracks()[0];
              window.localStream.addTrack(newTrack);
              for (let id in connections) {
                const sender = getSenderForKind(connections[id], "audio");
                if (sender && sender.replaceTrack) {
                  sender
                    .replaceTrack(newTrack)
                    .catch(() =>
                      connections[id].addTrack(newTrack, window.localStream),
                    );
                } else {
                  connections[id].addTrack(newTrack, window.localStream);
                }
              }
            } catch (e) {
              console.log("Failed to obtain audio track", e);
            }
          }
        } else {
          aTracks.forEach((t) => (t.enabled = false));
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      // No existing localStream: create one matching current flags
      getUserMedia();
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      applyTrackSettings();
      console.log("SET STATE HAS ", video, audio);
      localStorage.setItem("cameraOn", String(!!video));
      localStorage.setItem("microphoneOn", String(!!audio));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, audio]);
  let getMedia = () => {
    setVideo(!!videoAvailable);
    setAudio(!!audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    // Do not stop previous stream here; we prefer to update/replace tracks
    // only when necessary to avoid blinking. Assign the new stream and
    // update the video element.
    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      // For existing peer connections, try to replace existing RTCRtpSenders'
      // tracks instead of adding/stopping tracks and renegotiating which
      // causes blinking. Fall back to addTrack if replace fails.
      try {
        const tracks = window.localStream.getTracks();
        tracks.forEach((track) => {
          try {
            const senders = connections[id].getSenders
              ? connections[id].getSenders()
              : [];
            const existing = senders.find(
              (s) => s.track && s.track.kind === track.kind,
            );
            if (existing && existing.replaceTrack) {
              existing.replaceTrack(track).catch(() => {
                connections[id].addTrack(track, window.localStream);
              });
            } else {
              connections[id].addTrack(track, window.localStream);
            }
          } catch (e) {
            try {
              connections[id].addTrack(track, window.localStream);
            } catch (err) {
              console.log(err);
            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            // Disable/stop current element tracks
            let tracks = [];
            if (localVideoref.current && localVideoref.current.srcObject) {
              tracks = localVideoref.current.srcObject.getTracks();
              tracks.forEach((t) => t.stop());
            }
          } catch (e) {
            console.log(e);
          }

          let blackSilence = new MediaStream([black(), silence()]);
          window.localStream = blackSilence;
          if (localVideoref.current)
            localVideoref.current.srcObject = window.localStream;

          // Replace tracks on peers with black/silence stream without forcing a full renegotiation
          for (let id in connections) {
            try {
              const tracks = window.localStream.getTracks();
              tracks.forEach((t) => {
                const senders = connections[id].getSenders
                  ? connections[id].getSenders()
                  : [];
                const existing = senders.find(
                  (s) => s.track && s.track.kind === t.kind,
                );
                if (existing && existing.replaceTrack) {
                  existing
                    .replaceTrack(t)
                    .catch(() =>
                      connections[id].addTrack(t, window.localStream),
                    );
                } else {
                  connections[id].addTrack(t, window.localStream);
                }
              });
            } catch (e) {
              console.log(e);
            }
          }
        }),
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        // Instead of stopping tracks (which can cause device re-acquire and blinking),
        // just disable them so they remain available without restarting the device.
        if (window.localStream) {
          window.localStream.getTracks().forEach((t) => (t.enabled = false));
          if (localVideoref.current)
            localVideoref.current.srcObject = window.localStream;
        } else {
          let tracks = [];
          if (localVideoref.current && localVideoref.current.srcObject)
            tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((track) => (track.enabled = false));
        }
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      window.localStream.getTracks().forEach((track) => {
        connections[id].addTrack(track, window.localStream);
      });

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = new MediaStream([black(), silence()]);
          window.localStream = blackSilence;
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    // Clear chat history for new connection
    setMessages([]);
    setNewMessages(0);

    // Disconnect previous socket if exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io.connect(server_url);

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      // Use the meeting code from URL pathname for room identification
      // Extract meeting code from pathname (e.g., /abc123 -> abc123)
      const pathname = window.location.pathname;
      const meetingCode = pathname.startsWith("/")
        ? pathname.substring(1)
        : pathname;
      // Use meeting code or fallback to full URL if no meeting code
      const roomId = meetingCode || window.location.href;
      socketRef.current.emit("join-call", roomId, username);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        delete userNamesMap.current[id];
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients, userInfo) => {
        // Store username mapping
        if (userInfo && userInfo.allClients) {
          userInfo.allClients.forEach((client) => {
            if (client.username) {
              userNamesMap.current[client.socketId] = client.username;
            }
          });
        }

        clients.forEach((socketListId) => {
          // Skip if already connected
          if (
            connections[socketListId] &&
            socketListId !== socketIdRef.current
          ) {
            return;
          }

          if (socketListId === socketIdRef.current) {
            return; // Skip self
          }

          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].ontrack = (event) => {
            const stream = event.streams[0] || event.stream;

            if (!stream) {
              console.warn("No stream found in track event");
              return;
            }

            // Check if video already exists to prevent duplicates
            setVideos((videos) => {
              const exists = videos.some((v) => v.socketId === socketListId);
              if (exists) {
                // Update existing video stream
                return videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: stream }
                    : video,
                );
              } else {
                // Create new video with username - prevent duplicates
                const participantUsername =
                  userNamesMap.current[socketListId] ||
                  `User ${socketListId.substring(0, 8)}`;
                const newVideo = {
                  socketId: socketListId,
                  stream: stream,
                  username: participantUsername,
                  autoplay: true,
                  playsinline: true,
                };
                // Double check to prevent duplicates
                const exists = videos.some((v) => v.socketId === socketListId);
                if (!exists) {
                  return [...videos, newVideo];
                }
                return videos;
              }
            });
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            window.localStream.getTracks().forEach((track) => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          } else {
            let blackSilence = new MediaStream([black(), silence()]);
            window.localStream = blackSilence;
            window.localStream.getTracks().forEach((track) => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              window.localStream.getTracks().forEach((track) => {
                try {
                  const senders = connections[id2].getSenders
                    ? connections[id2].getSenders()
                    : [];
                  const existing = senders.find(
                    (s) => s.track && s.track.kind === track.kind,
                  );
                  if (existing && existing.replaceTrack) {
                    existing.replaceTrack(track).catch(() => {
                      connections[id2].addTrack(track, window.localStream);
                    });
                  } else {
                    connections[id2].addTrack(track, window.localStream);
                  }
                } catch (err) {
                  try {
                    connections[id2].addTrack(track, window.localStream);
                  } catch (e) {
                    console.log(e);
                  }
                }
              });
            } catch (e) {
              console.log(e);
            }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let handleVideo = () => {
    setVideo(!video);
    // getUserMedia();
  };
  let handleAudio = () => {
    setAudio(!audio);
    // getUserMedia();
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  const inactivityTimerRef = useRef(null);
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setVideo(false);
      setAudio(false);
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject.getTracks().forEach((t) => t.stop());
        }
      } catch {}
      localStorage.setItem("cameraOn", "false");
      localStorage.setItem("microphoneOn", "false");
    }, 30000);
  };

  useEffect(() => {
    const onActivity = () => resetInactivityTimer();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);
    resetInactivityTimer();
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  let handleEndCall = (confirmed = false) => {
    if (!confirmed && isCallActive) {
      setShowDisconnectDialog(true);
      setPendingNavigation(() => () => {
        endCall();
      });
      return;
    }

    endCall();
  };

  const endCall = () => {
    try {
      setIsCallActive(false);
      setVideo(false);
      setAudio(false);
      localStorage.setItem("cameraOn", "false");
      localStorage.setItem("microphoneOn", "false");
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      const finalSeconds = callStartRef.current
        ? Math.floor((Date.now() - callStartRef.current) / 1000)
        : elapsedSeconds;
      const mm = String(Math.floor(finalSeconds / 60)).padStart(2, "0");
      const ss = String(finalSeconds % 60).padStart(2, "0");
      const durationStr = `${mm}:${ss}`;
      const meetingCode = window.location.pathname.substring(1) || "meeting";
      if (completeMeeting) {
        completeMeeting(meetingCode, durationStr).catch(() => {});
      }
      callStartRef.current = null;
      setElapsedSeconds(0);
      localStorage.removeItem("activeMeeting");
      localStorage.removeItem("activeMeetingUsername");

      // Stop all tracks
      if (localVideoref.current && localVideoref.current.srcObject) {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }

      // Ensure any preview is also stopped
      stopPreview();

      // Stop all peer connections
      for (let id in connections) {
        if (connections[id]) {
          connections[id].close();
        }
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Clear state
      setVideos([]);
      setMessages([]);
      userNamesMap.current = {};
      connections = {};

      setShowDisconnectDialog(false);
    } catch (e) {
      console.log(e);
    }
    // Redirect to home page
    navigate("/home");
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    const isOwnMessage = socketIdSender === socketIdRef.current;
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: sender,
        data: data,
        isOwn: isOwnMessage,
        socketId: socketIdSender,
      },
    ]);
    if (!isOwnMessage) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatDisplayRef.current) {
        chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
      }
    }, 100);
  };

  let sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    const messageText = message.trim();
    socketRef.current.emit("chat-message", messageText, username);
    // Don't add message here - let server broadcast handle it to avoid duplicates
    setMessage("");
  };

  let connect = async () => {
    // Stop lobby preview before entering the call to ensure fresh capture
    stopPreview();
    setAskForUsername(false);
    setIsCallActive(true);
    const meetingCode = window.location.pathname.substring(1) || "meeting";
    localStorage.setItem("activeMeeting", meetingCode);
    localStorage.setItem("activeMeetingUsername", username);
    await getPermissions();
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 flex flex-col md:flex-row items-center justify-center gap-8 p-6">
          <div className="w-full md:w-96 bg-white rounded-2xl shadow p-5">
            <div className="mb-3 text-sm text-gray-600">
              Meeting Code:{" "}
              <span className="font-semibold">
                {window.location.pathname.substring(1)}
              </span>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              Preview stop in:{" "}
              <span className="font-semibold">
                {String(Math.floor(lobbyCountdown / 30)).padStart(2, "0")}:
                {String(lobbyCountdown % 30).padStart(2, "0")}
              </span>
            </div>
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && username) {
                  connect();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={connect}
              disabled={!username}
              fullWidth
              sx={{
                mt: 2,
                padding: "12px",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              Enter Meeting
            </Button>
            <div className="mt-4 text-xs text-gray-500">
              Test your devices below before joining
            </div>
          </div>
          <div className="w-full md:flex-1 bg-white rounded-2xl shadow p-5">
            <video
              ref={localVideoref}
              autoPlay
              muted
              className="w-full h-64 md:h-96 rounded-xl bg-black"
            ></video>
            <div className="mt-3 text-sm text-gray-600">Preview</div>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.meetVideoContainer} ${showModal ? styles.withChat : ""}`}
        >
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                  <h1>Chat</h1>
                  <IconButton
                    onClick={closeChat}
                    className={styles.closeChatButton}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </div>

                <div className={styles.chattingDisplay} ref={chatDisplayRef}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      const isOwn = item.isOwn || item.sender === username;
                      return (
                        <div
                          className={`${styles.messageItem} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                          key={index}
                        >
                          {!isOwn && (
                            <p className={styles.messageSender}>
                              {item.sender}
                            </p>
                          )}
                          <div className={styles.messageBubble}>
                            <p className={styles.messageText}>{item.data}</p>
                          </div>
                          {isOwn && <p className={styles.messageSender}>You</p>}
                        </div>
                      );
                    })
                  ) : (
                    <p className={styles.noMessages}>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your message"
                    variant="outlined"
                    fullWidth
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && message.trim()) {
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    sx={{
                      minWidth: "80px",
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton
              onClick={() => handleEndCall(false)}
              style={{ color: "red" }}
            >
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="orange">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "white",
                fontWeight: "bold",
                marginLeft: "12px",
              }}
            >
              <span>{`${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`}</span>
              <span
                style={{ fontSize: "0.9rem" }}
              >{`Cam: ${video ? "On" : "Off"}`}</span>
              <span
                style={{ fontSize: "0.9rem" }}
              >{`Mic: ${audio ? "On" : "Off"}`}</span>
            </div>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
            playsInline
          ></video>
          <div className={styles.localVideoLabel}>{"You"}</div>

          <div
            className={`${styles.conferenceView} ${videos.length === 1 ? styles.singleParticipant : videos.length <= 2 ? styles.twoParticipants : ""}`}
          >
            {videos.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "white",
                  padding: "40px",
                  fontSize: "1.2rem",
                }}
              >
                Waiting for other participants to join...
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.socketId}
                  className={styles.remoteVideoContainer}
                >
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                  ></video>
                  <div className={styles.videoLabel}>
                    {video.username || `User ${video.socketId.substring(0, 8)}`}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Disconnect Confirmation Dialog */}
          <Dialog
            open={showDisconnectDialog}
            onClose={() => {
              setShowDisconnectDialog(false);
              setPendingNavigation(null);
            }}
          >
            <DialogTitle>Disconnect Call?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to disconnect from the call? This will end
                the video call for you.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setShowDisconnectDialog(false);
                  setPendingNavigation(null);
                }}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingNavigation) {
                    const nav = pendingNavigation;
                    setPendingNavigation(null);
                    setShowDisconnectDialog(false);
                    nav();
                  } else {
                    setShowDisconnectDialog(false);
                    endCall();
                  }
                }}
                color="error"
                variant="contained"
              >
                Disconnect
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={!!permissionError}
            onClose={() => setPermissionError(null)}
          >
            <DialogTitle>Permissions Issue</DialogTitle>
            <DialogContent>
              <DialogContentText>{permissionError}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPermissionError(null)}>OK</Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
    </div>
  );
}

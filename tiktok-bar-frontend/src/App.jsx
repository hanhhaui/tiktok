import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Expand, Fish, Recycle, Sparkles, Trash2 } from "lucide-react";
import { io } from "socket.io-client";

const getSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL?.trim();

  if (configuredUrl) return configuredUrl;

  return `${window.location.protocol}//${window.location.hostname}:3001`;
};

const socket = io(getSocketUrl(), {
  transports: ["websocket", "polling"],
});

const GIFT_RULES = {
  commentOne: {
    giftName: "CMT 1",
    viewer: "@Viewer",
    trashCount: 1,
    pollution: 2,
    label: "Comment trash",
    color: "#22c55e",
  },
  rose: {
    giftName: "Rose",
    viewer: "@UserA",
    trashCount: 3,
    pollution: 6,
    label: "Small trash",
    color: "#f43f5e",
  },
  iceCream: {
    giftName: "Ice Cream",
    viewer: "@UserB",
    trashCount: 5,
    pollution: 10,
    label: "Trash cluster",
    color: "#38bdf8",
  },
  heart: {
    giftName: "Heart",
    viewer: "@UserC",
    trashCount: 10,
    pollution: 18,
    label: "Large trash bag",
    color: "#ec4899",
  },
  donut: {
    giftName: "Donut",
    viewer: "@UserD",
    trashCount: 20,
    pollution: 18,
    label: "Snack trash",
    color: "#f97316",
  },
  corgi: {
    giftName: "Corgi",
    viewer: "@UserE",
    trashCount: 50,
    pollution: 28,
    label: "Mega trash wave",
    color: "#f59e0b",
  },
};

const TRASH_TYPES = [
  { name: "Plastic bottle", icon: "bottle", color: "#60a5fa", points: 8 },
  { name: "Plastic bag", icon: "bag", color: "#fbbf24", points: 10 },
  { name: "Soda can", icon: "can", color: "#f87171", points: 12 },
  { name: "Foam box", icon: "box", color: "#e5e7eb", points: 9 },
];

const MAX_HP = 100;
const MISS_DAMAGE = 6;
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%2322c55e'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23dcfce7'/%3E%3Cpath d='M16 70c5-17 16-25 24-25s19 8 24 25' fill='%23dcfce7'/%3E%3C/svg%3E";
const DEFAULT_GIFT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect x='14' y='30' width='52' height='40' rx='8' fill='%23f43f5e'/%3E%3Cpath d='M12 28h56v14H12z' fill='%23fb7185'/%3E%3Cpath d='M36 24h8v46h-8zM12 38h56v8H12z' fill='%23fde047'/%3E%3Cpath d='M39 26C23 20 24 8 34 9c7 1 6 12 5 17Zm2 0c16-6 15-18 5-17-7 1-6 12-5 17Z' fill='%23fef3c7' stroke='%237f1d1d' stroke-width='3'/%3E%3C/svg%3E";

function createTrash(giftKey, index, left, delay, source = {}) {
  const gift = GIFT_RULES[giftKey];
  const trash = TRASH_TYPES[(Date.now() + index) % TRASH_TYPES.length];

  return {
    id: `${giftKey}-${Date.now()}-${index}-${Math.random()}`,
    giftKey,
    viewer: source.viewer ?? gift.viewer,
    avatarUrl: source.avatarUrl ?? DEFAULT_AVATAR,
    name: trash.name,
    icon: trash.icon,
    color: trash.color,
    points: trash.points + gift.pollution,
    left,
    delay,
    duration: 12 + Math.random() * 8,
    rotate: -18 + Math.random() * 36,
  };
}

function createTrashBatch(giftKey, source = {}) {
  const gift = GIFT_RULES[giftKey];
  const spacing = 72 / Math.max(gift.trashCount, 1);
  const start = 14 + Math.random() * 8;

  return Array.from({ length: gift.trashCount }, (_, index) => {
    const left = Math.max(
      12,
      Math.min(
        88,
        start + spacing * index + Math.random() * Math.max(spacing * 0.22, 4),
      ),
    );

    return createTrash(giftKey, index, left, index * 0.46, source);
  });
}

function createAutoTrash() {
  const giftKeys = Object.keys(GIFT_RULES);
  const giftKey = giftKeys[Math.floor(Math.random() * giftKeys.length)];

  return createTrash(giftKey, Date.now(), 16 + Math.random() * 68, 0);
}

function getCommentDisplayName(event) {
  return event?.nickname || event?.username || event?.user?.uniqueId || "Unknown";
}

function getCommentAvatarUrl(event) {
  return event?.avatarUrl || event?.user?.avatarUrl || DEFAULT_AVATAR;
}

function getGiftSenderName(event) {
  return event?.nickname || event?.username || event?.user?.uniqueId || "Unknown";
}

function getGiftSenderAvatarUrl(event) {
  return event?.avatarUrl || event?.user?.avatarUrl || DEFAULT_AVATAR;
}

function getGiftImageUrl(event) {
  return event?.giftImageUrl || DEFAULT_GIFT_IMAGE;
}

function getGiftRuleKey(event) {
  const giftName = String(event?.giftName ?? "").toLowerCase();
  const diamonds = Number(event?.totalDiamondCount ?? event?.diamondCount ?? 0);

  if (giftName.includes("corgi") || giftName.includes("dog") || giftName.includes("chó")) return "corgi";
  if (giftName.includes("donut") || giftName.includes("doughnut") || giftName.includes("bánh")) return "donut";
  if (giftName.includes("heart") || giftName.includes("love") || giftName.includes("tim")) return "heart";
  if (giftName.includes("ice") || giftName.includes("cream") || giftName.includes("kem")) return "iceCream";
  if (giftName.includes("rose") || giftName.includes("flower") || giftName.includes("hoa")) return "rose";

  if (diamonds >= 50) return "corgi";
  if (diamonds >= 20) return "donut";
  if (diamonds >= 10) return "heart";
  if (diamonds >= 5) return "iceCream";
  return "rose";
}

function GiftVisual({ type }) {
  if (type === "commentOne") {
    return (
      <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 15c0-6 5-10 11-10h22c7 0 11 4 11 10v18c0 6-4 10-11 10H29L17 55v-12c-4-1-7-5-7-10V15Z" fill="#86efac" stroke="#14532d" strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 24h20M22 33h13" stroke="#14532d" strokeWidth="4" strokeLinecap="round" />
        <path d="M47 10 52 5M53 18h7M48 27l5 5" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "rose") {
    return (
      <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 30c-9-1-15-7-13-15 7-3 13 0 16 6 2-7 8-11 16-8 3 9-4 16-13 17l-3 24h-7l4-24Z" fill="#ff4d6d" stroke="#14532d" strokeWidth="3" strokeLinejoin="round" />
        <path d="M29 34c-8 1-14 6-17 14 8 1 15-2 20-9" fill="#22c55e" stroke="#14532d" strokeWidth="3" strokeLinejoin="round" />
        <path d="M34 39c7-1 12 2 16 8-7 2-13 0-18-5" fill="#16a34a" stroke="#14532d" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="32" cy="22" r="7" fill="#ffe4e6" opacity="0.75" />
      </svg>
    );
  }

  if (type === "iceCream") {
    return (
      <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M20 28c0-10 6-17 14-17s14 7 14 17H20Z" fill="#f9a8d4" stroke="#164e63" strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 28h32L35 59h-6L18 28Z" fill="#f8d38d" stroke="#164e63" strokeWidth="3" strokeLinejoin="round" />
        <path d="M25 36h16M28 44h10" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
        <circle cx="27" cy="19" r="4" fill="#bae6fd" />
        <circle cx="38" cy="20" r="4" fill="#bbf7d0" />
      </svg>
    );
  }

  if (type === "heart") {
    return (
      <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 55S9 42 9 24c0-8 6-14 14-14 5 0 8 2 10 6 2-4 6-6 11-6 8 0 13 6 13 14 0 18-25 31-25 31Z" fill="#ff2e88" stroke="#831843" strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 23c1-4 4-6 8-6" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M45 37c-4 5-8 8-13 11" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  if (type === "donut") {
    return (
      <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="22" fill="#d97706" stroke="#7c2d12" strokeWidth="3" />
        <path d="M13 31c4-10 13-16 25-15 7 1 11 5 13 10-7-2-10 5-16 4-6-1-9-7-16-2-2 2-4 3-6 3Z" fill="#f9a8d4" />
        <circle cx="32" cy="32" r="8" fill="#fff7ed" stroke="#7c2d12" strokeWidth="3" />
        <path d="M22 22h4M43 25h4M20 39h4M39 43h4M31 17h4" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M27 47h4M47 36h4" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="tiktok-gift-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M17 28c0-12 7-19 15-19s15 7 15 19v12c0 9-6 15-15 15S17 49 17 40V28Z" fill="#fbbf24" stroke="#713f12" strokeWidth="3" />
      <path d="M18 21 10 11c8-1 14 2 17 9M46 21l8-10c-8-1-14 2-17 9" fill="#f59e0b" stroke="#713f12" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="25" cy="31" r="3" fill="#1f2937" />
      <circle cx="39" cy="31" r="3" fill="#1f2937" />
      <path d="M30 37h4l-2 3-2-3Z" fill="#1f2937" />
      <path d="M26 43c4 3 8 3 12 0" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 50h20" stroke="#fff7ed" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function TrashShape({ item }) {
  if (item.icon === "bag") {
    return (
      <svg className="trash-svg trash-svg-bag" viewBox="0 0 54 54" aria-hidden="true">
        <path d="M16 18c2-8 19-8 22 0l6 24c1 5-3 9-8 9H18c-5 0-9-4-8-9l6-24Z" fill={item.color} stroke="#123c31" strokeWidth="4" strokeLinejoin="round" />
        <path d="M21 18c1-7 11-7 12 0" fill="none" stroke="#123c31" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 31c5 3 10 3 15 0" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 40c6 2 13 2 19 0" fill="none" stroke="rgba(18,60,49,.28)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (item.icon === "can") {
    return (
      <svg className="trash-svg trash-svg-can" viewBox="0 0 54 54" aria-hidden="true">
        <ellipse cx="27" cy="11" rx="14" ry="6" fill="#fecaca" stroke="#123c31" strokeWidth="4" />
        <path d="M13 11h28v31c0 5-6 8-14 8s-14-3-14-8V11Z" fill={item.color} stroke="#123c31" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="27" cy="42" rx="14" ry="6" fill="#fca5a5" stroke="#123c31" strokeWidth="4" />
        <path d="M20 22h14" stroke="#fff7ed" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 31h18" stroke="rgba(18,60,49,.28)" strokeWidth="3" strokeLinecap="round" />
        <path d="M23 9h8" stroke="#fff7ed" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (item.icon === "box") {
    return (
      <svg className="trash-svg trash-svg-box" viewBox="0 0 54 54" aria-hidden="true">
        <path d="M9 18 27 8l18 10v24L27 52 9 42V18Z" fill={item.color} stroke="#123c31" strokeWidth="4" strokeLinejoin="round" />
        <path d="M9 18 27 28l18-10M27 28v24" fill="none" stroke="#123c31" strokeWidth="4" />
        <path d="M17 23 35 13" stroke="rgba(255,255,255,.65)" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 37h10" stroke="rgba(18,60,49,.32)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="trash-svg trash-svg-bottle" viewBox="0 0 54 54" aria-hidden="true">
      <path d="M22 4h11v10l5 6v25c0 5-4 8-10 8h-1c-6 0-10-3-10-8V20l5-6V4Z" fill={item.color} stroke="#123c31" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 14h11M19 30h18" stroke="#123c31" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 23h8" stroke="rgba(255,255,255,.7)" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 37h11" stroke="rgba(255,255,255,.45)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FloatingTrash({ item, onCollect, onMiss }) {
  return (
    <motion.button
      type="button"
      className="floating-trash"
      initial={{ top: "-12%", left: `${item.left}%`, rotate: item.rotate }}
      animate={{
        top: "112%",
        rotate: [item.rotate, item.rotate + 16, item.rotate - 12, item.rotate],
      }}
      transition={{ duration: item.duration, delay: item.delay, ease: "linear" }}
      onAnimationComplete={() => onMiss(item.id)}
      onClick={() => onCollect(item)}
      title={`Collect ${item.name}`}
    >
      <TrashShape item={item} />
      <span className="trash-viewer">
        {item.avatarUrl && (
          <img src={item.avatarUrl} alt="" referrerPolicy="no-referrer" />
        )}
        <span>{item.viewer}</span>
      </span>
    </motion.button>
  );
}

function Player({ isScooping }) {
  return (
    <div className={`player ${isScooping ? "is-scooping" : ""}`}>
      <div className="player-arm back" />
      <div className="player-arm front" />
      <div className="player-head">
        <span className="hair" />
        <span className="eye left-eye" />
        <span className="eye right-eye" />
        <span className="smile" />
      </div>
      <div className="player-body" />
      <div className="player-leg left" />
      <div className="player-leg right" />
      <div className="net">
        <div className="net-handle" />
        <div className="net-ring" />
      </div>
    </div>
  );
}

function GiftButton({ giftKey, gift, onDrop, disabled }) {
  return (
    <button
      type="button"
      className={`bank-gift-button ${giftKey === "commentOne" ? "is-comment-gift" : ""}`}
      disabled={disabled}
      onClick={() => onDrop(giftKey)}
      style={{ "--gift-color": gift.color }}
      aria-label={`${gift.giftName}: +${gift.trashCount} trash`}
    >
      <span className="gift-icon">
        {giftKey === "commentOne" ? (
          <span className="comment-gift-text">Comment</span>
        ) : (
          <GiftVisual type={giftKey} />
        )}
      </span>
      <span className="gift-meta">
        <small>+{gift.trashCount} trash</small>
      </span>
    </button>
  );
}

export default function App() {
  const audioContextRef = useRef(null);
  const musicTimerRef = useRef(null);
  const musicStepRef = useRef(0);
  const dropTrashByGiftRef = useRef(null);
  const [trashItems, setTrashItems] = useState([]);
  const [score, setScore] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [pollution, setPollution] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastGift, setLastGift] = useState("Waiting for TikTok gifts...");
  const [isScooping, setIsScooping] = useState(false);
  const [scoopEffects, setScoopEffects] = useState([]);
  const [giftPopup, setGiftPopup] = useState(null);
  const [hp, setHp] = useState(MAX_HP);
  const [socketConnected, setSocketConnected] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState({
    connected: false,
    connecting: false,
    username: null,
    roomId: null,
    lastError: null,
  });
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [socketMessage, setSocketMessage] = useState("Socket is starting...");
  const [liveComments, setLiveComments] = useState([]);
  const [liveGifts, setLiveGifts] = useState([]);
  const [giftUpdateCount, setGiftUpdateCount] = useState(0);
  const isGameOver = hp <= 0;

  const cleanPercent = useMemo(
    () => Math.max(0, Math.min(100, 100 - pollution)),
    [pollution],
  );

  useEffect(() => {
    return () => {
      if (musicTimerRef.current) {
        window.clearInterval(musicTimerRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isGameOver) return undefined;

    // Uncomment this block when you want the game to spawn mock trash automatically.
    // const autoTrashTimer = window.setInterval(() => {
    //   setTrashItems((items) => [...items, createAutoTrash()]);
    //   setPollution((value) => Math.min(100, value + 1));
    // }, 2000);

    // return () => {
    //   window.clearInterval(autoTrashTimer);
    // };

    return undefined;
  }, [isGameOver]);

  const playTone = (context, frequency, duration, volume, type = "sine") => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  const startBackgroundMusic = (context) => {
    if (musicTimerRef.current) return;

    const melody = [
      659.25, 783.99, 987.77, 783.99,
      698.46, 880, 1046.5, 880,
      783.99, 987.77, 1174.66, 987.77,
      880, 1046.5, 1318.51, 1046.5,
    ];

    musicTimerRef.current = window.setInterval(() => {
      const note = melody[musicStepRef.current % melody.length];
      playTone(context, note, 0.11, 0.017, "triangle");
      playTone(context, note / 2, 0.13, 0.008, "square");

      if (musicStepRef.current % 4 === 0) {
        playTone(context, 196, 0.07, 0.012, "sine");
      }

      musicStepRef.current += 1;
    }, 210);
  };

  const ensureAudio = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    startBackgroundMusic(audioContextRef.current);
    return audioContextRef.current;
  };

  const playCollectSound = () => {
    const context = ensureAudio();
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(760, now);
    oscillator.frequency.exponentialRampToValueAtTime(190, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.22);

    window.setTimeout(() => playTone(context, 980, 0.08, 0.035, "triangle"), 80);
  };

  const playGiftSound = () => {
    const context = ensureAudio();
    if (!context) return;

    [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
      window.setTimeout(
        () => playTone(context, note, 0.11, 0.055, "triangle"),
        index * 55,
      );
    });

    window.setTimeout(() => playTone(context, 1567.98, 0.16, 0.035, "sine"), 190);
  };

  const dropTrashByGift = (giftKey, source = {}) => {
    if (isGameOver) return;

    playGiftSound();
    const gift = GIFT_RULES[giftKey];
    const viewer = source.viewer ?? gift.viewer;
    const giftName = source.giftName ?? gift.giftName;
    const avatarUrl = source.avatarUrl ?? null;
    const newTrash = createTrashBatch(giftKey, { viewer, avatarUrl });
    const popupId = `${giftKey}-${Date.now()}`;

    setTrashItems((items) => [...items, ...newTrash]);
    setPollution((value) => Math.min(100, value + gift.pollution));
    setGiftPopup({
      id: popupId,
      username: viewer,
      giftName,
      avatarUrl,
      color: gift.color,
    });
    setLastGift(`${viewer} sent ${giftName}: dropped ${gift.trashCount} trash`);

    window.setTimeout(() => {
      setGiftPopup((current) => (current?.id === popupId ? null : current));
    }, 2000);
  };

  dropTrashByGiftRef.current = dropTrashByGift;

  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected to backend socket:", socket.id);
      setSocketConnected(true);
      setSocketMessage(`Socket connected: ${socket.id}`);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from backend socket");
      setSocketConnected(false);
      setSocketMessage("Socket disconnected");
    };

    const handleStatus = (status) => {
      console.log("TikTok status:", status);
      setTiktokStatus(status);
      if (status?.lastError) {
        setSocketMessage(status.lastError);
      }
    };

    const handleComment = (event) => {
      if (event?.type !== "comment") return;

      const displayName = getCommentDisplayName(event);
      const avatarUrl = getCommentAvatarUrl(event);
      console.log({
        name: displayName,
        avatar: avatarUrl,
        comment: event.comment,
      });
      const commentGiftKey = "commentOne";

      setLiveComments((items) => [
        {
          id: event.id,
          viewer: displayName,
          avatarUrl,
          comment: event.comment,
          createdAt: event.createdAt,
        },
        ...items,
      ].slice(0, 8));

      dropTrashByGiftRef.current?.(commentGiftKey, {
        viewer: displayName,
        avatarUrl,
        giftName: GIFT_RULES[commentGiftKey].giftName,
      });
    };

    const pushLiveGift = (event, status) => {
      const senderName = getGiftSenderName(event);
      const senderAvatar = getGiftSenderAvatarUrl(event);
      const giftName = event?.giftName || "Gift";
      const giftImage = getGiftImageUrl(event);
      const repeatCount = Number(event?.repeatCount ?? 1);

      console.log(`${senderName} sent ${giftName} x${repeatCount}`);

      setLiveGifts((items) => [
        {
          id: `${status}-${event?.id ?? Date.now()}-${repeatCount}`,
          viewer: senderName,
          avatarUrl: senderAvatar,
          giftName,
          giftImage,
          repeatCount,
          totalDiamondCount: event?.totalDiamondCount,
          status,
          createdAt: event?.createdAt,
        },
        ...items,
      ].slice(0, 6));
    };

    const handleGiftReceived = (event) => {
      if (event?.type !== "gift") return;
      pushLiveGift(event, "received");
    };

    const handleGift = (event) => {
      if (event?.type !== "gift") return;

      console.log("Final gift:", event.giftName, event.repeatCount);
      const giftKey = getGiftRuleKey(event);
      const viewer = getGiftSenderName(event);
      const avatarUrl = getGiftSenderAvatarUrl(event);
      const repeatCount = Number(event.repeatCount ?? 1);

      pushLiveGift(event, "final");

      dropTrashByGiftRef.current?.(giftKey, {
        viewer,
        avatarUrl,
        giftName: repeatCount > 1
          ? `${event.giftName} x${repeatCount}`
          : event.giftName,
      });
    };

    const handleGiftUpdate = (event) => {
      console.log("[GIFT UPDATE]", event);
      setGiftUpdateCount((value) => value + 1);
    };

    const handleError = (error) => {
      console.error("TikTok error:", error?.message ?? error);
      setSocketMessage(error?.message ?? "TikTok socket error");
      setTiktokStatus((status) => ({
        ...status,
        lastError: error?.message ?? "TikTok socket error",
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("tiktok:status", handleStatus);
    socket.on("tiktok:comment", handleComment);
    socket.on("tiktok:gift:received", handleGiftReceived);
    socket.on("tiktok:gift", handleGift);
    socket.on("tiktok:gift:update", handleGiftUpdate);
    socket.on("tiktok:error", handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("tiktok:status", handleStatus);
      socket.off("tiktok:comment", handleComment);
      socket.off("tiktok:gift:received", handleGiftReceived);
      socket.off("tiktok:gift", handleGift);
      socket.off("tiktok:gift:update", handleGiftUpdate);
      socket.off("tiktok:error", handleError);
    };
  }, []);

  const collectTrash = (item) => {
    if (isGameOver) return;

    playCollectSound();
    const effectId = `${item.id}-effect`;

    setTrashItems((items) => items.filter((trash) => trash.id !== item.id));
    setScore((value) => value + item.points + combo * 2);
    setCleanedCount((value) => value + 1);
    setPollution((value) => Math.max(0, value - 7));
    setCombo((value) => value + 1);
    setScoopEffects((effects) => [
      ...effects,
      { id: effectId, left: item.left, color: item.color },
    ]);
    setIsScooping(true);
    window.setTimeout(() => setIsScooping(false), 520);
    window.setTimeout(() => {
      setScoopEffects((effects) => effects.filter((effect) => effect.id !== effectId));
    }, 720);
  };

  const missTrash = (id) => {
    if (isGameOver) return;

    setTrashItems((items) => items.filter((trash) => trash.id !== id));
    setCombo(0);
    setPollution((value) => Math.min(100, value + 3));
    setHp((value) => Math.max(0, value - MISS_DAMAGE));
  };

  const clearRiver = () => {
    setTrashItems([]);
    setPollution(0);
    setCombo(0);
    setHp(MAX_HP);
    setScore(0);
    setCleanedCount(0);
    setScoopEffects([]);
    setGiftPopup(null);
    setLastGift("River cleaned!");
  };

  const enterFullscreen = async () => {
    const element = document.documentElement;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else {
        setSocketMessage("Fullscreen is limited on iPhone Chrome. Add this site to Home Screen for the best fullscreen view.");
      }
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
      setSocketMessage("Fullscreen is limited on iPhone Chrome. Use Add to Home Screen for the best view.");
    }
  };

  const connectTikTok = (event) => {
    event.preventDefault();
    const username = tiktokUsername.trim().replace(/^@/, "");
    if (!username) {
      setSocketMessage("Enter a TikTok username first");
      return;
    }

    setSocketMessage(`Connecting to @${username}...`);
    socket.emit("tiktok:connect", { username }, (result) => {
      console.log("Connect result:", result);
      setSocketMessage(result?.message ?? (result?.ok === false ? "Connect failed" : "Connect requested"));
    });
  };

  const disconnectTikTok = () => {
    setSocketMessage("Disconnecting TikTok LIVE...");
    socket.emit("tiktok:disconnect", (result) => {
      console.log("Disconnect result:", result);
      setSocketMessage(result?.message ?? (result?.ok === false ? "Disconnect failed" : "Disconnected"));
    });
  };

  return (
    <main className="app-shell">
      <section className="game-frame">
        <header className="game-header">
          <div>
            <h1>River Cleanup Game</h1>
          </div>
          <div className="header-actions">
            <div className="score-badge">
              <Sparkles size={16} />
              <strong>{score}</strong>
            </div>
          </div>
        </header>

        <section className="hp-panel" aria-label="Player HP">
          <div className="hp-header">
            <span>HP</span>
            <strong>{hp}/{MAX_HP}</strong>
          </div>
          <div className="hp-track">
            <div className="hp-fill" style={{ width: `${hp}%` }} />
          </div>
        </section>

        {/* <section className="live-panel">
          <form className="live-connect-form" onSubmit={connectTikTok}>
            <input
              type="text"
              value={tiktokUsername}
              onChange={(event) => setTiktokUsername(event.target.value)}
              placeholder="TikTok username"
              aria-label="TikTok username"
            />
            <button type="submit" disabled={tiktokStatus.connecting}>
              {tiktokStatus.connecting ? "Connecting" : "Connect"}
            </button>
            <button type="button" onClick={disconnectTikTok}>
              Disconnect
            </button>
          </form>

          <div className="live-status-row">
            <span className={socketConnected ? "is-online" : "is-offline"}>
              {socketConnected ? "Socket online" : "Socket offline"}
            </span>
            <span>
              {tiktokStatus.connected
                ? `LIVE @${tiktokStatus.username}`
                : tiktokStatus.connecting
                  ? "TikTok connecting"
                  : "TikTok idle"}
            </span>
            <span>Gift updates: {giftUpdateCount}</span>
          </div>

          <div className="live-message">{socketMessage}</div>

          <div className="live-feed-grid">
            <div className="live-feed">
              <strong>Comments</strong>
              {liveComments.length === 0 ? (
                <span>No comments yet</span>
              ) : (
                liveComments.map((item) => (
                  <p key={item.id} className="live-feed-row">
                    <img src={item.avatarUrl} alt={item.viewer} referrerPolicy="no-referrer" />
                    <span>
                      <b>{item.viewer}</b> {item.comment}
                    </span>
                  </p>
                ))
              )}
            </div>
            <div className="live-feed">
              <strong>Gifts</strong>
              {liveGifts.length === 0 ? (
                <span>No gifts yet</span>
              ) : (
                liveGifts.map((item) => (
                  <p key={item.id} className="live-feed-row gift-feed-row">
                    <img src={item.avatarUrl} alt={item.viewer} referrerPolicy="no-referrer" />
                    <img src={item.giftImage} alt={item.giftName} referrerPolicy="no-referrer" />
                    <span>
                      <b>{item.viewer}</b> {item.giftName} x{item.repeatCount}
                      <em>{item.status === "final" ? "final" : "received"}</em>
                    </span>
                  </p>
                ))
              )}
            </div>
          </div>
        </section> */}

        <section className="river-stage">
          <aside className="river-bank">
            <div className="grass-line" />
            <div className="bank-gift-dock" aria-label="TikTok Live gifts">
              {Object.entries(GIFT_RULES).map(([giftKey, gift]) => (
                <GiftButton
                  key={giftKey}
                  giftKey={giftKey}
                  gift={gift}
                  onDrop={dropTrashByGift}
                  disabled={isGameOver}
                />
              ))}
            </div>
            <Player isScooping={isScooping} />
            <div className="bank-sign">
              <strong>GREEN CREW</strong>
              <span>Keep the river clean</span>
            </div>
            <div className="flower one" />
            <div className="flower two" />
            <div className="stone one" />
            <div className="stone two" />
          </aside>

          <section className="river">
            <div className="river-shine" />
            <div className="wave wave-a" />
            <div className="wave wave-b" />
            <div className="wave wave-c" />
            <Fish className="fish fish-a" size={22} />
            <Fish className="fish fish-b" size={18} />

            {trashItems.map((item) => (
              <FloatingTrash
                key={item.id}
                item={item}
                onCollect={collectTrash}
                onMiss={missTrash}
              />
            ))}

            {scoopEffects.map((effect) => (
              <motion.div
                key={effect.id}
                className="scoop-effect"
                style={{ left: `${effect.left}%`, "--splash-color": effect.color }}
                initial={{ opacity: 0, scale: 0.45, y: 12 }}
                animate={{ opacity: [0, 1, 0], scale: [0.45, 1.25, 1.8], y: -18 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              >
                <span />
                <span />
                <span />
              </motion.div>
            ))}
          </section>
        </section>

        {isGameOver && (
          <motion.section
            className="game-over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="game-over-card"
              initial={{ scale: 0.8, y: 20, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
            >
              <div className="game-over-icon">
                <Trash2 size={34} />
              </div>
              <span>River overloaded</span>
              <h2>Game Over</h2>
              <p>Too much trash escaped. Clean the river to play again.</p>
              <button type="button" onClick={clearRiver}>Play Again</button>
            </motion.div>
          </motion.section>
        )}

        {giftPopup && (
          <motion.section
            key={giftPopup.id}
            className="gift-popup"
            initial={{ opacity: 0, scale: 0.55, y: 18 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.55, 1.08, 1, 0.96],
              y: [18, 0, 0, -8],
            }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <div className="gift-burst" />
            <div className="gift-avatar" style={{ "--gift-color": giftPopup.color }}>
              {giftPopup.avatarUrl ? (
                <img
                  src={giftPopup.avatarUrl}
                  alt={giftPopup.username}
                  referrerPolicy="no-referrer"
                />
              ) : (
                giftPopup.username.replace("@", "").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="gift-popup-text">
              <span>{giftPopup.username}</span>
              <strong>{giftPopup.giftName}</strong>
            </div>
          </motion.section>
        )}

        <section className="gift-panel">
          <button type="button" className="clean-button" onClick={clearRiver}>
            <Recycle size={16} />
            <span>Streamer</span>
            <strong>Clean River</strong>
            <small>Reset trash and pollution</small>
          </button>
        </section>
      </section>
    </main>
  );
}

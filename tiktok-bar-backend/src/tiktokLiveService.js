import { ControlEvent, TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const cleanUsername = (username) => String(username || '').trim().replace(/^@/, '');

const toStringOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'object' && typeof value.toString === 'function' ? value.toString() : String(value);
};

const getAvatarUrl = (user) => {
  const avatar =
    user?.profilePictureUrl ||
    user?.profilePicture?.url ||
    user?.profilePicture?.urls ||
    user?.avatarThumb?.urlList ||
    user?.avatarMedium?.urlList;

  if (Array.isArray(avatar)) {
    return (
      avatar.find((url) => String(url).includes('100x100') && String(url).includes('.webp')) ||
      avatar.find((url) => String(url).includes('100x100')) ||
      avatar[0] ||
      null
    );
  }

  return avatar || null;
};

const getImageUrl = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === 'string') {
      return candidate;
    }

    if (Array.isArray(candidate)) {
      const url = candidate.find(Boolean);
      if (url) return url;
    }

    if (Array.isArray(candidate.urlList)) {
      const url = candidate.urlList.find(Boolean);
      if (url) return url;
    }

    if (Array.isArray(candidate.url)) {
      const url = candidate.url.find(Boolean);
      if (url) return url;
    }

    if (candidate.imageUrl) return candidate.imageUrl;
    if (candidate.uri) return candidate.uri;
  }

  return null;
};

const normalizeUser = (user = {}) => ({
  userId: toStringOrNull(user.userId || user.id),
  uniqueId: toStringOrNull(user.uniqueId || user.secUid),
  nickname: user.nickname || user.uniqueId || 'Unknown',
  avatarUrl: getAvatarUrl(user),
});

const normalizeComment = (data) => {
  const user = normalizeUser(data.user || data);

  return {
    id: toStringOrNull(data.msgId || data.messageId) || `${Date.now()}-${Math.random()}`,
    type: 'comment',
    comment: data.comment || '',
    username: user.uniqueId,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    user,
    raw: data,
    createdAt: new Date().toISOString(),
  };
};

const normalizeGift = (data) => {
  const giftDetails = data.giftDetails || data.extendedGiftInfo || data.gift || {};
  const repeatCount = Number(data.repeatCount || data.repeat_count || 1);
  const diamondCount = Number(
    data.diamondCount || data.diamond_count || giftDetails.diamondCount || giftDetails.diamond_count || 0,
  );
  const giftId = toStringOrNull(data.giftId || giftDetails.giftId || giftDetails.id);
  const giftName = giftDetails.giftName || giftDetails.name || data.giftName || (giftId ? `Gift ${giftId}` : 'Gift');
  const giftType = data.giftType ?? giftDetails.giftType ?? giftDetails.type ?? null;
  const repeatEnd = Boolean(data.repeatEnd || data.repeat_end);
  const user = normalizeUser(data.user || data);

  return {
    id: toStringOrNull(data.msgId || data.messageId) || `${Date.now()}-${Math.random()}`,
    type: 'gift',
    giftId,
    giftName,
    giftImageUrl: getImageUrl(
      data.giftPictureUrl,
      giftDetails.giftImage,
      giftDetails.image,
      giftDetails.icon,
      giftDetails.iconUrl,
    ),
    repeatCount,
    diamondCount,
    totalDiamondCount: repeatCount * diamondCount,
    repeatEnd,
    giftType,
    isStreakable: giftType === 1,
    isStreakInProgress: giftType === 1 && !repeatEnd,
    username: user.uniqueId,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    user,
    raw: data,
    createdAt: new Date().toISOString(),
  };
};

export class TikTokLiveService {
  constructor({ io, logger = console } = {}) {
    this.io = io;
    this.logger = logger;
    this.connection = null;
    this.username = null;
    this.state = {
      connected: false,
      connecting: false,
      username: null,
      roomId: null,
      lastError: null,
    };
  }

  getStatus() {
    return { ...this.state };
  }

  async connect(username, options = {}) {
    const nextUsername = cleanUsername(username);

    if (!nextUsername) {
      throw new Error('TikTok username is required');
    }

    if (this.connection && this.username === nextUsername && this.state.connected) {
      return this.getStatus();
    }

    await this.disconnect();

    this.username = nextUsername;
    this.state = {
      connected: false,
      connecting: true,
      username: nextUsername,
      roomId: null,
      lastError: null,
    };
    this.emitStatus();

    this.connection = new TikTokLiveConnection(nextUsername, {
      processInitialData: false,
      fetchRoomInfoOnConnect: true,
      enableExtendedGiftInfo: true,
      sessionId: options.sessionId || undefined,
      ttTargetIdc: options.ttTargetIdc || undefined,
    });

    this.registerEvents(this.connection);

    try {
      const connectState = await this.connection.connect();
      this.state = {
        connected: true,
        connecting: false,
        username: nextUsername,
        roomId: connectState.roomId || this.connection.roomId || null,
        lastError: null,
      };
      this.emitStatus();
      return this.getStatus();
    } catch (error) {
      this.state = {
        connected: false,
        connecting: false,
        username: nextUsername,
        roomId: null,
        lastError: error.message,
      };
      this.emitStatus();
      await this.disconnect(false);
      throw error;
    }
  }

  async disconnect(emit = true) {
    if (!this.connection) {
      this.state.connected = false;
      this.state.connecting = false;
      if (emit) this.emitStatus();
      return;
    }

    try {
      this.connection.disconnect();
    } catch (error) {
      this.logger.warn('TikTok disconnect failed:', error.message);
    } finally {
      this.connection = null;
      this.state.connected = false;
      this.state.connecting = false;
      this.state.roomId = null;
      if (emit) this.emitStatus();
    }
  }

  registerEvents(connection) {
    connection.on(WebcastEvent.CHAT, (data) => {
      this.io.emit('tiktok:comment', normalizeComment(data));
    });

    connection.on(WebcastEvent.GIFT, (data) => {
      const gift = normalizeGift(data);
      this.io.emit('tiktok:gift:update', gift);
      this.io.emit('tiktok:gift:received', gift);

      if (!gift.isStreakInProgress) {
        this.io.emit('tiktok:gift', gift);
      }
    });

    connection.on(WebcastEvent.STREAM_END, () => {
      this.state.connected = false;
      this.state.connecting = false;
      this.state.lastError = 'Live stream ended';
      this.emitStatus();
    });

    connection.on(ControlEvent.CONNECTED, (state) => {
      this.logger.info(`Connected to TikTok LIVE @${this.username}, room ${state.roomId}`);
    });

    connection.on(ControlEvent.DISCONNECTED, (event) => {
      this.state.connected = false;
      this.state.connecting = false;
      this.state.lastError = event?.reason || null;
      this.emitStatus();
    });

    connection.on(ControlEvent.ERROR, (error) => {
      const message = error?.message || String(error);
      this.logger.error('TikTok connection error:', message);
      this.state.lastError = message;
      this.emitStatus();
      this.io.emit('tiktok:error', { message, createdAt: new Date().toISOString() });
    });
  }

  emitStatus() {
    this.io.emit('tiktok:status', this.getStatus());
  }
}

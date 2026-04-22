const admin = require('firebase-admin');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function normalizeSettings(raw = {}) {
  const inApp = raw?.inApp || {};
  const push = raw?.push || {};
  return {
    inApp: {
      chat: inApp.chat !== false,
      notice: inApp.notice !== false,
    },
    push: {
      enabled: push.enabled === true,
      chat: push.chat !== false,
      notice: push.notice !== false,
      preview: push.preview !== false,
    },
  };
}

async function getRecipientDoc(recipientType, recipientDocId) {
  if (!recipientDocId) return null;
  if (recipientType === 'partner') {
    return db.collection('partners').doc(recipientDocId);
  }
  return db.collection('users').doc(recipientDocId);
}

async function loadEnabledTokens(recipientType, recipientDocId) {
  const recipientRef = await getRecipientDoc(recipientType, recipientDocId);
  if (!recipientRef) return [];
  const tokenSnap = await recipientRef.collection('fcm_tokens').where('enabled', '==', true).get();
  const tokens = [];
  tokenSnap.forEach((doc) => {
    const token = String(doc.data()?.token || '').trim();
    if (token) tokens.push(token);
  });
  return tokens;
}

async function sendPushToRecipient({
  recipientType,
  recipientDocId,
  title,
  body,
  data = {},
  requireChat = false,
  requireNotice = false,
}) {
  if (!recipientDocId) return;
  const recipientRef = await getRecipientDoc(recipientType, recipientDocId);
  if (!recipientRef) return;

  const recipientSnap = await recipientRef.get();
  if (!recipientSnap.exists) return;

  const settings = normalizeSettings(recipientSnap.data()?.notificationSettings || {});
  if (!settings.push.enabled) return;
  if (requireChat && !settings.push.chat) return;
  if (requireNotice && !settings.push.notice) return;

  const tokens = await loadEnabledTokens(recipientType, recipientDocId);
  if (!tokens.length) return;

  const payload = {
    tokens,
    notification: {
      title,
      body: settings.push.preview ? body : '새 메시지가 도착했습니다.',
    },
    data: {
      ...Object.entries(data || {}).reduce((acc, [k, v]) => {
        acc[k] = String(v ?? '');
        return acc;
      }, {}),
      recipientType,
      recipientDocId,
    },
    webpush: {
      fcmOptions: {
        link: data?.clickUrl || '/',
      },
    },
  };

  const resp = await admin.messaging().sendEachForMulticast(payload);
  if (resp.failureCount > 0) {
    logger.warn('Some FCM sends failed', {
      recipientType,
      recipientDocId,
      successCount: resp.successCount,
      failureCount: resp.failureCount,
    });
  }
}

function toMillis(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSubStatus(raw = '') {
  const s = String(raw || '').trim().toLowerCase();
  if (['approved', 'complete', 'completed', 'done', 'success', 'paid'].includes(s)) return 'completed';
  if (['rejected', 'reject', 'denied', 'cancelled', 'canceled', 'failed'].includes(s)) return 'rejected';
  if (['pending', 'requested', 'request'].includes(s)) return 'pending';
  return s || 'pending';
}

async function claimDedupeKey(key = '') {
  const safeKey = String(key || '').trim();
  if (!safeKey) return false;
  const ref = db.collection('system_notification_dedupe').doc(safeKey);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        throw new Error('duplicate');
      }
      tx.set(ref, {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    return true;
  } catch (e) {
    if (String(e?.message || '').includes('duplicate')) return false;
    logger.error('dedupe key claim failed', { key: safeKey, error: e?.message || String(e) });
    return false;
  }
}

async function createNoticeAndAdminChat({
  dedupeKey,
  recipientType,
  recipientDocId,
  recipientUserId = '',
  recipientName = '',
  title = '안내',
  body = '',
  category = 'system',
  linkType = 'none',
  linkLabel = '',
}) {
  if (!recipientDocId || !recipientType || !body) return false;
  const claimed = await claimDedupeKey(dedupeKey);
  if (!claimed) return false;

  const isPartner = recipientType === 'partner';
  const chatThreadId = isPartner ? `admin__p_${recipientDocId}` : `admin__u_${recipientDocId}`;
  const unreadField = isPartner ? 'unreadForPartner' : 'unreadForUser';
  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  const noticeRef = db.collection('user_notifications').doc();
  batch.set(noticeRef, {
    recipientType,
    recipientDocId,
    recipientUserId: recipientUserId || '',
    recipientName: recipientName || (isPartner ? '업체' : '고객'),
    category,
    priority: 'normal',
    linkType,
    linkLabel: linkLabel || '바로가기 없음',
    title,
    body,
    isRead: false,
    createdAt: now,
    dedupeKey: String(dedupeKey || ''),
    source: 'functions',
  });

  const threadRef = db.collection('chat_threads').doc(chatThreadId);
  const messageRef = db.collection('chat_messages').doc();
  const threadPayload = isPartner
    ? {
        id: chatThreadId,
        isAdminChannel: true,
        participantPartnerDocId: recipientDocId,
        participantPartnerUserId: recipientUserId || '',
        partnerName: recipientName || '업체',
        userName: '다독 관리자',
        userId: 'admin',
        userImage: '',
        lastMessage: body,
        lastSenderRole: 'admin',
        lastAt: now,
        updatedAt: now,
        createdAt: now,
        [unreadField]: admin.firestore.FieldValue.increment(1),
      }
    : {
        id: chatThreadId,
        isAdminChannel: true,
        participantUserDocId: recipientDocId,
        participantUserId: recipientUserId || '',
        userName: recipientName || '고객',
        partnerName: '다독 관리자',
        partnerUserId: 'admin',
        partnerImage: '',
        lastMessage: body,
        lastSenderRole: 'admin',
        lastAt: now,
        updatedAt: now,
        createdAt: now,
        [unreadField]: admin.firestore.FieldValue.increment(1),
      };
  batch.set(threadRef, threadPayload, { merge: true });
  batch.set(messageRef, {
    threadId: chatThreadId,
    senderRole: 'admin',
    senderDocId: 'admin',
    senderUserId: 'system',
    senderName: '다독 관리자',
    text: body,
    category,
    dedupeKey: String(dedupeKey || ''),
    createdAt: now,
  });
  await batch.commit();

  await sendPushToRecipient({
    recipientType,
    recipientDocId,
    title,
    body,
    requireNotice: true,
    data: {
      type: category,
      dedupeKey: String(dedupeKey || ''),
      clickUrl: '/',
    },
  });
  return true;
}

exports.onChatMessageCreatedPush = onDocumentCreated('chat_messages/{messageId}', async (event) => {
  const msg = event.data?.data() || {};
  const threadId = String(msg.threadId || '').trim();
  const senderRole = String(msg.senderRole || '').trim();
  if (!threadId || !senderRole) return;

  const threadSnap = await db.collection('chat_threads').doc(threadId).get();
  if (!threadSnap.exists) return;
  const thread = threadSnap.data() || {};

  let recipientType = 'user';
  let recipientDocId = '';
  if (senderRole === 'user') {
    recipientType = 'partner';
    recipientDocId = String(thread.participantPartnerDocId || '').trim();
  } else if (senderRole === 'partner') {
    recipientType = 'user';
    recipientDocId = String(thread.participantUserDocId || '').trim();
  } else if (senderRole === 'admin') {
    if (threadId.startsWith('admin__u_')) {
      recipientType = 'user';
      recipientDocId = String(thread.participantUserDocId || threadId.replace('admin__u_', '') || '').trim();
    } else if (threadId.startsWith('admin__p_')) {
      recipientType = 'partner';
      recipientDocId = String(thread.participantPartnerDocId || threadId.replace('admin__p_', '') || '').trim();
    }
  }
  if (!recipientDocId) return;

  const senderName =
    String(msg.senderName || '').trim() ||
    (senderRole === 'admin' ? '다독 관리자' : senderRole === 'partner' ? '업체' : '고객');
  const text = String(msg.text || '').trim();
  const attachmentCount = Number(msg.attachmentCount || 0);
  const preview = text || (attachmentCount > 0 ? `첨부파일 ${attachmentCount}개` : '새 채팅 메시지');

  await sendPushToRecipient({
    recipientType,
    recipientDocId,
    title: `${senderName}`,
    body: preview,
    requireChat: true,
    data: {
      type: 'chat',
      messageId: event.params.messageId,
      threadId,
      clickUrl: '/',
    },
  });
});

exports.onNoticeCreatedPush = onDocumentCreated('user_notifications/{notificationId}', async (event) => {
  const notice = event.data?.data() || {};
  const recipientType = String(notice.recipientType || '').trim();
  const recipientDocId = String(notice.recipientDocId || '').trim();
  if (!recipientType || !recipientDocId) return;

  const title = String(notice.title || '').trim() || '새 공지';
  const body = String(notice.body || '').trim() || '새로운 공지/안내가 도착했습니다.';
  await sendPushToRecipient({
    recipientType,
    recipientDocId,
    title,
    body,
    requireNotice: true,
    data: {
      type: 'notice',
      notificationId: event.params.notificationId,
      clickUrl: '/',
    },
  });
});

exports.onPartnerStateChangedNotice = onDocumentUpdated('partners/{partnerId}', async (event) => {
  const before = event.data?.before?.data() || {};
  const after = event.data?.after?.data() || {};
  const partnerId = String(event.params.partnerId || '').trim();
  if (!partnerId) return;

  const beforeStatus = String(before.status || '').trim().toLowerCase();
  const afterStatus = String(after.status || '').trim().toLowerCase();
  const partnerName =
    String(after.name || before.name || after.companyName || before.companyName || '').trim() || '업체';
  const partnerUserId = String(after.userId || before.userId || '').trim();

  if (beforeStatus !== afterStatus) {
    if (afterStatus === 'active') {
      await createNoticeAndAdminChat({
        dedupeKey: `partner-status-active-${partnerId}-${toMillis(after.approvedAt || after.updatedAt || Date.now())}`,
        recipientType: 'partner',
        recipientDocId: partnerId,
        recipientUserId: partnerUserId,
        recipientName: partnerName,
        title: '[승인 완료] 파트너 권한이 활성화되었습니다.',
        body: '가입 승인이 완료되었습니다. 지금부터 업체 대시보드 기능을 이용하실 수 있습니다.',
        category: 'approval_done',
        linkType: 'partner_dashboard',
        linkLabel: '파트너 대시보드',
      });
    } else if (beforeStatus === 'active' && afterStatus === 'pending') {
      await createNoticeAndAdminChat({
        dedupeKey: `partner-status-pending-${partnerId}-${toMillis(after.updatedAt || Date.now())}`,
        recipientType: 'partner',
        recipientDocId: partnerId,
        recipientUserId: partnerUserId,
        recipientName: partnerName,
        title: '[승인 상태 변경] 현재 승인 대기 상태입니다.',
        body: '업체 상태가 승인 대기로 변경되었습니다. 운영팀 안내를 확인해주세요.',
        category: 'approval_pending',
        linkType: 'partner_dashboard',
        linkLabel: '파트너 대시보드',
      });
    }
  }

  const beforeExp = toMillis(before.ticketExpiryTimestamp || before.ticketExpiry);
  const afterExp = toMillis(after.ticketExpiryTimestamp || after.ticketExpiry);
  const now = Date.now();
  const ticketType = String(after.ticketType || before.ticketType || '').trim() || '입점권';

  if (afterExp > 0 && afterExp > beforeExp) {
    const expiryLabel = new Date(afterExp).toLocaleString('ko-KR');
    await createNoticeAndAdminChat({
      dedupeKey: `partner-ticket-expiry-${partnerId}-${afterExp}`,
      recipientType: 'partner',
      recipientDocId: partnerId,
      recipientUserId: partnerUserId,
      recipientName: partnerName,
      title: `[입점권 승인/연장] ${ticketType}`,
      body: `${ticketType} 적용이 완료되었습니다. 만료 예정 시각: ${expiryLabel}`,
      category: 'subscription_completed',
      linkType: 'partner_entry',
      linkLabel: '입점권 안내/구매',
    });
  }

  if (beforeExp > now && afterExp > 0 && afterExp <= now) {
    await createNoticeAndAdminChat({
      dedupeKey: `partner-ticket-expired-${partnerId}-${afterExp}`,
      recipientType: 'partner',
      recipientDocId: partnerId,
      recipientUserId: partnerUserId,
      recipientName: partnerName,
      title: '[입점권 만료] 노출 상태를 확인해주세요.',
      body: '입점권이 만료되었습니다. 연장 결제 후 정상 노출을 이어갈 수 있습니다.',
      category: 'subscription_expired',
      linkType: 'partner_entry',
      linkLabel: '입점권 안내/구매',
    });
  }

  const beforeDiff = beforeExp > 0 ? beforeExp - now : Number.MAX_SAFE_INTEGER;
  const afterDiff = afterExp > 0 ? afterExp - now : Number.MAX_SAFE_INTEGER;
  if (afterExp > now && afterDiff <= THREE_DAYS_MS && beforeDiff > THREE_DAYS_MS) {
    const expiryLabel = new Date(afterExp).toLocaleString('ko-KR');
    await createNoticeAndAdminChat({
      dedupeKey: `partner-ticket-expiring-soon-${partnerId}-${afterExp}`,
      recipientType: 'partner',
      recipientDocId: partnerId,
      recipientUserId: partnerUserId,
      recipientName: partnerName,
      title: '[입점권 만료 임박] 3일 이내 만료 예정입니다.',
      body: `현재 입점권은 ${expiryLabel}에 만료됩니다. 노출 유지를 원하시면 연장을 진행해주세요.`,
      category: 'subscription_expiring',
      linkType: 'partner_entry',
      linkLabel: '입점권 안내/구매',
    });
  }
});

exports.onSubscriptionRequestCreatedNotice = onDocumentCreated(
  'subscription_requests/{requestId}',
  async (event) => {
    const req = event.data?.data() || {};
    const requestId = String(event.params.requestId || '').trim();
    const partnerId = String(req.partnerId || '').trim();
    if (!requestId || !partnerId) return;
    const partnerName = String(req.partnerName || req.name || '').trim() || '업체';
    const partnerUserId = String(req.partnerUserId || req.userId || '').trim();
    const months = Number(req.months || 0);
    const ticketLabel = String(req.ticketTitle || '').trim() || (months ? `${months}개월 입점권` : '입점권');

    await createNoticeAndAdminChat({
      dedupeKey: `subreq-created-${requestId}`,
      recipientType: 'partner',
      recipientDocId: partnerId,
      recipientUserId: partnerUserId,
      recipientName: partnerName,
      title: '[입점권 신청 접수] 운영팀 확인 중입니다.',
      body: `${ticketLabel} 신청이 접수되었습니다. 승인 완료 시 알림으로 안내드립니다.`,
      category: 'subscription_requested',
      linkType: 'partner_entry',
      linkLabel: '입점권 안내/구매',
    });
  },
);

exports.onSubscriptionRequestUpdatedNotice = onDocumentUpdated(
  'subscription_requests/{requestId}',
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    const requestId = String(event.params.requestId || '').trim();
    const partnerId = String(after.partnerId || before.partnerId || '').trim();
    if (!requestId || !partnerId) return;

    const beforeStatus = normalizeSubStatus(before.status);
    const afterStatus = normalizeSubStatus(after.status);
    if (beforeStatus === afterStatus) return;

    const partnerName = String(after.partnerName || before.partnerName || after.name || before.name || '').trim() || '업체';
    const partnerUserId = String(after.partnerUserId || before.partnerUserId || after.userId || before.userId || '').trim();
    const months = Number(after.months || before.months || 0);
    const ticketLabel =
      String(after.approvedTicketType || after.ticketTitle || before.ticketTitle || '').trim() ||
      (months ? `${months}개월 입점권` : '입점권');

    if (afterStatus === 'completed') {
      const approvedExp = toMillis(after.approvedExpiryTimestamp || after.expiryTimestamp || after.ticketExpiryTimestamp);
      const expiryLabel = approvedExp ? new Date(approvedExp).toLocaleString('ko-KR') : '별도 안내';
      await createNoticeAndAdminChat({
        dedupeKey: approvedExp
          ? `partner-ticket-expiry-${partnerId}-${approvedExp}`
          : `subreq-completed-${requestId}`,
        recipientType: 'partner',
        recipientDocId: partnerId,
        recipientUserId: partnerUserId,
        recipientName: partnerName,
        title: `[입점권 승인 완료] ${ticketLabel}`,
        body: `${ticketLabel} 승인이 완료되었습니다. 만료 예정 시각: ${expiryLabel}`,
        category: 'subscription_completed',
        linkType: 'partner_entry',
        linkLabel: '입점권 안내/구매',
      });
      return;
    }

    if (afterStatus === 'rejected') {
      const reason = String(after.rejectReason || '').trim();
      await createNoticeAndAdminChat({
        dedupeKey: `subreq-rejected-${requestId}`,
        recipientType: 'partner',
        recipientDocId: partnerId,
        recipientUserId: partnerUserId,
        recipientName: partnerName,
        title: '[입점권 신청 반려] 사유를 확인해주세요.',
        body: reason
          ? `입점권 신청이 반려되었습니다. 사유: ${reason}`
          : '입점권 신청이 반려되었습니다. 운영팀 안내를 확인해주세요.',
        category: 'subscription_rejected',
        linkType: 'partner_entry',
        linkLabel: '입점권 안내/구매',
      });
    }
  },
);

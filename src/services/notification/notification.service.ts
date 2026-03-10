// =============================================================================
// NOTIFICATION SERVICE
// Centralised helpers to create notifications across the application.
// =============================================================================

import { db } from "@/lib/db";
import { NotificationType, Prisma } from "@prisma/client";

// ─── Core creator ─────────────────────────────────────────────────────────────

export async function createNotification(params: {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        recipientId: params.recipientId,
        actorId: params.actorId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return notification;
  } catch (error) {
    // Notifications are non-critical — log and continue rather than propagating
    console.error("[NotificationService] createNotification error:", error);
    return null;
  }
}

// ─── Domain-specific helpers ──────────────────────────────────────────────────

/**
 * Notify a post author when someone comments on their post.
 * Skips self-notification.
 */
export async function notifyNewComment(params: {
  postAuthorId: string;
  actorId: string;
  actorName: string;
  postTitle: string;
  postId: string;
  communitySlug: string;
}) {
  if (params.postAuthorId === params.actorId) return null;

  return createNotification({
    recipientId: params.postAuthorId,
    actorId: params.actorId,
    type: NotificationType.NEW_COMMENT,
    title: `${params.actorName} comentou no seu post`,
    body: params.postTitle || "Ver comentário",
    link: `/community/${params.communitySlug}/posts/${params.postId}`,
  });
}

/**
 * Notify a comment author when someone replies to their comment.
 * Skips self-notification.
 */
export async function notifyNewReply(params: {
  commentAuthorId: string;
  actorId: string;
  actorName: string;
  postId: string;
  communitySlug: string;
}) {
  if (params.commentAuthorId === params.actorId) return null;

  return createNotification({
    recipientId: params.commentAuthorId,
    actorId: params.actorId,
    type: NotificationType.NEW_REPLY,
    title: `${params.actorName} respondeu ao seu comentário`,
    body: "Ver resposta",
    link: `/community/${params.communitySlug}/posts/${params.postId}`,
  });
}

/**
 * Notify the influencer/admin when a new member joins their community.
 */
export async function notifyNewMember(params: {
  influencerUserId: string;
  newMemberName: string;
  communityName: string;
  communityId: string;
}) {
  return createNotification({
    recipientId: params.influencerUserId,
    type: NotificationType.NEW_MEMBER,
    title: `${params.newMemberName} entrou em ${params.communityName}`,
    body: "Ver membros da comunidade",
    link: `/dashboard/communities/${params.communityId}/settings`,
    metadata: { communityId: params.communityId },
  });
}

/**
 * Send a welcome notification to a user who just joined a community.
 */
export async function createWelcomeNotification(params: {
  userId: string;
  communityName: string;
  communitySlug: string;
}) {
  return createNotification({
    recipientId: params.userId,
    type: NotificationType.WELCOME,
    title: `Bem-vindo(a) à ${params.communityName}!`,
    body: "Explore o feed e conecte-se com a comunidade.",
    link: `/community/${params.communitySlug}/feed`,
  });
}

/**
 * Notify a user when a live session goes live.
 */
export async function notifyLiveSessionLive(params: {
  recipientId: string;
  actorId: string;
  actorName: string;
  sessionTitle: string;
  communitySlug: string;
  sessionId: string;
}) {
  return createNotification({
    recipientId: params.recipientId,
    actorId: params.actorId,
    type: NotificationType.LIVE_SESSION_LIVE,
    title: `${params.actorName} está ao vivo!`,
    body: params.sessionTitle,
    link: `/community/${params.communitySlug}/lives/${params.sessionId}`,
  });
}

/**
 * Notify a user that their subscription is expiring soon.
 */
export async function notifySubscriptionExpiring(params: {
  recipientId: string;
  communityName: string;
  communitySlug: string;
  daysLeft: number;
}) {
  return createNotification({
    recipientId: params.recipientId,
    type: NotificationType.SUBSCRIPTION_EXPIRING,
    title: `Sua assinatura em ${params.communityName} expira em ${params.daysLeft} dia(s)`,
    body: "Renove agora para continuar com acesso.",
    link: `/community/${params.communitySlug}`,
    metadata: { daysLeft: params.daysLeft },
  });
}

/**
 * Notify a user of a failed payment.
 */
export async function notifyPaymentFailed(params: {
  recipientId: string;
  communityName: string;
  communitySlug: string;
}) {
  return createNotification({
    recipientId: params.recipientId,
    type: NotificationType.PAYMENT_FAILED,
    title: `Falha no pagamento — ${params.communityName}`,
    body: "Por favor, atualize seu método de pagamento.",
    link: `/dashboard/settings`,
  });
}

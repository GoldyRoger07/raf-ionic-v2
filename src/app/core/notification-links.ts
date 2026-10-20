import { AppNotification, NotificationType } from './models';

// Ou mene une notification, et son icone. Memes destinations que les liens du backend.

const ICONS: Partial<Record<NotificationType, string>> = {
  QUIZ_SCHEDULED: 'clock',
  QUIZ_STARTED: 'flame',
  QUIZ_CLOSING: 'hourglass',
  QUIZ_CANCELLED: 'gift',
  QUIZ_RESULTS: 'trophy',
  PRIZE_WON: 'crown',
  TOPUP_CONFIRMED: 'coin',
  WITHDRAWAL_APPROVED: 'check',
  WITHDRAWAL_PAID: 'cash',
  WITHDRAWAL_REJECTED: 'cross',
  ADMIN_RECONCILIATION_ALERT: 'warning',
};

export function notificationIcon(n: AppNotification): string {
  return ICONS[n.type] ?? 'bell';
}

export function notificationLink(n: AppNotification): string | null {
  let data: Record<string, unknown> = {};
  try {
    data = n.data ? JSON.parse(n.data) : {};
  } catch {
    // donnees illisibles : pas de lien
  }
  const quizId = data['quizId'];
  switch (n.type) {
    case 'QUIZ_SCHEDULED':
    case 'QUIZ_STARTED':
    case 'QUIZ_CLOSING':
    case 'QUIZ_CANCELLED':
      return quizId ? `/quiz/${quizId}` : null;
    case 'QUIZ_RESULTS':
    case 'PRIZE_WON':
      return quizId ? `/quiz/${quizId}/classement` : null;
    case 'TOPUP_CONFIRMED':
      return '/portefeuille';
    case 'WITHDRAWAL_APPROVED':
    case 'WITHDRAWAL_PAID':
    case 'WITHDRAWAL_REJECTED':
      return '/portefeuille/retraits';
    default:
      return null;
  }
}

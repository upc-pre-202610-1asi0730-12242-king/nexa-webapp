import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

export class CommunicationsApi {
  constructor() {
    this.messages = new BaseEndpoint('/api/v1/conversation-messages');
    this.notifications = new BaseEndpoint('/api/v1/notification-records');
  }

  getThreads() { return this.messages.getAll(); }
  getMessages() { return this.messages.getAll(); }
  createMessage(payload) { return this.messages.create(payload); }
  getNotifications() { return this.notifications.getAll(); }
}

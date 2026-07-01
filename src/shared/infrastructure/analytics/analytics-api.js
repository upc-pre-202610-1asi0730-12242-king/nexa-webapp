import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

class AnalyticsApiService {
  constructor() {
    this.alerts = new BaseEndpoint('/api/v1/notification-records');
    this.activityLog = new BaseEndpoint('/api/v1/audit-logs');
  }

  getAlerts() {
    return this.alerts.getAll();
  }

  getActivityLog() {
    return this.activityLog.getAll();
  }
}

export const analyticsApiService = new AnalyticsApiService();

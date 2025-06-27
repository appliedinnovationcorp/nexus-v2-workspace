/**
 * Dashboard Manager
 * Manages dashboard creation, updates, and rendering
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { MongoClient, Db, Collection } from 'mongodb';
import { 
  Dashboard, 
  Widget, 
  AnalyticsConfig,
  AnalyticsError,
  NotFoundError 
} from '../types';

export class DashboardManager extends EventEmitter {
  private mongodb: MongoClient;
  private db: Db;
  private dashboardsCollection: Collection<Dashboard>;
  private isConnected: boolean = false;
  private stats = {
    total: 0,
    active: 0,
    created: 0,
    updated: 0
  };

  constructor(
    private config: AnalyticsConfig,
    private logger: Logger
  ) {
    super();
  }

  /**
   * Initialize dashboard manager
   */
  async initialize(): Promise<void> {
    try {
      // Connect to MongoDB
      this.mongodb = new MongoClient(this.config.database.mongodb.uri);
      await this.mongodb.connect();
      this.db = this.mongodb.db(this.config.database.mongodb.database);
      this.dashboardsCollection = this.db.collection('dashboards');

      // Create indexes
      await this.createIndexes();

      // Load initial stats
      await this.loadStats();

      this.isConnected = true;
      this.logger.info('Dashboard Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Dashboard Manager', { error: error.message });
      throw new AnalyticsError('Dashboard Manager initialization failed', 'INIT_ERROR');
    }
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    await Promise.all([
      this.dashboardsCollection.createIndex({ createdBy: 1 }),
      this.dashboardsCollection.createIndex({ createdAt: -1 }),
      this.dashboardsCollection.createIndex({ updatedAt: -1 }),
      this.dashboardsCollection.createIndex({ name: 'text', description: 'text' })
    ]);
  }

  /**
   * Load statistics
   */
  private async loadStats(): Promise<void> {
    this.stats.total = await this.dashboardsCollection.countDocuments();
    this.stats.active = await this.dashboardsCollection.countDocuments({
      // Add criteria for active dashboards if needed
    });
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(
    dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Dashboard> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const now = new Date();
      const dashboard: Dashboard = {
        id: this.generateDashboardId(),
        ...dashboardData,
        createdAt: now,
        updatedAt: now
      };

      // Validate dashboard structure
      this.validateDashboard(dashboard);

      // Insert into database
      await this.dashboardsCollection.insertOne(dashboard);

      // Update stats
      this.stats.total++;
      this.stats.created++;

      this.emit('dashboard_created', dashboard);
      this.logger.info('Dashboard created', { 
        dashboardId: dashboard.id,
        name: dashboard.name,
        createdBy: dashboard.createdBy 
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to create dashboard', { error: error.message });
      throw error;
    }
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(id: string): Promise<Dashboard | null> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const dashboard = await this.dashboardsCollection.findOne({ id });
      return dashboard;
    } catch (error) {
      this.logger.error('Failed to get dashboard', { error: error.message, dashboardId: id });
      throw error;
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(
    id: string,
    updates: Partial<Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Dashboard> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const existingDashboard = await this.getDashboard(id);
      if (!existingDashboard) {
        throw new NotFoundError('Dashboard');
      }

      const updatedDashboard: Dashboard = {
        ...existingDashboard,
        ...updates,
        updatedAt: new Date()
      };

      // Validate updated dashboard
      this.validateDashboard(updatedDashboard);

      // Update in database
      await this.dashboardsCollection.replaceOne({ id }, updatedDashboard);

      // Update stats
      this.stats.updated++;

      this.emit('dashboard_updated', updatedDashboard);
      this.logger.info('Dashboard updated', { 
        dashboardId: id,
        name: updatedDashboard.name 
      });

      return updatedDashboard;
    } catch (error) {
      this.logger.error('Failed to update dashboard', { error: error.message, dashboardId: id });
      throw error;
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const dashboard = await this.getDashboard(id);
      if (!dashboard) {
        throw new NotFoundError('Dashboard');
      }

      await this.dashboardsCollection.deleteOne({ id });

      // Update stats
      this.stats.total--;

      this.emit('dashboard_deleted', { id, name: dashboard.name });
      this.logger.info('Dashboard deleted', { dashboardId: id, name: dashboard.name });
    } catch (error) {
      this.logger.error('Failed to delete dashboard', { error: error.message, dashboardId: id });
      throw error;
    }
  }

  /**
   * List dashboards
   */
  async listDashboards(
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    } = {}
  ): Promise<Dashboard[]> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        search
      } = options;

      let query: any = {};

      // Filter by user if specified
      if (userId) {
        query.createdBy = userId;
      }

      // Add search filter
      if (search) {
        query.$text = { $search: search };
      }

      const cursor = this.dashboardsCollection
        .find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(offset)
        .limit(limit);

      return await cursor.toArray();
    } catch (error) {
      this.logger.error('Failed to list dashboards', { error: error.message });
      throw error;
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<Dashboard> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new NotFoundError('Dashboard');
      }

      const newWidget: Widget = {
        id: this.generateWidgetId(),
        ...widget
      };

      // Validate widget
      this.validateWidget(newWidget);

      dashboard.widgets.push(newWidget);
      dashboard.updatedAt = new Date();

      await this.dashboardsCollection.replaceOne({ id: dashboardId }, dashboard);

      this.emit('widget_added', { dashboardId, widget: newWidget });
      this.logger.info('Widget added to dashboard', { 
        dashboardId,
        widgetId: newWidget.id,
        widgetType: newWidget.type 
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to add widget', { error: error.message, dashboardId });
      throw error;
    }
  }

  /**
   * Update widget in dashboard
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<Omit<Widget, 'id'>>
  ): Promise<Dashboard> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new NotFoundError('Dashboard');
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new NotFoundError('Widget');
      }

      const updatedWidget: Widget = {
        ...dashboard.widgets[widgetIndex],
        ...updates
      };

      // Validate updated widget
      this.validateWidget(updatedWidget);

      dashboard.widgets[widgetIndex] = updatedWidget;
      dashboard.updatedAt = new Date();

      await this.dashboardsCollection.replaceOne({ id: dashboardId }, dashboard);

      this.emit('widget_updated', { dashboardId, widget: updatedWidget });
      this.logger.info('Widget updated', { 
        dashboardId,
        widgetId,
        widgetType: updatedWidget.type 
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to update widget', { error: error.message, dashboardId, widgetId });
      throw error;
    }
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    if (!this.isConnected) {
      throw new AnalyticsError('Dashboard Manager not connected', 'NOT_CONNECTED');
    }

    try {
      const dashboard = await this.getDashboard(dashboardId);
      if (!dashboard) {
        throw new NotFoundError('Dashboard');
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new NotFoundError('Widget');
      }

      const removedWidget = dashboard.widgets[widgetIndex];
      dashboard.widgets.splice(widgetIndex, 1);
      dashboard.updatedAt = new Date();

      await this.dashboardsCollection.replaceOne({ id: dashboardId }, dashboard);

      this.emit('widget_removed', { dashboardId, widget: removedWidget });
      this.logger.info('Widget removed from dashboard', { 
        dashboardId,
        widgetId,
        widgetType: removedWidget.type 
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to remove widget', { error: error.message, dashboardId, widgetId });
      throw error;
    }
  }

  /**
   * Validate dashboard structure
   */
  private validateDashboard(dashboard: Dashboard): void {
    if (!dashboard.name || dashboard.name.trim().length === 0) {
      throw new AnalyticsError('Dashboard name is required', 'VALIDATION_ERROR');
    }

    if (!dashboard.createdBy || dashboard.createdBy.trim().length === 0) {
      throw new AnalyticsError('Dashboard creator is required', 'VALIDATION_ERROR');
    }

    if (!Array.isArray(dashboard.widgets)) {
      throw new AnalyticsError('Dashboard widgets must be an array', 'VALIDATION_ERROR');
    }

    // Validate each widget
    dashboard.widgets.forEach(widget => this.validateWidget(widget));
  }

  /**
   * Validate widget structure
   */
  private validateWidget(widget: Widget): void {
    if (!widget.type || !['metric', 'chart', 'table', 'text', 'image'].includes(widget.type)) {
      throw new AnalyticsError('Invalid widget type', 'VALIDATION_ERROR');
    }

    if (!widget.title || widget.title.trim().length === 0) {
      throw new AnalyticsError('Widget title is required', 'VALIDATION_ERROR');
    }

    if (!widget.dataSource || widget.dataSource.trim().length === 0) {
      throw new AnalyticsError('Widget data source is required', 'VALIDATION_ERROR');
    }

    if (!widget.config || typeof widget.config !== 'object') {
      throw new AnalyticsError('Widget config is required', 'VALIDATION_ERROR');
    }

    if (!widget.position || typeof widget.position !== 'object') {
      throw new AnalyticsError('Widget position is required', 'VALIDATION_ERROR');
    }

    // Validate position
    const { x, y, width, height } = widget.position;
    if (typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number') {
      throw new AnalyticsError('Widget position must have numeric x, y, width, height', 'VALIDATION_ERROR');
    }

    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
      throw new AnalyticsError('Widget position values must be positive', 'VALIDATION_ERROR');
    }
  }

  /**
   * Generate unique dashboard ID
   */
  private generateDashboardId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique widget ID
   */
  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    created: number;
    updated: number;
  }> {
    await this.loadStats();
    return { ...this.stats };
  }

  /**
   * Check if manager is healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.mongodb?.topology?.isConnected();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.mongodb) {
      await this.mongodb.close();
    }
    this.isConnected = false;
    this.logger.info('Dashboard Manager cleaned up');
  }
}

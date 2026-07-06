// SECTION: CONSTANTS & CONFIGURATION

const APP_VERSION = '2.0.0';
const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    ARCHIVED: 'taskflow_archived',
    DELETED: 'taskflow_deleted',
    CATEGORIES: 'taskflow_categories',
    SETTINGS: 'taskflow_settings',
    THEME: 'taskflow_theme',
    USER: 'taskflow_user',
    ACTIVITY: 'taskflow_activity',
    NOTIFICATIONS: 'taskflow_notifications',
    STATE: 'taskflow_state',
    BACKUP: 'taskflow_backup'
};

const DEFAULT_CATEGORIES = [
    { id: 'cat_1', name: 'العمل', color: '#6C63FF' },
    { id: 'cat_2', name: 'شخصي', color: '#51CF66' },
    { id: 'cat_3', name: 'دراسة', color: '#4DABF7' },
    { id: 'cat_4', name: 'منزل', color: '#FCC419' },
    { id: 'cat_5', name: 'صحي', color: '#FF6B6B' }
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER = { pending: 0, 'in-progress': 1, 'on-hold': 2, completed: 3, cancelled: 4 };

const PRIORITY_COLORS = {
    urgent: '#FF6B6B',
    high: '#FCC419',
    medium: '#4DABF7',
    low: '#51CF66'
};

const STATUS_LABELS = {
    pending: 'معلقة',
    'in-progress': 'قيد التنفيذ',
    completed: 'مكتملة',
    cancelled: 'ملغية',
    'on-hold': 'معلقة مؤقتًا'
};

const STATUS_COLORS = {
    pending: '#FCC419',
    'in-progress': '#4DABF7',
    completed: '#51CF66',
    cancelled: '#FF6B6B',
    'on-hold': '#8A8AA8'
};

// SECTION: APPLICATION STATE

class AppState {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.archivedTasks = [];
        this.deletedTasks = [];
        this.categories = [];
        this.notifications = [];
        this.activityLogs = [];
        this.settings = this.getDefaultSettings();
        this.theme = 'light';
        this.selectedTask = null;
        this.currentView = 'dashboard';
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: '',
            favorite: false,
            pinned: false,
            archived: false,
            deleted: false
        };
        this.sortOption = 'createdAt-desc';
        this.searchTerm = '';
        this.selectedTasks = new Set();
        this.pagination = {
            page: 1,
            limit: 20
        };
        this.undoStack = [];
        this.redoStack = [];
        this.isAnimating = true;
        this.isLoading = false;
        this.lastBackupDate = null;
    }

    getDefaultSettings() {
        return {
            language: 'ar',
            theme: 'light',
            animations: true,
            notifications: true,
            reminderNotifications: true,
            emailNotifications: false,
            defaultSort: 'createdAt-desc',
            cardSize: 'medium',
            sidebarPosition: 'right',
            dashboardLayout: 'grid',
            autoSave: true
        };
    }

    loadFromStorage() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEYS.STATE);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                Object.assign(this, parsed);
            }

            // Load tasks
            const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
            if (tasks) this.tasks = JSON.parse(tasks);

            const archived = localStorage.getItem(STORAGE_KEYS.ARCHIVED);
            if (archived) this.archivedTasks = JSON.parse(archived);

            const deleted = localStorage.getItem(STORAGE_KEYS.DELETED);
            if (deleted) this.deletedTasks = JSON.parse(deleted);

            const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
            if (categories) this.categories = JSON.parse(categories);
            else this.categories = DEFAULT_CATEGORIES;

            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (settings) this.settings = { ...this.getDefaultSettings(), ...JSON.parse(settings) };

            const theme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (theme) this.theme = theme;

            const user = localStorage.getItem(STORAGE_KEYS.USER);
            if (user) this.currentUser = JSON.parse(user);

            const activity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
            if (activity) this.activityLogs = JSON.parse(activity);

            const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
            if (notifications) this.notifications = JSON.parse(notifications);

            const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
            if (backup) this.lastBackupDate = JSON.parse(backup);

            return true;
        } catch (error) {
            console.error('Error loading state from storage:', error);
            return false;
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({
                currentUser: this.currentUser,
                selectedTask: this.selectedTask,
                currentView: this.currentView,
                filters: this.filters,
                sortOption: this.sortOption,
                searchTerm: this.searchTerm,
                pagination: this.pagination,
                isAnimating: this.isAnimating,
                lastBackupDate: this.lastBackupDate
            }));

            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
            localStorage.setItem(STORAGE_KEYS.ARCHIVED, JSON.stringify(this.archivedTasks));
            localStorage.setItem(STORAGE_KEYS.DELETED, JSON.stringify(this.deletedTasks));
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(this.theme));
            localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(this.activityLogs));
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));

            if (this.currentUser) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
            }

            if (this.lastBackupDate) {
                localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(this.lastBackupDate));
            }

            return true;
        } catch (error) {
            console.error('Error saving state to storage:', error);
            return false;
        }
    }

    getTasks() {
        return this.tasks;
    }

    getArchivedTasks() {
        return this.archivedTasks;
    }

    getDeletedTasks() {
        return this.deletedTasks;
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id) ||
            this.archivedTasks.find(t => t.id === id) ||
            this.deletedTasks.find(t => t.id === id);
    }

    addTask(task) {
        this.tasks.push(task);
        this.addActivity('create', `تم إنشاء مهمة: ${task.title}`);
        this.addNotification('تم إنشاء مهمة جديدة', task.title, 'success');
        this.saveToStorage();
        return task;
    }

    updateTask(id, updates) {
        const task = this.getTaskById(id);
        if (task) {
            const oldTitle = task.title;
            Object.assign(task, updates);
            task.updatedAt = new Date().toISOString();
            this.addActivity('update', `تم تحديث مهمة: ${task.title}`);
            this.addNotification('تم تحديث المهمة', task.title, 'info');
            this.saveToStorage();
            return task;
        }
        return null;
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const task = this.tasks.splice(index, 1)[0];
            task.deletedAt = new Date().toISOString();
            this.deletedTasks.push(task);
            this.addActivity('delete', `تم حذف مهمة: ${task.title}`);
            this.addNotification('تم حذف المهمة', task.title, 'warning');
            this.saveToStorage();
            return task;
        }
        return null;
    }

    restoreTask(id) {
        const index = this.deletedTasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const task = this.deletedTasks.splice(index, 1)[0];
            delete task.deletedAt;
            this.tasks.push(task);
            this.addActivity('restore', `تم استعادة مهمة: ${task.title}`);
            this.addNotification('تم استعادة المهمة', task.title, 'success');
            this.saveToStorage();
            return task;
        }
        return null;
    }

    archiveTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const task = this.tasks.splice(index, 1)[0];
            task.archivedAt = new Date().toISOString();
            this.archivedTasks.push(task);
            this.addActivity('archive', `تم أرشفة مهمة: ${task.title}`);
            this.addNotification('تم أرشفة المهمة', task.title, 'info');
            this.saveToStorage();
            return task;
        }
        return null;
    }

    unarchiveTask(id) {
        const index = this.archivedTasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const task = this.archivedTasks.splice(index, 1)[0];
            delete task.archivedAt;
            this.tasks.push(task);
            this.addActivity('unarchive', `تم إلغاء أرشفة مهمة: ${task.title}`);
            this.addNotification('تم إلغاء أرشفة المهمة', task.title, 'info');
            this.saveToStorage();
            return task;
        }
        return null;
    }

    toggleFavorite(id) {
        const task = this.getTaskById(id);
        if (task) {
            task.favorite = !task.favorite;
            task.updatedAt = new Date().toISOString();
            this.addActivity('favorite', `${task.favorite ? 'أضيفت' : 'أزيلت'} من المفضلة: ${task.title}`);
            this.saveToStorage();
            return task;
        }
        return null;
    }

    togglePin(id) {
        const task = this.getTaskById(id);
        if (task) {
            task.pinned = !task.pinned;
            task.updatedAt = new Date().toISOString();
            this.addActivity('pin', `${task.pinned ? 'ثُبّتت' : 'أزيلت'} المهمة: ${task.title}`);
            this.saveToStorage();
            return task;
        }
        return null;
    }

    addComment(taskId, comment) {
        const task = this.getTaskById(taskId);
        if (task) {
            if (!task.comments) task.comments = [];
            const newComment = {
                id: `comment_${Date.now()}`,
                text: comment,
                author: this.currentUser?.name || 'مستخدم',
                createdAt: new Date().toISOString()
            };
            task.comments.push(newComment);
            task.updatedAt = new Date().toISOString();
            this.addActivity('comment', `تم إضافة تعليق على مهمة: ${task.title}`);
            this.saveToStorage();
            return newComment;
        }
        return null;
    }

    addChecklistItem(taskId, text) {
        const task = this.getTaskById(taskId);
        if (task) {
            if (!task.checklist) task.checklist = [];
            const item = {
                id: `check_${Date.now()}`,
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            task.checklist.push(item);
            task.updatedAt = new Date().toISOString();
            this.updateTaskProgress(task);
            this.addActivity('checklist', `تم إضافة عنصر إلى قائمة المراجعة في: ${task.title}`);
            this.saveToStorage();
            return item;
        }
        return null;
    }

    toggleChecklistItem(taskId, itemId) {
        const task = this.getTaskById(taskId);
        if (task && task.checklist) {
            const item = task.checklist.find(c => c.id === itemId);
            if (item) {
                item.completed = !item.completed;
                item.updatedAt = new Date().toISOString();
                this.updateTaskProgress(task);
                task.updatedAt = new Date().toISOString();
                this.saveToStorage();
                return item;
            }
        }
        return null;
    }

    updateTaskProgress(task) {
        if (task.checklist && task.checklist.length > 0) {
            const completed = task.checklist.filter(c => c.completed).length;
            task.progress = Math.round((completed / task.checklist.length) * 100);
        } else if (task.status === 'completed') {
            task.progress = 100;
        } else if (task.progress === undefined) {
            task.progress = 0;
        }
    }

    duplicateTask(id) {
        const original = this.getTaskById(id);
        if (original) {
            const newTask = this.createTaskObject({
                title: `${original.title} (نسخة)`,
                description: original.description,
                status: original.status,
                priority: original.priority,
                category: original.category,
                dueDate: original.dueDate,
                color: original.color,
                tags: original.tags ? [...original.tags] : [],
                notes: original.notes,
                estimatedTime: original.estimatedTime,
                progress: 0,
                favorite: false,
                pinned: false,
                archived: false
            });
            this.tasks.push(newTask);
            this.addActivity('duplicate', `تم نسخ مهمة: ${original.title}`);
            this.addNotification('تم نسخ المهمة', newTask.title, 'success');
            this.saveToStorage();
            return newTask;
        }
        return null;
    }

    createTaskObject(data) {
        const now = new Date().toISOString();
        return {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: data.title || 'مهمة جديدة',
            description: data.description || '',
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            category: data.category || '',
            dueDate: data.dueDate || '',
            createdAt: now,
            updatedAt: now,
            color: data.color || '#6C63FF',
            tags: data.tags || [],
            notes: data.notes || '',
            estimatedTime: data.estimatedTime || 0,
            progress: data.progress || 0,
            favorite: data.favorite || false,
            archived: data.archived || false,
            pinned: data.pinned || false,
            deleted: false,
            attachments: [],
            comments: [],
            checklist: [],
            reminder: data.reminder || null,
            activityHistory: [],
            completedTime: null
        };
    }

    addActivity(type, description) {
        const activity = {
            id: `act_${Date.now()}`,
            type: type,
            description: description,
            timestamp: new Date().toISOString(),
            user: this.currentUser?.name || 'مستخدم'
        };
        this.activityLogs.unshift(activity);
        if (this.activityLogs.length > 1000) {
            this.activityLogs = this.activityLogs.slice(0, 1000);
        }
        this.saveToStorage();
        return activity;
    }

    addNotification(title, message, type = 'info') {
        const notification = {
            id: `notif_${Date.now()}`,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: new Date().toISOString()
        };
        this.notifications.unshift(notification);
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        this.saveToStorage();
        this.updateNotificationBadge();

        if (this.settings.notifications) {
            this.showToast(title, message, type);
        }

        return notification;
    }

    markNotificationRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.saveToStorage();
            this.updateNotificationBadge();
            return true;
        }
        return false;
    }

    markAllNotificationsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveToStorage();
        this.updateNotificationBadge();
        return true;
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveToStorage();
        this.updateNotificationBadge();
        return true;
    }

    getUnreadNotificationsCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    updateNotificationBadge() {
        const count = this.getUnreadNotificationsCount();
        const badge = document.querySelector('.notification-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showToast(title, message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        setTimeout(() => {
            this.removeToast(toast);
        }, 4000);
    }

    removeToast(toast) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getDashboardStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const archived = this.archivedTasks.length;
        const deleted = this.deletedTasks.length;
        const favorites = this.tasks.filter(t => t.favorite).length;
        const pinned = this.tasks.filter(t => t.pinned).length;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayTasks = this.tasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= today && due < new Date(today.getTime() + 86400000);
        });

        const weekEnd = new Date(today.getTime() + 7 * 86400000);
        const weekTasks = this.tasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= today && due < weekEnd;
        });

        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const monthTasks = this.tasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= today && due <= monthEnd;
        });

        const overdue = this.tasks.filter(t => {
            if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
            const due = new Date(t.dueDate);
            return due < today;
        });

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            pending,
            inProgress,
            archived,
            deleted,
            favorites,
            pinned,
            todayTasks: todayTasks.length,
            weekTasks: weekTasks.length,
            monthTasks: monthTasks.length,
            overdue: overdue.length,
            completionRate
        };
    }

    getTasksByStatus(status) {
        if (status === 'all') return this.tasks;
        return this.tasks.filter(t => t.status === status);
    }

    getTasksByPriority(priority) {
        if (priority === 'all') return this.tasks;
        return this.tasks.filter(t => t.priority === priority);
    }

    getTasksByCategory(category) {
        if (category === 'all') return this.tasks;
        return this.tasks.filter(t => t.category === category);
    }

    searchTasks(query) {
        if (!query || query.trim() === '') return this.tasks;

        const searchTerm = query.toLowerCase().trim();
        return this.tasks.filter(task => {
            const searchableFields = [
                task.title,
                task.description,
                task.category,
                task.priority,
                task.status,
                task.id,
                ...(task.tags || []),
                task.notes,
                ...(task.comments || []).map(c => c.text)
            ].join(' ').toLowerCase();

            return searchableFields.includes(searchTerm);
        });
    }

    sortTasks(tasks, sortOption) {
        const sorted = [...tasks];
        const [field, order] = sortOption.split('-');

        sorted.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (field === 'priority') {
                aVal = PRIORITY_ORDER[aVal] ?? 999;
                bVal = PRIORITY_ORDER[bVal] ?? 999;
            } else if (field === 'status') {
                aVal = STATUS_ORDER[aVal] ?? 999;
                bVal = STATUS_ORDER[bVal] ?? 999;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase() || '';
                bVal = bVal.toLowerCase() || '';
            }

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }

    filterTasks(tasks, filters) {
        return tasks.filter(task => {
            if (filters.status && filters.status !== 'all' && task.status !== filters.status) return false;
            if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) return false;
            if (filters.category && filters.category !== 'all' && task.category !== filters.category) return false;
            if (filters.favorite && !task.favorite) return false;
            if (filters.pinned && !task.pinned) return false;
            if (filters.archived && !task.archived) return false;
            if (filters.deleted && !task.deleted) return false;

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase().trim();
                const searchable = [
                    task.title,
                    task.description,
                    task.category,
                    task.priority,
                    task.status,
                    task.id,
                    ...(task.tags || [])
                ].join(' ').toLowerCase();
                if (!searchable.includes(searchTerm)) return false;
            }

            return true;
        });
    }

    getFilteredAndSortedTasks() {
        let tasks = this.tasks;

        // Apply filters
        tasks = this.filterTasks(tasks, this.filters);

        // Apply search
        if (this.searchTerm) {
            tasks = this.searchTasks(this.searchTerm);
        }

        // Apply sorting
        tasks = this.sortTasks(tasks, this.sortOption);

        // Apply pagination
        const start = (this.pagination.page - 1) * this.pagination.limit;
        const end = start + this.pagination.limit;
        const paginated = tasks.slice(start, end);

        return {
            tasks: paginated,
            total: tasks.length,
            page: this.pagination.page,
            totalPages: Math.ceil(tasks.length / this.pagination.limit)
        };
    }

    exportData(format = 'json') {
        const data = {
            tasks: this.tasks,
            archived: this.archivedTasks,
            deleted: this.deletedTasks,
            categories: this.categories,
            settings: this.settings,
            exportedAt: new Date().toISOString(),
            version: APP_VERSION
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Category', 'DueDate', 'CreatedAt', 'UpdatedAt', 'Progress', 'Favorite', 'Pinned'];
            const rows = this.tasks.map(t => [
                t.id,
                `"${t.title.replace(/"/g, '""')}"`,
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.status,
                t.priority,
                t.category || '',
                t.dueDate || '',
                t.createdAt,
                t.updatedAt,
                t.progress || 0,
                t.favorite ? 'true' : 'false',
                t.pinned ? 'true' : 'false'
            ]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        } else if (format === 'txt') {
            let text = `=== TASKFLOW EXPORT ===\n`;
            text += `Exported: ${new Date().toISOString()}\n`;
            text += `Version: ${APP_VERSION}\n\n`;
            text += `Total Tasks: ${this.tasks.length}\n`;
            text += `Archived: ${this.archivedTasks.length}\n`;
            text += `Deleted: ${this.deletedTasks.length}\n\n`;

            text += `=== TASKS ===\n`;
            this.tasks.forEach((t, i) => {
                text += `\n${i + 1}. ${t.title}\n`;
                text += `   ID: ${t.id}\n`;
                text += `   Status: ${STATUS_LABELS[t.status] || t.status}\n`;
                text += `   Priority: ${t.priority}\n`;
                text += `   Category: ${t.category || 'None'}\n`;
                text += `   Due Date: ${t.dueDate || 'No due date'}\n`;
                text += `   Progress: ${t.progress || 0}%\n`;
                if (t.description) text += `   Description: ${t.description}\n`;
                if (t.tags && t.tags.length) text += `   Tags: ${t.tags.join(', ')}\n`;
            });

            return text;
        }

        return null;
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid data format: tasks array is required');
            }

            // Validate tasks
            data.tasks.forEach(task => {
                if (!task.id || !task.title) {
                    throw new Error('Invalid task: id and title are required');
                }
            });

            // Merge or replace
            const existingIds = new Set(this.tasks.map(t => t.id));
            const newTasks = data.tasks.filter(t => !existingIds.has(t.id));

            this.tasks = [...this.tasks, ...newTasks];

            if (data.categories && Array.isArray(data.categories)) {
                const existingCatIds = new Set(this.categories.map(c => c.id));
                const newCategories = data.categories.filter(c => !existingCatIds.has(c.id));
                this.categories = [...this.categories, ...newCategories];
            }

            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }

            this.addActivity('import', `تم استيراد ${newTasks.length} مهمة`);
            this.addNotification('تم الاستيراد بنجاح', `تم استيراد ${newTasks.length} مهمة`, 'success');
            this.saveToStorage();

            return {
                success: true,
                imported: newTasks.length,
                total: data.tasks.length
            };
        } catch (error) {
            this.addNotification('فشل الاستيراد', error.message, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    createBackup() {
        const backup = {
            version: APP_VERSION,
            createdAt: new Date().toISOString(),
            data: {
                tasks: this.tasks,
                archived: this.archivedTasks,
                deleted: this.deletedTasks,
                categories: this.categories,
                settings: this.settings,
                activityLogs: this.activityLogs.slice(0, 100)
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.lastBackupDate = new Date().toISOString();
        this.addActivity('backup', 'تم إنشاء نسخة احتياطية');
        this.addNotification('تم إنشاء النسخة الاحتياطية', 'تم حفظ النسخة بنجاح', 'success');
        this.saveToStorage();

        return true;
    }

    restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);

                    if (!backup.version || !backup.data) {
                        throw new Error('Invalid backup file format');
                    }

                    const data = backup.data;

                    if (data.tasks && Array.isArray(data.tasks)) {
                        this.tasks = data.tasks;
                    }

                    if (data.archived && Array.isArray(data.archived)) {
                        this.archivedTasks = data.archived;
                    }

                    if (data.deleted && Array.isArray(data.deleted)) {
                        this.deletedTasks = data.deleted;
                    }

                    if (data.categories && Array.isArray(data.categories)) {
                        this.categories = data.categories;
                    }

                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                    }

                    if (data.activityLogs && Array.isArray(data.activityLogs)) {
                        this.activityLogs = data.activityLogs;
                    }

                    this.lastBackupDate = backup.createdAt;
                    this.addActivity('restore', 'تم استعادة نسخة احتياطية');
                    this.addNotification('تم الاستعادة بنجاح', 'تم استعادة النسخة الاحتياطية', 'success');
                    this.saveToStorage();

                    resolve({
                        success: true,
                        message: `تم استعادة النسخة الاحتياطية من ${new Date(backup.createdAt).toLocaleDateString()}`
                    });
                } catch (error) {
                    reject({
                        success: false,
                        error: error.message
                    });
                }
            };
            reader.onerror = () => {
                reject({
                    success: false,
                    error: 'فشل في قراءة الملف'
                });
            };
            reader.readAsText(file);
        });
    }

    pushUndo(action) {
        this.undoStack.push({
            action: action,
            timestamp: new Date().toISOString()
        });
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        return action;
    }
}

// SECTION: APPLICATION INITIALIZATION

let app = new AppState();
let currentConfirmCallback = null;
let currentTaskId = null;

// SECTION: DOM REFERENCES

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const DOM = {
    // App
    app: $('#app'),
    loadingScreen: $('#loadingScreen'),

    // Sidebar
    sidebar: $('#sidebar'),
    sidebarToggle: $('#sidebarToggle'),
    mobileMenuToggle: $('#mobileMenuToggle'),
    navItems: $$('.nav-item'),

    // Views
    viewsContainer: $('#viewsContainer'),
    views: $$('.view'),

    // Top Navbar
    pageTitle: $('#pageTitle'),
    themeToggle: $('#themeToggle'),
    notificationsBtn: $('#notificationsBtn'),
    notificationCount: $('#notificationCount'),
    notificationPanel: $('#notificationPanel'),
    notificationPanelBody: $('#notificationPanelBody'),
    clearAllNotifications: $('#clearAllNotifications'),
    quickActionsBtn: $('#quickActionsBtn'),
    quickActionsPanel: $('#quickActionsPanel'),

    // Search
    globalSearchInput: $('#globalSearchInput'),
    searchResults: $('#searchResults'),

    // Dashboard
    dashboardStats: $('#dashboardStats'),
    statTotal: $('#statTotal'),
    statCompleted: $('#statCompleted'),
    statPending: $('#statPending'),
    statInProgress: $('#statInProgress'),
    statArchived: $('#statArchived'),
    statFavorites: $('#statFavorites'),
    statOverdue: $('#statOverdue'),
    statToday: $('#statToday'),
    progressRing: $('#progressRing'),
    progressPercentage: $('#progressPercentage'),
    completedTasksCount: $('#completedTasksCount'),
    totalTasksCount: $('#totalTasksCount'),
    urgentCount: $('#urgentCount'),
    highCount: $('#highCount'),
    mediumCount: $('#mediumCount'),
    lowCount: $('#lowCount'),
    urgentBar: $('#urgentBar'),
    highBar: $('#highBar'),
    mediumBar: $('#mediumBar'),
    lowBar: $('#lowBar'),
    recentActivities: $('#recentActivities'),

    // Tasks
    tasksContainer: $('#tasksContainer'),
    createTaskBtn: $('#createTaskBtn'),
    filterBtns: $$('.filter-btn'),
    sortSelect: $('#sortSelect'),
    resetFiltersBtn: $('#resetFiltersBtn'),

    // Task Modal
    taskModalOverlay: $('#taskModalOverlay'),
    taskModal: $('#taskModal'),
    taskModalTitle: $('#taskModalTitle'),
    taskModalClose: $('#taskModalClose'),
    taskModalCancel: $('#taskModalCancel'),
    taskModalSave: $('#taskModalSave'),
    taskForm: $('#taskForm'),
    taskId: $('#taskId'),
    taskTitle: $('#taskTitle'),
    taskDescription: $('#taskDescription'),
    taskStatus: $('#taskStatus'),
    taskPriority: $('#taskPriority'),
    taskCategory: $('#taskCategory'),
    taskDueDate: $('#taskDueDate'),
    taskColor: $('#taskColor'),
    taskTags: $('#taskTags'),
    taskNotes: $('#taskNotes'),
    taskEstimatedTime: $('#taskEstimatedTime'),
    taskProgress: $('#taskProgress'),
    taskProgressValue: $('#taskProgressValue'),
    taskFavorite: $('#taskFavorite'),
    taskPinned: $('#taskPinned'),
    taskReminder: $('#taskReminder'),
    taskReminderDate: $('#taskReminderDate'),

    // Confirm Modal
    confirmModalOverlay: $('#confirmModalOverlay'),
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmMessage: $('#confirmMessage'),
    confirmClose: $('#confirmClose'),
    confirmCancel: $('#confirmCancel'),
    confirmOk: $('#confirmOk'),

    // Category Modal
    categoryModalOverlay: $('#categoryModalOverlay'),
    categoryModal: $('#categoryModal'),
    categoryModalTitle: $('#categoryModalTitle'),
    categoryModalClose: $('#categoryModalClose'),
    categoryModalCancel: $('#categoryModalCancel'),
    categoryModalSave: $('#categoryModalSave'),
    categoryForm: $('#categoryForm'),
    categoryId: $('#categoryId'),
    categoryName: $('#categoryName'),
    categoryColor: $('#categoryColor'),

    // Task Details Modal
    taskDetailsModalOverlay: $('#taskDetailsModalOverlay'),
    taskDetailsModal: $('#taskDetailsModal'),
    taskDetailsTitle: $('#taskDetailsTitle'),
    taskDetailsClose: $('#taskDetailsClose'),
    taskDetailsBody: $('#taskDetailsBody'),

    // Today View
    todayTasksContainer: $('#todayTasksContainer'),

    // Upcoming View
    upcomingTasksContainer: $('#upcomingTasksContainer'),

    // Completed View
    completedTasksContainer: $('#completedTasksContainer'),

    // Pending View
    pendingTasksContainer: $('#pendingTasksContainer'),

    // Favorites View
    favoritesTasksContainer: $('#favoritesTasksContainer'),

    // Archived View
    archivedTasksContainer: $('#archivedTasksContainer'),

    // Trash View
    trashTasksContainer: $('#trashTasksContainer'),

    // Categories
    categoriesContainer: $('#categoriesContainer'),
    addCategoryBtn: $('#addCategoryBtn'),

    // Calendar
    calendarGrid: $('#calendarGrid'),
    calendarMonthYear: $('#calendarMonthYear'),
    prevMonth: $('#prevMonth'),
    nextMonth: $('#nextMonth'),
    calendarDayTasks: $('#calendarDayTasks'),

    // Statistics
    statusDistribution: $('#statusDistribution'),
    monthlyChart: $('#monthlyChart'),

    // Reports
    exportJsonBtn: $('#exportJsonBtn'),
    exportCsvBtn: $('#exportCsvBtn'),
    exportTxtBtn: $('#exportTxtBtn'),
    importBtn: $('#importBtn'),
    reportPreview: $('#reportPreview'),

    // Activity Log
    activityLogContainer: $('#activityLogContainer'),

    // Settings
    themeOptions: $$('.theme-option'),
    animationsToggle: $('#animationsToggle'),
    cardSizeSelect: $('#cardSizeSelect'),
    defaultSortSelect: $('#defaultSortSelect'),
    reminderNotifications: $('#reminderNotifications'),
    emailNotifications: $('#emailNotifications'),
    createBackupBtn: $('#createBackupBtn'),
    restoreBackupBtn: $('#restoreBackupBtn'),
    lastBackupDate: $('#lastBackupDate'),

    // Toast
    toastContainer: $('#toastContainer'),

    // Quick Actions
    quickActions: $$('.quick-action'),

    // Logout
    logoutBtn: $('#logoutBtn')
};

// SECTION: UTILITY FUNCTIONS

function generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} يوم`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} أسبوع`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} شهر`;
    return `${Math.floor(diff / 31536000)} سنة`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightMatch(text, query) {
    if (!query || !text) return escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHtml(text).replace(regex, '<span class="result-match">$1</span>');
}

function getPriorityLabel(priority) {
    const labels = {
        urgent: 'عاجل',
        high: 'مرتفعة',
        medium: 'متوسطة',
        low: 'منخفضة'
    };
    return labels[priority] || priority;
}

function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

function getStatusColor(status) {
    return STATUS_COLORS[status] || '#8A8AA8';
}

function getPriorityColor(priority) {
    return PRIORITY_COLORS[priority] || '#8A8AA8';
}

// SECTION: RENDER FUNCTIONS

function renderDashboard() {
    const stats = app.getDashboardStats();

    // Update stats
    DOM.statTotal.textContent = stats.total;
    DOM.statCompleted.textContent = stats.completed;
    DOM.statPending.textContent = stats.pending;
    DOM.statInProgress.textContent = stats.inProgress;
    DOM.statArchived.textContent = stats.archived;
    DOM.statFavorites.textContent = stats.favorites;
    DOM.statOverdue.textContent = stats.overdue;
    DOM.statToday.textContent = stats.todayTasks;

    // Update progress ring
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (stats.completionRate / 100) * circumference;
    DOM.progressRing.style.strokeDashoffset = offset;
    DOM.progressPercentage.textContent = `${stats.completionRate}%`;
    DOM.completedTasksCount.textContent = stats.completed;
    DOM.totalTasksCount.textContent = stats.total;

    // Update priority chart
    const urgent = app.tasks.filter(t => t.priority === 'urgent').length;
    const high = app.tasks.filter(t => t.priority === 'high').length;
    const medium = app.tasks.filter(t => t.priority === 'medium').length;
    const low = app.tasks.filter(t => t.priority === 'low').length;
    const maxPriority = Math.max(urgent, high, medium, low, 1);

    DOM.urgentCount.textContent = urgent;
    DOM.highCount.textContent = high;
    DOM.mediumCount.textContent = medium;
    DOM.lowCount.textContent = low;

    DOM.urgentBar.style.width = `${(urgent / maxPriority) * 100}%`;
    DOM.highBar.style.width = `${(high / maxPriority) * 100}%`;
    DOM.mediumBar.style.width = `${(medium / maxPriority) * 100}%`;
    DOM.lowBar.style.width = `${(low / maxPriority) * 100}%`;

    // Update recent activities
    renderRecentActivities();
}

function renderRecentActivities() {
    const activities = app.activityLogs.slice(0, 10);

    if (activities.length === 0) {
        DOM.recentActivities.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>لا توجد نشاطات حديثة</p>
            </div>
        `;
        return;
    }

    DOM.recentActivities.innerHTML = activities.map(activity => {
        const iconMap = {
            create: 'fa-plus-circle',
            update: 'fa-edit',
            delete: 'fa-trash',
            restore: 'fa-undo',
            archive: 'fa-archive',
            unarchive: 'fa-box-open',
            favorite: 'fa-star',
            pin: 'fa-thumbtack',
            comment: 'fa-comment',
            checklist: 'fa-check-square',
            duplicate: 'fa-copy',
            import: 'fa-file-import',
            export: 'fa-file-export',
            backup: 'fa-database',
            restore: 'fa-undo-alt',
            login: 'fa-sign-in-alt',
            logout: 'fa-sign-out-alt'
        };

        const colorMap = {
            create: 'create',
            update: 'update',
            delete: 'delete',
            restore: 'restore',
            archive: 'archive',
            unarchive: 'archive',
            favorite: 'favorite',
            pin: 'info',
            comment: 'info',
            checklist: 'success',
            duplicate: 'info',
            import: 'success',
            export: 'info',
            backup: 'success',
            login: 'info',
            logout: 'warning'
        };

        const icon = iconMap[activity.type] || 'fa-info-circle';
        const color = colorMap[activity.type] || 'info';

        return `
            <div class="activity-item animate-fade-in">
                <div class="activity-icon ${color}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${escapeHtml(activity.description)}</div>
                </div>
                <div class="activity-time">${timeAgo(activity.timestamp)}</div>
            </div>
        `;
    }).join('');
}

function renderTasks(container, tasks, showCheckbox = true, showActions = true) {
    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>لا توجد مهام</p>
                <div class="empty-sub">قم بإنشاء مهمة جديدة للبدء</div>
            </div>
        `;
        return;
    }

    const cardSize = app.settings.cardSize || 'medium';

    container.innerHTML = tasks.map(task => {
        const isCompleted = task.status === 'completed';
        const progress = task.progress || 0;
        const dueDate = task.dueDate ? formatDate(task.dueDate) : '';

        // Build tags HTML
        const tagsHtml = (task.tags || []).map(tag =>
            `<span class="badge badge-secondary" style="font-size:10px;padding:0 8px;">${escapeHtml(tag)}</span>`
        ).join('');

        // Priority badge
        const priorityBadge = `
            <span class="badge" style="background:${getPriorityColor(task.priority)};color:#fff;">
                ${getPriorityLabel(task.priority)}
            </span>
        `;

        // Status badge
        const statusBadge = `
            <span class="status-badge ${task.status}">${getStatusLabel(task.status)}</span>
        `;

        // Favorite button
        const favBtn = task.favorite ?
            `<button class="favorite-active" data-action="toggle-favorite" title="إزالة من المفضلة"><i class="fas fa-star"></i></button>` :
            `<button data-action="toggle-favorite" title="إضافة للمفضلة"><i class="far fa-star"></i></button>`;

        // Pin button
        const pinBtn = task.pinned ?
            `<button class="favorite-active" data-action="toggle-pin" title="إلغاء التثبيت"><i class="fas fa-thumbtack"></i></button>` :
            `<button data-action="toggle-pin" title="تثبيت"><i class="far fa-thumbtack"></i></button>`;

        // Actions
        const actionsHtml = showActions ? `
            <div class="task-actions">
                ${favBtn}
                ${pinBtn}
                <button data-action="edit" title="تعديل"><i class="fas fa-edit"></i></button>
                <button data-action="duplicate" title="نسخ"><i class="fas fa-copy"></i></button>
                <button data-action="archive" title="أرشفة"><i class="fas fa-archive"></i></button>
                <button class="danger" data-action="delete" title="حذف"><i class="fas fa-trash"></i></button>
            </div>
        ` : '';

        const checkboxHtml = showCheckbox ? `
            <div class="task-checkbox">
                <input type="checkbox" data-action="select-task" data-id="${task.id}" ${app.selectedTasks.has(task.id) ? 'checked' : ''}>
            </div>
        ` : '';

        return `
            <div class="task-card priority-${task.priority} size-${cardSize}" data-id="${task.id}" draggable="true">
                ${checkboxHtml}
                <div class="task-content">
                    <div class="task-header">
                        <div style="flex:1;min-width:0;">
                            <div class="task-title ${isCompleted ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        </div>
                        ${actionsHtml}
                    </div>
                    <div class="task-meta">
                        <span class="meta-item">
                            <i class="fas fa-tag"></i>
                            ${priorityBadge}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-circle" style="color:${task.color || '#6C63FF'};"></i>
                            ${escapeHtml(task.category || 'بدون تصنيف')}
                        </span>
                        ${dueDate ? `<span class="meta-item"><i class="far fa-calendar-alt"></i> ${dueDate}</span>` : ''}
                        <span class="meta-item">${statusBadge}</span>
                        ${tagsHtml}
                    </div>
                    <div class="task-progress">
                        <div class="progress-track">
                            <div class="progress-fill" style="width:${progress}%;"></div>
                        </div>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to task cards
    container.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.dataset.id;

        // Click to open details
        card.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            openTaskDetails(taskId);
        });

        // Drag events
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', taskId);
            card.style.opacity = '0.5';
        });

        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
        });

        // Action buttons
        card.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                handleTaskAction(action, taskId);
            });
        });

        // Checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    app.selectedTasks.add(taskId);
                } else {
                    app.selectedTasks.delete(taskId);
                }
                updateSelectedTasksUI();
            });
        }
    });
}

function renderAllTasks() {
    const result = app.getFilteredAndSortedTasks();
    renderTasks(DOM.tasksContainer, result.tasks);
    updateTaskCounts();
}

function renderTodayTasks() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tasks = app.tasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr) && t.status !== 'completed');
    renderTasks(DOM.todayTasksContainer, tasks);
}

function renderUpcomingTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = app.tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const due = new Date(t.dueDate);
        return due >= tomorrow && due <= nextWeek;
    });

    renderTasks(DOM.upcomingTasksContainer, tasks);
}

function renderCompletedTasks() {
    const tasks = app.tasks.filter(t => t.status === 'completed');
    renderTasks(DOM.completedTasksContainer, tasks);
}

function renderPendingTasks() {
    const tasks = app.tasks.filter(t => t.status === 'pending');
    renderTasks(DOM.pendingTasksContainer, tasks);
}

function renderFavoritesTasks() {
    const tasks = app.tasks.filter(t => t.favorite);
    renderTasks(DOM.favoritesTasksContainer, tasks);
}

function renderArchivedTasks() {
    renderTasks(DOM.archivedTasksContainer, app.archivedTasks);
}

function renderTrashTasks() {
    renderTasks(DOM.trashTasksContainer, app.deletedTasks);
}

function renderCategories() {
    if (!DOM.categoriesContainer) return;

    const categories = app.categories;

    if (categories.length === 0) {
        DOM.categoriesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <p>لا توجد تصنيفات</p>
                <div class="empty-sub">أضف تصنيفاً جديداً للبدء</div>
            </div>
        `;
        return;
    }

    DOM.categoriesContainer.innerHTML = categories.map(cat => {
        const taskCount = app.tasks.filter(t => t.category === cat.id).length;

        return `
            <div class="category-card" data-id="${cat.id}">
                <div class="category-color" style="background:${cat.color};"></div>
                <div class="category-info">
                    <div class="category-name">${escapeHtml(cat.name)}</div>
                    <div class="category-count">${taskCount} مهمة</div>
                </div>
                <div class="category-actions">
                    <button data-action="edit-category" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="danger" data-action="delete-category" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    DOM.categoriesContainer.querySelectorAll('.category-card').forEach(card => {
        const catId = card.dataset.id;

        card.querySelector('[data-action="edit-category"]').addEventListener('click', (e) => {
            e.stopPropagation();
            openCategoryModal(catId);
        });

        card.querySelector('[data-action="delete-category"]').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(catId);
        });
    });
}

function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, but we use Monday as first

    // Adjust for Monday first (in RTL we use Sunday as first)
    const startOffset = (startingDay + 6) % 7;

    // Month name in Arabic
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    DOM.calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

    // Day names
    const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    let html = '';
    // Day name headers
    dayNames.forEach(name => {
        html += `<div class="day-name">${name}</div>`;
    });

    // Empty cells for start offset
    for (let i = 0; i < startOffset; i++) {
        html += `<div class="day-cell other-month"></div>`;
    }

    // Days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;

        // Check if this day has tasks
        const hasTasks = app.tasks.some(t => t.dueDate && t.dueDate.startsWith(dateStr));

        html += `
            <div class="day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
                ${day}
                ${hasTasks ? '<div class="day-dot"></div>' : ''}
            </div>
        `;
    }

    DOM.calendarGrid.innerHTML = html;

    // Add click events to days
    DOM.calendarGrid.querySelectorAll('.day-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            renderCalendarDayTasks(date);

            // Highlight selected
            DOM.calendarGrid.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        });
    });

    // Auto-select today
    const todayCell = DOM.calendarGrid.querySelector('.day-cell.today');
    if (todayCell) {
        todayCell.click();
    }
}

function renderCalendarDayTasks(dateStr) {
    const tasks = app.tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));

    if (tasks.length === 0) {
        DOM.calendarDayTasks.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-day"></i>
                <p>لا توجد مهام في هذا اليوم</p>
            </div>
        `;
        return;
    }

    DOM.calendarDayTasks.innerHTML = tasks.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-dot" style="background:${task.color || '#6C63FF'};"></div>
            <span class="task-title">${escapeHtml(task.title)}</span>
            <span class="badge" style="background:${getPriorityColor(task.priority)};color:#fff;font-size:10px;">
                ${getPriorityLabel(task.priority)}
            </span>
        </div>
    `).join('');

    // Click to open task details
    DOM.calendarDayTasks.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', () => {
            openTaskDetails(item.dataset.id);
        });
    });
}

function renderStatistics() {
    const stats = app.getDashboardStats();

    // Status distribution
    const statuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'];
    const statusCounts = statuses.map(status => ({
        label: getStatusLabel(status),
        count: app.tasks.filter(t => t.status === status).length,
        color: getStatusColor(status)
    }));

    const maxCount = Math.max(...statusCounts.map(s => s.count), 1);

    DOM.statusDistribution.innerHTML = statusCounts.map(s => `
        <div class="status-item animate-fade-in">
            <span class="status-label">${s.label}</span>
            <div class="status-bar">
                <div class="status-fill" style="width:${(s.count / maxCount) * 100}%;background:${s.color};"></div>
            </div>
            <span class="status-count">${s.count}</span>
        </div>
    `).join('');

    // Monthly chart (simple bar chart using canvas)
    renderMonthlyChart();
}

function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    // Get last 6 months data
    const months = [];
    const counts = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        const count = app.tasks.filter(t => {
            if (!t.createdAt) return false;
            return t.createdAt.startsWith(monthStr);
        }).length;

        months.push(date.toLocaleDateString('ar-EG', { month: 'short' }));
        counts.push(count);
    }

    const maxCount = Math.max(...counts, 1);
    const barWidth = (width - padding * 2) / months.length * 0.6;
    const gap = (width - padding * 2) / months.length * 0.4;

    // Draw grid lines
    ctx.strokeStyle = 'var(--border-color, #E8ECF4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (height - padding * 2) * (1 - i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.fillStyle = 'var(--text-tertiary, #8A8AA8)';
        ctx.font = '10px Cairo';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxCount * i / 4), padding - 8, y + 4);
    }

    // Draw bars
    months.forEach((month, index) => {
        const x = padding + index * (barWidth + gap) + gap / 2;
        const barHeight = (counts[index] / maxCount) * (height - padding * 2);
        const y = height - padding - barHeight;

        // Gradient bar
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, 'var(--primary, #6C63FF)');
        gradient.addColorStop(1, 'var(--primary-light, #8B83FF)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(108, 99, 255, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        const radius = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Bar label
        ctx.fillStyle = 'var(--text-secondary, #4A4A6A)';
        ctx.font = '11px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(month, x + barWidth / 2, height - padding + 16);

        // Count on top
        ctx.fillStyle = 'var(--text-primary, #1A1A2E)';
        ctx.font = '11px Cairo';
        ctx.fillText(counts[index], x + barWidth / 2, y - 6);
    });
}

function renderActivityLog() {
    const logs = app.activityLogs.slice(0, 100);

    if (logs.length === 0) {
        DOM.activityLogContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>لا توجد سجلات نشاط</p>
            </div>
        `;
        return;
    }

    DOM.activityLogContainer.innerHTML = logs.map(log => {
        const iconMap = {
            create: 'fa-plus-circle',
            update: 'fa-edit',
            delete: 'fa-trash',
            restore: 'fa-undo',
            archive: 'fa-archive',
            unarchive: 'fa-box-open',
            favorite: 'fa-star',
            pin: 'fa-thumbtack',
            comment: 'fa-comment',
            checklist: 'fa-check-square',
            duplicate: 'fa-copy',
            import: 'fa-file-import',
            export: 'fa-file-export',
            backup: 'fa-database',
            restore: 'fa-undo-alt',
            login: 'fa-sign-in-alt',
            logout: 'fa-sign-out-alt'
        };

        const colorMap = {
            create: 'success',
            update: 'info',
            delete: 'danger',
            restore: 'warning',
            archive: 'secondary',
            unarchive: 'info',
            favorite: 'warning',
            pin: 'info',
            comment: 'info',
            checklist: 'success',
            duplicate: 'info',
            import: 'success',
            export: 'info',
            backup: 'success',
            login: 'info',
            logout: 'warning'
        };

        const icon = iconMap[log.type] || 'fa-info-circle';
        const color = colorMap[log.type] || 'info';

        return `
            <div class="log-item animate-fade-in">
                <div class="log-icon" style="background:var(--${color}-light, rgba(108,99,255,0.12));color:var(--${color}, #6C63FF);">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="log-content">
                    <div class="log-text">${escapeHtml(log.description)}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">
                        ${escapeHtml(log.user || 'مستخدم')} • ${timeAgo(log.timestamp)}
                    </div>
                </div>
                <div class="log-time">${formatDateTime(log.timestamp)}</div>
            </div>
        `;
    }).join('');
}

function renderTaskDetails(taskId) {
    const task = app.getTaskById(taskId);
    if (!task) {
        DOM.taskDetailsBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>المهمة غير موجودة</p>
            </div>
        `;
        return;
    }

    const commentsHtml = (task.comments || []).map(comment => `
        <div class="log-item animate-fade-in">
            <div class="log-icon" style="background:rgba(77,171,247,0.12);color:var(--info);">
                <i class="fas fa-comment"></i>
            </div>
            <div class="log-content">
                <div class="log-text">${escapeHtml(comment.text)}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">
                    ${escapeHtml(comment.author || 'مستخدم')} • ${timeAgo(comment.createdAt)}
                </div>
            </div>
            <div class="log-time">${formatDateTime(comment.createdAt)}</div>
        </div>
    `).join('') || '<div style="color:var(--text-tertiary);font-size:13px;">لا توجد تعليقات</div>';

    const checklistHtml = (task.checklist || []).map(item => `
        <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--border-color);">
            <input type="checkbox" ${item.completed ? 'checked' : ''} data-action="toggle-checklist" data-item-id="${item.id}" style="width:18px;height:18px;accent-color:var(--primary);">
            <span style="${item.completed ? 'text-decoration:line-through;color:var(--text-tertiary);' : ''}">${escapeHtml(item.text)}</span>
        </div>
    `).join('') || '<div style="color:var(--text-tertiary);font-size:13px;">لا توجد عناصر في قائمة المراجعة</div>';

    const tagsHtml = (task.tags || []).map(tag =>
        `<span class="badge badge-secondary">${escapeHtml(tag)}</span>`
    ).join('');

    DOM.taskDetailsBody.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">العنوان</div>
                <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${escapeHtml(task.title)}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">المعرف</div>
                <div style="font-size:14px;color:var(--text-secondary);font-family:monospace;">${task.id}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">الحالة</div>
                <span class="status-badge ${task.status}">${getStatusLabel(task.status)}</span>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">الأولوية</div>
                <span class="badge" style="background:${getPriorityColor(task.priority)};color:#fff;">${getPriorityLabel(task.priority)}</span>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">التصنيف</div>
                <div><i class="fas fa-circle" style="color:${task.color || '#6C63FF'};font-size:12px;"></i> ${escapeHtml(task.category || 'بدون تصنيف')}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">التاريخ المستحق</div>
                <div>${task.dueDate ? formatDate(task.dueDate) : 'غير محدد'}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">التقدم</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${task.progress || 0}%;background:var(--primary-gradient);border-radius:3px;transition:width 0.6s;"></div>
                    </div>
                    <span style="font-size:14px;font-weight:700;">${task.progress || 0}%</span>
                </div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">الوقت المقدر</div>
                <div>${task.estimatedTime || 0} ساعة</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">تاريخ الإنشاء</div>
                <div>${formatDateTime(task.createdAt)}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">آخر تحديث</div>
                <div>${formatDateTime(task.updatedAt)}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">مفضلة</div>
                <div>${task.favorite ? '✅ نعم' : '❌ لا'}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--text-tertiary);">مثبتة</div>
                <div>${task.pinned ? '✅ نعم' : '❌ لا'}</div>
            </div>
        </div>

        ${task.description ? `
            <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-tertiary);">الوصف</div>
                <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;font-size:14px;color:var(--text-secondary);">${escapeHtml(task.description)}</div>
            </div>
        ` : ''}

        ${tagsHtml ? `
            <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-tertiary);">الوسوم</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">${tagsHtml}</div>
            </div>
        ` : ''}

        ${task.notes ? `
            <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-tertiary);">الملاحظات</div>
                <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;font-size:14px;color:var(--text-secondary);">${escapeHtml(task.notes)}</div>
            </div>
        ` : ''}

        <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:12px;color:var(--text-tertiary);">قائمة المراجعة</div>
                <div style="display:flex;gap:4px;">
                    <input type="text" id="newChecklistInput" placeholder="أضف عنصر..." style="padding:4px 8px;border:2px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);">
                    <button class="btn btn-sm btn-primary" id="addChecklistBtn">إضافة</button>
                </div>
            </div>
            <div id="checklistContainer">${checklistHtml}</div>
        </div>

        <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:12px;color:var(--text-tertiary);">التعليقات</div>
                <div style="display:flex;gap:4px;">
                    <input type="text" id="newCommentInput" placeholder="أضف تعليق..." style="padding:4px 8px;border:2px solid var(--border-color);border-radius:6px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);flex:1;">
                    <button class="btn btn-sm btn-primary" id="addCommentBtn">إضافة</button>
                </div>
            </div>
            <div id="commentsContainer">${commentsHtml}</div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
            <button class="btn btn-sm btn-secondary" data-action="edit-task">تعديل</button>
            <button class="btn btn-sm btn-secondary" data-action="duplicate-task">نسخ</button>
            <button class="btn btn-sm btn-secondary" data-action="toggle-favorite-task">${task.favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}</button>
            <button class="btn btn-sm btn-secondary" data-action="toggle-pin-task">${task.pinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>
            <button class="btn btn-sm btn-secondary" data-action="archive-task">أرشفة</button>
            <button class="btn btn-sm btn-danger" data-action="delete-task">حذف</button>
        </div>
    `;

    // Add event listeners for task details actions
    const detailsBody = DOM.taskDetailsBody;

    // Checklist
    const addChecklistBtn = detailsBody.querySelector('#addChecklistBtn');
    const newChecklistInput = detailsBody.querySelector('#newChecklistInput');

    if (addChecklistBtn && newChecklistInput) {
        addChecklistBtn.addEventListener('click', () => {
            const text = newChecklistInput.value.trim();
            if (text) {
                app.addChecklistItem(taskId, text);
                newChecklistInput.value = '';
                openTaskDetails(taskId); // Refresh
                updateAllViews();
            }
        });

        newChecklistInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addChecklistBtn.click();
            }
        });
    }

    // Checklist toggle
    detailsBody.querySelectorAll('[data-action="toggle-checklist"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const itemId = e.target.dataset.itemId;
            app.toggleChecklistItem(taskId, itemId);
            openTaskDetails(taskId); // Refresh
            updateAllViews();
        });
    });

    // Comments
    const addCommentBtn = detailsBody.querySelector('#addCommentBtn');
    const newCommentInput = detailsBody.querySelector('#newCommentInput');

    if (addCommentBtn && newCommentInput) {
        addCommentBtn.addEventListener('click', () => {
            const text = newCommentInput.value.trim();
            if (text) {
                app.addComment(taskId, text);
                newCommentInput.value = '';
                openTaskDetails(taskId); // Refresh
                updateAllViews();
            }
        });

        newCommentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addCommentBtn.click();
            }
        });
    }

    // Action buttons
    detailsBody.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;

            switch (action) {
                case 'edit-task':
                    DOM.taskDetailsModalOverlay.classList.remove('active');
                    openEditTask(taskId);
                    break;
                case 'duplicate-task':
                    app.duplicateTask(taskId);
                    DOM.taskDetailsModalOverlay.classList.remove('active');
                    updateAllViews();
                    app.showToast('تم النسخ', 'تم نسخ المهمة بنجاح', 'success');
                    break;
                case 'toggle-favorite-task':
                    app.toggleFavorite(taskId);
                    openTaskDetails(taskId);
                    updateAllViews();
                    break;
                case 'toggle-pin-task':
                    app.togglePin(taskId);
                    openTaskDetails(taskId);
                    updateAllViews();
                    break;
                case 'archive-task':
                    if (confirm('هل تريد أرشفة هذه المهمة؟')) {
                        app.archiveTask(taskId);
                        DOM.taskDetailsModalOverlay.classList.remove('active');
                        updateAllViews();
                        app.showToast('تم الأرشفة', 'تم أرشفة المهمة بنجاح', 'info');
                    }
                    break;
                case 'delete-task':
                    if (confirm('هل تريد حذف هذه المهمة؟')) {
                        app.deleteTask(taskId);
                        DOM.taskDetailsModalOverlay.classList.remove('active');
                        updateAllViews();
                        app.showToast('تم الحذف', 'تم حذف المهمة بنجاح', 'warning');
                    }
                    break;
            }
        });
    });
}

// SECTION: VIEW MANAGEMENT

function switchView(viewName) {
    // Hide all views
    DOM.views.forEach(view => view.classList.remove('active'));

    // Show target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Update nav items
    DOM.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'لوحة التحكم',
        tasks: 'جميع المهام',
        today: 'مهام اليوم',
        upcoming: 'المهام القادمة',
        completed: 'المهام المكتملة',
        pending: 'المهام المعلقة',
        favorites: 'المفضلة',
        archived: 'المؤرشفة',
        trash: 'سلة المحذوفات',
        categories: 'التصنيفات',
        calendar: 'التقويم',
        statistics: 'الإحصائيات',
        reports: 'التقارير',
        activity: 'سجل النشاط',
        settings: 'الإعدادات',
        help: 'مركز المساعدة',
        about: 'عن النظام'
    };

    DOM.pageTitle.textContent = titles[viewName] || viewName;

    // Update app state
    app.currentView = viewName;
    app.saveToStorage();

    // Render view content
    switch (viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'tasks':
            renderAllTasks();
            break;
        case 'today':
            renderTodayTasks();
            break;
        case 'upcoming':
            renderUpcomingTasks();
            break;
        case 'completed':
            renderCompletedTasks();
            break;
        case 'pending':
            renderPendingTasks();
            break;
        case 'favorites':
            renderFavoritesTasks();
            break;
        case 'archived':
            renderArchivedTasks();
            break;
        case 'trash':
            renderTrashTasks();
            break;
        case 'categories':
            renderCategories();
            break;
        case 'calendar':
            const now = new Date();
            renderCalendar(now.getFullYear(), now.getMonth());
            break;
        case 'statistics':
            renderStatistics();
            break;
        case 'activity':
            renderActivityLog();
            break;
        case 'settings':
            renderSettings();
            break;
    }

    // Close mobile sidebar
    DOM.sidebar.classList.remove('mobile-open');
}

function updateAllViews() {
    const currentView = app.currentView;
    switch (currentView) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'tasks':
            renderAllTasks();
            break;
        case 'today':
            renderTodayTasks();
            break;
        case 'upcoming':
            renderUpcomingTasks();
            break;
        case 'completed':
            renderCompletedTasks();
            break;
        case 'pending':
            renderPendingTasks();
            break;
        case 'favorites':
            renderFavoritesTasks();
            break;
        case 'archived':
            renderArchivedTasks();
            break;
        case 'trash':
            renderTrashTasks();
            break;
        case 'categories':
            renderCategories();
            break;
        case 'statistics':
            renderStatistics();
            break;
        case 'activity':
            renderActivityLog();
            break;
    }

    updateTaskCounts();
    renderRecentActivities();
}

function updateTaskCounts() {
    const total = app.tasks.length;
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = app.tasks.filter(t => t.dueDate && t.dueDate.startsWith(today) && t.status !== 'completed').length;
    const completed = app.tasks.filter(t => t.status === 'completed').length;
    const pending = app.tasks.filter(t => t.status === 'pending').length;
    const favorites = app.tasks.filter(t => t.favorite).length;
    const archived = app.archivedTasks.length;
    const deleted = app.deletedTasks.length;

    const taskCountEl = document.querySelector('.nav-item[data-view="tasks"] .task-count');
    if (taskCountEl) taskCountEl.textContent = total;

    const todayCountEl = document.querySelector('.nav-item[data-view="today"] .today-count');
    if (todayCountEl) todayCountEl.textContent = todayTasks;

    const completedCountEl = document.querySelector('.nav-item[data-view="completed"] .completed-count');
    if (completedCountEl) completedCountEl.textContent = completed;

    const pendingCountEl = document.querySelector('.nav-item[data-view="pending"] .pending-count');
    if (pendingCountEl) pendingCountEl.textContent = pending;

    const favoriteCountEl = document.querySelector('.nav-item[data-view="favorites"] .favorite-count');
    if (favoriteCountEl) favoriteCountEl.textContent = favorites;

    const archivedCountEl = document.querySelector('.nav-item[data-view="archived"] .archived-count');
    if (archivedCountEl) archivedCountEl.textContent = archived;

    const trashCountEl = document.querySelector('.nav-item[data-view="trash"] .trash-count');
    if (trashCountEl) trashCountEl.textContent = deleted;
}

function updateSelectedTasksUI() {
    const count = app.selectedTasks.size;
    // Could show a toolbar with bulk actions
    if (count > 0) {
        // Show bulk actions toolbar if needed
    }
}

// =========================================
// SECTION: MODAL FUNCTIONS
// =========================================

function openTaskModal(taskId = null) {
    const isEdit = taskId !== null;
    const task = taskId ? app.getTaskById(taskId) : null;

    DOM.taskModalTitle.textContent = isEdit ? 'تعديل المهمة' : 'مهمة جديدة';
    DOM.taskId.value = taskId || '';

    // Populate categories
    const categorySelect = DOM.taskCategory;
    categorySelect.innerHTML = `
        <option value="">بدون تصنيف</option>
        ${app.categories.map(cat =>
            `<option value="${cat.id}" style="color:${cat.color};">${escapeHtml(cat.name)}</option>`
        ).join('')}
    `;

    if (isEdit && task) {
        DOM.taskTitle.value = task.title || '';
        DOM.taskDescription.value = task.description || '';
        DOM.taskStatus.value = task.status || 'pending';
        DOM.taskPriority.value = task.priority || 'medium';
        DOM.taskCategory.value = task.category || '';
        DOM.taskDueDate.value = task.dueDate || '';
        DOM.taskColor.value = task.color || '#6C63FF';
        DOM.taskTags.value = (task.tags || []).join(', ');
        DOM.taskNotes.value = task.notes || '';
        DOM.taskEstimatedTime.value = task.estimatedTime || 0;
        DOM.taskProgress.value = task.progress || 0;
        DOM.taskProgressValue.textContent = `${task.progress || 0}%`;
        DOM.taskFavorite.checked = task.favorite || false;
        DOM.taskPinned.checked = task.pinned || false;
        DOM.taskReminder.checked = !!task.reminder;
        DOM.taskReminderDate.value = task.reminder || '';
        DOM.taskReminderDate.style.display = task.reminder ? 'block' : 'none';
    } else {
        DOM.taskForm.reset();
        DOM.taskTitle.value = '';
        DOM.taskDescription.value = '';
        DOM.taskStatus.value = 'pending';
        DOM.taskPriority.value = 'medium';
        DOM.taskCategory.value = '';
        DOM.taskDueDate.value = '';
        DOM.taskColor.value = '#6C63FF';
        DOM.taskTags.value = '';
        DOM.taskNotes.value = '';
        DOM.taskEstimatedTime.value = '';
        DOM.taskProgress.value = 0;
        DOM.taskProgressValue.textContent = '0%';
        DOM.taskFavorite.checked = false;
        DOM.taskPinned.checked = false;
        DOM.taskReminder.checked = false;
        DOM.taskReminderDate.value = '';
        DOM.taskReminderDate.style.display = 'none';
    }

    DOM.taskModalOverlay.classList.add('active');
    DOM.taskTitle.focus();
}

function closeTaskModal() {
    DOM.taskModalOverlay.classList.remove('active');
}

function saveTask() {
    const taskId = DOM.taskId.value;
    const title = DOM.taskTitle.value.trim();
    const description = DOM.taskDescription.value.trim();
    const status = DOM.taskStatus.value;
    const priority = DOM.taskPriority.value;
    const category = DOM.taskCategory.value;
    const dueDate = DOM.taskDueDate.value;
    const color = DOM.taskColor.value;
    const tags = DOM.taskTags.value.split(',').map(t => t.trim()).filter(t => t);
    const notes = DOM.taskNotes.value.trim();
    const estimatedTime = parseFloat(DOM.taskEstimatedTime.value) || 0;
    const progress = parseInt(DOM.taskProgress.value) || 0;
    const favorite = DOM.taskFavorite.checked;
    const pinned = DOM.taskPinned.checked;
    const reminder = DOM.taskReminder.checked ? DOM.taskReminderDate.value : null;

    // Validation
    if (!title) {
        app.showToast('خطأ', 'الرجاء إدخال عنوان المهمة', 'error');
        DOM.taskTitle.focus();
        return;
    }

    const taskData = {
        title,
        description,
        status,
        priority,
        category,
        dueDate,
        color,
        tags,
        notes,
        estimatedTime,
        progress,
        favorite,
        pinned,
        reminder
    };

    if (taskId) {
        // Update existing task
        app.updateTask(taskId, taskData);
        app.showToast('تم التحديث', 'تم تحديث المهمة بنجاح', 'success');
    } else {
        // Create new task
        const newTask = app.createTaskObject(taskData);
        app.addTask(newTask);
        app.showToast('تم الإنشاء', 'تم إنشاء المهمة بنجاح', 'success');
    }

    closeTaskModal();
    updateAllViews();
}

function openCategoryModal(categoryId = null) {
    const isEdit = categoryId !== null;
    const category = categoryId ? app.categories.find(c => c.id === categoryId) : null;

    DOM.categoryModalTitle.textContent = isEdit ? 'تعديل التصنيف' : 'تصنيف جديد';
    DOM.categoryId.value = categoryId || '';

    if (isEdit && category) {
        DOM.categoryName.value = category.name || '';
        DOM.categoryColor.value = category.color || '#6C63FF';
    } else {
        DOM.categoryForm.reset();
        DOM.categoryName.value = '';
        DOM.categoryColor.value = '#6C63FF';
    }

    DOM.categoryModalOverlay.classList.add('active');
    DOM.categoryName.focus();
}

function closeCategoryModal() {
    DOM.categoryModalOverlay.classList.remove('active');
}

function saveCategory() {
    const categoryId = DOM.categoryId.value;
    const name = DOM.categoryName.value.trim();
    const color = DOM.categoryColor.value;

    if (!name) {
        app.showToast('خطأ', 'الرجاء إدخال اسم التصنيف', 'error');
        DOM.categoryName.focus();
        return;
    }

    if (categoryId) {
        // Update existing category
        const index = app.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            app.categories[index] = { ...app.categories[index], name, color };
            app.saveToStorage();
            app.showToast('تم التحديث', 'تم تحديث التصنيف بنجاح', 'success');
        }
    } else {
        // Create new category
        const newCategory = {
            id: `cat_${Date.now()}`,
            name,
            color
        };
        app.categories.push(newCategory);
        app.saveToStorage();
        app.showToast('تم الإنشاء', 'تم إنشاء التصنيف بنجاح', 'success');
    }

    closeCategoryModal();
    renderCategories();
    updateAllViews();
}

function deleteCategory(categoryId) {
    showConfirmModal(
        'حذف التصنيف',
        'هل أنت متأكد من حذف هذا التصنيف؟ سيتم إزالة التصنيف من جميع المهام.',
        () => {
            app.categories = app.categories.filter(c => c.id !== categoryId);
            // Remove category from tasks
            app.tasks.forEach(t => {
                if (t.category === categoryId) {
                    t.category = '';
                }
            });
            app.saveToStorage();
            renderCategories();
            updateAllViews();
            app.showToast('تم الحذف', 'تم حذف التصنيف بنجاح', 'warning');
        }
    );
}

function openTaskDetails(taskId) {
    DOM.taskDetailsTitle.textContent = 'تفاصيل المهمة';
    renderTaskDetails(taskId);
    DOM.taskDetailsModalOverlay.classList.add('active');
}

function closeTaskDetails() {
    DOM.taskDetailsModalOverlay.classList.remove('active');
}

function openEditTask(taskId) {
    closeTaskModal();
    openTaskModal(taskId);
}

function showConfirmModal(title, message, callback) {
    DOM.confirmTitle.textContent = title;
    DOM.confirmMessage.textContent = message;
    currentConfirmCallback = callback;
    DOM.confirmModalOverlay.classList.add('active');
}

function closeConfirmModal() {
    DOM.confirmModalOverlay.classList.remove('active');
    currentConfirmCallback = null;
}

// SECTION: HANDLE TASK ACTIONS

function handleTaskAction(action, taskId) {
    switch (action) {
        case 'edit':
            openEditTask(taskId);
            break;

        case 'delete':
            showConfirmModal(
                'حذف المهمة',
                'هل أنت متأكد من حذف هذه المهمة؟ سيتم نقلها إلى سلة المحذوفات.',
                () => {
                    app.deleteTask(taskId);
                    updateAllViews();
                    app.showToast('تم الحذف', 'تم نقل المهمة إلى سلة المحذوفات', 'warning');
                }
            );
            break;

        case 'archive':
            showConfirmModal(
                'أرشفة المهمة',
                'هل تريد أرشفة هذه المهمة؟',
                () => {
                    app.archiveTask(taskId);
                    updateAllViews();
                    app.showToast('تم الأرشفة', 'تم أرشفة المهمة بنجاح', 'info');
                }
            );
            break;

        case 'restore':
            app.restoreTask(taskId);
            updateAllViews();
            app.showToast('تم الاستعادة', 'تم استعادة المهمة بنجاح', 'success');
            break;

        case 'delete-forever':
            showConfirmModal(
                'حذف نهائي',
                'هل أنت متأكد من حذف هذه المهمة نهائياً؟ لا يمكن استعادتها.',
                () => {
                    app.deletedTasks = app.deletedTasks.filter(t => t.id !== taskId);
                    app.saveToStorage();
                    updateAllViews();
                    app.showToast('تم الحذف النهائي', 'تم حذف المهمة نهائياً', 'error');
                }
            );
            break;

        case 'toggle-favorite':
            app.toggleFavorite(taskId);
            updateAllViews();
            break;

        case 'toggle-pin':
            app.togglePin(taskId);
            updateAllViews();
            break;

        case 'duplicate':
            app.duplicateTask(taskId);
            updateAllViews();
            app.showToast('تم النسخ', 'تم نسخ المهمة بنجاح', 'success');
            break;

        case 'select-task':
            // Handled by checkbox change event
            break;
    }
}

// SECTION: SETTINGS RENDER

function renderSettings() {
    // Theme
    DOM.themeOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.theme === app.theme);
    });

    // Animations
    DOM.animationsToggle.checked = app.settings.animations !== false;

    // Card size
    DOM.cardSizeSelect.value = app.settings.cardSize || 'medium';

    // Default sort
    DOM.defaultSortSelect.value = app.settings.defaultSort || 'createdAt-desc';

    // Notifications
    DOM.reminderNotifications.checked = app.settings.reminderNotifications !== false;
    DOM.emailNotifications.checked = app.settings.emailNotifications || false;

    // Last backup
    DOM.lastBackupDate.textContent = app.lastBackupDate ? formatDateTime(app.lastBackupDate) : 'غير موجود';
}

function saveSettings() {
    app.settings.theme = app.theme;
    app.settings.animations = DOM.animationsToggle.checked;
    app.settings.cardSize = DOM.cardSizeSelect.value;
    app.settings.defaultSort = DOM.defaultSortSelect.value;
    app.settings.reminderNotifications = DOM.reminderNotifications.checked;
    app.settings.emailNotifications = DOM.emailNotifications.checked;

    app.saveToStorage();
    app.showToast('تم الحفظ', 'تم حفظ الإعدادات بنجاح', 'success');
}

// SECTION: THEME MANAGEMENT

function toggleTheme() {
    const newTheme = app.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    app.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));

    const icon = DOM.themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';

    app.saveToStorage();

    // Update theme options in settings
    DOM.themeOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.theme === theme);
    });
}

// SECTION: SEARCH FUNCTIONALITY

const debouncedSearch = debounce((query) => {
    performSearch(query);
}, 300);

function performSearch(query) {
    app.searchTerm = query.trim();

    if (!app.searchTerm) {
        DOM.searchResults.classList.remove('active');
        return;
    }

    const results = app.searchTasks(app.searchTerm);
    const filtered = results.slice(0, 10);

    if (filtered.length === 0) {
        DOM.searchResults.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>لا توجد نتائج مطابقة لـ "${escapeHtml(app.searchTerm)}"</p>
            </div>
        `;
        DOM.searchResults.classList.add('active');
        return;
    }

    DOM.searchResults.innerHTML = filtered.map(task => `
        <div class="search-result-item" data-id="${task.id}">
            <div class="result-icon" style="background:${task.color || '#6C63FF'}20;color:${task.color || '#6C63FF'};">
                <i class="fas fa-tasks"></i>
            </div>
            <div class="result-info">
                <div class="result-title">${highlightMatch(task.title, app.searchTerm)}</div>
                <div class="result-subtitle">
                    ${task.category || 'بدون تصنيف'} • ${getStatusLabel(task.status)}
                </div>
            </div>
        </div>
    `).join('');

    DOM.searchResults.classList.add('active');

    // Add click events
    DOM.searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const taskId = item.dataset.id;
            DOM.searchResults.classList.remove('active');
            DOM.globalSearchInput.value = '';
            app.searchTerm = '';
            openTaskDetails(taskId);
        });
    });
}

// SECTION: NOTIFICATIONS PANEL

function toggleNotifications() {
    DOM.notificationPanel.classList.toggle('active');
    if (DOM.notificationPanel.classList.contains('active')) {
        renderNotifications();
        app.markAllNotificationsRead();
    }
}

function renderNotifications() {
    const notifications = app.notifications.slice(0, 50);

    if (notifications.length === 0) {
        DOM.notificationPanelBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد إشعارات</p>
            </div>
        `;
        return;
    }

    DOM.notificationPanelBody.innerHTML = notifications.map(notif => {
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        return `
            <div class="notification-item" data-id="${notif.id}">
                <div class="notif-icon ${notif.type}">
                    <i class="fas ${iconMap[notif.type] || iconMap.info}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${escapeHtml(notif.title)}</div>
                    <div class="notif-text">${escapeHtml(notif.message)}</div>
                </div>
                <div class="notif-time">${timeAgo(notif.createdAt)}</div>
            </div>
        `;
    }).join('');

    // Mark as read when clicked
    DOM.notificationPanelBody.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            app.markNotificationRead(id);
            renderNotifications();
        });
    });
}

// SECTION: QUICK ACTIONS

function toggleQuickActions() {
    DOM.quickActionsPanel.classList.toggle('active');
}

function handleQuickAction(action) {
    DOM.quickActionsPanel.classList.remove('active');

    switch (action) {
        case 'new-task':
            openTaskModal();
            break;
        case 'search':
            DOM.globalSearchInput.focus();
            break;
        case 'export':
            app.exportData('json');
            break;
        case 'backup':
            app.createBackup();
            break;
        case 'theme':
            toggleTheme();
            break;
        case 'settings':
            switchView('settings');
            break;
    }
}

// SECTION: KEYBOARD SHORTCUTS

document.addEventListener('keydown', (e) => {
    // Ctrl + N - New Task
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openTaskModal();
    }

    // Ctrl + F - Focus Search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        DOM.globalSearchInput.focus();
    }

    // Ctrl + S - Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (DOM.taskModalOverlay.classList.contains('active')) {
            saveTask();
        }
        if (DOM.categoryModalOverlay.classList.contains('active')) {
            saveCategory();
        }
    }

    // Delete - Delete selected task
    if (e.key === 'Delete' && !e.target.closest('input, textarea, select')) {
        if (app.selectedTasks.size > 0) {
            app.selectedTasks.forEach(id => {
                app.deleteTask(id);
            });
            app.selectedTasks.clear();
            updateAllViews();
            app.showToast('تم الحذف', `تم حذف ${app.selectedTasks.size} مهمة`, 'warning');
        }
    }

    // Escape - Close modals
    if (e.key === 'Escape') {
        if (DOM.taskModalOverlay.classList.contains('active')) {
            closeTaskModal();
        }
        if (DOM.categoryModalOverlay.classList.contains('active')) {
            closeCategoryModal();
        }
        if (DOM.taskDetailsModalOverlay.classList.contains('active')) {
            closeTaskDetails();
        }
        if (DOM.confirmModalOverlay.classList.contains('active')) {
            closeConfirmModal();
        }
        if (DOM.notificationPanel.classList.contains('active')) {
            DOM.notificationPanel.classList.remove('active');
        }
        if (DOM.quickActionsPanel.classList.contains('active')) {
            DOM.quickActionsPanel.classList.remove('active');
        }
        if (DOM.searchResults.classList.contains('active')) {
            DOM.searchResults.classList.remove('active');
        }
    }

    // Ctrl + Z - Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const action = app.undo();
        if (action) {
            app.showToast('تراجع', 'تم التراجع عن العملية السابقة', 'info');
            updateAllViews();
        }
    }

    // Ctrl + Y - Redo
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        const action = app.redo();
        if (action) {
            app.showToast('إعادة', 'تم إعادة العملية السابقة', 'info');
            updateAllViews();
        }
    }

    // Ctrl + Shift + A - Select All
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const tasks = app.getFilteredAndSortedTasks().tasks;
        tasks.forEach(t => app.selectedTasks.add(t.id));
        updateSelectedTasksUI();
        updateAllViews();
    }
});

// =========================================
// SECTION: EXPORT / IMPORT
// =========================================

function handleExport(format) {
    const data = app.exportData(format);

    if (!data) {
        app.showToast('خطأ', 'فشل في تصدير البيانات', 'error');
        return;
    }

    const extensions = {
        json: 'json',
        csv: 'csv',
        txt: 'txt'
    };

    const mimeTypes = {
        json: 'application/json',
        csv: 'text/csv',
        txt: 'text/plain'
    };

    const blob = new Blob([data], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow_export_${new Date().toISOString().slice(0, 10)}.${extensions[format]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    app.showToast('تم التصدير', `تم تصدير البيانات بصيغة ${format.toUpperCase()}`, 'success');
}

function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = app.importData(e.target.result);
                if (result.success) {
                    updateAllViews();
                    app.showToast('تم الاستيراد', `تم استيراد ${result.imported} مهمة بنجاح`, 'success');
                } else {
                    app.showToast('فشل الاستيراد', result.error, 'error');
                }
            } catch (error) {
                app.showToast('خطأ', error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// SECTION: EVENT LISTENERS

// ----- SIDEBAR -----
DOM.sidebarToggle.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('collapsed');
    app.saveToStorage();
});

DOM.mobileMenuToggle.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('mobile-open');
});

// ----- NAVIGATION -----
DOM.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) {
            switchView(view);
        }
    });
});

// ----- THEME -----
DOM.themeToggle.addEventListener('click', toggleTheme);

// ----- NOTIFICATIONS -----
DOM.notificationsBtn.addEventListener('click', toggleNotifications);

DOM.clearAllNotifications.addEventListener('click', () => {
    app.clearAllNotifications();
    renderNotifications();
    app.showToast('تم المسح', 'تم مسح جميع الإشعارات', 'info');
});

// Click outside to close notification panel
document.addEventListener('click', (e) => {
    if (DOM.notificationPanel.classList.contains('active')) {
        if (!DOM.notificationPanel.contains(e.target) && !DOM.notificationsBtn.contains(e.target)) {
            DOM.notificationPanel.classList.remove('active');
        }
    }

    if (DOM.quickActionsPanel.classList.contains('active')) {
        if (!DOM.quickActionsPanel.contains(e.target) && !DOM.quickActionsBtn.contains(e.target)) {
            DOM.quickActionsPanel.classList.remove('active');
        }
    }

    if (DOM.searchResults.classList.contains('active')) {
        if (!DOM.searchResults.contains(e.target) && !DOM.globalSearchInput.contains(e.target)) {
            DOM.searchResults.classList.remove('active');
        }
    }
});

// ----- QUICK ACTIONS -----
DOM.quickActionsBtn.addEventListener('click', toggleQuickActions);

DOM.quickActions.forEach(action => {
    action.addEventListener('click', () => {
        handleQuickAction(action.dataset.action);
    });
});

// ----- SEARCH -----
DOM.globalSearchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    debouncedSearch(query);
});

DOM.globalSearchInput.addEventListener('focus', () => {
    if (DOM.globalSearchInput.value.trim()) {
        performSearch(DOM.globalSearchInput.value);
    }
});

DOM.globalSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        DOM.searchResults.classList.remove('active');
        DOM.globalSearchInput.blur();
    }
    if (e.key === 'Enter') {
        const firstResult = DOM.searchResults.querySelector('.search-result-item');
        if (firstResult) {
            firstResult.click();
        }
    }
});

// ----- TASK MODAL -----
DOM.createTaskBtn.addEventListener('click', () => openTaskModal());

DOM.taskModalClose.addEventListener('click', closeTaskModal);
DOM.taskModalCancel.addEventListener('click', closeTaskModal);

DOM.taskModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.taskModalOverlay) {
        closeTaskModal();
    }
});

DOM.taskModalSave.addEventListener('click', saveTask);

// Task progress range
DOM.taskProgress.addEventListener('input', (e) => {
    DOM.taskProgressValue.textContent = `${e.target.value}%`;
});

DOM.taskReminder.addEventListener('change', (e) => {
    DOM.taskReminderDate.style.display = e.target.checked ? 'block' : 'none';
});

// ----- CONFIRM MODAL -----
DOM.confirmClose.addEventListener('click', closeConfirmModal);
DOM.confirmCancel.addEventListener('click', closeConfirmModal);

DOM.confirmModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.confirmModalOverlay) {
        closeConfirmModal();
    }
});

DOM.confirmOk.addEventListener('click', () => {
    if (currentConfirmCallback) {
        currentConfirmCallback();
        closeConfirmModal();
    }
});

// ----- CATEGORY MODAL -----
DOM.addCategoryBtn.addEventListener('click', () => openCategoryModal());

DOM.categoryModalClose.addEventListener('click', closeCategoryModal);
DOM.categoryModalCancel.addEventListener('click', closeCategoryModal);

DOM.categoryModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.categoryModalOverlay) {
        closeCategoryModal();
    }
});

DOM.categoryModalSave.addEventListener('click', saveCategory);

// ----- TASK DETAILS MODAL -----
DOM.taskDetailsClose.addEventListener('click', closeTaskDetails);

DOM.taskDetailsModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.taskDetailsModalOverlay) {
        closeTaskDetails();
    }
});

// ----- TASKS FILTERS -----
DOM.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        app.filters.status = filter;
        app.saveToStorage();
        renderAllTasks();
    });
});

// ----- TASKS SORT -----
DOM.sortSelect.addEventListener('change', (e) => {
    app.sortOption = e.target.value;
    app.saveToStorage();
    renderAllTasks();
});

// ----- RESET FILTERS -----
DOM.resetFiltersBtn.addEventListener('click', () => {
    app.filters = {
        status: 'all',
        priority: 'all',
        category: 'all',
        search: '',
        favorite: false,
        pinned: false,
        archived: false,
        deleted: false
    };
    app.sortOption = 'createdAt-desc';
    app.searchTerm = '';

    DOM.filterBtns.forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');

    DOM.sortSelect.value = 'createdAt-desc';
    DOM.globalSearchInput.value = '';

    renderAllViews();
    app.showToast('تم إعادة التعيين', 'تم إعادة تعيين جميع الفلاتر', 'info');
});

// ----- CALENDAR -----
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

DOM.prevMonth.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
});

DOM.nextMonth.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
});

// ----- REPORTS -----
DOM.exportJsonBtn.addEventListener('click', () => handleExport('json'));
DOM.exportCsvBtn.addEventListener('click', () => handleExport('csv'));
DOM.exportTxtBtn.addEventListener('click', () => handleExport('txt'));
DOM.importBtn.addEventListener('click', handleImport);

// ----- SETTINGS -----
DOM.themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        setTheme(theme);
        saveSettings();
    });
});

DOM.animationsToggle.addEventListener('change', saveSettings);
DOM.cardSizeSelect.addEventListener('change', saveSettings);
DOM.defaultSortSelect.addEventListener('change', saveSettings);
DOM.reminderNotifications.addEventListener('change', saveSettings);
DOM.emailNotifications.addEventListener('change', saveSettings);

DOM.createBackupBtn.addEventListener('click', () => {
    app.createBackup();
    renderSettings();
});

DOM.restoreBackupBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showConfirmModal(
                'استعادة النسخة الاحتياطية',
                'سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟',
                async () => {
                    const result = await app.restoreBackup(file);
                    if (result.success) {
                        updateAllViews();
                        renderSettings();
                        app.showToast('تم الاستعادة', result.message, 'success');
                    } else {
                        app.showToast('فشل الاستعادة', result.error, 'error');
                    }
                }
            );
        } catch (error) {
            app.showToast('خطأ', error.message, 'error');
        }
    };
    input.click();
});

// ----- LOGOUT -----
DOM.logoutBtn.addEventListener('click', () => {
    showConfirmModal(
        'تسجيل الخروج',
        'هل أنت متأكد من تسجيل الخروج؟',
        () => {
            app.currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.USER);
            app.saveToStorage();
            app.showToast('تم تسجيل الخروج', 'تم تسجيل الخروج بنجاح', 'info');
            // Could redirect to login screen
        }
    );
});

// ----- FORM SUBMISSIONS -----
DOM.taskForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        saveTask();
    }
});

DOM.categoryForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveCategory();
    }
});

// SECTION: APP INITIALIZATION

function initApp() {
    console.log(`🚀 TaskFlow v${APP_VERSION} starting...`);

    // Load state from storage
    const loaded = app.loadFromStorage();

    if (loaded) {
        console.log('✅ State loaded from storage');
    } else {
        console.log('ℹ️ No saved state found, using defaults');
        // Initialize with sample data for demo
        initializeSampleData();
    }

    // Apply theme
    setTheme(app.theme);

    // Update notification badge
    app.updateNotificationBadge();

    // Update task counts
    updateTaskCounts();

    // Load last view
    const lastView = app.currentView || 'dashboard';
    switchView(lastView);

    // Hide loading screen
    setTimeout(() => {
        DOM.loadingScreen.classList.add('hidden');
        DOM.app.style.display = 'block';
    }, 1500);

    // Start reminder checker
    setInterval(checkReminders, 60000);

    console.log('✅ TaskFlow ready!');
}

function initializeSampleData() {
    // Create sample categories if none exist
    if (app.categories.length === 0) {
        app.categories = DEFAULT_CATEGORIES;
    }

    // Create sample tasks if none exist
    if (app.tasks.length === 0) {
        const sampleTasks = [
            {
                title: 'تصميم واجهة المستخدم الرئيسية',
                description: 'إنشاء تصميم احترافي للوحة التحكم باستخدام Figma',
                status: 'in-progress',
                priority: 'high',
                category: 'cat_1',
                dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
                color: '#6C63FF',
                tags: ['تصميم', 'UI/UX'],
                notes: 'استخدام نظام الألوان الأساسي',
                estimatedTime: 4,
                progress: 60,
                favorite: true,
                pinned: true
            },
            {
                title: 'تطوير نظام المصادقة',
                description: 'تنفيذ نظام تسجيل الدخول والتسجيل مع JWT',
                status: 'pending',
                priority: 'urgent',
                category: 'cat_1',
                dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                color: '#FF6B6B',
                tags: ['تطوير', 'أمان'],
                notes: 'استخدام localStorage للتخزين المؤقت',
                estimatedTime: 8,
                progress: 20,
                favorite: false,
                pinned: false
            },
            {
                title: 'مراجعة كود المشروع',
                description: 'مراجعة جميع ملفات المشروع وتحسين الأداء',
                status: 'completed',
                priority: 'medium',
                category: 'cat_1',
                dueDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
                color: '#51CF66',
                tags: ['مراجعة', 'جودة'],
                notes: 'تم المراجعة مع الفريق',
                estimatedTime: 2,
                progress: 100,
                favorite: true,
                pinned: false
            },
            {
                title: 'تنظيم الملفات الشخصية',
                description: 'ترتيب وتنظيم الملفات الشخصية في الحاسوب',
                status: 'pending',
                priority: 'low',
                category: 'cat_2',
                dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
                color: '#FCC419',
                tags: ['تنظيم', 'شخصي'],
                notes: 'إنشاء مجلدات جديدة',
                estimatedTime: 1,
                progress: 0,
                favorite: false,
                pinned: false
            },
            {
                title: 'مذاكرة الاختبار النهائي',
                description: 'الاستعداد للاختبار النهائي في مادة JavaScript',
                status: 'in-progress',
                priority: 'high',
                category: 'cat_3',
                dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                color: '#4DABF7',
                tags: ['دراسة', 'JavaScript'],
                notes: 'مراجعة جميع المفاهيم',
                estimatedTime: 6,
                progress: 45,
                favorite: true,
                pinned: false
            },
            {
                title: 'تنظيف المنزل',
                description: 'تنظيف شامل للمنزل وترتيب الغرف',
                status: 'pending',
                priority: 'low',
                category: 'cat_4',
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                color: '#FF6B6B',
                tags: ['منزل', 'تنظيف'],
                notes: 'طلب مساعدة إذا لزم الأمر',
                estimatedTime: 3,
                progress: 10,
                favorite: false,
                pinned: false
            }
        ];

        sampleTasks.forEach(task => {
            const newTask = app.createTaskObject(task);
            app.tasks.push(newTask);
        });

        // Add some archived tasks
        const archivedTask = app.createTaskObject({
            title: 'مشروع قديم (مؤرشف)',
            description: 'هذا المشروع تم أرشفته',
            status: 'completed',
            priority: 'low',
            category: 'cat_1',
            color: '#8A8AA8',
            tags: ['قديم', 'مؤرشف']
        });
        app.archivedTasks.push(archivedTask);

        // Add some deleted tasks
        const deletedTask = app.createTaskObject({
            title: 'مهمة محذوفة',
            description: 'تم حذف هذه المهمة',
            status: 'cancelled',
            priority: 'low',
            category: 'cat_1',
            color: '#8A8AA8'
        });
        app.deletedTasks.push(deletedTask);

        // Add some activity logs
        app.addActivity('create', 'تم إنشاء مشروع TaskFlow');
        app.addActivity('login', 'قام المستخدم بتسجيل الدخول');
        app.addActivity('update', 'تم تحديث مهمة: تصميم واجهة المستخدم الرئيسية');
        app.addActivity('create', 'تم إنشاء مهمة: تطوير نظام المصادقة');
        app.addActivity('complete', 'تم إكمال مهمة: مراجعة كود المشروع');
        app.addActivity('archive', 'تم أرشفة مشروع قديم');

        app.saveToStorage();
        console.log('✅ Sample data initialized');
    }
}

function checkReminders() {
    const now = new Date();
    const tasks = app.tasks.filter(t => t.reminder);

    tasks.forEach(task => {
        const reminderDate = new Date(task.reminder);
        if (reminderDate <= now) {
            app.addNotification(
                'تذكير بمهمة',
                `حان موعد المهمة: ${task.title}`,
                'warning'
            );
            // Clear reminder after notification
            task.reminder = null;
            app.saveToStorage();
        }
    });
}

// SECTION: POLYFILLS & BROWSER COMPATIBILITY

// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
        const [tl, tr, br, bl] = r.map(rad => Math.min(rad, Math.min(w, h) / 2));

        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
    };
}

// START THE APPLICATION

document.addEventListener('DOMContentLoaded', initApp);

console.log('📦 TaskFlow - Advanced Task Management System');
console.log(`📱 Version: ${APP_VERSION}`);
console.log('🛠️ Built with Vanilla JavaScript ES6+');
console.log('❤️ Made with passion for quality');

// إصلاح مشكلة إخفاء القائمة الجانبية (Sidebar Toggle) والاستجابة للهواتف


document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");

    // تفعيل السهم لإخفاء وإظهار القائمة الجانبية
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            
            // تغيير اتجاه السهم حسب حالة القائمة
            const icon = sidebarToggle.querySelector("i");
            if (icon) {
                if (sidebar.classList.contains("collapsed")) {
                    icon.className = "fas fa-chevron-left"; // السهم يشير لليسار عند الإغلاق
                } else {
                    icon.className = "fas fa-chevron-right"; // السهم يشير لليمين عند الفتح
                }
            }
        });
    }

    // تفعيل زر الهواتف (Burger Menu) لإظهار القائمة الجانبية في الشاشات الصغيرة
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }
}

);
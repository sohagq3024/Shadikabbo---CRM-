import express from 'express';
import { formatDateYMD, isStaffDayOff } from './attendanceService';

export interface DailyReportRecord {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  userRole: 'CRO' | 'MK' | 'Super Admin';
  userPhone: string;
  attendance: {
    status: string; // 'present' | 'late' | 'day_off' | 'absent' | 'pending'
    inTime: string;
    outTime: string;
    lateMinutes: number;
    scanMethod: string;
    notes: string;
  };
  metrics: {
    leadsAddedCount: number;
    leadSources: Record<string, number>;
    leadStatuses: Record<string, number>;
    trafficsAddedCount: number;
    leadsTransferredToTrafficCount: number;
    paidTrafficsCount: number;
    sellingAmount: number;
    // MK specific metrics
    matchmaking?: {
      totalServicesCount: number;
      uniqueClientsCount: number;
      pendingServicesCount: number;
      serviceTypeBreakdown: Record<string, number>;
    };
  };
  manualInputs: {
    receivedCalls: number;
    messagesAssigned: number;
    notes?: string;
  };
  submittedAt: number;
  updatedAt: number;
}

export function ensureDailyReportsInitialized(db: any) {
  if (!db.dailyReports || !Array.isArray(db.dailyReports)) {
    db.dailyReports = [];
  }
}

export function setupDailyReportRoutes(
  app: express.Express,
  loadDB: () => any,
  saveDB: (db: any) => void,
  authMiddleware: any
) {
  // 1. Get Live Real-Time Auto-Calculated Stats for Today (or specified date)
  app.get('/api/daily-reports/live-stats', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureDailyReportsInitialized(db);

    const currentUser = (req as any).user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requestedUserId = (req.query.userId as string) || currentUser.id;
    // Only Super Admin can query another staff's live stats
    const targetUserId =
      currentUser.role === 'Super Admin' ? requestedUserId : currentUser.id;

    const targetUser = (db.users || []).find((u: any) => u.id === targetUserId) || currentUser;

    const dateQuery = (req.query.date as string) || formatDateYMD(new Date());
    const isToday = dateQuery === formatDateYMD(new Date());

    // 1. Live Attendance Status
    const attRecord = (db.attendance || []).find(
      (a: any) => a.date === dateQuery && a.userId === targetUser.id
    );

    let attStatus = 'Pending';
    let inTime = '-';
    let outTime = '-';
    let lateMinutes = 0;
    let scanMethod = '-';
    let attNotes = '';

    if (attRecord) {
      inTime = attRecord.inTime || '-';
      outTime = attRecord.outTime || (isToday ? 'In Office' : '-');
      lateMinutes = attRecord.lateMinutes || 0;
      scanMethod = attRecord.scanMethod || 'qr_scanner';
      attNotes = attRecord.notes || '';
      if (attRecord.status === 'present') {
        attStatus = lateMinutes > 0 ? `Late (${lateMinutes}m)` : 'Present (On Time)';
      } else if (attRecord.status === 'day_off') {
        attStatus = 'Day Off (সাপ্তাহিক ছুটি)';
      } else {
        attStatus = 'Absent';
      }
    } else {
      const isDayOff = isStaffDayOff(targetUser, new Date(dateQuery + 'T12:00:00'));
      if (isDayOff) {
        attStatus = 'Day Off (সাপ্তাহিক ছুটি)';
      } else if (!isToday) {
        attStatus = 'Absent';
      } else {
        attStatus = 'Pending In-Time Scan';
      }
    }

    // 2. Leads Added by Target User on this Date (with source breakdown)
    const userLeads = (db.leads || []).filter((l: any) => {
      const leadDate =
        l.createdAt || (l.createdTimestamp ? formatDateYMD(new Date(l.createdTimestamp)) : '');
      const matchDate = leadDate === dateQuery;
      if (!matchDate) return false;

      if (currentUser.role === 'Super Admin' && requestedUserId === 'all') return true;
      return l.creatorId === targetUser.id || l.createdBy === targetUser.name;
    });

    const leadsAddedCount = userLeads.length;
    const leadSources: Record<string, number> = {};
    const leadStatuses: Record<string, number> = {};

    userLeads.forEach((l: any) => {
      const src = l.category ? String(l.category).trim() : 'Direct';
      leadSources[src] = (leadSources[src] || 0) + 1;

      const st = l.status ? String(l.status).trim() : 'New Lead';
      leadStatuses[st] = (leadStatuses[st] || 0) + 1;
    });

    // 3. Traffics Added by Target User on this Date
    const userTraffics = (db.traffics || []).filter((t: any) => {
      const trafficDate =
        t.createdAt || (t.createdTimestamp ? formatDateYMD(new Date(t.createdTimestamp)) : '');
      const matchDate = trafficDate === dateQuery;
      if (!matchDate) return false;

      if (currentUser.role === 'Super Admin' && requestedUserId === 'all') return true;
      return t.creatorId === targetUser.id || t.createdBy === targetUser.name;
    });
    const trafficsAddedCount = userTraffics.length;

    // 4. Leads Transferred to Traffic on this Date
    const leadsTransferred = (db.traffics || []).filter((t: any) => {
      const trafficDate =
        t.createdAt || (t.createdTimestamp ? formatDateYMD(new Date(t.createdTimestamp)) : '');
      const matchDate = trafficDate === dateQuery;
      const isConverted =
        !!t.convertedFromLeadId ||
        (Array.isArray(t.activityLog) &&
          t.activityLog.some(
            (act: any) => act.originalLeadId || act.comment?.includes('Transferred from Lead')
          ));

      if (!matchDate || !isConverted) return false;

      if (currentUser.role === 'Super Admin' && requestedUserId === 'all') return true;
      return t.creatorId === targetUser.id || t.createdBy === targetUser.name;
    });
    const leadsTransferredToTrafficCount = leadsTransferred.length;

    // 5. Convert Paid Traffic or Added Paid Traffic on this Date
    // Match payments or accepted paid traffics created/converted on this date
    const paidTraffics = (db.traffics || []).filter((t: any) => {
      if (t.status === 'trash' || t.paymentStatus !== 'accepted') return false;

      const trafficDate =
        t.createdAt || (t.createdTimestamp ? formatDateYMD(new Date(t.createdTimestamp)) : '');
      const matchDate = trafficDate === dateQuery;
      if (!matchDate) return false;

      if (currentUser.role === 'Super Admin' && requestedUserId === 'all') return true;
      const isCreator = t.creatorId === targetUser.id || t.createdBy === targetUser.name;
      const isAssigned =
        t.assignBy === targetUser.name ||
        t.assignedTo?.name === targetUser.name ||
        t.assignedTo?.id === targetUser.id;
      return isCreator || isAssigned;
    });
    const paidTrafficsCount = paidTraffics.length;

    // 6. Auto-included Selling Amount
    // Completed/accepted payments on this date attributed to this staff member
    let sellingAmount = 0;
    (db.payments || []).forEach((p: any) => {
      const payDate = p.date || '';
      if (payDate === dateQuery) {
        let isAttributed = false;
        if (currentUser.role === 'Super Admin' && requestedUserId === 'all') {
          isAttributed = true;
        } else if (targetUser.role === 'CRO') {
          isAttributed =
            p.createdBy === targetUser.name ||
            p.creatorId === targetUser.id ||
            p.assignedBy === targetUser.name;
        } else if (targetUser.role === 'MK') {
          isAttributed =
            p.assignedBy === targetUser.name ||
            p.createdBy === targetUser.name ||
            p.assignedRole === 'MK';
        } else {
          isAttributed = true;
        }

        if (isAttributed) {
          sellingAmount += Number(p.paidAmount) || 0;
        }
      }
    });

    // 7. Matchmaking Metrics (for MK Role & Super Admin)
    let matchmakingMetrics: any = undefined;
    if (targetUser.role === 'MK' || targetUser.role === 'Super Admin') {
      const paidPool = (db.traffics || []).filter(
        (t: any) => t.status !== 'trash' && t.paymentStatus === 'accepted'
      );

      let mkClients = paidPool;
      if (targetUser.role === 'MK') {
        mkClients = paidPool.filter((t: any) => {
          const isCreator =
            (t.creatorId && t.creatorId === targetUser.id) || t.createdBy === targetUser.name;
          const isAssigned =
            (t.assignedTo?.id && t.assignedTo?.id === targetUser.id) ||
            (t.assignedTo?.name && t.assignedTo?.name === targetUser.name) ||
            t.assignBy === targetUser.name ||
            (Array.isArray(t.assignedMKs) &&
              t.assignedMKs.some(
                (m: any) => m.id === targetUser.id || m.name === targetUser.name
              ));
          return isCreator || isAssigned;
        });
      }

      // Services performed on this date by targetUser:
      // Note: A single client can be served multiple times during the day!
      let totalServicesCount = 0;
      const uniqueServicedClients = new Set<string>();
      const serviceTypeBreakdown: Record<string, number> = {
        'Incoming Call': 0,
        'Outgoing Call': 0,
        'CV Send': 0,
        Update: 0,
      };

      mkClients.forEach((t: any) => {
        if (Array.isArray(t.matchmakingServices)) {
          t.matchmakingServices.forEach((s: any) => {
            const sDate = s.isoDate
              ? s.isoDate.substring(0, 10)
              : s.timestamp
              ? formatDateYMD(new Date(s.timestamp))
              : '';
            const matchSDate = sDate === dateQuery;

            const isProvidedByMe =
              targetUser.role === 'Super Admin' && requestedUserId === 'all'
                ? true
                : s.providedBy?.id === targetUser.id || s.providedBy?.name === targetUser.name;

            if (matchSDate && isProvidedByMe) {
              totalServicesCount++;
              uniqueServicedClients.add(t.id);
              const st = s.serviceType || 'Update';
              serviceTypeBreakdown[st] = (serviceTypeBreakdown[st] || 0) + 1;
            }
          });
        }
      });

      // Pending / required services (routine service required every 3 days)
      const now = Date.now();
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      let pendingServicesCount = 0;

      mkClients.forEach((t: any) => {
        const lastServiceTime =
          t.lastServiceAt || t.assignedAt || t.createdTimestamp || Date.now();
        const isOverdue = now - lastServiceTime >= THREE_DAYS_MS;
        if (isOverdue || !t.lastServiceAt) {
          pendingServicesCount++;
        }
      });

      matchmakingMetrics = {
        totalServicesCount,
        uniqueClientsCount: uniqueServicedClients.size,
        pendingServicesCount,
        serviceTypeBreakdown,
      };
    }

    // Check if an existing submitted report already exists for today
    const existingReport = (db.dailyReports || []).find(
      (r: DailyReportRecord) => r.date === dateQuery && r.userId === targetUser.id
    );

    res.json({
      date: dateQuery,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        role: targetUser.role,
        phone: targetUser.phone || '',
      },
      hasSubmitted: !!existingReport,
      existingReport: existingReport || null,
      liveData: {
        attendance: {
          status: attStatus,
          inTime,
          outTime,
          lateMinutes,
          scanMethod,
          notes: attNotes,
        },
        metrics: {
          leadsAddedCount,
          leadSources,
          leadStatuses,
          trafficsAddedCount,
          leadsTransferredToTrafficCount,
          paidTrafficsCount,
          sellingAmount,
          ...(matchmakingMetrics ? { matchmaking: matchmakingMetrics } : {}),
        },
      },
    });
  });

  // 2. Submit or Update Today's Daily Report
  app.post('/api/daily-reports', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureDailyReportsInitialized(db);

    const currentUser = (req as any).user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date, manualInputs, metrics, attendance } = req.body;
    const reportDate = date || formatDateYMD(new Date());

    if (!manualInputs || typeof manualInputs.receivedCalls === 'undefined') {
      return res.status(400).json({ error: 'Manual input for received calls is required.' });
    }

    const receivedCalls = Number(manualInputs.receivedCalls) || 0;
    const messagesAssigned = Number(manualInputs.messagesAssigned) || 0;
    const notes = manualInputs.notes ? String(manualInputs.notes).trim() : '';

    const existingIndex = (db.dailyReports || []).findIndex(
      (r: DailyReportRecord) => r.date === reportDate && r.userId === currentUser.id
    );

    const now = Date.now();
    const reportId =
      existingIndex !== -1
        ? db.dailyReports[existingIndex].id
        : `DLR-${reportDate.replace(/-/g, '')}-${currentUser.id}`;

    const reportRecord: DailyReportRecord = {
      id: reportId,
      date: reportDate,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userPhone: currentUser.phone || '',
      attendance: attendance || {
        status: 'Present',
        inTime: '-',
        outTime: '-',
        lateMinutes: 0,
        scanMethod: 'qr_scanner',
        notes: '',
      },
      metrics: metrics || {
        leadsAddedCount: 0,
        leadSources: {},
        leadStatuses: {},
        trafficsAddedCount: 0,
        leadsTransferredToTrafficCount: 0,
        paidTrafficsCount: 0,
        sellingAmount: 0,
      },
      manualInputs: {
        receivedCalls,
        messagesAssigned,
        notes,
      },
      submittedAt: existingIndex !== -1 ? db.dailyReports[existingIndex].submittedAt : now,
      updatedAt: now,
    };

    if (existingIndex !== -1) {
      db.dailyReports[existingIndex] = reportRecord;
    } else {
      db.dailyReports.push(reportRecord);
    }

    saveDB(db);

    res.json({
      success: true,
      message: 'Daily report submitted successfully',
      report: reportRecord,
    });
  });

  // 3. Get Daily Reports List (Filterable by Date, Date Range, Role, Staff, Month)
  app.get('/api/daily-reports', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureDailyReportsInitialized(db);

    const currentUser = (req as any).user;
    const { date, startDate, endDate, role, userId, month } = req.query;

    let reports: DailyReportRecord[] = [...db.dailyReports];

    // Access control:
    // Staff (CRO/MK) can only see their own reports.
    // Super Admin can see all reports from any agent at any time (last month, last year, all history).
    if (currentUser.role === 'CRO' || currentUser.role === 'MK') {
      reports = reports.filter((r) => r.userId === currentUser.id);
    } else if (userId && userId !== 'all') {
      reports = reports.filter((r) => r.userId === userId);
    }

    if (date) {
      reports = reports.filter((r) => r.date === date);
    }

    if (startDate) {
      reports = reports.filter((r) => r.date >= String(startDate));
    }

    if (endDate) {
      reports = reports.filter((r) => r.date <= String(endDate));
    }

    if (month) {
      reports = reports.filter((r) => r.date.startsWith(String(month)));
    }

    if (role && role !== 'all') {
      reports = reports.filter((r) => r.userRole === role);
    }

    // Sort newest date and updated time first
    reports.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.updatedAt - a.updatedAt;
    });

    const todayStr = formatDateYMD(new Date());
    const hasSubmittedToday = (db.dailyReports || []).some(
      (r: DailyReportRecord) => r.date === todayStr && r.userId === currentUser.id
    );

    res.json({
      reports,
      totalCount: reports.length,
      hasSubmittedToday,
      todayStr,
    });
  });

  // 3.5 Get All Agents dynamically from db.users (Automatically includes any newly registered account)
  app.get('/api/daily-reports/agents', authMiddleware, (req, res) => {
    const db = loadDB();
    const users = db.users || [];
    const agents = users
      .filter((u: any) => u.role !== 'Super Admin')
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        phone: u.phone || '',
        email: u.email || '',
      }));

    // In case any staff submitted under another role or old record, ensure distinct
    const seenIds = new Set(agents.map((a: any) => a.id));
    (db.dailyReports || []).forEach((r: DailyReportRecord) => {
      if (r.userId && !seenIds.has(r.userId) && r.userRole !== 'Super Admin') {
        seenIds.add(r.userId);
        agents.push({
          id: r.userId,
          name: r.userName || 'Agent',
          role: r.userRole || 'Agent',
          phone: r.userPhone || '',
          email: '',
        });
      }
    });

    res.json({ agents });
  });

  // 4. Get Single Daily Report by ID
  app.get('/api/daily-reports/:id', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureDailyReportsInitialized(db);

    const { id } = req.params;
    const report = (db.dailyReports || []).find((r: DailyReportRecord) => r.id === id);

    if (!report) {
      return res.status(404).json({ error: 'Daily report not found' });
    }

    res.json({ report });
  });

  // 5. Delete Daily Report (Super Admin only)
  app.delete('/api/daily-reports/:id', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureDailyReportsInitialized(db);

    const currentUser = (req as any).user;
    if (currentUser.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete daily reports' });
    }

    const { id } = req.params;
    const index = (db.dailyReports || []).findIndex((r: any) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Daily report not found' });
    }

    db.dailyReports.splice(index, 1);
    saveDB(db);

    res.json({ success: true, message: 'Daily report deleted successfully' });
  });
}

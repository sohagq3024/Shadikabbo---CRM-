import express from 'express';
import {
  ensureAttendanceInitialized,
  getStaffMembers,
  formatDateYMD,
  formatTime12,
  calculateLateMinutes,
  calculateEarlyOutMinutes,
  getOfficeQrDataUrl,
  OFFICE_QR_SECRET,
  AttendanceRecord,
  isStaffDayOff,
  getStaffDayOffList,
  DAY_NAMES,
} from './attendanceService';

export function setupAttendanceRoutes(app: express.Express, loadDB: () => any, saveDB: (db: any) => void, authMiddleware: any) {
  // 1. Get Office QR Code for display/printing
  app.get('/api/attendance/qr-code', authMiddleware, async (req, res) => {
    try {
      const qrData = await getOfficeQrDataUrl();
      res.json({ success: true, ...qrData });
    } catch (err: any) {
      console.error('Failed to generate office QR code:', err);
      res.status(500).json({ error: 'Failed to generate office QR code' });
    }
  });

  // 2. Get list of MK and CRO staff members with their configured day-off schedule
  app.get('/api/attendance/staff-list', authMiddleware, (req, res) => {
    const db = loadDB();
    const staff = getStaffMembers(db).map((u: any) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      phone: u.phone || '',
      weeklyOffDays: getStaffDayOffList(u),
    }));
    res.json({ staff, allDays: DAY_NAMES });
  });

  // 2.5 Day-Off Management Endpoints (Super Admin Only)
  app.get('/api/attendance/day-off-settings', authMiddleware, (req, res) => {
    const db = loadDB();
    const staff = getStaffMembers(db).map((u: any) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      phone: u.phone || '',
      weeklyOffDays: getStaffDayOffList(u),
    }));
    res.json({ staff, allDays: DAY_NAMES });
  });

  app.post('/api/attendance/day-off-settings', authMiddleware, (req, res) => {
    const db = loadDB();
    const currentUser = (req as any).user;
    if (!currentUser || currentUser.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can manage staff weekly day-off' });
    }

    const { userId, weeklyOffDays, updates } = req.body;

    if (Array.isArray(updates)) {
      // Bulk update
      updates.forEach((item: any) => {
        const u = (db.users || []).find((usr: any) => usr.id === item.userId);
        if (u) {
          u.weeklyOffDays = Array.isArray(item.weeklyOffDays) ? item.weeklyOffDays : ['Friday'];
        }
      });
      saveDB(db);
      return res.json({ success: true, message: 'Staff day-off schedules updated successfully' });
    }

    if (!userId || !Array.isArray(weeklyOffDays)) {
      return res.status(400).json({ error: 'userId and weeklyOffDays array are required' });
    }

    const targetUser = (db.users || []).find((u: any) => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    targetUser.weeklyOffDays = weeklyOffDays;
    saveDB(db);

    res.json({
      success: true,
      message: `Weekly day-off updated for ${targetUser.name}`,
      weeklyOffDays: targetUser.weeklyOffDays,
    });
  });

  // 3. Scan Office QR Code (Daily Attendance Record)
  // Handles In-time in the morning or Out-time in the evening
  app.post('/api/attendance/scan', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const { qrCode } = req.body;
    let isValidCode = false;

    // Validate QR code
    if (typeof qrCode === 'string') {
      const trimmed = qrCode.trim();
      if (trimmed === OFFICE_QR_SECRET || trimmed.includes(OFFICE_QR_SECRET) || trimmed.includes('SHADIKABBO_OFFICE_ATTENDANCE')) {
        isValidCode = true;
      }
    }

    if (!isValidCode) {
      return res.status(400).json({
        error: 'Invalid QR Code. Please scan the official Shadikabbo Office QR code.',
      });
    }

    const now = new Date();
    const todayStr = formatDateYMD(now);
    const existingIndex = (db.attendance || []).findIndex(
      (a: AttendanceRecord) => a.date === todayStr && a.userId === user.id
    );

    let resultType: 'in' | 'out' = 'in';
    let record: AttendanceRecord;

    if (existingIndex === -1) {
      // First scan of the day -> Check IN
      const lateMins = calculateLateMinutes(now);
      record = {
        id: `att_${todayStr}_${user.id}`,
        date: todayStr,
        userId: user.id,
        userName: user.name,
        userRole: user.role === 'CRO' ? 'CRO' : 'MK',
        userPhone: user.phone || '',
        inTime: formatTime12(now),
        inTimestamp: now.getTime(),
        outTime: null,
        outTimestamp: null,
        status: 'present',
        lateMinutes: lateMins,
        earlyOutMinutes: 0,
        scanMethod: 'qr_scanner',
        notes: lateMins > 0 ? `Late by ${lateMins} minutes` : 'On time arrival',
      };
      db.attendance.push(record);
      resultType = 'in';
    } else {
      // Second or subsequent scan -> Check OUT
      record = db.attendance[existingIndex];
      const earlyMins = calculateEarlyOutMinutes(now);
      const durationMins = record.inTimestamp
        ? Math.round((now.getTime() - record.inTimestamp) / 60000)
        : 0;

      record.outTime = formatTime12(now);
      record.outTimestamp = now.getTime();
      record.earlyOutMinutes = earlyMins;
      record.workDurationMinutes = durationMins;
      record.status = 'present';
      if (earlyMins > 0) {
        record.notes = (record.notes ? record.notes + '; ' : '') + `Early departure by ${earlyMins} mins`;
      }
      db.attendance[existingIndex] = record;
      resultType = 'out';
    }

    saveDB(db);

    const message =
      resultType === 'in'
        ? `Welcome, ${user.name}! In-time recorded at ${record.inTime}${record.lateMinutes > 0 ? ` (Late by ${record.lateMinutes} mins)` : ' (On Time)'}.`
        : `Goodbye, ${user.name}! Out-time recorded at ${record.outTime}.${record.earlyOutMinutes > 0 ? ` (Early by ${record.earlyOutMinutes} mins)` : ' (Standard hours complete)'}.`;

    res.json({
      success: true,
      type: resultType,
      record,
      message,
    });
  });

  // 3.5 Batch Sync Offline Attendance Scans
  // Synchronizes logs recorded while staff were offline with preserved exact scan timestamps
  app.post('/api/attendance/sync', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, syncedIds: [], message: 'No items to sync' });
    }

    const syncedIds: string[] = [];
    const processedRecords: any[] = [];

    // Sort items chronologically by scan timestamp
    const sortedItems = [...items].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    for (const item of sortedItems) {
      // Validate QR code
      const trimmedQr = String(item.qrCode || '').trim();
      const isValid =
        trimmedQr === OFFICE_QR_SECRET ||
        trimmedQr.includes(OFFICE_QR_SECRET) ||
        trimmedQr.includes('SHADIKABBO_OFFICE_ATTENDANCE');

      if (!isValid) {
        continue;
      }

      const scanTime = item.timestamp ? new Date(item.timestamp) : new Date();
      const dateStr = item.date || formatDateYMD(scanTime);
      const timeStr = item.recordedTimeStr || formatTime12(scanTime);
      const targetUserId = item.userId || user.id;
      const targetUserName = item.userName || user.name;
      const targetUserRole = item.userRole || user.role;

      const existingIndex = (db.attendance || []).findIndex(
        (a: AttendanceRecord) => a.date === dateStr && a.userId === targetUserId
      );

      let record: AttendanceRecord;

      if (existingIndex === -1) {
        // Record Check IN
        const lateMins = calculateLateMinutes(scanTime);
        record = {
          id: `att_${dateStr}_${targetUserId}`,
          date: dateStr,
          userId: targetUserId,
          userName: targetUserName,
          userRole: targetUserRole === 'CRO' ? 'CRO' : 'MK',
          userPhone: item.userPhone || user.phone || '',
          inTime: timeStr,
          inTimestamp: scanTime.getTime(),
          outTime: null,
          outTimestamp: null,
          status: 'present',
          lateMinutes: lateMins,
          earlyOutMinutes: 0,
          scanMethod: 'offline_synced',
          notes: (lateMins > 0 ? `Late by ${lateMins} minutes` : 'On time arrival') + ' (Synced from offline scan)',
        };
        db.attendance.push(record);
        processedRecords.push({ id: item.id, type: 'in', record });
        syncedIds.push(item.id);
      } else {
        // Record Check OUT
        record = db.attendance[existingIndex];
        const earlyMins = calculateEarlyOutMinutes(scanTime);
        const durationMins = record.inTimestamp
          ? Math.round((scanTime.getTime() - record.inTimestamp) / 60000)
          : 0;

        record.outTime = timeStr;
        record.outTimestamp = scanTime.getTime();
        record.earlyOutMinutes = earlyMins;
        record.workDurationMinutes = durationMins;
        record.status = 'present';
        record.scanMethod = 'offline_synced';
        record.notes = (record.notes ? record.notes + '; ' : '') + 'Out-time synced from offline scan';
        db.attendance[existingIndex] = record;
        processedRecords.push({ id: item.id, type: 'out', record });
        syncedIds.push(item.id);
      }
    }

    saveDB(db);

    res.json({
      success: true,
      syncedIds,
      syncedCount: syncedIds.length,
      processed: processedRecords,
      message: `Successfully synced ${syncedIds.length} offline attendance log(s)`,
    });
  });

  // 4. Get Current User's Today Status (for staff scanner view)
  app.get('/api/attendance/my-status', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const user = (req as any).user;
    const now = new Date();
    const todayStr = formatDateYMD(now);
    const isDayOffToday = isStaffDayOff(user, now);
    const weeklyOffDays = getStaffDayOffList(user);

    const todayRecord = (db.attendance || []).find(
      (a: AttendanceRecord) => a.date === todayStr && a.userId === user.id
    );

    res.json({
      date: todayStr,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        weeklyOffDays,
      },
      isDayOffToday,
      weeklyOffDays,
      hasCheckedIn: !!todayRecord && todayRecord.status === 'present',
      hasCheckedOut: !!todayRecord && !!todayRecord.outTime && todayRecord.outTime !== '-',
      record: todayRecord || null,
    });
  });

  // 5. Admin Dashboard Attendance Summary Table (Requirement 3 - Real Logic, Individual Day-Off)
  // Columns: Date, Total Employee (MK + CRO only), Present Total, Absent Total, Day Off Total
  app.get('/api/attendance/summary', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const staff = getStaffMembers(db);
    const totalStaffCount = staff.length; // MK and CRO only

    // Real workflow: Collect today's date + any dates that have actual recorded attendance
    const today = new Date();
    const todayStr = formatDateYMD(today);
    const requestedDate = req.query.date as string | undefined;

    const datesSet = new Set<string>();
    datesSet.add(todayStr); // Always show today for live monitoring

    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      datesSet.add(requestedDate);
    }

    // Include all dates with real logs in database
    (db.attendance || []).forEach((att: AttendanceRecord) => {
      if (att && att.date) {
        datesSet.add(att.date);
      }
    });

    // Build real summary rows based on each staff member's configured weekly day-off
    const summaryList = Array.from(datesSet).map((dateStr) => {
      const d = new Date(dateStr + 'T12:00:00');
      const isFriday = d.getDay() === 5;

      const dateRecords = (db.attendance || []).filter(
        (att: AttendanceRecord) => att.date === dateStr && staff.some((s: any) => s.id === att.userId)
      );

      let presentTotal = 0;
      let dayOffTotal = 0;
      let absentTotal = 0;

      staff.forEach((member: any) => {
        const record = dateRecords.find((r: AttendanceRecord) => r.userId === member.id);
        const isOff = isStaffDayOff(member, d);

        if (record && record.status === 'present') {
          presentTotal++;
        } else if (record && record.status === 'day_off') {
          dayOffTotal++;
        } else if (isOff) {
          // Individual assigned day-off
          dayOffTotal++;
        } else {
          // Working day with no scan
          absentTotal++;
        }
      });

      return {
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        totalEmployees: totalStaffCount, // Only MK and CRO counted
        presentTotal,
        absentTotal,
        dayOffTotal,
        isFriday,
      };
    });

    // Sort newest date first
    summaryList.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      totalEmployees: totalStaffCount,
      summary: summaryList,
    });
  });

  // 6. Specific Date Details Pop-up (Requirement 4 - Real List with individual day-offs)
  // Shows list of who was Present and who was Absent with Name, Role & Assigned Day-Off
  app.get('/api/attendance/date/:date', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const { date } = req.params;
    const staff = getStaffMembers(db);
    const d = new Date(date + 'T12:00:00');
    const dayOfWeekName = d.toLocaleDateString('en-US', { weekday: 'long' });

    const presentList: any[] = [];
    const absentList: any[] = [];
    const dayOffList: any[] = [];

    staff.forEach((user: any) => {
      const record = (db.attendance || []).find(
        (a: AttendanceRecord) => a.date === date && a.userId === user.id
      );
      const isUserDayOff = isStaffDayOff(user, d);
      const userOffDays = getStaffDayOffList(user);

      if (record && record.status === 'present') {
        presentList.push({
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone || '',
          inTime: record.inTime || 'N/A',
          outTime: record.outTime || 'Working...',
          lateMinutes: record.lateMinutes || 0,
          earlyOutMinutes: record.earlyOutMinutes || 0,
          workDuration: record.workDurationMinutes
            ? `${Math.floor(record.workDurationMinutes / 60)}h ${record.workDurationMinutes % 60}m`
            : record.outTime ? 'Completed' : 'Active in office',
          status: 'present',
          scanMethod: record.scanMethod || 'qr_scanner',
          notes: record.notes || '',
          weeklyOffDays: userOffDays,
        });
      } else if ((record && record.status === 'day_off') || isUserDayOff) {
        dayOffList.push({
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone || '',
          status: 'day_off',
          reason: record?.notes || `Weekly Day Off (${dayOfWeekName})`,
          weeklyOffDays: userOffDays,
        });
      } else {
        absentList.push({
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone || '',
          status: 'absent',
          reason: record?.notes || 'No attendance record found for this working day',
          weeklyOffDays: userOffDays,
        });
      }
    });

    res.json({
      date,
      dayName: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      totalEmployees: staff.length,
      presentCount: presentList.length,
      absentCount: absentList.length,
      dayOffCount: dayOffList.length,
      presentList,
      absentList,
      dayOffList,
    });
  });

  // 7. Specific Person Monthly Details Pop-up (Requirement 5)
  // Shows full month breakdown respecting each employee's individual weekly day-off
  app.get('/api/attendance/employee/:userId', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const { userId } = req.params;
    const monthQuery = (req.query.month as string) || formatDateYMD(new Date()).substring(0, 7); // YYYY-MM

    const user = (db.users || []).find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const [yearStr, monthStr] = monthQuery.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed

    // Calculate days in requested month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const todayStr = formatDateYMD(new Date());
    const userOffDays = getStaffDayOffList(user);

    const dailyLogs: any[] = [];
    let presentCount = 0;
    let absentCount = 0;
    let dayOffCount = 0;
    let totalLateMinutes = 0;
    let totalEarlyOutMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, monthIndex, day, 12, 0, 0);
      const dateStr = formatDateYMD(dayDate);
      const isFuture = dateStr > todayStr;
      const isIndividualDayOff = isStaffDayOff(user, dayDate);
      const dayNameShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNameFull = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

      const record = (db.attendance || []).find(
        (a: AttendanceRecord) => a.date === dateStr && a.userId === user.id
      );

      let status: 'present' | 'absent' | 'day_off' | 'future' = 'absent';
      let inTime = '-';
      let outTime = '-';
      let lateMinutes = 0;
      let earlyOutMinutes = 0;
      let durationStr = '-';

      if (isFuture) {
        status = 'future';
      } else if (record && record.status === 'present') {
        status = 'present';
        inTime = record.inTime || '-';
        outTime = record.outTime || (dateStr === todayStr ? 'In Office' : '-');
        lateMinutes = record.lateMinutes || 0;
        earlyOutMinutes = record.earlyOutMinutes || 0;
        if (record.workDurationMinutes) {
          durationStr = `${Math.floor(record.workDurationMinutes / 60)}h ${record.workDurationMinutes % 60}m`;
        }
        presentCount++;
        totalLateMinutes += lateMinutes;
        totalEarlyOutMinutes += earlyOutMinutes;
      } else if ((record && record.status === 'day_off') || isIndividualDayOff) {
        status = 'day_off';
        dayOffCount++;
      } else {
        status = 'absent';
        absentCount++;
      }

      dailyLogs.push({
        day,
        date: dateStr,
        dayName: dayNameShort,
        status,
        inTime,
        outTime,
        lateMinutes,
        earlyOutMinutes,
        workDuration: durationStr,
        isDayOff: isIndividualDayOff || status === 'day_off',
        dayOffReason: isIndividualDayOff ? `Weekly Off (${dayNameFull})` : (record?.notes || ''),
        scanMethod: record?.scanMethod || 'qr_scanner',
        notes: record?.notes || '',
      });
    }

    const monthName = new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    res.json({
      employee: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone || '',
        weeklyOffDays: userOffDays,
      },
      month: monthQuery,
      monthName,
      userWeeklyOffDays: userOffDays,
      stats: {
        totalDays: daysInMonth,
        presentCount,
        absentCount,
        dayOffCount,
        totalLateMinutes,
        totalEarlyOutMinutes,
      },
      dailyLogs,
    });
  });

  // 8. Admin Manual Attendance / Leave Management (Real HR Workflow)
  app.post('/api/attendance/manual', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const adminUser = (req as any).user;
    if (!adminUser || adminUser.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can manually manage attendance records' });
    }

    const { userId, date, status, inTime, outTime, notes } = req.body;
    if (!userId || !date || !status) {
      return res.status(400).json({ error: 'Employee ID, date, and status are required' });
    }

    const staff = getStaffMembers(db);
    const targetStaff = staff.find((s: any) => s.id === userId);
    if (!targetStaff) {
      return res.status(404).json({ error: 'Employee not found or not an MK/CRO staff member' });
    }

    const existingIndex = (db.attendance || []).findIndex(
      (a: AttendanceRecord) => a.date === date && a.userId === userId
    );

    let lateMinutes = 0;
    let earlyOutMinutes = 0;

    if (status === 'present' && inTime) {
      const match = inTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const isPM = match[3] && match[3].toUpperCase() === 'PM';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        const testD = new Date(date + 'T12:00:00');
        testD.setHours(h, m, 0, 0);
        lateMinutes = calculateLateMinutes(testD);
      }
    }

    if (status === 'present' && outTime) {
      const match = outTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const isPM = match[3] && match[3].toUpperCase() === 'PM';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        const testD = new Date(date + 'T12:00:00');
        testD.setHours(h, m, 0, 0);
        earlyOutMinutes = calculateEarlyOutMinutes(testD);
      }
    }

    const record: AttendanceRecord = {
      id: `att_${date}_${userId}`,
      date,
      userId,
      userName: targetStaff.name,
      userRole: targetStaff.role,
      userPhone: targetStaff.phone || '',
      inTime: inTime || (status === 'present' ? '10:00 AM' : '-'),
      inTimestamp: Date.now(),
      outTime: outTime || (status === 'present' ? '06:00 PM' : '-'),
      outTimestamp: Date.now(),
      status,
      lateMinutes,
      earlyOutMinutes,
      scanMethod: 'manual',
      notes: notes || `Admin manually updated on ${new Date().toLocaleDateString()}`,
    };

    if (existingIndex !== -1) {
      db.attendance[existingIndex] = record;
    } else {
      db.attendance.push(record);
    }

    saveDB(db);

    res.json({
      success: true,
      record,
      message: `Attendance record updated for ${targetStaff.name}`,
    });
  });

  // 9. Admin Delete Attendance Record
  app.delete('/api/attendance/record/:id', authMiddleware, (req, res) => {
    const db = loadDB();
    ensureAttendanceInitialized(db);

    const adminUser = (req as any).user;
    if (!adminUser || adminUser.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete attendance records' });
    }

    const { id } = req.params;
    const index = (db.attendance || []).findIndex((a: any) => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.attendance.splice(index, 1);
    saveDB(db);
    res.json({ success: true, message: 'Record deleted successfully' });
  });
}

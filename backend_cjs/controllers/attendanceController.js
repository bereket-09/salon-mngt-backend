const { Attendance, User, Branch } = require('../models/index')
const { Op } = require('sequelize')

exports.checkIn = async function checkIn(req, res) {
  try {
    const { userId, branchId, lat, lng } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    
    let record = await Attendance.findOne({ where: { UserId: userId, date: today } });
    if (record && record.checkInTime && !record.checkOutTime) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const event = { type: 'CLOCK_IN', time: now, lat, lng, branchId };
    
    if (!record) {
      record = await Attendance.create({ 
        UserId: userId, 
        BranchId: branchId, 
        date: today, 
        checkInTime: now, 
        status: 'present',
        breakMinutes: 0,
        lat, lng,
        events: [event]
      });
    } else {
      record.checkInTime = record.checkInTime || now;
      record.checkOutTime = null;
      record.BranchId = branchId;
      record.lat = lat;
      record.lng = lng;
      const history = Array.isArray(record.events) ? record.events : [];
      record.events = [...history, event];
      await record.save();
    }
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
}

exports.checkOut = async function checkOut(req, res) {
  try {
    const { userId, lat, lng } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    
    let record = await Attendance.findOne({ where: { UserId: userId, date: today } });
    if (!record || !record.checkInTime) return res.status(400).json({ error: 'Not checked in' });
    if (record.checkOutTime) return res.status(400).json({ error: 'Already out' });

    let currentBreakMins = record.breakMinutes || 0;
    const history = Array.isArray(record.events) ? record.events : [];
    
    if (record.status === 'on_break' && record.lastBreakStartTime) {
      const breakMs = now - new Date(record.lastBreakStartTime);
      const sessionMins = Math.max(1, Math.round(breakMs / (1000 * 60)));
      currentBreakMins += sessionMins;
      history.push({ type: 'BREAK_END', time: now, lat, lng, duration: sessionMins, autoClose: true });
    }

    history.push({ type: 'CLOCK_OUT', time: now, lat, lng });

    record.checkOutTime = now;
    record.status = 'present'; 
    record.breakMinutes = currentBreakMins;
    record.lat = lat; record.lng = lng;
    record.events = history;
    
    const diffMs = now - (new Date(record.checkInTime));
    record.totalHours = Math.max(0.01, (diffMs / (1000 * 60 * 60)) - (currentBreakMins / 60)).toFixed(2);
    
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
}

exports.undoCheckout = async function undoCheckout(req, res) {
  try {
    const { userId, lat, lng } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const record = await Attendance.findOne({ where: { UserId: userId, date: today } });
    if (!record || !record.checkOutTime) return res.status(400).json({ error: 'No checkout' });
    
    const history = Array.isArray(record.events) ? record.events : [];
    history.push({ type: 'UNDO_END', time: now, lat, lng, reason: 'mistake' });

    record.checkOutTime = null;
    record.totalHours = 0;
    record.events = history;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
}

exports.toggleBreak = async function toggleBreak(req, res) {
  try {
    const { userId, lat, lng } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const record = await Attendance.findOne({ where: { UserId: userId, date: today } });
    const now = new Date();
    
    if (!record || !record.checkInTime) return res.status(400).json({ error: 'Not in' });
    if (record.checkOutTime) return res.status(400).json({ error: 'Already out' });

    const history = Array.isArray(record.events) ? record.events : [];

    if (record.status === 'on_break') {
      const breakMs = now - new Date(record.lastBreakStartTime);
      const sessionMins = Math.max(1, Math.round(breakMs / (1000 * 60))); 
      record.breakMinutes = (record.breakMinutes || 0) + sessionMins;
      record.status = 'present';
      record.lastBreakStartTime = null;
      history.push({ type: 'BREAK_END', time: now, lat, lng, duration: sessionMins });
    } else {
      record.status = 'on_break';
      record.lastBreakStartTime = now;
      history.push({ type: 'BREAK_START', time: now, lat, lng });
    }
    
    record.events = history;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
}

exports.getStatus = async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    const rec = await Attendance.findOne({ where: { UserId: userId, date: today } });
    res.json(rec || { status: 'none' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
}

exports.listAttendance = async function listAttendance(req, res) {
  try {
    const { from, to, branchId, userId } = req.query;
    const where = {};
    if (from && to) where.date = { [Op.between]: [from, to] };
    if (branchId && branchId !== 'all') where.BranchId = branchId;
    if (userId) where.UserId = userId;

    const list = await Attendance.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'role'] },
        { model: Branch, attributes: ['id', 'name'] }
      ],
      order: [['date', 'DESC'], ['checkInTime', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}



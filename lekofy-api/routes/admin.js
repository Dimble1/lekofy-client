const router = require('express').Router();
const auth = require('../middleware/auth');
const isModerator = require('../middleware/isModerator');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Report = require('../models/Report');

router.get('/stats', [auth, isModerator], async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalAds = await Ad.count();
    const activeAds = await Ad.count({ where: { status: 'active' } });
    const pendingAds = await Ad.count({ where: { status: 'pending' } });
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    res.json({ totalUsers, totalAds, activeAds, pendingAds, pendingReports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', [auth, isModerator], async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isBlocked', 'banReason', 'banUntil', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Бан с причиной и сроком
router.put('/users/:id/block', [auth, isModerator], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    if (user.id === req.user.id) return res.status(403).json({ error: 'Нельзя заблокировать себя' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Нельзя заблокировать администратора' });

    const reason = req.body && req.body.reason ? req.body.reason : null;
    const days = req.body && req.body.days ? req.body.days : null;

    if (!reason) return res.status(400).json({ error: 'Укажите причину блокировки' });

    let banUntil = null;
    if (days && parseInt(days) > 0) {
      banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + parseInt(days));
    }

    await user.update({ isBlocked: true, banReason: reason, banUntil });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/unblock', [auth, isModerator], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    await user.update({ isBlocked: false, banReason: null, banUntil: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', [auth, isAdmin], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    if (user.id === req.user.id) return res.status(403).json({ error: 'Нельзя изменить свою роль' });
    await user.update({ role: req.body.role });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ads/pending', [auth, isModerator], async (req, res) => {
  try {
    const ads = await Ad.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'Owner', attributes: ['id', 'name', 'email'], required: false }],
      order: [['createdAt', 'DESC']],
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/ads/:id/approve', [auth, isModerator], async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Не найдено' });
    await ad.update({ status: 'active' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/ads/:id/reject', [auth, isModerator], async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Не найдено' });
    await ad.update({ status: 'rejected' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление объявления с причиной
router.delete('/ads/:id', [auth, isModerator], async (req, res) => {
  try {
    const reason = req.body && req.body.reason ? req.body.reason : null;
    if (!reason) return res.status(400).json({ error: 'Укажите причину удаления' });
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Не найдено' });
    await ad.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Жалобы с данными репортёра и объявления
router.get('/reports', [auth, isModerator], async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: User, as: 'Reporter', attributes: ['id', 'name', 'email'], required: false },
        { model: Ad, as: 'Ad', attributes: ['id', 'title'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reports/:id', [auth, isModerator], async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Не найдено' });
    await report.update({ status: req.body.status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
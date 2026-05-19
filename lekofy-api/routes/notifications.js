const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/mine', auth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const unreadCount = notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }
    if (Number(notification.userId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await notification.update({ isRead: true });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

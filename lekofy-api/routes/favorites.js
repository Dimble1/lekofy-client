const router = require('express').Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');
const Ad = require('../models/Ad');

router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.findAll({ where: { userId: req.user.id } });
    const adIds = favorites.map(f => f.adId);
    const ads = await Ad.findAll({ where: { id: adIds } });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:adId', auth, async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      where: { userId: req.user.id, adId: req.params.adId }
    });
    if (existing) return res.status(400).json({ error: 'Уже в избранном' });
    const favorite = await Favorite.create({ userId: req.user.id, adId: req.params.adId });
    res.json(favorite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:adId', auth, async (req, res) => {
  try {
    await Favorite.destroy({ where: { userId: req.user.id, adId: req.params.adId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
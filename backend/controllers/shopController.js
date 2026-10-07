import ShopItem from '../models/ShopItem.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';

// GET /api/shop — all active items
export const getShopItems = async (req, res) => {
    try {
        const items = await ShopItem.find({ isActive: true }).sort({ ecoCoinsRequired: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/shop/buy/:id — purchase an item
export const buyItem = async (req, res) => {
    try {
        const item = await ShopItem.findById(req.params.id);
        if (!item || !item.isActive)
            return res.status(404).json({ message: 'Item not found or unavailable' });
        if (item.stock === 0)
            return res.status(400).json({ message: 'This item is out of stock' });

        const user = await User.findById(req.user._id);
        if (user.ecoCoins < item.ecoCoinsRequired)
            return res.status(400).json({ message: `Not enough Eco Coins. You need ${item.ecoCoinsRequired} but have ${user.ecoCoins}` });

        // Deduct coins
        user.ecoCoins -= item.ecoCoinsRequired;
        await user.save();

        // Reduce stock if limited
        if (item.stock > 0) {
            item.stock -= 1;
            await item.save();
        }

        // Create purchase record
        const purchase = await Purchase.create({
            citizen: user._id,
            shopItem: item._id,
            itemName: item.name,
            ecoCoinsSpent: item.ecoCoinsRequired,
            status: 'Fulfilled'
        });

        res.status(201).json({
            message: `🎉 ${item.name} redeemed! Enjoy your reward.`,
            ecoCoinsRemaining: user.ecoCoins,
            purchase
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/shop/my-purchases
export const getMyPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ citizen: req.user._id })
            .populate('shopItem', 'name imageEmoji category')
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/shop — admin adds/updates item
export const addShopItem = async (req, res) => {
    try {
        const { name, description, category, ecoCoinsRequired, stock, imageEmoji } = req.body;
        if (!name || !description || !ecoCoinsRequired)
            return res.status(400).json({ message: 'name, description and ecoCoinsRequired are required' });
        const item = await ShopItem.create({ name, description, category, ecoCoinsRequired, stock: stock ?? -1, imageEmoji: imageEmoji || '🎁' });
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/shop/:id — admin removes item
export const deleteShopItem = async (req, res) => {
    try {
        await ShopItem.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Item removed from shop' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

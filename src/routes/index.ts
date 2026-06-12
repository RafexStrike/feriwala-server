import { Router } from 'express';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import tagRoutes from './tagRoutes';
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;


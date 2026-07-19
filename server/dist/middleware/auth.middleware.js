import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access token missing or invalid',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        }
        catch (err) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired access token',
            });
            return;
        }
        // Verify user exists and is active
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User account not found',
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User account is deactivated',
            });
            return;
        }
        // Attach user payload to request
        req.user = {
            id: user.id,
            role: user.role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};

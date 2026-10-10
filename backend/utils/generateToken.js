import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'estateiq_facility_jwt_secret_2026', { expiresIn: '30d' });
};

export default generateToken;

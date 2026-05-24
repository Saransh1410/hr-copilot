const { admin } = require('./db');

async function verifyAuth(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
        return null;
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error("verifyAuth Error:", error);
        res.status(401).json({ error: 'Unauthorized: Token verification failed' });
        return null;
    }
}

module.exports = { verifyAuth };

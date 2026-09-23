import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtUserPayload = {
  id?: number | string;
  sub?: number | string;
  [key: string]: unknown;
};

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  //tokens header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET no está definido en el .env');
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  const secretBuffer = Buffer.from(secret, 'base64');

  jwt.verify(token, secretBuffer, (err: jwt.VerifyErrors | null, user: string | jwt.JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }

    if (!user || typeof user === 'string') {
      return res.status(403).json({ error: 'Token inválido.' });
    }
    
    // Guardamos los datos del token en la petición para usarlos después
    req.user = user as JwtUserPayload;
    next(); // "continuar a la ruta
  });
};

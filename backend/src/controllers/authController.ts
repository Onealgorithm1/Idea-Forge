import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, role: newUser.rows[0].role }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: newUser.rows[0],
      token,
    });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ message: 'Server error', details: error instanceof Error ? error.message : String(error) });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

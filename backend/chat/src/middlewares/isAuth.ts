import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Authentication token is missing." });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    if (!decoded || !decoded.user) {
      res.status(401).json({ message: "Invalid authentication token." });
      return;
    }
    req.user = decoded.user as IUser;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid authentication token. - JWT ERROR" });
  }
};

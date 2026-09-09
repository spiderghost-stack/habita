import { Request, Response } from "express";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.schema";
import * as authService from "./auth.service";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.registerOwner(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  res.status(200).json(user);
}

export async function updateMe(req: Request, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user!.userId, input);
  res.status(200).json(user);
}

import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { AuthenticateRequest } from "../middleware/isAuth.js";
import { User } from "../model/User.js";

export const loginUser = TryCatch(async (req, res) => {
  const { email } = req.body;

  const rateLimitKey = `otp:ratelimit:${email}`;
  const rateLimit = await redisClient.get(rateLimitKey);

  if (rateLimit) {
    res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, {
    EX: 300, // OTP expires in 5 minutes
  });
  await redisClient.set(rateLimitKey, "true", {
    EX: 60, // Rate limit for 1 minute
  });

  const message = {
    to: email,
    subject: "Your OTP Code",
    body: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
  };

  await publishToQueue("send-otp", message);
  res.status(200).json({
    message: "OTP sent successfully. Please check your email.",
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({
      message: "Email and OTP are required.",
    });
    return;
  }

  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);

  console.log(`Verifying OTP for ${email}:`, { otp, storedOtp });

  if (!storedOtp || otp !== storedOtp) {
    res.status(401).json({
      message: "Invalid OTP.",
    });
    return;
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });
  if (!user) {
    const name = email.split("@")[0];
    user = new User({
      email,
      name,
    });
    await user.save();
  }

  const token = generateToken(user);

  res.json({
    message: "OTP verified successfully.",
    token,
    user,
  });
});

export const myProfile = TryCatch(async (req: AuthenticateRequest, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      message: "Unauthorized access.",
    });
    return;
  }

  res.json({
    message: "User profile retrieved successfully.",
    user,
  });
});

export const updateProfileName = TryCatch(
  async (req: AuthenticateRequest, res) => {
    const user = req.user;
    const { name } = req.body;

    if (!user) {
      res.status(401).json({
        message: "Unauthorized access.",
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        message: "Name is required.",
      });
      return;
    }

    user.name = name;
    await user.save();

    const token = generateToken(user);

    res.json({
      message: "Profile updated successfully.",
      user,
      token,
    });
  }
);

export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.find();
  res.json({
    message: "All users retrieved successfully.",
    users,
  });
});

export const getAUser = TryCatch(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "User ID is required.",
    });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({
      message: "User not found.",
    });
    return;
  }

  res.json({
    message: "User retrieved successfully.",
    user,
  });
});

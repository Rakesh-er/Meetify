import httpStatus from "http-status";
import { User } from "../models/user.models.js";
import bcrypt, { hash } from "bcrypt";

import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";


const register = async (req, res) => {
  const { name, username, password } = req.body;

  // Validate required fields
  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide name, username, and password" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (e) {
    console.error("Registration error:", e);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong: ${e.message}` });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      let token = crypto.randomBytes(20).toString("hex");

      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Username or password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

const completeMeeting = async (req, res) => {
  const { token, meeting_code, duration } = req.body;

  if (!token || !meeting_code) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const meeting = await Meeting.findOne({ user_id: user.username, meetingCode: meeting_code })
      .sort({ date: -1 });

    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    meeting.duration = duration || meeting.duration;

    await meeting.save();

    return res.status(httpStatus.OK).json({ message: "Meeting updated" });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e.message}` });
  }
};

const deleteHistory = async (req, res) => {
  const { token, meetingId } = req.body;

  try {
    const user = await User.findOne({ token: token });
    const meeting = await Meeting.findById(meetingId);

    if (!meeting || meeting.user_id !== user.username) {
      return res.status(httpStatus.FORBIDDEN).json({ message: "Not authorized" });
    }

    await Meeting.findByIdAndDelete(meetingId);
    res.status(httpStatus.OK).json({ message: "Meeting deleted" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e.message}` });
  }
};

const clearAllHistory = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token });
    await Meeting.deleteMany({ user_id: user.username });
    res.status(httpStatus.OK).json({ message: "All history cleared" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e.message}` });
  }
};

const getCurrentUser = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }
    res.status(httpStatus.OK).json({
      username: user.username,
      name: user.name
    });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e.message}` });
  }
};

export { login, register, getUserHistory, addToHistory, deleteHistory, clearAllHistory, getCurrentUser, completeMeeting };

import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'rickychalz1998@gmail.com',
    pass: 'pgqhvkihpjrpjyvf',
  },
});

export default transporter;

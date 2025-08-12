import nodemailer from "nodemailer";
import asyncHandler from "./asynHandler.js";

const sendMail = asyncHandler(async (email, subject, resetUrl) => {
  console.log("email testing -->", email, subject, resetUrl);

//   const transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.Emailuser,
//       pass: process.env.Emailpass,
//     },
//   });

const transporter = nodemailer.createTransport({
  service: "gmail", // or use "smtp" with custom config
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



 const info = await transporter.sendMail({
      from: `${process.env.EMAIL_USER}`,
      to: email,
      subject,
      html: `
       <p>Please click the following link to reset your password:</p>
       <a href="${resetUrl}">${resetUrl}</a>
       <p>If you did not request this, please ignore this email.</p>
   `,
      text:"hii",
    });

  console.log("Message sent:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // For Ethereal

  return info;
});

export { sendMail };

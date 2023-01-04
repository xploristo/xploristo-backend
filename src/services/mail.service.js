import nodemailer from 'nodemailer';

import GroupsService from './groups.service.js';

let transporter;
let transporterEmail;

function bootstrap({ user, pass }) {
  transporterEmail = user;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: transporterEmail,
    to,
    subject: subject || `${process.env.APP_NAME} Password`,
    text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject();
      } else {
        console.log('Email sent: ' + info.response);
        resolve();
      }
    });
  });
}

async function sendPasswordEmail(to, { password, role, groupId }) {
  const subject = `${process.env.APP_NAME} Password`;
  let text = `${password}`;

  if (role === 'student') {
    const group = await GroupsService.getGroup(groupId, {}, false);
    // TODO Translate email text!
    text = `Te han inscrito a la asignatura ${group.name} en ${process.env.APP_NAME}.\nTu contraseña provisional es ${password}.\nEntra en ${process.env.FRONTEND_URL} y elige tu nueva contraseña.`;
  } else {
    text = `Te han creado una cuenta en ${process.env.APP_NAME}.\nTu contraseña provisional es ${password}.\nEntra en ${process.env.FRONTEND_URL} y elige tu nueva contraseña.`;
  }

  return sendEmail(to, subject, text);
}

async function sendResetPasswordEmail(to, { password }) {
  const subject = `${process.env.APP_NAME} Password`;
  // TODO Translate email text!
  const text = `Se ha restablecido tu contraseña en ${process.env.APP_NAME}.\nTu contraseña provisional es ${password}.\nEntra en ${process.env.FRONTEND_URL} y elige tu nueva contraseña.`;

  return sendEmail(to, subject, text);
}

export default {
  bootstrap,
  sendPasswordEmail,
  sendResetPasswordEmail,
};

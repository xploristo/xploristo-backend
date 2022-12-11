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

async function sendPasswordEmail(to, { password, role, groupId }) {
  const mailOptions = {
    from: transporterEmail,
    to,
    subject: `${process.env.APP_NAME} Password`,
    text: `${password}`,
  };

  if (role === 'student') {
    const group = await GroupsService.getGroup(groupId, {}, false);
    mailOptions.text = `Te han inscrito a la asignatura ${group.name} en ${process.env.APP_NAME}.\nTu contraseña provisional es ${password}.\nEntra en ${process.env.FRONTEND_URL} y elige tu nueva contraseña.`;
  } else {
    mailOptions.text = `Te han creado una cuenta en ${process.env.APP_NAME}.\nTu contraseña provisional es ${password}.\nEntra en ${process.env.FRONTEND_URL} y elige tu nueva contraseña.`;
  }

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

export default {
  bootstrap,
  sendPasswordEmail,
};

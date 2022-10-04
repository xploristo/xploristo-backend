import nodemailer from 'nodemailer';

let transporter;
let transporterEmail;

function bootstrap({ user, pass }) {
  transporterEmail = user;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
}

async function sendPasswordEmail(to, password) {
  const mailOptions = {
    from: transporterEmail,
    to,
    subject: 'Xploristo Password',
    text: `${password}`
  };

  return new Promise((resolve,reject) => {
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
  sendPasswordEmail
};
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendResetPassword(email: string, token: string) {
    // 👉 lien vers ton FRONT (Next.js)
    const resetUrl = `http://localhost:3001/reset-password?token=${token}`;

    const html = `
      <p>Bonjour,</p>
      <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}" 
         style="
           display:inline-block;
           padding:10px 20px;
           font-weight:bold;
           color:white;
           background-color:#231f20;
           border-radius:5px;
           text-decoration:none;
         ">
        Modifier votre mot de passe
      </a>
      <p>Ce lien expire dans 15 minutes.</p>
    `;

    await this.transporter.sendMail({
      from: `"Support App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation du mot de passe',
      html,
    });
  }
}

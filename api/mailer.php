<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

require_once dirname(__DIR__) . '/vendor/PHPMailer-master/src/Exception.php';
require_once dirname(__DIR__) . '/vendor/PHPMailer-master/src/PHPMailer.php';
require_once dirname(__DIR__) . '/vendor/PHPMailer-master/src/SMTP.php';

function send_otp_email(string $recipient, string $otp): array
{
    $smtpUsername = getenv('ERIFT_SMTP_USERNAME') ?: SMTP_USERNAME;
    $smtpPassword = getenv('ERIFT_SMTP_PASSWORD') ?: SMTP_PASSWORD;
    if ($smtpPassword === '') {
        return ['sent' => false, 'error' => 'SMTP password is not configured.'];
    }

    $mailer = new PHPMailer(true);
    try {
        $mailer->isSMTP();
        $mailer->Host = 'smtp.gmail.com';
        $mailer->SMTPAuth = true;
        $mailer->Username = $smtpUsername;
        $mailer->Password = $smtpPassword;
        $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Port = 587;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($smtpUsername, 'ERIFTverse');
        $mailer->addAddress($recipient);
        $mailer->isHTML(false);
        $mailer->Subject = 'ERIFTverse - Ma xac nhan tai khoan';
        $mailer->Body = "Ma OTP cua ban la: {$otp}\nMa co hieu luc trong 10 phut.";
        $mailer->send();
        return ['sent' => true, 'error' => ''];
    } catch (Exception $exception) {
        return ['sent' => false, 'error' => $exception->getMessage()];
    }
}
